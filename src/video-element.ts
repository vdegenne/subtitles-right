import {getElement, cquerySelector} from 'html-vision'
import {guard} from 'lit/directives/guard.js'
import {MdLinearProgress} from '@material/web/progress/linear-progress.js'
import {withController} from '@snar/lit'
import {numericTimeToTimecode, subtitlesToVTT} from '@vdegenne/subtitles'
import {css, html, LitElement, PropertyValues} from 'lit'
import {withStyles} from 'lit-with-styles'
import {customElement, query, state} from 'lit/decorators.js'
import {until} from 'lit/directives/until.js'
import {api} from './api.js'
import {fs} from './fssystem.js'
import {store} from './store.js'
import {sleep} from './utils.js'
import {logger} from './logger.js'
import {subtitlesUI} from './subtitles-element.js'
import {openTerminal} from './server/functions.js'

MdLinearProgress.elementStyles.push(css`
	.bar {
		transition: none !important;
	}
`)

@customElement('video-element')
@withController(store)
@withStyles(css`
	:host {
		position: fixed;
		width: var(--video-container-width);
	}
	video {
		display: block;
		width: 100%;
	}
	md-linear-progress {
		--md-linear-progress-active-indicator-height: 24px;
		--md-linear-progress-track-height: 24px;
	}
`)
class VideoElement extends LitElement {
	@state() controls = false
	/**
	 * This is set by the guard and will determine if other video-related elements need to be displayed.
	 * @TODO: implement
	 */
	@state() hasVideo = false
	/**
	 * requestAnimationFrame ID representing the loop when the video is actually playing
	 */
	// rafId: number | null = null

	// TODO: change this to @state
	#playing = false

	/**
	 * Will be set by `playFromTo()` to end the video at a certain time.
	 * Use `cancelPlayFromTo()` to cancel it.
	 */
	@state() lookupTime: number | undefined

	// @query('video') #videoElement?: HTMLVideoElement
	#videoElement: HTMLVideoElement | undefined
	@query('md-linear-progress') progress!: MdLinearProgress
	@query('#feed') feed!: HTMLDivElement

	#renderVideoElementCompleteWithResolvers:
		| PromiseWithResolvers<HTMLVideoElement>
		| undefined
	get renderVideoElementComplete() {
		return this.#renderVideoElementCompleteWithResolvers?.promise
	}

	render() {
		logger.log('RENDER')
		return html`<!-- -->
			${guard([store.projectPath], () =>
				until(this.#renderVideoElement(), 'Loading...'),
			)}
			${this.hasVideo
				? html`<!-- -->
						<md-linear-progress
							@click=${this.#onProgressClick}
							class="cursor-pointer"
						></md-linear-progress>
						<div class="flex items-center justify-between m-2">
							<div id="feed"></div>
							<md-filled-tonal-icon-button ?invisible=${!this.lookupTime}>
								<md-icon>timer</md-icon>
							</md-filled-tonal-icon-button>
						</div>
						<div id="actions" class="m-4">
							<md-icon-button @click=${() => store.openDirectory()}
								><md-icon>folder_open</md-icon></md-icon-button
							>
							<md-icon-button @click=${() => store.openTerminal()}
								><md-icon>terminal</md-icon></md-icon-button
							>
						</div>
						<!-- -->`
				: null}
			<!-- -->`
	}

	async #renderVideoElement() {
		const {resolve, reject} = (this.#renderVideoElementCompleteWithResolvers =
			Promise.withResolvers<HTMLVideoElement>())
		logger.log('Render guarded video element')
		this.hasVideo = false
		// TODO: need to guard that (store.videoPath)
		if (!store.projectPath) {
			return 'Path not provided.'
		}
		const {ok, text} = await api.get(
			`/video/${encodeURIComponent(store.projectPath)}` as '/video/:path',
		)
		if (!ok) {
			this.hasVideo = false
			this.#videoElement = undefined
			reject()
			return html`<!-- -->
				<div class="m-5">
					<p>Video couldn't be found for this project.</p>
					<div class="flex gap-3">
						<md-filled-tonal-button
							@click=${() => fs.openDirectory(store.projectPath)}
						>
							<md-icon slot="icon">folder</md-icon>
							Open directory
						</md-filled-tonal-button>
						<md-filled-tonal-button
							@click=${() => fs.openTerminal(store.projectPath)}
						>
							<md-icon slot="icon">terminal</md-icon>
							Open terminal
						</md-filled-tonal-button>
					</div>
				</div>
				<!-- -->`
		}

		this.hasVideo = true
		// TODO: This looks shady but should work for now
		new Promise((r) => requestAnimationFrame(r)).then(async () => {
			try {
				this.#videoElement = await getElement('video', {timeoutMs: 1000})
				resolve(this.#videoElement)
			} catch {
				reject()
			}
		})
		return html`<!-- -->
			<video
				src="/api/videos/${await text()}"
				@playing=${this.#startTimeUpdate}
				@pause=${this.#stopTimeUpdate}
				@ended=${this.#stopTimeUpdate}
				@timeupdate=${
					/* also calling the slower version for code that doesn't require speed */
					this.#onSlowTimeUpdate
				}
				?controls=${this.controls}
			></video>
			<!-- -->`
	}

	get timecode(): sub.Timecode {
		return numericTimeToTimecode(this.#videoElement!.currentTime)
	}
	get time(): sub.NumericTime {
		return this.#videoElement!.currentTime
	}

	isPlaying() {
		return !!(
			this.#videoElement!.currentTime > 0 &&
			!this.#videoElement!.paused &&
			!this.#videoElement!.ended &&
			this.#videoElement!.readyState > 2
		)
	}

	play() {
		this.#videoElement!.play()
	}
	pause() {
		this.#videoElement!.pause()
	}

	togglePlay() {
		if (this.#videoElement!.paused) {
			this.play()
		} else {
			this.pause()
		}
	}

	#startTimeUpdate = () => {
		this.#playing = true
		const loop = async () => {
			await this.#onTimeUpdate()
			if (this.#playing) {
				requestAnimationFrame(loop)
			}
		}
		loop()
	}

	#stopTimeUpdate = () => {
		// TODO: Defering to solve unupdated views when the video pauses suddenly.
		// remove the timeout if something is wrong.
		setTimeout(() => {
			this.#playing = false
		}, 200)
	}

	async #onTimeUpdate() {
		this.feed && (this.feed.textContent = this.timecode)
		// Stop the video if there were a lookup
		if (this.lookupTime && this.time > this.lookupTime) {
			this.pause()
			// await sleep(80)
			this.seek(this.lookupTime, false)
			this.lookupTime = undefined
		}
		await sleep(90)
	}

	#onSlowTimeUpdate = (e: Event) => {
		this.#updateProgress()
		subtitlesUI.updateProgresses(this.time)
		// Experimental: follow subtitles if not in lookup mode
		// TODO: make it as an option to avoid draining perfs
		if (this.isPlaying() && !this.lookupTime) {
			subtitlesUI.activateSubtitleFromTime(this.time, false)
		}
	}

	#updateProgress() {
		this.progress.value =
			this.#videoElement!.currentTime / this.#videoElement!.duration
	}

	#onProgressClick(event: PointerEvent) {
		const progress = event.target as MdLinearProgress
		const rect = progress.getBoundingClientRect()
		const ratio = (event.clientX - rect.left) / rect.width
		this.seek(ratio * this.#videoElement!.duration, true)
		this.#onTimeUpdate() // update feedback time
	}

	seek(time: sub.NumericTime, activateSubtitle = true, clearLookupTime = true) {
		this.#videoElement!.currentTime = time
		if (activateSubtitle) {
			subtitlesUI.activateSubtitleFromTime(time, false)
		}
		if (clearLookupTime) {
			this.lookupTime = undefined
		}
		this.#onTimeUpdate()
	}

	loadSubtitles(subtitles: sub.Subtitles) {
		const vtt = subtitlesToVTT(subtitles)

		// Create a Blob URL for the VTT content
		const blob = new Blob([vtt], {type: 'text/vtt'})
		const url = URL.createObjectURL(blob)

		// Remove existing text tracks if needed
		Array.from(this.#videoElement!.textTracks).forEach((track) => {
			track.mode = 'disabled'
		})

		// Create a new track element
		const trackEl = document.createElement('track')
		trackEl.kind = 'subtitles'
		trackEl.label = 'English'
		trackEl.srclang = 'en'
		trackEl.src = url
		trackEl.default = true

		this.#videoElement!.appendChild(trackEl)
	}

	playFromTo(start: sub.NumericTime, end: sub.NumericTime) {
		this.lookupTime = end
		this.seek(start, false, false)
		this.play()
	}

	playSubtitle(subtitle: sub.Subtitle) {
		this.playFromTo(subtitle.start, subtitle.end)
	}

	rewind(stepS = 1) {
		this.#videoElement!.currentTime -= stepS
	}
	fastforward(stepS = 1) {
		this.#videoElement!.currentTime += stepS
	}
}

export type {VideoElement}
export const videoUI = new VideoElement()
// @ts-ignore
window.videoUI = videoUI
