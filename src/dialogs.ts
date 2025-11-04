import '@material/web/dialog/dialog.js'
import '@material/web/iconbutton/icon-button.js'
import '@material/web/textfield/filled-text-field.js'
import '@material/web/textfield/outlined-text-field.js'
import {TEXTFIELD} from '@vdegenne/forms'
import {cquerySelector} from 'html-vision'
import {html} from 'lit'
import {materialDialog} from 'material-3-dialog'

export function createNewDirectory() {
	const formData = {fullpath: ''}
	materialDialog({
		headline: 'Create new directory',
		content: (dialog) => {
			return html`<!-- -->
				${TEXTFIELD('asdf', formData, 'fullpath', {
					resetButton: false,
					autofocus: true, //
					style: {
						width: '100%',
					},
				})}
				<!-- -->`
		},
		confirmButton() {
			console.log(formData)
		},
	})
}
