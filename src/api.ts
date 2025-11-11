import toast from 'toastit'
import {getApi} from './server/api.js'

export const api = getApi('/api')

export async function getVideoPath(projectPath: string) {
	const {ok, text} = await api.get(
		`/video/${encodeURIComponent(projectPath)}` as '/video/:path',
	)
	const ErrorMsgOrSubtitles = await text()
	if (!ok) {
		toast(ErrorMsgOrSubtitles)
		throw new Error(ErrorMsgOrSubtitles)
	}
	return ErrorMsgOrSubtitles
}

export async function getSubtitles(projectPath: string) {
	const {ok, json, text} = await api.get(
		`/subtitles/${encodeURIComponent(projectPath)}` as '/subtitles/:path',
	)
	if (!ok) {
		toast(await text())
		throw new Error("Can't load the subtitles for this project.")
	}
	return await json()
}

export async function getMeta(projectPath: string) {
	const {ok, json, text} = await api.get(
		`/meta/${encodeURIComponent(projectPath)}` as '/meta/:path',
	)
	if (!ok) {
		toast(await text())
		throw new Error("Couldn't load project metadata")
	}
	return await json()
}
