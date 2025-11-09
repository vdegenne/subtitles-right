import {withController} from '@snar/lit'
import {Debouncer} from '@vdegenne/debouncer'
import {html, LitElement} from 'lit'
import {withStyles} from 'lit-with-styles'
import {customElement, query, queryAll, state} from 'lit/decorators.js'
import {guard} from 'lit/directives/guard.js'
import {repeat} from 'lit/directives/repeat.js'
import {until} from 'lit/directives/until.js'
import toast from 'toastit'
import {api} from './api.js'
import {logger} from './logger.js'
import {persistentStore} from './persistentStore.js'
import {saveSuccessFeedback} from './save-success-feedback.js'
import {store} from './store.js'
import './subtitle-element.js'
import {type SubtitleElement} from './subtitle-element.js'
import {videoUI} from './video-element.js'
import {openFillEmptySubtitlesDialog} from './imports.js'
import {start} from 'repl'

export interface AddSubtitleOptions {
	/**
	 * If true, allow start and end time to cling to previous and next subtitle to avoid overlapping.
	 * @default false
	 */
	allowClinging: boolean

	/**
	 * Should activate the subtitle on the UI after being inserted
	 * @default false
	 */
	activate: boolean

	/**
	 * If `activate` is true, should we also set the video time to the start time of the subtitle being inserted?
	 * @default true
	 */
	seekVideoOnActivation: boolean
}

@customElement('subtitles-element')
@withController(store)
@withStyles()
class SubtitlesElement extends LitElement {
	@state() subtitles: sub.Subtitles = []
	#saveDebouncer = new Debouncer(() => this.#save(), 700)

	@query('subtitle-element[active]') activeSubtitleElement!: SubtitleElement
	@queryAll('subtitle-element') subtitleElements!: SubtitleElement[]

	render() {
		logger.log('RENDER')
		return html`<!-- -->
			${guard([store.videoPath], () =>
				until(this.#loadSubtitles(), 'Loading...'),
			)}
			<div id="subtitles" class="mb-5">
				${repeat(
					this.subtitles,
					(s) => s.id,
					(s, i) => {
						return html`<!-- -->
							<div class="relative">
								<span
									class="absolute top-0 left-1 text-[var(--md-sys-color-primary)] opacity-50"
									>${i}</span
								><subtitle-element .subtitle=${s}></subtitle-element>
							</div>
							<!-- -->`
					},
				)}
			</div>
			${this.subtitles.length === 0
				? html`<!-- -->
						<div class="my-24 text-center">
							<wavy-text>No subtitles yet.</wavy-text>
						</div>
						<!-- -->`
				: html`<!-- -->
						<md-assist-chip
							elevated
							@click=${() => openFillEmptySubtitlesDialog()}
						>
							<md-icon slot="icon">water_full</md-icon>
							Fill empty subtitles
						</md-assist-chip>
						<!-- -->`}
			<!-- -->`
	}

	getLastSubtitle() {
		return this.subtitles[this.subtitles.length - 1]
	}
	getActiveSubtitle() {
		const elements = [...this.subtitleElements]
		const index = elements.findIndex((el) => el.active)
		return this.subtitles[index]
	}

	async #loadSubtitles() {
		if (!store.videoPath) {
			return 'Path not provided.'
		}
		const {ok, json} = await api.get(
			`/subtitles/${encodeURIComponent(store.videoPath)}` as '/subtitles/:path',
		)
		if (!ok) {
			// toast("Couldn't load the subtitles")
			return html`<span error>Couldn't load the subtitles</span>`
		}
		this.subtitles = await json()
		await this.updateComplete
		videoUI.renderVideoElementComplete
			?.then(() => {
				const last = this.getLastSubtitle()
				if (last) {
					this.activateOnly(last, true)
				}
				this.injectSubtitles()
			})
			.catch(() => {
				toast('Video unavailable.')
			})
	}

	getNextId() {
		console.log('what')
		const ids = this.subtitles.map((s) => s.id)
		ids.sort((a, b) => a! - b!)
		if (ids.length === 0) {
			return 0
		}
		const lastId = ids.pop()!
		return lastId + 1
	}

	getSurroundingSubtitles(subtitle: sub.Subtitle): {
		previous?: sub.Subtitle
		next?: sub.Subtitle
	} {
		const index = this.subtitles.findIndex((s) => s.id === subtitle.id)

		if (index === -1) return {}

		return {
			previous: this.subtitles[index - 1],
			next: this.subtitles[index + 1],
		}
	}

	getSurroundingSubtitlesFromTime(time: sub.NumericTime): {
		previous?: sub.Subtitle
		next?: sub.Subtitle
	} {
		const n = this.subtitles.length
		if (n === 0) return {}

		// before first subtitle
		if (time < this.subtitles[0]!.start) {
			return {previous: undefined, next: this.subtitles[0]}
		}

		// walk list to find insertion spot
		for (let i = 0; i < n; i++) {
			const previous = this.subtitles[i]!
			const next = this.subtitles[i + 1]

			// if this is the last item or the next starts after time,
			// and the current starts <= time, we've found the spot
			if (previous.start <= time && (next === undefined || next.start > time)) {
				return {previous, next}
			}
		}

		// fallback: time is after all starts
		return {previous: this.subtitles[n - 1], next: undefined}
	}

	addSubtitle(subtitle: sub.Subtitle, options?: Partial<AddSubtitleOptions>) {
		const _opts: AddSubtitleOptions = {
			allowClinging: false,
			activate: false,
			seekVideoOnActivation: true,
			...options,
		}
		subtitle.id = this.getNextId()
		if (_opts.allowClinging) {
			// we need to find surrounding subtitles.
			const {previous, next} = this.getSurroundingSubtitlesFromTime(
				subtitle.start,
			)
			if (previous && subtitle.start <= previous.end) {
				subtitle.start = previous.end + persistentStore.newSubEntryOffsetS
			}
			if (next && subtitle.end >= next.start) {
				subtitle.end = next.start - persistentStore.newSubEntryOffsetS
				if (subtitle.end <= subtitle.start) {
					subtitle.end = subtitle.start + persistentStore.newSubEntryOffsetS
				}
			}
			const index = previous ? this.subtitles.indexOf(previous) + 1 : 0
			this.subtitles.splice(index, 0, subtitle)
			this.subtitles = [...this.subtitles]
		} else {
			// just insert subtitle at the end of the list
			this.subtitles = [...this.subtitles, subtitle]
		}
		if (_opts.activate) {
			this.updateComplete.then(() => {
				subtitlesUI.activateOnly(subtitle, _opts.seekVideoOnActivation)
			})
		}
		this.save()
	}

	injectSubtitles() {
		videoUI.loadSubtitles(this.subtitles)
	}

	async #save() {
		const {ok, text} = await api.put(
			`/subtitles/${encodeURIComponent(store.videoPath!)}` as '/subtitles/:path',
			this.subtitles,
		)
		if (!ok) {
			toast(await text())
		}
		saveSuccessFeedback.show()
		return
	}
	save() {
		this.injectSubtitles()
		return this.#saveDebouncer.call()
	}

	deleteSubtitle(subtitle: sub.Subtitle) {
		this.subtitles = this.subtitles.filter((s) => s.id !== subtitle.id)
		this.save()
	}

	async activateOnly(subtitle: sub.Subtitle, seek = true) {
		const index = this.subtitles.indexOf(subtitle)
		if (index >= 0) {
			const elements = this.subtitleElements
			elements.forEach((el) => (el.active = false))
			elements[index]!.active = true
			if (seek) {
				// const subtitle = this.subtitles[index]!
				await videoUI.updateComplete // Make sure the video is available from last update
				videoUI.seek(subtitle.start, false)
			}
		}
	}
	activateIndexOnly(index: number, seek = true) {
		if (this.subtitles[index]) {
			this.activateOnly(this.subtitles[index], seek)
		}
	}
	activateSubtitleFromTime(time: sub.NumericTime, seek = true) {
		let subtitle = this.getSubtitleFromTime(time)
		if (!subtitle) {
			const last = this.getLastSubtitle()
			if (last && time >= last.end) {
				subtitle = last
			}
		}
		if (subtitle) {
			this.activateOnly(subtitle, seek)
		}
	}
	activatePrevious(seek = true) {
		// const subtitle = this.getActiveSubtitle()
		// if (subtitle) {
		// 	const index = this.subtitles.indexOf(subtitle)
		// 	if (index - 1 >= 0) {
		// 		this.acti
		// 	}
		// }
		const elements = [...this.subtitleElements]
		const active = elements.find((el) => el.active === true)
		if (active) {
			const index = elements.indexOf(active)
			if (index - 1 >= 0) {
				this.activateIndexOnly(index - 1, seek)
			}
		}
	}
	activateNext(seek = true) {
		const elements = [...this.subtitleElements]
		const active = elements.find((el) => el.active === true)
		if (active) {
			const index = elements.indexOf(active)
			if (index + 1 < elements.length) {
				this.activateIndexOnly(index + 1, seek)
			}
		}
	}
	activateFirst(seek = true) {
		if (this.subtitles.length === 0) return
		this.activateIndexOnly(0, seek)
	}
	activateLast(seek = true) {
		if (this.subtitles.length === 0) return
		this.activateIndexOnly(this.subtitles.length - 1, seek)
	}

	getSubtitlesFromTime(time: sub.NumericTime) {
		return this.subtitles.filter((s) => {
			if (time >= s.start && time <= s.end) {
				return true
			}
		})
	}
	getSubtitleFromTime(time: sub.NumericTime) {
		return this.subtitles.find((s) => {
			if (time >= s.start && time <= s.end) {
				return true
			}
		})
	}

	override async getUpdateComplete() {
		const result = await super.getUpdateComplete()
		await Promise.all([...this.subtitleElements].map((el) => el.updateComplete))
		return result
	}

	updateProgresses(time: sub.NumericTime) {
		this.subtitleElements.forEach((el) => el.updateProgress(time))
		// const active = this.activeSubtitleElement
		// if (active) {
		// 	active.updateProgress(time)
		// }
	}

	updateElements(start: number, end?: number) {
		if (!end) end = start
		const elements = [...this.subtitleElements].slice(start, end + 1)
		elements.forEach((el) => el.requestUpdate())
	}

	setStartTime(time: sub.NumericTime, subtitle?: sub.Subtitle, seek = true) {
		subtitle ??= this.getActiveSubtitle()
		if (subtitle) {
			subtitle.start = time
			const index = this.subtitles.indexOf(subtitle)
			this.updateElements(index)
			if (seek) {
				videoUI.playSubtitle(subtitle)
			}
			this.save()
		}
	}
	setEndTime(time: sub.NumericTime, subtitle?: sub.Subtitle, seek = true) {
		subtitle ??= this.getActiveSubtitle()
		if (subtitle) {
			subtitle.end = time
			// TODO: We should make sure the video lookup time is updated to avoid over play
			const index = this.subtitles.indexOf(subtitle)
			this.updateElements(index)
			if (seek) {
				videoUI.playFromTo(
					subtitle.end - persistentStore.subEndTimeReplayLengthS,
					subtitle.end,
				)
			}
			this.save()
		}
	}

	/**
	 * Will subtract time from the given (or the active one if not provided) subtitle's start numeric time
	 */
	subtractStartTime(subtitle?: sub.Subtitle, seek = true) {
		subtitle ??= this.getActiveSubtitle()
		if (subtitle) {
			this.setStartTime(
				subtitle.start - persistentStore.subtractTime,
				subtitle,
				seek,
			)
		}
	}
	/**
	 * Will add time from the given (or the active one if not provided) subtitle's start numeric time
	 */
	addStartTime(subtitle?: sub.Subtitle, seek = true) {
		subtitle ??= this.getActiveSubtitle()
		if (subtitle) {
			this.setStartTime(
				subtitle.start + persistentStore.addTime,
				subtitle,
				seek,
			)
		}
	}
	/**
	 * Will subtract time from the given (or the active one if not provided) subtitle's end numeric time
	 */
	subtractEndTime(subtitle?: sub.Subtitle, seek = true) {
		subtitle ??= this.getActiveSubtitle()
		if (subtitle) {
			this.setEndTime(
				subtitle.end - persistentStore.subtractTime,
				subtitle,
				seek,
			)
		}
	}
	/**
	 * Will add time from the given (or the active one if not provided) subtitle's end numeric time
	 */
	addEndTime(subtitle?: sub.Subtitle, seek = true) {
		subtitle ??= this.getActiveSubtitle()
		if (subtitle) {
			this.setEndTime(subtitle.end + persistentStore.addTime, subtitle, seek)
		}
	}

	getAllLastEmptySubtitles() {
		const subtitles = this.subtitles
		const result: sub.Subtitle[] = []
		for (let i = subtitles.length - 1; i >= 0; i--) {
			if (subtitles[i]!.text === '') {
				result.unshift(subtitles[i]!) // add to the start of result to maintain original order
			} else {
				break // stop once we hit a non-empty text
			}
		}
		return result
	}

	/**
	 * Fill all last empty subtitles with the input.
	 * The input should contain new lines (\n) to be able to understand how to cut.
	 * All cut lines will go sequentially from last first empty subtitle to last last empty subtitle found.
	 * Use wisely!
	 */
	fillEmptySubtitles(input: string = 'test', trimSurroundingNewLines = true) {
		let lines = input.split('\n')

		if (trimSurroundingNewLines) {
			// Remove leading and trailing empty lines using regex
			const trimmedInput = input.replace(/^(?:\s*\n)+|(?:\n\s*)+$/g, '')
			lines = trimmedInput.split('\n')
		}

		const emptySubtitles = this.getAllLastEmptySubtitles()
		if (lines.length !== emptySubtitles.length) {
			const msg =
				"The input lines length doesn't match the length of last empty subtitles."
			toast(msg)
			logger.warn(msg)
			return
		}

		for (const sub of emptySubtitles) {
			sub.text = lines[0] as string
			lines.shift()
		}

		const startIndex = this.subtitles.indexOf(emptySubtitles[0]!)
		const endIndex = this.subtitles.indexOf(
			emptySubtitles[emptySubtitles.length - 1]!,
		)
		if (startIndex >= 0 && endIndex >= 0) {
			this.updateElements(startIndex, endIndex)
		}
		this.save()
	}
}

export const subtitlesUI = new SubtitlesElement()
// @ts-ignore
window.subtitlesUI = subtitlesUI
