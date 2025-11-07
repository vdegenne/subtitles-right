import {PropertyValues, ReactiveController, state} from '@snar/lit'
import {Logger} from '@vdegenne/debug'
import {FormBuilder} from '@vdegenne/forms/FormBuilder.js'
import chalk from 'chalk'
import {saveToLocalStorage} from 'snar-save-to-local-storage'
import {availablePages, Page} from './pages/index.js'

const logger = new Logger({
	colors: {
		log: chalk.grey,
	},
})

@saveToLocalStorage('subtitles-right:store')
export class AppStore extends ReactiveController {
	/**
	 * When a new subtitle entry is inserted,
	 * how long is the clip?
	 * In seconds.
	 */
	@state() newSubEntryLengthS = 4
	/*
	 * When a new subtitle entry is inserted using cling method,
	 * how offsetted it is from the end time of the previous entry?
	 * In seconds.
	 */
	@state() newSubEntryOffsetS = 0.1 // 100ms

	F = new FormBuilder(this)

	protected updated(changed: PropertyValues<this>) {}
}

export const persistentStore = new AppStore()
