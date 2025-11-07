import {guard} from 'lit/directives/guard.js'
import {MdLinearProgress} from '@material/web/progress/linear-progress.js'
import {withController} from '@snar/lit'
import {numericTimeToTimecode, subtitlesToVTT} from '@vdegenne/subtitles'
import {css, html, LitElement} from 'lit'
import {withStyles} from 'lit-with-styles'
import {customElement, query, state} from 'lit/decorators.js'
import {until} from 'lit/directives/until.js'
import {api} from './api.js'
import {fs} from './fssystem.js'
import {store} from './store.js'
import {sleep} from './utils.js'
import {logger} from './logger.js'
import {subtitlesUI} from './subtitles-element.js'

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

	@query('video') video?: HTMLVideoElement
	@query('md-linear-progress') progress!: MdLinearProgress
	@query('#feed') feed!: HTMLDivElement

	render() {
		logger.log('RENDER')
		return html`<!-- -->
			${guard([store.videoPath], () =>
				until(this.#renderVideoElement(), 'Loading...'),
			)}
			${this.hasVideo
				? html`<!-- -->
						<div ?hidden=${!this.hasVideo}>
							<md-linear-progress
								@click=${this.#onProgressClick}
								class="cursor-pointer"
							></md-linear-progress>
							<div id="feed"></div>
						</div>
						<!-- -->`
				: null}
			<!-- -->`
	}

	async #renderVideoElement() {
		logger.log('Render guarded video element')
		this.hasVideo = false
		// TODO: need to guard that (store.videoPath)
		if (!store.videoPath) {
			return 'Path not provided.'
		}
		const {ok, text} = await api.get(
			`/video/${encodeURIComponent(store.videoPath)}` as '/video/:path',
		)
		if (!ok) {
			this.hasVideo = false
			return html`<!-- -->
				<div class="m-5">
					<p>Video couldn't be found for this project.</p>
					<div class="flex gap-3">
						<md-filled-tonal-button
							@click=${() => fs.openDirectory(store.videoPath)}
						>
							<md-icon slot="icon">folder</md-icon>
							Open directory
						</md-filled-tonal-button>
						<md-filled-tonal-button
							@click=${() => fs.openTerminal(store.videoPath)}
						>
							<md-icon slot="icon">terminal</md-icon>
							Open terminal
						</md-filled-tonal-button>
					</div>
				</div>
				<!-- -->`
		}

		this.hasVideo = true
		return html`<!-- -->
			<video
				src="/api/${await text()}"
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
		return numericTimeToTimecode(this.video!.currentTime)
	}
	get time(): sub.NumericTime {
		return this.video!.currentTime
	}

	play() {
		this.video!.play()
	}
	pause() {
		this.video!.pause()
	}

	togglePlay() {
		if (this.video!.paused) {
			this.play()
		} else {
			this.pause()
		}
	}

	#startTimeUpdate = () => {
		this.#playing = true
		console.log(this.video)
		const loop = async () => {
			await this.#onTimeUpdate()
			if (this.#playing) {
				requestAnimationFrame(loop)
			}
		}
		loop()
		// if (this.rafId == null) loop()
	}

	#stopTimeUpdate = () => {
		this.#playing = false
		// if (this.rafId != null) {
		// 	cancelAnimationFrame(this.rafId)
		// 	this.rafId = null
		// }
	}

	async #onTimeUpdate() {
		this.feed && (this.feed.textContent = this.timecode)
		await sleep(100)
	}

	#onSlowTimeUpdate = () => {
		this.#updateProgress()
	}

	#updateProgress() {
		this.progress.value = this.video!.currentTime / this.video!.duration
	}

	#onProgressClick(event: PointerEvent) {
		const progress = event.target as MdLinearProgress
		const rect = progress.getBoundingClientRect()
		const ratio = (event.clientX - rect.left) / rect.width
		this.seek(ratio * this.video!.duration, true)
	}

	seek(time: sub.NumericTime, activateSubtitle = true) {
		this.video!.currentTime = time
		if (activateSubtitle) {
			subtitlesUI.activateSubtitleFromTime(time, false)
		}
	}

	loadSubtitles(subtitles: sub.Subtitles) {
		const vtt = subtitlesToVTT(subtitles)

		// Create a Blob URL for the VTT content
		const blob = new Blob([vtt], {type: 'text/vtt'})
		const url = URL.createObjectURL(blob)

		// Remove existing text tracks if needed
		Array.from(this.video!.textTracks).forEach((track) => {
			track.mode = 'disabled'
		})

		// Create a new track element
		const trackEl = document.createElement('track')
		trackEl.kind = 'subtitles'
		trackEl.label = 'English'
		trackEl.srclang = 'en'
		trackEl.src = url
		trackEl.default = true

		this.video!.appendChild(trackEl)
	}

	playSubtitle(subtitle: sub.Subtitle) {}
}

export type {VideoElement}
export const videoUI = new VideoElement()
// @ts-ignore
window.videoUI = videoUI
