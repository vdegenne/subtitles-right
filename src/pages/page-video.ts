import {withController} from '@snar/lit'
import {css, html} from 'lit'
import {withStyles} from 'lit-with-styles'
import {customElement} from 'lit/decorators.js'
import {store} from '../store.js'
import {PageElement} from './PageElement.js'
import {videoUI} from '../video-element.js'
import {subtitlesUI} from '../subtitles-element.js'

declare global {
	interface HTMLElementTagNameMap {
		'page-video': PageVideo
	}
}

@customElement('page-video')
@withController(store)
@withStyles(css`
	:host {
	}
`)
export class PageVideo extends PageElement {
	render() {
		return html`<!-- -->
			<div class="flex">
				<div
					class="shrink-0"
					style="width:var(--video-container-width);/*background-color:var(--md-sys-color-surface-container);*/"
				>
					${videoUI}
				</div>
				<div class="flex-1 pb-24">${subtitlesUI}</div>
			</div>
			<!-- -->`
	}
}

// export const pageVideo = new PageVideo();
