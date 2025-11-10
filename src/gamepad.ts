import {ReactiveController} from '@snar/lit'
import {MGamepad, MiniGamepad, Mode} from '@vdegenne/mini-gamepad'
import {state} from 'lit/decorators.js'
import {logger} from './logger.js'
import {store} from './store.js'
import {videoUI} from './video-element.js'
import {AddSubtitleOptions, subtitlesUI} from './subtitles-element.js'
import {persistentStore} from './persistentStore.js'
import {pageCompose} from './pages/page-compose.js'
import {app} from './app-shell/app-shell.js'

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
						videoUI.rewind()
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
						videoUI.fastforward()
						break
					case Mode.TERTIARY:
						break
				}
			})
			// X
			gamepad.for(map.RIGHT_BUTTONS_LEFT).before(async ({mode}) => {
				let subtitle: sub.Subtitle | undefined
				let options: Partial<AddSubtitleOptions> = {activate: true}
				switch (mode) {
					case Mode.NORMAL:
						subtitle = {
							start: videoUI.time,
							end: videoUI.time + persistentStore.newSubEntryLengthS,
							text: '',
						}
						options.allowClinging = true
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
						break
				}

				if (subtitle) {
					subtitlesUI.addSubtitle(subtitle, options)
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

			gamepad.for(map.RIGHT_BUTTONS_RIGHT).before(({mode}) => {
				if (mode === Mode.NORMAL) {
				}
			})

			gamepad.for(map.L1).before(({mode}) => {
				switch (store.page) {
					case 'video':
						switch (mode) {
							case Mode.NORMAL:
								if (videoUI.isPlaying() && videoUI.lookupTime) {
									// Making sure the lookup time is updated
									const active = subtitlesUI.getActiveSubtitle()
									if (active) {
										videoUI.lookupTime = active.end
									}
									videoUI.pause()
								} else if (!videoUI.isPlaying() && videoUI.lookupTime) {
									const active = subtitlesUI.getActiveSubtitle()
									if (active) {
										videoUI.lookupTime = active.end
									}
									videoUI.play()
								} else {
									const active = subtitlesUI.getActiveSubtitle()
									if (active) {
										videoUI.playSubtitle(active)
									} else {
										videoUI.play()
									}
								}
								break
							case Mode.PRIMARY:
								if (videoUI.isPlaying() && videoUI.lookupTime) {
									videoUI.lookupTime = undefined
								} else if (!videoUI.isPlaying() && videoUI.lookupTime) {
									videoUI.lookupTime = undefined
									videoUI.play()
								} else {
									videoUI.togglePlay()
								}
								break

							case Mode.SECONDARY:
								const active = subtitlesUI.getActiveSubtitle()
								if (active) {
									videoUI.playSubtitle(active)
								} else {
									// videoUI.play()
								}
								break
						}
						break
					case 'compose':
						app.pageCompose.togglePlay()
						break
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

			// DPAD_UP
			gamepad.for(map.LEFT_BUTTONS_TOP).before(({mode}) => {
				switch (mode) {
					case Mode.NORMAL:
						videoUI.pause()
						videoUI.lookupTime = undefined
						subtitlesUI.activatePrevious(false)
						break
					case Mode.PRIMARY:
						videoUI.pause()
						videoUI.lookupTime = undefined
						subtitlesUI.activateFirst(false)
						break
				}
			})
			// DPAD_DOWN
			gamepad.for(map.LEFT_BUTTONS_BOTTOM).before(({mode}) => {
				switch (mode) {
					case Mode.NORMAL:
						videoUI.pause()
						videoUI.lookupTime = undefined
						subtitlesUI.activateNext(false)
						break
					case Mode.PRIMARY:
						videoUI.pause()
						videoUI.lookupTime = undefined
						subtitlesUI.activateLast(false)
						break
				}
			})

			// DPAD_LEFT
			gamepad.for(map.LEFT_BUTTONS_LEFT).before(({mode}) => {
				switch (mode) {
					case Mode.NORMAL:
						subtitlesUI.subtractStartTime()
						break
					case Mode.SECONDARY:
						subtitlesUI.subtractEndTime()
						break
				}
			})
			// DPAD_RIGHT
			gamepad.for(map.LEFT_BUTTONS_RIGHT).before(({mode}) => {
				switch (mode) {
					case Mode.NORMAL:
						subtitlesUI.addStartTime()
						break
					case Mode.SECONDARY:
						subtitlesUI.addEndTime()
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
			gamepad.for(map.RIGHT_BUTTONS_BOTTOM).before(async ({mode}) => {
				switch (mode) {
					case Mode.NORMAL:
						if (videoUI.lookupTime) {
							videoUI.lookupTime = undefined
						} else if (videoUI.isPlaying()) {
							videoUI.pause()
						}
						break
					case Mode.TERTIARY:
						break
				}
			})

			gamepad.for(map.MIDDLE_LEFT).before(({mode}) => {
				switch (mode) {
					case Mode.NORMAL:
						break
				}
			})

			gamepad.for(map.LEFT_STICK_PRESS).before(({mode}) => {
				switch (mode) {
					case Mode.NORMAL:
						// undefined to apply on the active subtitle if any
						subtitlesUI.setStartTime(videoUI.time, undefined, true)
						break
				}
			})
			gamepad.for(map.RIGHT_STICK_PRESS).before(({mode}) => {
				switch (mode) {
					case Mode.NORMAL:
						// undefined to apply on the active subtitle if any
						subtitlesUI.setEndTime(videoUI.time, undefined, true)
						break
				}
			})
		})
	}
}

export const gamepadCtrl = new GamepadController()
