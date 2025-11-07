import {Logger} from '@vdegenne/debug'
import {config} from '@vdegenne/koa'
import {video} from '@vdegenne/koa/middlewares/video.js'
import {isValidYouTubeUrl} from '@vdegenne/youtube'
import chalk from 'chalk'
import {SubtitlesRightAPI} from './api.js'
import {PORT} from './constants.js'
import {
	createDirectory,
	createMetaFile,
	deleteDirectory,
	findFirstVideo,
	getSubtitles,
	listProjectFSItems,
	openDirectory,
	openTerminal,
	saveSubtitles,
} from './functions.js'
import {DirectoryNotFoundError} from './errors.js'

const debug = true

export const logger = new Logger({
	prefix: 'SUBRIGHT_SRV',
	colors: {log: chalk.yellowBright, debug: chalk.grey},
	debug,
})

config<SubtitlesRightAPI>({
	apiVersion: 'api',

	logger,
	debug,

	port: PORT,

	// statics: ['./dist' /*, {prefix: '/videos', location: '..'}*/],

	middlewares: [video(['./dist/data'])],

	get: {
		'/ping': () => 'pong',
		'/fs': () => listProjectFSItems(),
		'/open/:path'({ctx, params}) {
			const success = openDirectory(params.path!)
			if (!success) {
				ctx.throw(404, "The directory doesn't exist.")
			}
			return ''
		},
		'/terminal/:path'({ctx, params}) {
			const success = openTerminal(params.path!)
			if (!success) {
				ctx.throw(404, "The directory doesn't exist.")
			}
			return ''
		},

		'/video/:path'({ctx, params}) {
			// const name = findFirstVideo(params.path!)
			try {
				return findFirstVideo(params.path!)
			} catch {}
		},

		'/subtitles/:path'({ctx, guard, params}) {
			try {
				return getSubtitles(params.path!)
			} catch {
				return []
			}
		},
	},

	post: {
		'/directories'({ctx, guard}) {
			const {fullpath} = guard({required: ['fullpath'], allowAlien: true})
			if (!fullpath) {
				ctx.throw(400, '"fullpath" needs a value')
			}
			try {
				createDirectory(fullpath)
			} catch {
				ctx.throw(409, 'This directory already exists')
			}
			return ''
		},
		'/projects'({ctx, guard}) {
			let {fullpath, youtube} = guard({
				required: ['fullpath'],
				allowAlien: true,
			})
			if (!fullpath) {
				ctx.throw(400, '"fullpath" needs a value')
			}
			if (youtube === undefined) {
				youtube = null
			}
			if (youtube !== null) {
				if (!youtube) {
					ctx.throw(400, '"youtube" needs a value (or use null)')
				}
				if (!isValidYouTubeUrl(youtube)) {
					ctx.throw(400, 'The youtube link needs to be a valid youtube url')
				}
			}
			try {
				createDirectory(fullpath)
			} catch {
				ctx.throw(409, 'This directory already exists')
			}
			createMetaFile(fullpath, {youtube})
			return ''
		},
	},

	put: {
		'/subtitles/:path'({ctx, body, params}) {
			if (body === undefined) {
				ctx.throw(400, 'Body required')
			}
			const subtitles = body
			if (!Array.isArray(subtitles)) {
				ctx.throw(400, 'Body needs to be an array of subtitles')
			}
			try {
				saveSubtitles(params.path!, subtitles)
			} catch (err) {
				if (err instanceof DirectoryNotFoundError) {
					ctx.throw(404, "This project directory doesn't exist.")
				}
			}
			return ''
		},
	},

	delete: {
		'/directory/:path'({ctx, guard, params}) {
			const success = deleteDirectory(params.path!)
			if (!success) {
				ctx.throw(409, "The directory you are trying to delete doesn't exist.")
			}
			return ''
		},
	},
})
