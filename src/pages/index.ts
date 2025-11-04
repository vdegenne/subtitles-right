import {cquerySelector} from 'html-vision'
import {PageMain} from './page-main.js'
import {PageVideo} from './page-video.js'

export const availablePages = ['main', 'video'] as const
export type Page = (typeof availablePages)[number]

export function getPage(name: Page) {
	return cquerySelector(`page-${name}`)
}
export function getMainPage() {
	return getPage('main') as PageMain
}
export function getVideoPage() {
	return getPage('video') as PageVideo
}
