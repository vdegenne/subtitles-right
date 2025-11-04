import {Logger} from '@vdegenne/debug'
import chalk from 'chalk'

export const logger = new Logger({
	color: chalk.magenta,
	errorColor: chalk.red,
})
