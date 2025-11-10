import {html, LitElement, PropertyValues} from 'lit'
import {customElement, property} from 'lit/decorators.js'
import {unsafeHTML} from 'lit/directives/unsafe-html.js'

@customElement('subtitle-input')
export class SubtitleInput extends LitElement {
	@property() text = ''
	@property({type: Boolean}) editable = true

	render() {
		return html`
			<div ?contenteditable=${this.editable} @input=${this.#onInput}>
				${unsafeHTML(this.text.replace(/\n/g, '<br>'))}
			</div>
		`
	}

	updated(changed: PropertyValues<this>) {
		if (changed.has('text')) {
			try {
				// this.renderRoot!.querySelector('div')!.textContent = this.text
			} catch {}
		}
	}

	#onInput = (event: Event) => {
		event.preventDefault()
		event.stopImmediatePropagation()
		const target = event.target as HTMLElement
		this.dispatchEvent(
			new CustomEvent('input', {detail: {text: target.innerText.trim()}}),
		)
	}
}
