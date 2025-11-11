export class DirectoryNotFoundError extends Error {
	constructor(path: string) {
		super(`Directory does not exist: ${path}`)
		// this.name = 'DirectoryNotFoundError'
	}
}
export class FileNotFoundError extends Error {
	constructor(path: string) {
		super(`File does not exist: ${path}`)
		// this.name = 'FileNotFoundError'
	}
}
