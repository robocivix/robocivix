import { Scene, GameObjects } from "phaser"

export class DebugOverlay {
	#scene: Scene
	#overlay: HTMLElement | null
	#info?: string
	#object?: any

	constructor(scene: Scene) {
		this.#scene = scene
		this.#overlay = null
	}

	init(): void {
		this.#overlay = document.getElementById("debug-overlay")
		if (!this.#overlay) {
			this.#overlay = document.createElement("div")
			this.#overlay.id = "debug-overlay"
			this.#overlay.style.cssText = `
                position: fixed;
                right: 9px;
                top: 8px;
                background: rgba(0, 0, 0, 0.2);
                color: white;
                padding: 10px;
                font-family: monospace;
                font-size: 16px;
                width: 220px;
                height: 190px;
                z-index: 1000;
                pointer-events: none;
            `
			document.body.appendChild(this.#overlay)
		}
		this.#scene.input.on("pointermove", this.update.bind(this))
		this.#scene.input.on("wheel", this.update.bind(this))
		this.update()
	}

	update(): void {
		const camera = this.#scene.cameras.main
		const pointer = this.#scene.input.activePointer
		const mapPointer = pointer ? (this.#scene as any).coordinationHelper.viewToWorldPosition(pointer.x, pointer.y) : {x: 0, y: 0}
		const viewLeftTop = (this.#scene as any).coordinationHelper.viewToWorldPosition(0, 0)
		const viewRightBottom = (this.#scene as any).coordinationHelper.viewToWorldPosition(camera.width, camera.height)

		// Count active sprites
		const allSprites = this.#scene.children.list.filter((x): x is GameObjects.Sprite => x instanceof GameObjects.Sprite)
		const activeSprites = allSprites.filter(x => x.visible).length
		const totalSprites = allSprites.length

		let text =
			`Viewport: (${viewLeftTop.x}, ${viewLeftTop.y}) to (${viewRightBottom.x}, ${viewRightBottom.y})<br>` +
			`Mouse: (${mapPointer.x}, ${mapPointer.y})<br>` +
			`Zoom: ${camera.zoom.toFixed(2)}<br>` +
			`FPS: ${Math.round(this.#scene.game.loop.actualFps)}<br>` +
			`Sprites: ${activeSprites}/${totalSprites}<br>`
		if (this.#info) {
			text += `${this.#info}: ${this.#object}<br>`
		}
		if (this.#overlay) {
			this.#overlay.innerHTML = text
		}
	}

	message(info: string, object: any): void {
		this.#info = info
		this.#object = object
		this.update()
	}

	destroy(): void {
		if (this.#overlay) {
			this.#overlay.remove()
			this.#overlay = null
		}
	}
}

