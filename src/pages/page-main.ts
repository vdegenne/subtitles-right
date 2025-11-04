import {ifDefined} from 'lit/directives/if-defined.js'
import {basename, dirname, oneDirectoryUp} from '@vdegenne/path'
import {withController} from '@snar/lit'
import {css, html} from 'lit'
import {withStyles} from 'lit-with-styles'
import {customElement} from 'lit/decorators.js'
import {store} from '../store.js'
import {PageElement} from './PageElement.js'
import {logger} from '../logger.js'
import {classMap} from 'lit/directives/class-map.js'
import {createNewDirectory} from '../dialogs.js'
import {openNewDirectoryDialog} from '../imports.js'

declare global {
	interface HTMLElementTagNameMap {
		'page-main': PageMain
	}
}

@customElement('page-main')
@withController(store)
@withStyles(css`
	:host {
	}
`)
export class PageMain extends PageElement {
	render() {
		logger.log('RENDER')
		const fsitems = store.getCurrentFSItems()
		return html`<!-- -->
			<md-list>
				<md-list-item
					class=${classMap({invisible: !store.currentPath})}
					href=${ifDefined(
						store.currentPath
							? `/#fspath=${dirname(store.currentPath)}`
							: undefined,
					)}
				>
					<md-icon slot="start">arrow_back</md-icon>
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

			<div class="fixed bottom-0 right-0 flex flex-col gap-3 m-10 items-center">
				<md-fab
					size="small"
					variant="secondary"
					@click=${() => openNewDirectoryDialog()}
				>
					<md-icon slot="icon">create_new_folder</md-icon>
				</md-fab>
				<md-fab variant="tertiary">
					<md-icon slot="icon">add</md-icon>
				</md-fab>
			</div>
			<!-- -->`
	}
}
// export const pageMain = new PageMain();
