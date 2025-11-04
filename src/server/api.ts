import {Rest, type Endpoint} from '@vdegenne/mini-rest'

export interface SubtitlesRightAPI {
	get: {
		'/ping': Endpoint<void, 'pong'>
		'/fs': Endpoint<void, ProjectFSItem[]>
	}
	post: {
		'/directories': Endpoint<{fullpath: string}, any>
	}
}

export function getApi(origin = 'http://localhost:44979/api') {
	return new Rest<SubtitlesRightAPI>(origin)
}
