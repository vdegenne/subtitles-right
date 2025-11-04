import {getElement} from 'html-vision'
import {type SettingsDialog} from './settings/settings-dialog.js'
import {Directory} from './objects/Directory.js'

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

export async function openNewDirectoryDialog(name?: string) {
	const {NewDirectoryDialog} = await import('./dialogs/new-directory-dialog.js')
	const dialog = new NewDirectoryDialog(
		name ? new Directory(undefined, {name}) : undefined,
	)
	dialog.show()
}
