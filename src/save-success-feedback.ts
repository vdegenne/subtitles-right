import {css, html, LitElement} from 'lit'
import {withStyles} from 'lit-with-styles'
import {customElement, property, state} from 'lit/decorators.js'

@customElement('save-success-feedback')
@withStyles(css`
	:host {
		position: fixed;
		bottom: 12px;
		right: 12px;
		opacity: 0;
		transition: opacity 0.6s linear;
	}
	:host([display]) {
		display: block;
		opacity: 1;
	}
`)
class SaveSuccessFeedback extends LitElement {
	@property({type: Boolean, reflect: true}) display = false

	#showTimeout: number | undefined

	constructor() {
		super()
		document.body.appendChild(this)
	}

	render() {
		return html`<!-- -->
			<md-filled-tonal-icon-button
				><md-icon>save</md-icon></md-filled-tonal-icon-button
			>
			<!-- -->`
	}

	show() {
		this.display = true
		clearTimeout(this.#showTimeout)
		setTimeout(() => {
			this.display = false
		}, 1000)
	}
}

export const saveSuccessFeedback = new SaveSuccessFeedback()
