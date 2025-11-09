import '@material/web/textfield/filled-text-field.js'
import '@material/web/textfield/outlined-text-field.js'
import '@material/web/iconbutton/icon-button.js'
import type {MdDialog} from '@material/web/all.js'
import {FormBuilder} from '@vdegenne/forms'
import {customElement} from 'custom-element-decorator'
import {html, LitElement} from 'lit'
import {withStyles} from 'lit-with-styles'
import {query, state} from 'lit/decorators.js'
import toast from 'toastit'
import {subtitlesUI} from './subtitles-element.js'
// import '../material/dialog-patch.js'
import {confirm} from './confirm.js'

declare global {
	interface Window {
		fillEmptySubtitlesDialog: FillEmptySubtitlesDialog
	}
	interface HTMLElementTagNameMap {
		'fill-empty-subtitles-dialog': FillEmptySubtitlesDialog
	}
}

@customElement({name: 'fill-empty-subtitles-dialog', inject: true})
@withStyles()
export class FillEmptySubtitlesDialog extends LitElement {
	@state() open = false
	@state() input = ''

	F = new FormBuilder(this)

	@query('md-dialog') dialog!: MdDialog

	canSubmit() {
		return this.input
	}

	render() {
		return html`<!-- -->
			<md-dialog
				?open="${this.open}"
				@opened=${() => {
					this.renderRoot.querySelector<HTMLElement>('[autofocus]')?.focus()
				}}
				@closed=${() => {
					this.remove()
					this.open = false
				}}
			>
				<header slot="headline">Fill empty subtitles</header>

				<form slot="content" method="dialog" id="form">
					${this.F.TEXTAREA('Input', 'input', {
						supportingText: '\\n line separated input',
						variant: 'filled',
						rows: 5,
						style: {width: '100%'},
						autofocus: true,
					})}
				</form>

				<div slot="actions">
					<md-text-button form="form">Close</md-text-button>
					<md-filled-button
						?disabled=${!this.canSubmit()}
						@click=${() => this.submit()}
					>
						<md-icon slot="icon">water_full</md-icon>
						Fill
					</md-filled-button>
				</div>
			</md-dialog>
			<!-- --> `
	}

	@confirm({headline: 'Are you sure?'})
	private submit() {
		subtitlesUI.fillEmptySubtitles(this.input)
		this.open = false
	}

	async show() {
		this.open = true
	}
}

// export const fillEmptySubtitlesDialog = new FillEmptySubtitlesDialog();
