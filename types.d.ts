declare global {
	interface Project {
		name: string
		youtube: string | null
	}

	interface ProjectFSItem {
		path: string
		project?: Project
		creationTime: number
		updateTime: number
	}
}

export {}
