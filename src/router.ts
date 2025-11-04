import {Hash, Router} from '@vdegenne/router'
import {Page} from './pages/index.js'
import {store} from './store.js'
import {Logger} from '@vdegenne/debug'
import chalk from 'chalk'

const hash = new Hash<{fspath: string}>({paramsToHashReflect: false})
const logger = new Logger({
	color: chalk.yellow,
})

export const router = new Router(async ({location, parts}) => {
	logger.log('Location has changed')
	await store.updateComplete
	hash.reflectHashToParams()
	if (parts.length === 0) {
		store.page = 'main'
		if (!hash.has('fspath')) {
			hash.$('fspath', '')
			hash.reflectParamsToHash()
			return
		}
		const fspath = hash.$('fspath')
		console.log(fspath)
		if (fspath !== undefined) {
			logger.log(`set store fspath (${fspath})`)
			store.currentPath = fspath
		}
	} else {
		store.page = parts[0] as Page
	}
})
