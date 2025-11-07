import {ReactiveController} from '@snar/lit'
import {MGamepad, MiniGamepad, Mode} from '@vdegenne/mini-gamepad'
import {state} from 'lit/decorators.js'
import {logger} from './logger.js'
import {store} from './store.js'
import {videoUI} from './video-element.js'
import {subtitlesUI} from './subtitles-element.js'
import {persistentStore} from './persistentStore.js'

class GamepadController extends ReactiveController {
	@state() gamepad: MGamepad | undefined

	constructor() {
		super()
		const minigp = new MiniGamepad({
			// pollSleepMs: 900,
			focusDeadTimeMs: 200,
			debug: true,
			logger,
		})
		minigp.onConnect((gamepad) => {
			this.gamepad = gamepad
			const map = gamepad.mapping

			gamepad.for(map.LEFT_STICK_LEFT).before(({mode}) => {
				switch (mode) {
					case Mode.NORMAL:
						break
					case Mode.PRIMARY:
						break
					case Mode.SECONDARY:
						break
					case Mode.TERTIARY:
						break
				}
			})
			gamepad.for(map.LEFT_STICK_RIGHT).before(({mode}) => {
				switch (mode) {
					case Mode.NORMAL:
						break
					case Mode.TERTIARY:
						break
				}
			})
			gamepad.for(map.RIGHT_BUTTONS_LEFT).before(async ({mode}) => {
				let subtitle: sub.Subtitle
				switch (mode) {
					case Mode.NORMAL:
						subtitle = {
							start: videoUI.time,
							end: videoUI.time + persistentStore.newSubEntryLengthS,
							text: '',
						}
						subtitlesUI.addSubtitle(subtitle)
						break
					case Mode.PRIMARY:
						const last = subtitlesUI.getLastSubtitle()
						if (last) {
							subtitle = {
								start: last.end + persistentStore.newSubEntryOffsetS,
								end:
									last.end +
									persistentStore.newSubEntryOffsetS +
									persistentStore.newSubEntryLengthS,
								text: '',
							}
						} else {
							subtitle = {
								start: videoUI.time,
								end: videoUI.time + persistentStore.newSubEntryLengthS,
								text: '',
							}
						}
						subtitlesUI.addSubtitle(subtitle)
						await subtitlesUI.updateComplete
						subtitlesUI.activateOnly(subtitle, true)
						break
				}
			})

			gamepad.for(map.RIGHT_STICK_LEFT).before(({mode}) => {
				switch (mode) {
					case Mode.NORMAL:
						break
				}
			})
			gamepad.for(map.RIGHT_STICK_RIGHT).before(({mode}) => {
				switch (mode) {
					case Mode.NORMAL:
						break
				}
			})

			gamepad.for(map.RIGHT_BUTTONS_BOTTOM).before(async ({mode}) => {
				switch (mode) {
					case Mode.NORMAL:
						break
					case Mode.TERTIARY:
						break
				}
			})
			gamepad.for(map.RIGHT_BUTTONS_RIGHT).before(({mode}) => {
				if (mode === Mode.NORMAL) {
				}
			})

			gamepad.for(map.L1).before(({mode}) => {
				switch (store.page) {
					case 'video':
						switch (mode) {
							case Mode.NORMAL:
								videoUI.togglePlay()
								break
						}
						break
				}
				if (mode === Mode.NORMAL) {
				}
			})
			gamepad.for(map.R1).before(({mode}) => {
				if (mode === Mode.NORMAL) {
				}
			})

			gamepad.for(map.LEFT_BUTTONS_RIGHT).before(({mode}) => {
				switch (mode) {
					case Mode.NORMAL:
						break
				}
			})

			gamepad.for(map.LEFT_BUTTONS_BOTTOM).before(({mode}) => {
				switch (mode) {
					case Mode.NORMAL:
						break
					case Mode.PRIMARY:
						break
				}
			})

			gamepad.for(map.LEFT_BUTTONS_LEFT).before(({mode}) => {
				switch (mode) {
					case Mode.NORMAL:
						break
					case Mode.PRIMARY:
						break
					case Mode.TERTIARY:
						break
				}
			})

			gamepad.for(map.RIGHT_BUTTONS_TOP).before(({mode}) => {
				switch (mode) {
					case Mode.NORMAL:
						break
					case Mode.PRIMARY:
						break
					case Mode.SECONDARY:
					case Mode.TERTIARY:
				}
			})

			gamepad.for(map.MIDDLE_LEFT).before(({mode}) => {
				switch (mode) {
					case Mode.NORMAL:
						break
				}
			})
		})
	}
}

export const gamepadCtrl = new GamepadController()
