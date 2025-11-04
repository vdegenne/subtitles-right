import * as fs from 'fs'
import * as path from 'path'
import {DATA_ROOT, META_FILENAME} from './constants.js'

// Function to read meta.json and return a Project
function readProjectMeta(dirPath: string): Project | undefined {
	const metaPath = path.join(dirPath, META_FILENAME)
	if (!fs.existsSync(metaPath)) return undefined

	try {
		const raw = fs.readFileSync(metaPath, 'utf-8')
		const data = JSON.parse(raw)
		// Ensure it matches Project type minimally
		return data
	} catch (e) {
		console.error('Failed to read meta.json in', dirPath, e)
	}
	return undefined
}

// Recursive function to list all directories and build ProjectFSItem list
export function listProjectFSItems(dirPath = DATA_ROOT): ProjectFSItem[] {
	const items: ProjectFSItem[] = []
	const entries = fs.readdirSync(dirPath, {withFileTypes: true})

	for (const entry of entries) {
		if (entry.isDirectory()) {
			const fullPath = path.join(dirPath, entry.name)
			const stats = fs.statSync(fullPath)

			const project = readProjectMeta(fullPath)

			items.push({
				path: path.relative(DATA_ROOT, fullPath), // relative path
				project,
				creationTime: Math.floor(stats.birthtimeMs / 1000), // unix timestamp in seconds
				updateTime: Math.floor(stats.mtimeMs / 1000),
			})

			items.push(...listProjectFSItems(fullPath))
		}
	}

	return items
}

export function ensureDirectory(relativePath: string): boolean {
	const fullPath = path.join(DATA_ROOT, relativePath)

	if (fs.existsSync(fullPath)) {
		// Directory already exists
		return false
	}

	fs.mkdirSync(fullPath, {recursive: true})
	return true
}
