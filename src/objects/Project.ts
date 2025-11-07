import {ReactiveController, state} from '@snar/lit'

export class Project extends ReactiveController<subright.ProjectInterface> {
	/**
	 * Will be used for the directory name on the filesystem
	 */
	@state() name = ''
	@state() youtube: string | null = null
}
