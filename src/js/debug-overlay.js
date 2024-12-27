import { GameObjects } from '../node_modules/phaser/dist/phaser.esm.js'
import { mapState } from './map-state.js'

export class DebugOverlay {
	constructor(scene) {
		this.scene = scene
		this.overlay = null
	}

	init() {
		this.overlay = document.getElementById('debug-overlay')
		if (!this.overlay) {
			this.overlay = document.createElement('div')
			this.overlay.id = 'debug-overlay'
			this.overlay.style.cssText = `
                position: fixed;
                right: 10px;
                bottom: 10px;
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
			document.body.appendChild(this.overlay)
		}
		this.scene.input.on('pointermove', this.update.bind(this))
		this.scene.input.on('wheel', this.update.bind(this))
		this.update()
	}

	update() {
		const camera = this.scene.cameras.main
		const pointer = this.scene.input.activePointer
		const mapPointer = pointer ? this.scene.viewToWorldPosition(pointer.x, pointer.y) : {x: 0, y: 0}
		const viewLeftTop = this.scene.viewToWorldPosition(0, 0)
		const viewRightBottom = this.scene.viewToWorldPosition(camera.width, camera.height)

		// Count active sprites
		const allSprites = this.scene.children.list.filter(x => x instanceof GameObjects.Sprite)
		const activeSprites = allSprites.filter(x => x.visible).length
		const totalSprites = allSprites.length

		this.overlay.innerHTML = 
			`Viewport: (${viewLeftTop.x}, ${viewLeftTop.y}) to (${viewRightBottom.x}, ${viewRightBottom.y})<br>` +
			`Mouse: (${mapPointer.x}, ${mapPointer.y})<br>` +
			`Zoom: ${camera.zoom.toFixed(2)}<br>` +
			`Sprites: ${activeSprites}/${totalSprites}<br>` +
			`Chunks: ${Object.keys(mapState.subscribedChunks).length}/${Object.keys(mapState.chunks).length}<br>`
	}

	destroy() {
		if (this.overlay) {
			this.overlay.remove()
			this.overlay = null
		}
	}
} 

