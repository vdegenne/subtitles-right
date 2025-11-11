import {withController} from '@snar/lit'
import {css, html} from 'lit'
import {withStyles} from 'lit-with-styles'
import {customElement} from 'lit/decorators.js'
import {guard} from 'lit/directives/guard.js'
import {until} from 'lit/directives/until.js'
import {logger} from '../logger.js'
import {store} from '../store.js'
import '../styles/themeStore.ts'
import {PageElement} from './PageElement.js'
import {api, getMeta, getSubtitles} from '../api.js'

declare global {
	interface HTMLElementTagNameMap {
		'page-compose': PageCompose
	}
}

@customElement('page-compose')
@withController(store)
@withStyles(css`
	:host {
	}
`)
export class PageCompose extends PageElement {
	video?: HTMLVideoElement

	render() {
		return guard([store.projectPath, store.videoPath], () =>
			until(
				(async () => {
					try {
						logger.log('RENDER')
						if (store.projectPath && store.videoPath) {
							if (!customElements.get('compose-view')) {
								const composeViewPath = `/dist/data/${store.projectPath}/compose.ts`
								await import(composeViewPath)
							}
							this.video = document.createElement('video')
							this.video.src = `/api/videos/${store.videoPath}`
							this.video.style.cssText = 'width: 100%;'
							this.video.controls = true
							const subtitles = await getSubtitles(store.projectPath)
							return html`<!-- -->
								<compose-view
									.video=${this.video}
									.subtitles=${subtitles}
									.projectPath=${store.projectPath}
									.videoPath=${store.videoPath}
									.meta=${store.meta}
								></compose-view>
								<!-- -->`
						}
					} catch (err: any) {
						logger.error(err.message)
						return html`<!-- -->
							<div class="m-4">
								<div>Could not load the compose view.</div>
								<div>
									Make sure the path is correct and that the project directory
									contains a ${'`compose.ts`'} file
								</div>
							</div>
							<!-- -->`
					}
				})(),
			),
		)
	}

	isPlaying() {
		return !!(
			this.video!.currentTime > 0 &&
			!this.video!.paused &&
			!this.video!.ended &&
			this.video!.readyState > 2
		)
	}

	togglePlay() {
		if (this.isPlaying()) {
			this.video!.pause()
		} else {
			this.video!.play()
		}
	}
}

// export const pageCompose = new PageCompose()
