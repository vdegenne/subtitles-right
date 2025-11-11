import {Logger} from '@vdegenne/debug'
import {Hash, Router} from '@vdegenne/router'
import chalk from 'chalk'
import {fs} from './fssystem.js'
import {Page} from './pages/index.js'
import {store} from './store.js'
import {trim} from './utils.js'

export const hash = new Hash<{fspath: string}>({
	paramsToHashReflect: true,
	encode: false,
})
const logger = new Logger({
	colors: {log: chalk.yellow},
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
		const fspath = trim(hash.$('fspath') ?? '', '/')
		if (fspath !== undefined) {
			logger.log(`set fssystem path to "${fspath}"`)
			fs.current = fspath
		}
	} else {
		store.page = parts[0] as Page
		if (parts[0] === 'video' || parts[0] === 'compose') {
			store.projectPath = decodeURIComponent(parts.slice(1).join('/'))
		}
	}
})

export function getComposePageURL(projectPath: string) {
	return `/compose/${projectPath}`
}
