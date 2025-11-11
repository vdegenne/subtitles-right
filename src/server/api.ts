import {Rest, type Endpoint} from '@vdegenne/mini-rest'

type PostProject = subright.ProjectInterface & {fullpath: string}

export interface SubtitlesRightAPI {
	get: {
		'/ping': Endpoint<void, 'pong'>
		'/fs': Endpoint<void, subright.ProjectFSItem[]>
		'/open/:path': Endpoint<void, ''>
		'/terminal/:path': Endpoint<void, ''>
		'/video/:path': Endpoint<void, string>
		'/subtitles/:path': Endpoint<void, sub.Subtitles>
		'/meta/:path': Endpoint<void, subright.ProjectInterface>
	}
	post: {
		'/directories': Endpoint<{fullpath: string}, ''>
		'/projects': Endpoint<PostProject, ''>
	}
	put: {
		'/subtitles/:path': Endpoint<sub.Subtitles, ''>
	}
	delete: {
		'/directory/:path': Endpoint<void, ''>
	}
}

export function getApi(origin = 'http://localhost:44979/api') {
	return new Rest<SubtitlesRightAPI>(origin)
}
