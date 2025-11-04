import {config} from '@vdegenne/koa'
import {PORT} from './constants.js'
import {SubtitlesRightAPI} from './api.js'
import {ensureDirectory, listProjectFSItems} from './functions.js'
import {Logger} from '@vdegenne/debug'
import chalk from 'chalk'

const debug = true

const logger = new Logger({
	prefix: 'SUBRIGHT_SRV',
	color: chalk.yellowBright,
	debug,
})

config<SubtitlesRightAPI>({
	apiVersion: 'api',

	logger,
	debug,

	port: PORT,

	statics: ['./public' /*, {prefix: '/videos', location: '..'}*/],

	get: {
		'/ping': () => 'pong',
		'/fs': () => listProjectFSItems(),
		// info() {
		// 	return {
		// 		videos: listVideos(),
		// 	}
		// },
	},

	post: {
		'/directories'({ctx, guard, debug}) {
			debug()
			const {fullpath} = guard({required: ['fullpath'], allowAlien: true})
			if (!fullpath) {
				ctx.throw(400, '"fullpath" needs a value')
			}
			console.log(fullpath)
			return ''
			const success = ensureDirectory(fullpath)
			if (!success) {
				ctx.throw(409, 'This directory already exists')
			}
		},
	},
})
