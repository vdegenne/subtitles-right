import '@material/web/dialog/dialog.js'
import {html} from 'lit'
import {materialDialog} from 'material-3-dialog'
import {fs} from './fssystem.js'
import {api} from './api.js'
import toast from 'toastit'
import 'wavy-text-element'
import {subtitlesUI} from './subtitles-element.js'

export function deleteCurrentDirectory() {
	const fullpath = fs.current
	materialDialog({
		headline: 'Delete directory',
		content: html`<!-- -->
			<div class="flex flex-col gap-5">
				<div>Are you sure you want to delete the following directory?</div>
				<wavy-text label="${fullpath}" class="font-bold">"</wavy-text>
				<div>This action is recursive</div>
			</div>
			<!-- -->`,
		async confirmButton(dialog) {
			try {
				const {ok, text} = await api.delete(
					`/directory/${encodeURIComponent(fullpath)}` as '/directory/:path',
				)
				if (!ok) {
					throw await text()
				}
				toast('Directory deleted')
				dialog.close()
				fs.oneDirectoryUp()
				setTimeout(() => {
					fs.reload()
				}, 500)
			} catch (err) {
				toast(err)
			}
		},
	})
}

export function deleteSubtitle(subtitle: sub.Subtitle) {
	materialDialog({
		headline: 'Delete subtitle',
		content: 'Are you sure you want to delete this subtitle?',
		async confirmButton(dialog) {
			subtitlesUI.deleteSubtitle(subtitle)
			dialog.close()
		},
	})
}
