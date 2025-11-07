import {PropertyValues, ReactiveController, state} from '@snar/lit'
import {Logger} from '@vdegenne/debug'
import {FormBuilder} from '@vdegenne/forms/FormBuilder.js'
import chalk from 'chalk'
// import { saveToLocalStorage } from 'snar-save-to-local-storage'
import {availablePages, Page} from './pages/index.js'

const logger = new Logger({
	colors: {
		log: chalk.grey,
	},
})

/**
 * videoPath and page are set by the router on url change (when the page reloads also)
 * so it doesn't really need to be save in the localstorage and it's fine this way.
 * Better create a new store for persistent values only.
 */
// @saveToLocalStorage('subtitles-right:store')
export class AppStore extends ReactiveController {
	@state() videoPath: string | undefined
	@state() page: Page = 'main'

	F = new FormBuilder(this)

	protected updated(changed: PropertyValues<this>) {
		// TODO: if the page is a video, we can load information about it.
		if (changed.has('page')) {
			const page = availablePages.includes(this.page) ? this.page : '404'
			if (!customElements.get(`page-${page}`)) {
				import(`./pages/page-${page}.ts`)
					.then(() => {
						logger.log(`Page ${page} loaded.`)
					})
					.catch(() => {})
			}
		}
	}
}

export const store = new AppStore()
// @ts-ignore
window.store = store
