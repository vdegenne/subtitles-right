import type {MdDialog} from '@material/web/dialog/dialog.js'
import '@material/web/iconbutton/icon-button.js'
import '@material/web/textfield/filled-text-field.js'
import '@material/web/textfield/outlined-text-field.js'
import {FormBuilder} from '@vdegenne/forms'
import {join} from '@vdegenne/path'
import {customElement} from 'custom-element-decorator'
import {html, LitElement} from 'lit'
import {withStyles} from 'lit-with-styles'
import {query, state} from 'lit/decorators.js'
import toast from 'toastit'
import {api} from '../api.js'
import {fs} from '../fssystem.js'
import '../material/dialog-patch.js'
import {Project as Class} from '../objects/Project.js'

declare global {
	interface Window {
		ProjectDialog: ProjectDialog
	}
	interface HTMLElementTagNameMap {
		'project-dialog': ProjectDialog
	}
}

@customElement({name: 'project-dialog', inject: true})
@withStyles()
export class ProjectDialog extends LitElement {
	@state() open = false
	@state() type: 'Create' | 'Edit' = 'Create'
	@state() _pending = false

	@query('md-dialog') dialog!: MdDialog

	#old: Class | undefined
	#new: Class
	#F: FormBuilder<Class>

	constructor(project?: Class) {
		super()
		if (project) {
			this.type = 'Edit'
			this.#old = project
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
				<header slot="headline">${this.type} project</header>

				<div slot="content" class="flex flex-col gap-5">
					${this.#F.TEXTFIELD('Name', 'name', {
						variant: 'filled',
						resetButton: false,
						autofocus: true,
					})}
					${this.#F.TEXTFIELD('YouTube', 'youtube', {
						variant: 'filled',
						resetButton: false,
					})}
				</div>

				<div slot="actions">
					<md-text-button @click=${() => this.close()}>Cancel</md-text-button>
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
					const {ok, text} = await api.post('/projects', {
						fullpath: join(fs.current, this.#new.name),
						youtube: this.#new.youtube,
					})
					if (!ok) {
						throw await text()
					} else {
						toast('Project created')
						fs.reload()
						fs.enterProject(this.#new.name)
					}
					break

				case 'Edit':
					throw 'Not implemented yet'

				default:
					break
			}
			this.close()
		} catch (err) {
			toast(err)
			throw err
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

// export const dialogProjectDialog = new DialogProjectDialog();
