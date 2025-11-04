import {ReactiveController, state} from '@snar/lit'

export class Directory extends ReactiveController {
	@state() name = ''
}
