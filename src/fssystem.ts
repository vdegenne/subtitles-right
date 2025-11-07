import {PropertyValues, ReactiveController, state} from '@snar/lit'
import {Logger} from '@vdegenne/debug'
import {explode, join, oneDirectoryUp} from '@vdegenne/path'
import chalk from 'chalk'
import toast from 'toastit'
import {api} from './api.js'
import {hash} from './router.js'
import {trim} from './utils.js'

const logger = new Logger({
	colors: {
		log: chalk.blueBright,
	},
})

class FSSystem extends ReactiveController {
	@state() fs: subright.ProjectFSItem[] = []
	@state() current = ''

	constructor() {
		super()
		this.reload()
	}

	protected updated(_changed: PropertyValues<this>) {
		logger.log('UPDATED called')
		logger.log(`fspath: ${this.current}`)
	}

	async reload() {
		const {ok, json} = await api.get('/fs')
		if (!ok) {
			const errMsg = 'Something went wrong when fetching the fs'
			logger.error(errMsg)
			toast(errMsg)
			return (this.fs = [])
		}
		return (this.fs = await json())
	}

	readdir(dir: string) {
		const path = trim(dir, '/')
		const pathParts = explode(path)
		return this.fs.filter((i) => {
			const parts = explode(trim(i.path, '/'))
			return parts.length === pathParts.length + 1 && i.path.startsWith(path)
		})
	}
	readWorkingDir() {
		return this.readdir(this.current)
	}

	enterDirectory(name: string) {
		// const trimmedName = trim(name, '/')
		// const current = trim(this.current, '/')
		// // const nextPath = current ? `${current}/${trimmedName}` : trimmedName
		// const nextPath = current + '/' + trimmedName
		const path = join(this.current, name)

		hash.$('fspath', path)
	}

	enterProject(name: string) {
		const path = join('video', this.current, name)
		const a = document.createElement('a')
		a.href = path
		a.click()
	}

	oneDirectoryUp() {
		const previous = oneDirectoryUp(this.current)
		hash.$('fspath', previous)
	}

	exists(fullpath = this.current) {
		if (fullpath === '') return true
		const parts = JSON.stringify(explode(fullpath))
		return this.fs.some((item) => JSON.stringify(explode(item.path)) === parts)
	}

	async openDirectory(fullpath = this.current) {
		try {
			logger.log(`Opening "${fullpath || '/'}"`)
			const {ok, text} = await api.get(
				`/open/${encodeURIComponent(fullpath || '/')}` as '/open/:path',
			)
			if (!ok) {
				throw await text()
			}
		} catch (err) {
			toast(err)
		}
	}

	async openTerminal(fullpath = this.current) {
		try {
			logger.log(`Opening "${fullpath || '/'}"`)
			const {ok, text} = await api.get(
				`/terminal/${encodeURIComponent(fullpath || '/')}` as '/terminal/:path',
			)
			if (!ok) {
				throw await text()
			}
		} catch (err) {
			toast(err)
		}
	}
}

export const fs = new FSSystem()
