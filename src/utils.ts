import {type PropertyValues} from 'snar'
import {toast} from 'toastit'

export function copyToClipboard(text: string) {
	navigator.clipboard.writeText(text)
	toast('Copied to clipboard.')
}

export function sleep(milli: number = 1000) {
	return new Promise((r) => setTimeout(r, milli))
}

export function preventDefault(event: Event) {
	event.preventDefault()
}
export function stopPropagation(event: Event) {
	event.stopPropagation()
}

/**
 * Re-dispatches an event from the provided element.
 *
 * This function is useful for forwarding non-composed events, such as `change`
 * events.
 *
 * @example
 * class MyInput extends LitElement {
 *   render() {
 *     return html`<input @change=${this.redispatchEvent}>`;
 *   }
 *
 *   protected redispatchEvent(event: Event) {
 *     redispatchEvent(this, event);
 *   }
 * }
 *
 * @param element The element to dispatch the event from.
 * @param event The event to re-dispatch.
 * @return Whether or not the event was dispatched (if cancelable).
 */
export function redispatchEvent(element: Element, event: Event) {
	// For bubbling events in SSR light DOM (or composed), stop their propagation
	// and dispatch the copy.
	if (event.bubbles && (!element.shadowRoot || event.composed)) {
		event.stopPropagation()
	}

	const copy = Reflect.construct(event.constructor, [event.type, event])
	const dispatched = element.dispatchEvent(copy)
	if (!dispatched) {
		event.preventDefault()
	}

	return dispatched
}

const eventOpts = {composed: true, bubbles: true}
export function getElementsTree(node: Element): Promise<Element[]> {
	return new Promise((resolve, _reject) => {
		function f(event: Event) {
			resolve(event.composedPath() as Element[])
			node.removeEventListener('get-elements-tree', f)
		}
		node.addEventListener('get-elements-tree', f)
		node.dispatchEvent(new Event('get-elements-tree', eventOpts))
	})
}
export async function getElementInTree(
	from: Element,
	condition: (element: Element) => boolean,
): Promise<Element | undefined> {
	for (const element of await getElementsTree(from)) {
		if (condition(element)) {
			return element
		}
	}
}

export function shuffleArray<T>(array: T[]) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[array[i]!, array[j]!] = [array[j]!, array[i]!]
	}
}

export async function generateHash(input: string): Promise<string> {
	const encoder = new TextEncoder()
	const data = encoder.encode(input)
	const hashBuffer = await crypto.subtle.digest('SHA-256', data)
	const hashArray = Array.from(new Uint8Array(hashBuffer))
	return hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function random(min: number, max: number, decimal = 0): number {
	const random = Math.random() * (max - min) + min
	return parseFloat(random.toFixed(decimal))
}

export function saveDataToFile(data: string, filename: string): void {
	const blob = new Blob([data], {type: 'text/plain'})
	const link = document.createElement('a')
	link.download = filename
	link.href = URL.createObjectURL(blob)
	document.body.appendChild(link)
	link.click()
	document.body.removeChild(link)
}

export async function loadDataFromFile(): Promise<string> {
	return new Promise((resolve, reject) => {
		const input = document.createElement('input')
		input.type = 'file'

		input.onchange = () => {
			const file = input.files?.[0]
			if (!file) {
				reject(new Error('No file selected'))
				return
			}

			const reader = new FileReader()

			reader.onload = (event) => {
				const result = event.target?.result
				if (typeof result === 'string') {
					resolve(result)
				} else {
					reject(new Error('File read error: result is not a string'))
				}
			}

			reader.onerror = () => {
				reject(new Error('Error reading file'))
			}

			reader.readAsText(file)
		}

		input.click()
	})
}

export function propertyValuesToJson<T>(
	changed: PropertyValues<T>,
	object: T,
): Partial<T> {
	return Object.fromEntries(
		[...changed.keys()].map((key) => [key, object[key as keyof typeof object]]),
	) as Partial<T>
}

export function changeStyleProperty(cssVar: string, value: number | string) {
	document.documentElement.style.setProperty(`--${cssVar}`, value + '')
}

export async function loadImage(url: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image()
		img.crossOrigin = 'anonymous' // prevent CORS taint if server allows
		img.onload = () => {
			if (img.naturalWidth === 0 || img.naturalHeight === 0) {
				reject(new Error('Image has zero dimensions'))
			} else {
				resolve(img)
			}
		}
		img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
		img.src = url
	})
}

export function trim(input: string, char = ' '): string {
	const regex = new RegExp(`^${char}+|${char}+$`, 'g')
	return input.replace(regex, '')
}

export function numericTimeToTimeCode(time: number) {
	const hours = Math.floor(time / 3600)
	const minutes = Math.floor((time % 3600) / 60)
	const seconds = Math.floor(time % 60)
	const milliseconds = Math.floor((time * 1000) % 1000)

	return (
		String(hours).padStart(2, '0') +
		':' +
		String(minutes).padStart(2, '0') +
		':' +
		String(seconds).padStart(2, '0') +
		'.' +
		String(milliseconds).padStart(3, '0')
	)
}
