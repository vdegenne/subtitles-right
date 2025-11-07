export class DirectoryNotFoundError extends Error {
	constructor(path: string) {
		super(`Directory does not exist: ${path}`)
		this.name = 'DirectoryNotFoundError'
	}
}
