import {getElement} from 'html-vision'
import {type SettingsDialog} from './settings/settings-dialog.js'
import {Directory} from './objects/Directory.js'
import {Project} from './objects/Project.js'

export async function getThemeStore() {
	const {themeStore} = await import('./styles/themeStore.js')
	return themeStore
}

export async function getSettingsDialog(/*importIfNotFound = false*/) {
	// try {
	// 	const dialog = await getElement<SettingsDialog>('settings-dialog')
	// 	return dialog
	// } catch {
	// if (importIfNotFound) {
	const {settingsDialog} = await import('./settings/settings-dialog.js')
	return settingsDialog
	// }
	// }
	// return undefined
}

export async function openSettingsDialog() {
	const dialog = await getSettingsDialog()
	dialog.show()
}

export async function openDirectoryDialog(name?: string) {
	const {DirectoryDialog} = await import('./dialogs/directory-dialog.js')
	const dialog = new DirectoryDialog(
		name ? new Directory(undefined, {name}) : undefined,
	)
	dialog.show()
}

export async function openProjectDialog(project?: Project) {
	const {ProjectDialog} = await import('./dialogs/project-dialog.js')
	const dialog = new ProjectDialog(project)
	dialog.show()
}

export async function openYtDlpDialog() {
	const {YtDlpDialog} = await import('./dialogs/yt-dlp-dialog.js')
	const dialog = new YtDlpDialog()
	dialog.show()
}
