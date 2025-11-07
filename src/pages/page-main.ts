import {withController} from '@snar/lit'
import {basename, dirname} from '@vdegenne/path'
import {css, html} from 'lit'
import {withStyles} from 'lit-with-styles'
import {customElement, state} from 'lit/decorators.js'
import {fs} from '../fssystem.js'
import {openDirectoryDialog, openProjectDialog} from '../imports.js'
import {logger} from '../logger.js'
import {store} from '../store.js'
import {PageElement} from './PageElement.js'
import {deleteCurrentDirectory} from '../dialogs.js'
import {api} from '../api.js'

declare global {
	interface HTMLElementTagNameMap {
		'page-main': PageMain
	}
}

@customElement('page-main')
@withController(store)
@withController(fs)
@withStyles(css`
	:host {
	}
`)
export class PageMain extends PageElement {
	render() {
		logger.log('RENDER')
		const fsitems = fs.readWorkingDir()
		return html`<!-- -->
			<md-list>
				<md-list-item>
					<md-icon-button
						slot="start"
						?inert=${!fs.current}
						href="/#fspath=${dirname(fs.current)}"
						><md-icon>arrow_back</md-icon></md-icon-button
					>
					<div slot="headline">${fs.current}</div>
					<div slot="end" class="flex items-center gap-1">
						<md-icon-button @click=${() => fs.openDirectory()}
							><md-icon>folder_open</md-icon></md-icon-button
						>
						<md-icon-button
							error
							@click=${deleteCurrentDirectory}
							?hidden=${!fs.current}
						>
							<md-icon>delete</md-icon>
						</md-icon-button>
					</div>
				</md-list-item>
				${fsitems.map((item) => {
					const isProject = !!item.project
					const href = isProject
						? `/video/${item.path}`
						: `/#fspath=${item.path}`
					return html`<!-- -->
						<md-list-item href="${href}">
							${isProject
								? html`<!-- -->
										<md-icon slot="start">play_arrow</md-icon>
										${basename(item.path)}
										<!-- -->`
								: html`<!-- -->
										<md-icon slot="start">folder</md-icon>
										${basename(item.path)}
										<!-- -->`}
						</md-list-item>
						<!-- -->`
				})}
			</md-list>

			<div class="text-center m-10">
				${fs.exists()
					? fsitems.length === 0
						? html`<!-- -->

								<wavy-text>Empty.</wavy-text>
								<!-- -->`
						: null
					: html`<!-- -->
							<wavy-text label="Ghost directory"></wavy-text>
							<!-- -->`}
			</div>

			<div class="fixed bottom-0 right-0 flex flex-col gap-3 m-10 items-center">
				<md-fab
					size="small"
					variant="secondary"
					@click=${() => openDirectoryDialog()}
				>
					<md-icon slot="icon">create_new_folder</md-icon>
				</md-fab>
				<md-fab variant="tertiary" @click=${() => openProjectDialog()}>
					<md-icon slot="icon">add</md-icon>
				</md-fab>
			</div>
			<!-- -->`
	}
}
// export const pageMain = new PageMain();
