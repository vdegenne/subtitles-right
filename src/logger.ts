import {Logger} from '@vdegenne/debug'
import chalk from 'chalk'

export const logger = new Logger({
	colors: {
		log: chalk.green,
	},
})
