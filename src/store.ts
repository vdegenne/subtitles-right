import {explode} from '@vdegenne/path'
import {PropertyValues, ReactiveController, state} from '@snar/lit'
import {Logger} from '@vdegenne/debug'
import {FormBuilder} from '@vdegenne/forms/FormBuilder.js'
import chalk from 'chalk'
import {saveToLocalStorage} from 'snar-save-to-local-storage'
import toast from 'toastit'
import {api} from './api.js'
import {availablePages, Page} from './pages/index.js'
import {trim} from './utils.js'

const logger = new Logger({
	color: chalk.blueBright,
	errorColor: chalk.red,
})

@saveToLocalStorage('subtitles-right:store')
export class AppStore extends ReactiveController {
	F = new FormBuilder(this)

	@state() page: Page = 'main'
	@state() fs: ProjectFSItem[] = []
	@state() currentPath = ''

	constructor() {
		super()
		this.loadFS()
	}

	protected updated(changed: PropertyValues<this>) {
		logger.log('UPDATED called')
		logger.log(`fspath: ${this.currentPath}`)
		if (changed.has('page')) {
			const page = availablePages.includes(this.page) ? this.page : '404'
			import(`./pages/page-${page}.ts`)
				.then(() => {
					console.log(`Page ${page} loaded.`)
				})
				.catch(() => {})
		}
	}

	async loadFS() {
		const {ok, json} = await api.get('/fs')
		if (!ok) {
			const errMsg = 'Something went wrong when fetching the fs'
			logger.error(errMsg)
			toast(errMsg)
			return (this.fs = [])
		}
		return (this.fs = await json())
	}

	getCurrentFSItems() {
		console.log('debug')
		const currentPath = trim(this.currentPath, '/')
		const pathParts = explode(currentPath)
		console.log(pathParts)
		const pathLength = pathParts.length
		const items = this.fs.filter((i) => {
			const parts = i.path.split(/\/+/)
			return parts.length === pathLength + 1 && i.path.startsWith(currentPath)
		})
		// console.log(currentPath, pathLength)
		return items
	}
}

export const store = new AppStore()
