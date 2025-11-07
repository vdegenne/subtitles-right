import {withController} from '@snar/lit'
import {Debouncer} from '@vdegenne/debouncer'
import {html, LitElement} from 'lit'
import {withStyles} from 'lit-with-styles'
import {customElement, queryAll, state} from 'lit/decorators.js'
import {guard} from 'lit/directives/guard.js'
import {repeat} from 'lit/directives/repeat.js'
import {until} from 'lit/directives/until.js'
import toast from 'toastit'
import {api} from './api.js'
import {logger} from './logger.js'
import {saveSuccessFeedback} from './save-success-feedback.js'
import {store} from './store.js'
import './subtitle-element.js'
import {type SubtitleElement} from './subtitle-element.js'
import {videoUI} from './video-element.js'

@customElement('subtitles-element')
@withController(store)
@withStyles()
class SubtitlesElement extends LitElement {
	@state() subtitles: sub.Subtitles = []
	#saveDebouncer = new Debouncer(() => this.#save(), 700)

	@queryAll('subtitle-element') subtitleElements!: SubtitleElement[]

	render() {
		logger.log('RENDER')
		return html`<!-- -->
			${guard([store.videoPath], () =>
				until(this.#loadSubtitles(), 'Loading...'),
			)}
			${repeat(
				this.subtitles,
				(s) => s.id,
				(s) => {
					return html`<!-- -->
						<subtitle-element .subtitle=${s}></subtitle-element>
						<!-- -->`
				},
			)}
			${this.subtitles.length === 0
				? html`<!-- -->
						<div class="my-24 text-center">
							<wavy-text>No subtitles yet.</wavy-text>
						</div>
						<!-- -->`
				: null}
			<!-- -->`
	}

	getLastSubtitle() {
		return this.subtitles[this.subtitles.length - 1]
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
		const last = this.getLastSubtitle()
		if (last) {
			this.activateOnly(last)
		}
		this.injectSubtitles()
	}

	getNextId() {
		const ids = this.subtitles.map((s) => s.id)
		ids.sort()
		logger.log(ids)
		if (ids.length === 0) {
			return 0
		}
		const lastId = ids.pop()!
		return lastId + 1
	}

	addSubtitle(subtitle: sub.Subtitle) {
		this.subtitles.push()
		subtitle.id = this.getNextId()
		this.subtitles = [...this.subtitles, subtitle]
		this.save()
	}

	injectSubtitles() {
		videoUI.loadSubtitles(this.subtitles)
	}

	async #save() {
		return
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

	async deleteSubtitle(subtitle: sub.Subtitle) {
		this.subtitles = this.subtitles.filter((s) => s.id !== subtitle.id)
		await this.save()
	}

	activateOnly(subtitle: sub.Subtitle, seek = true) {
		const index = this.subtitles.indexOf(subtitle)
		if (index >= 0) {
			const elements = this.subtitleElements
			elements.forEach((el) => (el.active = false))
			elements[index]!.active = true
			if (seek) {
				const subtitle = this.subtitles[index]!
				videoUI.seek(subtitle.start)
			}
		}
	}
	activateIndexOnly(index: number, seek = true) {
		if (this.subtitles[index]) {
			this.activateOnly(this.subtitles[index], seek)
		}
	}
	activateSubtitleFromTime(time: sub.NumericTime, seek = true) {
		const subtitles = this.getSubtitleFromTime(time)
		let subtitle: sub.Subtitle | undefined
		if (subtitles.length) {
			subtitle = subtitles[0]
		} else {
			const last = this.getLastSubtitle()
			if (last && time >= last.end) {
				subtitle = last
			}
		}
		if (subtitle) {
			this.activateOnly(subtitle, seek)
		}
	}

	getSubtitleFromTime(time: sub.NumericTime) {
		return this.subtitles.filter((s) => {
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
}

export const subtitlesUI = new SubtitlesElement()
// @ts-ignore
window.subtitlesUI = subtitlesUI
