import type {MdDialog} from '@material/web/dialog/dialog.js'
import '@material/web/iconbutton/icon-button.js'
import '@material/web/textfield/filled-text-field.js'
import '@material/web/textfield/outlined-text-field.js'
import {customElement} from 'custom-element-decorator'
import {html, LitElement} from 'lit'
import {withStyles} from 'lit-with-styles'
import {query, state} from 'lit/decorators.js'
import '../material/dialog-patch.js'

declare global {
	// interface Window {
	// 	ytDlpDialog: YtDlpDialog
	// }
	interface HTMLElementTagNameMap {
		'yt-dlp-dialog': YtDlpDialog
	}
}

@customElement({name: 'yt-dlp-dialog', inject: true})
@withStyles()
export class YtDlpDialog extends LitElement {
	@state() open = false
	@state() _pending = false

	@query('md-dialog') dialog!: MdDialog

	render() {
		return html`<!-- -->
			<md-dialog
				?open=${this.open}
				@opened=${() => {
					this.renderRoot.querySelector<HTMLElement>('[autofocus]')?.focus()
				}}
				@closed=${() => {
					this.remove()
					this.open = false
				}}
			>
				<header slot="headline">yt-dlp</header>

				<div slot="content" class="flex flex-col gap-5"></div>

				<div slot="actions">
					<md-text-button @click=${() => this.close()}>Cancel</md-text-button>
					<md-filled-button
						form="form"
						value="accept"
						?disabled=${!this.canSubmit()}
						@click=${() => this.submit()}
					>
						Fetch
					</md-filled-button>
				</div>
			</md-dialog>
			<!-- --> `
	}

	canSubmit() {
		return true
	}

	async submit() {}

	show() {
		this.open = true
	}

	close() {
		this.dialog.close()
	}
}
