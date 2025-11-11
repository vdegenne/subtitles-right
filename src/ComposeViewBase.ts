import {MdLinearProgress} from '@material/web/progress/linear-progress.js'
import {css, html, LitElement, PropertyValues} from 'lit'
import {property, query, state} from 'lit/decorators.js'
import {StyleInfo, styleMap} from 'lit/directives/style-map.js'
import {SVG_VINYL} from './assets/assets.js'
import {openSettingsDialog} from './imports.js'
import {logger} from './logger.js'
import {store} from './store.js'
import {pageCompose} from './pages/page-compose.js'
import {app} from './app-shell/app-shell.js'

export interface ComposeEvent {
	/**
	 * Optional name for readability
	 */
	name?: string

	/**
	 * Start time of the event
	 */
	start: number
	/**
	 * End time of the event
	 * If undefined, the everything after "start" time is considered in,
	 * and everything before "start" time is considered out.
	 */
	end?: number

	/**
	 * Flag to determine if we are in the event space or not.
	 * This is used to avoid calling function indefinitely in the loop.
	 * `in` should be set to "true" and `inFct` should be called when entering the event space.
	 * `in` should be set to "false" and `outFct` should be called when exiting the event space.
	 *
	 * undefined is treated as false.
	 */
	in?: boolean

	/**
	 * The function to execute when entering the event space.
	 *
	 */
	inFct?: () => void

	/**
	 * The function to execute when exiting the event space.
	 */
	outFct?: () => void
}

export class ComposeViewBase extends LitElement {
	@state() projectPath?: string
	@state() videoPath?: string
	@state() video?: HTMLVideoElement
	@state() subtitles: sub.Subtitles = []
	@state() meta: subright.ProjectInterface | undefined

	@state() selectedIndex = -1

	@property({type: Boolean, reflect: true}) playing = false

	protected events: ComposeEvent[] = []

	#subtitleElements: HTMLDivElement[] = []

	@query('md-linear-progress', true) progress!: MdLinearProgress
	@query('#vinyl', true) vinylElement!: HTMLDivElement
	@query('#time', true) timeElement!: HTMLSpanElement

	constructor() {
		super()
		window.addEventListener('keydown', (event: KeyboardEvent) => {
			if (event.key === 'p') {
				app.pageCompose.togglePlay()
			} else if (event.key === 's') {
				openSettingsDialog()
			} else if (event.key === 'y') {
				if (store.meta?.youtube) {
					window.open(store.meta.youtube, '_blank')
				}
			}
		})
	}

	static styles = css`
		:host {
			background-color: var(--md-sys-color-surface-container);
			color: var(--md-sys-color-primary);
			position: absolute;
			inset: 0;
			--md-elevation-level: 2;
		}
		.subtitle {
			display: none;
		}
		.subtitle[active] {
			display: initial;
		}
		.subtitle[surround] {
			display: initial;
			opacity: 0.2;
		}

		#vinyl > svg {
			width: 100%;
			height: 100%;
		}
	`

	#startTimeUpdate = () => {
		this.playing = true
		const loop = async () => {
			await this.#onTimeUpdate()
			if (this.playing) {
				requestAnimationFrame(loop)
			}
		}
		loop()
	}

	#stopTimeUpdate = () => {
		// TODO: Defering to solve unupdated views when the video pauses suddenly.
		// remove the timeout if something is wrong.
		// setTimeout(() => {
		this.playing = false
		// }, 200)
	}

	async #onTimeUpdate() {
		this.#updateVinyl()
		this.#updateSubtitles(this.video!.currentTime)
		this.#updateProgress()
		this.#updateTime()
		this.#updateVideoEvents()
	}

	#updateVideoEvents() {
		const time = this.video!.currentTime
		this.events.forEach((ev) => {
			const isIn = time >= ev.start && (ev.end === undefined || time <= ev.end)
			if (isIn !== ev.in) {
				isIn ? ev.inFct?.() : ev.outFct?.()
				ev.in = isIn
			}
		})
	}

	getURL(uri: string) {
		return `/dist/data/${this.projectPath}/${uri}`
	}

	updated(changed: PropertyValues<this>) {
		logger.log('Updated')
		if (changed.has('video') && this.video) {
			this.video.ontimeupdate = () => {}
			this.video.onplaying = this.#startTimeUpdate
			this.video.onpause = this.#stopTimeUpdate
			this.video.onended = this.#stopTimeUpdate
		}
	}

	renderVinyl(sizePx = 60) {
		return html`<div id="vinyl" style="width:${sizePx}px;height:${sizePx}px;">
			${SVG_VINYL}
		</div>`
	}

	renderTitle(style?: Readonly<StyleInfo>) {
		const _style = {
			fontFamily: 'Roboto',
			fontSize: '30px',
			...style,
		}
		return html`<span style=${styleMap(_style)}>${this.meta?.name}</span>`
	}

	#timeWasRendered = false
	renderTime() {
		this.#timeWasRendered = true
		return html`<span id="time"></span>`
	}
	#updateTime() {
		if (this.#timeWasRendered) {
			// @ts-ignore
			this.timeElement.textContent = this.video!.currentTime
		}
	}

	#vinylAngle = 0
	#updateVinyl() {
		this.vinylElement.style.transform = `rotate(${this.#vinylAngle++}deg)`
	}

	#updateSubtitles(time: sub.NumericTime) {
		// TODO: should detect both start and end out of bounds.
		const subtitles = this.subtitles ?? []
		const index = subtitles.findIndex((s) => time >= s.start && time <= s.end)
		if (index >= 0) {
			this.selectedIndex = index
		}
	}

	#updateProgress() {
		this.progress.value = this.video!.currentTime / this.video!.duration
	}

	renderProgress(heightPx = 24) {
		return html`<md-linear-progress
			value="0"
			style="--md-linear-progress-active-indicator-height: ${heightPx}px;--md-linear-progress-track-height: ${heightPx}px;"
		></md-linear-progress>`
	}

	renderVideo() {
		return this.video
	}

	renderSubtitles(style?: Readonly<StyleInfo>) {
		const _style = {
			fontFamily: 'Roboto',
			...style,
		}
		return this.subtitles.map((s, i) => {
			const surround =
				(this.selectedIndex === -1 && (i === 0 || i === 1)) ||
				(this.selectedIndex >= 0 &&
					(i === this.selectedIndex - 1 || i === this.selectedIndex + 1))
			return html`
				<div
					class="subtitle"
					style=${styleMap(_style)}
					?active=${i === this.selectedIndex}
					?surround=${surround}
				>
					${s.text}
				</div>
			`
		})
	}

	$(selector: string) {
		return this.renderRoot!.querySelector(selector) as HTMLElement
	}
}
