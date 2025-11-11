declare global {
	namespace subright {
		interface ProjectInterface {
			name?: string
			youtube: string | null
		}

		interface ProjectFSItem {
			path: string
			project?: ProjectInterface
			creationTime: number
			updateTime: number
		}
	}
}

export {}
