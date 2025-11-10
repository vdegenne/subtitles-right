import {css, html} from 'lit'
import {withStyles} from 'lit-with-styles'
import {customElement} from 'lit/decorators.js'
import {ComposeViewBase} from '../../../../../src/ComposeViewBase.js'

@customElement('compose-view')
@withStyles(css`
	:host {
	}
`)
export class ComposeView extends ComposeViewBase {
	render() {
		return html`<!-- -->
			<div class="absolute inset-0 flex items-center gap-12 ml-24">
				<div class="relative rounded-2xl">
					<md-elevation></md-elevation>
					<img
						src="${this.getURL('./cover.jpg')}"
						width="800"
						class="block rounded-2xl"
					/>
				</div>
				<!-- <div class="w-[700px]">${this.renderVideo()}</div> -->
				<div
					class="text-6xl"
					style="font-family:'Noto Sans JP';font-weight:400"
				>
					${this.renderSubtitles()}
				</div>
			</div>
			<!-- -->`
	}
}
