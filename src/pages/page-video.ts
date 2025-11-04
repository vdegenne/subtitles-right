import {withController} from '@snar/lit'
import {css, html} from 'lit'
import {withStyles} from 'lit-with-styles'
import {customElement} from 'lit/decorators.js'
import {store} from '../store.js'
import {PageElement} from './PageElement.js'

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
		return html`Video page`
	}
}

// export const pageVideo = new PageVideo();
