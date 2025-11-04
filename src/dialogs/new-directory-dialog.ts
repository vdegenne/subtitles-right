import '@material/web/textfield/filled-text-field.js'
import '@material/web/textfield/outlined-text-field.js'
import '@material/web/iconbutton/icon-button.js'
import type {MdDialog} from '@material/web/dialog/dialog.js'
import {customElement} from 'custom-element-decorator'
import {html, LitElement} from 'lit'
import {withStyles} from 'lit-with-styles'
import {query, state} from 'lit/decorators.js'
import '../material/dialog-patch.js'
import {FormBuilder} from '@vdegenne/forms'
import {Directory as Class} from '../objects/Directory.js'
import {logger} from '../logger.js'
import {api} from '../api.js'
import toast from 'toastit'

declare global {
	interface Window {
		newDirectoryDialog: NewDirectoryDialog
	}
	interface HTMLElementTagNameMap {
		'new-directory-dialog': NewDirectoryDialog
	}
}

@customElement({name: 'new-directory-dialog', inject: true})
@withStyles()
export class NewDirectoryDialog extends LitElement {
	@state() open = false
	@state() type: 'Create' | 'Edit' = 'Create'
	@state() _pending = false

	@query('md-dialog') dialog!: MdDialog

	#old: Class | undefined
	#new: Class
	#F: FormBuilder<Class>

	constructor(directory?: Class) {
		super()
		if (directory) {
			this.type = 'Edit'
			this.#old = directory
			this.#new = new Class(this, this.#old.toJSON())
		} else {
			this.type = 'Create'
			this.#new = new Class(this)
		}
		this.#F = new FormBuilder(this.#new)

		this.addEventListener('keydown', (e: KeyboardEvent) => {
			const target = e.composedPath()[0] as HTMLElement
			if (
				target.nodeName === 'INPUT' &&
				e.code === 'Enter' &&
				this.canSubmit()
			) {
				this.submit()
			}
		})
	}

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
				<header slot="headline">${this.type} directory</header>

				<div slot="content">
					${this.#F.TEXTFIELD('Name', 'name', {
						variant: 'filled',
						resetButton: false,
						autofocus: true,
					})}
				</div>

				<div slot="actions">
					<md-text-button>Cancel</md-text-button>
					<md-filled-button
						form="form"
						value="accept"
						?disabled=${!this.canSubmit()}
						@click=${() => this.submit()}
					>
						${this.type}
					</md-filled-button>
				</div>
			</md-dialog>
			<!-- --> `
	}

	canSubmit() {
		if (this._pending) {
			return false
		}
		if (this.type === 'Edit' && this.#new.name === this.#old!.name) {
			return false
		}
		if (!this.#new.name) {
			return false
		}
		return true
	}

	async submit() {
		this._pending = true
		try {
			switch (this.type) {
				case 'Create':
					const {ok, text} = await api.post('/directories', {
						fullpath: this.#new.name,
					})
					if (!ok) {
						throw await text()
					} else {
						toast('YES')
					}
					break

				case 'Edit':
					break

				default:
					break
			}
			this.close()
		} catch (err) {
			toast(err)
		} finally {
			this._pending = false
		}
	}

	show() {
		this.open = true
	}

	close() {
		this.dialog.close()
	}
}

// export const dialogNewDirectoryDialog = new DialogNewDirectoryDialog();
