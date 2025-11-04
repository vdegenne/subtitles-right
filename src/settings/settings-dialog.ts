import type {MdDialog} from '@material/web/all.js'
import {withController} from '@snar/lit'
import {customElement} from 'custom-element-decorator'
import {html, LitElement} from 'lit'
import {withStyles} from 'lit-with-styles'
import {query, state} from 'lit/decorators.js'
import {FormBuilder} from '@vdegenne/forms/FormBuilder.js'
import {store} from '../store.js'
import {themeStore} from '../styles/themeStore.js'
import {renderThemeElements} from '../styles/theme-elements.js'
import styles from './settings-dialog.css?inline'
import '../material/dialog-patch.js'
import '../material/item-patch.js'

let F = new FormBuilder(store)

@customElement({name: 'settings-dialog', inject: true})
@withStyles(styles)
@withController(themeStore)
@withController(store)
export class SettingsDialog extends LitElement {
	@state() open = false

	@query('md-dialog') dialog!: MdDialog

	render() {
		return html`
			<md-dialog
				?open=${this.open}
				@closed=${() => (this.open = false)}
				style="max-width:min(100vw - 18px, 400px);width:100%"
			>
				<header slot="headline" class="select-none">
					<md-icon>settings</md-icon>
					Settings
				</header>

				<form slot="content" method="dialog" id="form" class="">
					<md-elevated-card>
						<md-text-button inert>Global</md-text-button>
						<section></section>
					</md-elevated-card>

					<md-elevated-card>
						<md-text-button inert>Theme</md-text-button>
						<section>${renderThemeElements()}</section>
					</md-elevated-card>
				</form>

				<div slot="actions">
					<md-text-button form="form" autofocus>Close</md-text-button>
				</div>
			</md-dialog>
		`
	}

	async show() {
		if (this.dialog.open) {
			const dialogClose = new Promise((resolve) => {
				const resolveCB = () => {
					resolve(null)
					this.dialog.removeEventListener('closed', resolveCB)
				}
				this.dialog.addEventListener('closed', resolveCB)
			})
			this.dialog.close()
			await dialogClose
		}
		this.open = true
	}

	close(returnValue?: string) {
		return this.dialog.close(returnValue)
	}
}

declare global {
	interface Window {
		settingsDialog: SettingsDialog
	}
	interface HTMLElementTagNameMap {
		'settings-dialog': SettingsDialog
	}
}

export const settingsDialog = (window.settingsDialog = new SettingsDialog())
