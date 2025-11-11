import {type MdLinearProgress} from '@material/web/progress/linear-progress.js'
import {Logger} from '@vdegenne/debug'
import {numericTimeToTimecode} from '@vdegenne/subtitles'
import chalk from 'chalk'
import {css, html, LitElement} from 'lit'
import {withStyles} from 'lit-with-styles'
import {customElement, property, query} from 'lit/decorators.js'
import {deleteSubtitle} from './dialogs.js'
import {subtitlesUI} from './subtitles-element.js'
import {videoUI} from './video-element.js'
import './subtitle-input.js'

@customElement('subtitle-element')
@withStyles(css`
	#led {
		width: 6px;
	}
	:host([active]) #led {
		/*background-color: var(--md-sys-color-tertiary);*/
	}
	:host([active]) md-list-item {
		background-color: var(--md-sys-color-surface-container-highest);
	}
`)
export class SubtitleElement extends LitElement {
	@property({type: Object}) subtitle: sub.Subtitle | undefined
	// @property({type: Number}) start: sub.NumericTime = NaN
	// @property({type: Number}) end: sub.NumericTime = NaN
	// @property() text = ''

	// @property({type: Boolean, reflect: true}) active = false

	@query('md-linear-progress', true) progress!: MdLinearProgress

	render() {
		// TODO: remove that when finish debugging or comment
		const logger = new Logger({
			prefix: 'SUB-' + this.subtitle!.id + '',
			colors: {log: chalk.magenta},
		})
		logger.log(chalk.magenta('RENDER'))
		return html`<!-- -->
			<div class="flex">
				<div id="led"></div>
				<div class="flex-1">
					<md-list-item>
						<!-- <div slot="start">${this.subtitle?.id ?? NaN}</div> -->
						<div slot="overline" class="flex gap-2 opacity-70">
							<span>${this.startTimecode}</span>-<span
								>${this.endTimecode}</span
							>
						</div>
						<div slot="headline">
							<!--<span contenteditable="true" @input=${this.#onInput}
								>${this.subtitle!.text}</span
							>-->
							<subtitle-input
								text=${this.subtitle!.text}
								@input=${this.#onInput}
								@click=${() => subtitlesUI.activateOnly(this.subtitle!)}
							></subtitle-input>
						</div>
						<md-icon-button tabindex="-1" slot="end" @click=${() => null}
							><md-icon>edit</md-icon></md-icon-button
						>
						<md-icon-button
							tabindex="-1"
							slot="end"
							@click=${() =>
								videoUI.playFromTo(this.subtitle!.start, this.subtitle!.end)}
							><md-icon>play_arrow</md-icon></md-icon-button
						>
						<md-icon-button
							tabindex="-1"
							slot="end"
							@click=${() =>
								this.subtitle ? deleteSubtitle(this.subtitle) : null}
							><md-icon>delete</md-icon></md-icon-button
						>
					</md-list-item>
					<md-linear-progress></md-linear-progress>
				</div>
			</div>
			<!-- -->`
	}
	set active(value: boolean) {
		value ? this.setAttribute('active', '') : this.removeAttribute('active')
	}
	get active() {
		return this.hasAttribute('active')
	}

	#onInput = (event: CustomEvent) => {
		// const target = event.target as HTMLElement
		this.subtitle!.text = event.detail.text
		subtitlesUI.activateOnly(this.subtitle!, true)
		subtitlesUI.save()
	}

	get startTimecode(): Readonly<sub.Timecode> | number {
		return this.subtitle ? numericTimeToTimecode(this.subtitle.start) : NaN
	}
	get endTimecode(): Readonly<sub.Timecode> | number {
		return this.subtitle ? numericTimeToTimecode(this.subtitle.end) : NaN
	}

	updateProgress(time: sub.NumericTime) {
		// @TODO: Maybe make this more optimal
		if (!this.subtitle || !this.progress) return
		const {start, end} = this.subtitle
		const duration = end - start
		this.progress.value = duration > 0 ? (time - start) / duration : 0
	}
}
