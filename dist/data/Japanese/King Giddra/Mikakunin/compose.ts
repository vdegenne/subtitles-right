import {html} from 'lit'
import {withStyles} from 'lit-with-styles'
import {customElement} from 'lit/decorators.js'
import {
	ComposeEvent,
	ComposeViewBase,
} from '../../../../../src/ComposeViewBase.js'
import {SVG_YOUTUBE} from '../../../../../src/assets/assets.js'
import {sleep} from '../../../../../src/utils.js'

const debug = false

@customElement('compose-view')
@withStyles()
export class ComposeView extends ComposeViewBase {
	events: ComposeEvent[] = [
		{
			start: 0,
			end: 6,
			outFct: async () => {
				this.$('#like-and-subscribe').classList.add('opacity-0')
				await sleep(1000)
				this.$('#subtitles').classList.remove('opacity-0')
			},
		},
	]

	firstUpdated() {
		document.head.insertAdjacentHTML(
			'beforeend',
			`
<link href="https://fonts.googleapis.com/css2?family=Potta+One&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Hachi+Maru+Pop&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;500;700;800&display=swap" rel="stylesheet">
`,
		)
	}

	render() {
		return html`<!-- -->
			<div class="absolute inset-0 flex flex-col p-6">
				<header class="flex items-center gap-5 text-(--md-sys-color-secondary)">
					${this.renderVinyl(50)}${this.renderTitle({
						fontFamily: 'Noto Sans JP',
					})}
				</header>
				<div class="flex-1 flex items-center gap-24 pl-24">
					<div>
						<div class="relative rounded-t-2xl">
							<md-elevation></md-elevation>
							<img
								src="${this.getURL('./cover.jpg')}"
								width="400"
								class="block rounded-t-2xl"
							/>
							${this.renderProgress()}
						</div>
						${debug ? this.renderTime() : null}
					</div>
					<div class="relative flex-1">
						<wavy-text
							id="like-and-subscribe"
							class="text-6xl transition-opacity duration-1000 absolute top-1/2"
							height="20"
							>Like & Subscribe ❤️</wavy-text
						>
						<div
							id="subtitles"
							class="flex flex-col gap-2 text-4xl font-light transition-opacity duration-1000 opacity-0 leading-snug"
						>
							${this.selectedIndex === -1
								? html`<span>Lyrics:</span>`
								: this.selectedIndex === 0
									? html`<span> </span>`
									: null}
							${this.renderSubtitles({
								fontFamily: "'M PLUS Rounded 1c'",
							})}
						</div>
					</div>
				</div>
				<div class="text-right">
					<md-suggestion-chip elevated error>
						<md-icon slot="icon" class="ml-1 mr-3">${SVG_YOUTUBE}</md-icon>
						vdegenne
					</md-suggestion-chip>
				</div>
			</div>
			<!-- -->`
	}
}
