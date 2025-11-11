import {spawn} from 'child_process'
import * as fs from 'fs'
import * as pathlib from 'path'
import {
	DATA_ROOT,
	META_FILENAME,
	SUBTITLES_FILENAME,
	TERMINAL_BIN_NAME,
	VIDEO_EXTENSIONS,
} from './constants.js'
import {DirectoryNotFoundError, FileNotFoundError} from './errors.js'

// Function to read meta.json and return a Project
export function getMeta(
	relativePath: string,
): subright.ProjectInterface | undefined {
	const metapath = pathlib.join(DATA_ROOT, relativePath, META_FILENAME)
	if (!fs.existsSync(metapath)) {
		throw new FileNotFoundError(metapath)
	}

	// try {
	const raw = fs.readFileSync(metapath, 'utf-8')
	const data = JSON.parse(raw)
	return data
	// } catch (e) {
	// 	throw new Error('Failed to read meta.json')
	// }
	// return undefined
}

// Recursive function to list all directories and build ProjectFSItem list
export function listProjectFSItems(
	dirpath = DATA_ROOT,
): subright.ProjectFSItem[] {
	const items: subright.ProjectFSItem[] = []
	const entries = fs.readdirSync(dirpath, {withFileTypes: true})

	for (const entry of entries) {
		if (entry.isDirectory()) {
			const fullpath = pathlib.join(dirpath, entry.name)
			const stats = fs.statSync(fullpath)

			let project: subright.ProjectInterface | undefined
			try {
				project = getMeta(fullpath)
			} catch (err) {
				if (err instanceof FileNotFoundError) {
					project = undefined
				} else {
					throw err
				}
			}

			items.push({
				path: pathlib.relative(DATA_ROOT, fullpath), // relative path
				project,
				creationTime: Math.floor(stats.birthtimeMs / 1000), // unix timestamp in seconds
				updateTime: Math.floor(stats.mtimeMs / 1000),
			})

			items.push(...listProjectFSItems(fullpath))
		}
	}

	return items
}

export function createDirectory(relativePath: string) {
	const fullPath = pathlib.join(DATA_ROOT, relativePath)

	if (fs.existsSync(fullPath)) {
		throw new Error('The directory already exists.')
	}

	fs.mkdirSync(fullPath, {recursive: true})
}

export function createMetaFile(
	relativePath: string,
	project: subright.ProjectInterface,
) {
	const fullPath = pathlib.join(DATA_ROOT, relativePath, META_FILENAME)
	if (fs.existsSync(fullPath)) {
		throw new Error('The meta file already exists.')
	}
	fs.writeFileSync(fullPath, JSON.stringify(project, null, 2))
}

export function createProject(
	relativePath: string,
	project: subright.ProjectInterface,
) {
	createDirectory(relativePath)
	createMetaFile(relativePath, project)
}

export function deleteDirectory(relativePath: string): boolean {
	const fullPath = pathlib.join(DATA_ROOT, relativePath)

	if (!fs.existsSync(fullPath)) {
		return false
	}

	const stats = fs.statSync(fullPath)
	if (!stats.isDirectory()) {
		return false
	}

	fs.rmSync(fullPath, {recursive: true, force: true})
	return true
}

export function openDirectory(relativePath: string): boolean {
	const fullPath = pathlib.join(DATA_ROOT, relativePath)

	if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isDirectory()) {
		return false
	}

	// Non-blocking call to xdg-open
	spawn('xdg-open', [fullPath], {
		detached: true,
		stdio: 'ignore',
	}).unref()

	return true
}

export function openTerminal(relativePath: string): boolean {
	const fullPath = pathlib.join(DATA_ROOT, relativePath)

	if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isDirectory()) {
		return false
	}

	// Non-blocking call to open terminal in the directory
	spawn(TERMINAL_BIN_NAME, ['--working-directory', fullPath], {
		detached: true,
		stdio: 'ignore',
	}).unref()

	return true
}

export function findFirstVideo(relativePath: string): string {
	const fullpath = pathlib.join(DATA_ROOT, relativePath)
	const files = fs.readdirSync(fullpath)
	for (const file of files) {
		const path = pathlib.join(fullpath, file)
		const stat = fs.statSync(path)

		if (stat.isFile()) {
			const ext = pathlib.extname(file).toLowerCase()
			if (VIDEO_EXTENSIONS.includes(ext)) {
				return pathlib.relative(DATA_ROOT, path)
			}
		}
	}
	throw new Error('Nothing found')
}

export function getSubtitles(relativePath: string): sub.Subtitles {
	const fullpath = pathlib.join(DATA_ROOT, relativePath, SUBTITLES_FILENAME)

	if (!fs.existsSync(fullpath)) {
		throw new Error("The subtitles file doesn't exist.")
	}

	return JSON.parse(fs.readFileSync(fullpath).toString())
}

export function saveSubtitles(relativePath: string, subtitles: sub.Subtitles) {
	const fullpath = pathlib.join(DATA_ROOT, relativePath, SUBTITLES_FILENAME)
	const dir = pathlib.dirname(fullpath)

	if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
		throw new DirectoryNotFoundError(dir)
	}

	fs.writeFileSync(fullpath, JSON.stringify(subtitles, null, 2), 'utf-8')
}
