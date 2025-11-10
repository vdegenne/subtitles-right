import {css, html, LitElement, PropertyValues} from 'lit'
import {state} from 'lit/decorators.js'
import {openSettingsDialog} from './imports.js'
import {logger} from './logger.js'

export class ComposeViewBase extends LitElement {
	@state() projectPath?: string
	@state() videoPath?: string
	@state() video?: HTMLVideoElement
	@state() subtitles: sub.Subtitles = []

	// @queryAll('.subtitle') subtitleElements!: HTMLDivElement[]
	#subtitleElements: HTMLDivElement[] = []

	constructor() {
		super()
		window.addEventListener('keydown', (event: KeyboardEvent) => {
			if (event.key === 's') {
				openSettingsDialog()
			}
		})
	}

	static styles = css`
		:host {
			background-color: var(--md-sys-color-surface-container-highest);
			background-color: var(--md-sys-color-primary);
			color: var(--md-sys-color-on-primary);
			position: absolute;
			inset: 0;
			--md-elevation-level: 5;
		}
	`

	getURL(uri: string) {
		return `/dist/data/${this.projectPath}/${uri}`
	}

	updated(changed: PropertyValues<this>) {
		logger.log('Updated')
		if (changed.has('video') && this.video) {
			this.video.ontimeupdate = () => {
				this.#updateSubtitles(this.video!.currentTime)
			}
		}
		if (changed.has('subtitles')) {
			this.#subtitleElements = [
				...this.renderRoot.querySelectorAll<HTMLDivElement>('.subtitle'),
			]
		}
	}

	#updateSubtitles(time: sub.NumericTime) {
		const subtitles = this.subtitles ?? []
		const index = subtitles.findIndex((s) => time >= s.start && time <= s.end)
		this.#subtitleElements.forEach((el) => el.classList.add('hidden'))
		if (index >= 0) {
			this.#subtitleElements[index]?.classList.remove('hidden')
		}
	}

	renderVideo() {
		return this.video
	}

	renderSubtitles() {
		logger.log('Render subtitles')
		return this.subtitles.map((s, i) => {
			return html`<!-- -->
				<div class="subtitle ${i !== 0 ? 'hidden' : ''}">${s.text}</div>
				<!-- -->`
		})
	}
}
