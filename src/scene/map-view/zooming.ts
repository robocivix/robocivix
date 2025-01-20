import Phaser from "phaser"

interface ZoomingScene extends Phaser.Scene {
  debugOverlay: {
    message: (title: string, text: string) => void
  }
}

export class Zooming {
	#scene: ZoomingScene
	#onUpdate: () => void

	constructor(scene: ZoomingScene, onUpdate: () => void) {
		this.#scene = scene
		this.#onUpdate = onUpdate
	}

	init(): void {
		this.#handleMouseZoom()
		this.#handlePinchZoom()
	}

	#handleMouseZoom(): void {
		// Handle mouse wheel zoom
		this.#scene.input.on("wheel", (pointer: Phaser.Input.Pointer, _gameObjects: any, _deltaX: number, deltaY: number, _deltaZ: number) => {
			this.#handleZoom(pointer, deltaY > 0 ? -0.1 : 0.1)
		})
	}

	#handlePinchZoom(): void {
		// Handle pinch zoom on touch devices
		// let startDistance = 0
		// let lastScale = 1

		// this.scene.input.on("touchstart", (pointer: Phaser.Input.Pointer) => {
		// 	this.scene.debugOverlay.message("touchstart", "touches: " + pointer.touches?.length)
      
		// 	if (pointer.touches?.length === 2) {
		// 		const touch1 = pointer.touches[0]
		// 		const touch2 = pointer.touches[1]
        
		// 		// Use pointer coordinates directly from Phaser's touch objects
		// 		startDistance = Math.hypot(
		// 			touch1.pageX - touch2.pageX,
		// 			touch1.pageY - touch2.pageY
		// 		)
		// 		lastScale = 1
		// 	}
		// })

		// // Listen for touchmove to handle zoom
		// this.scene.input.on("touchmove", (pointer: Phaser.Input.Pointer) => {
		// 	this.scene.debugOverlay.message("touchmove p2", pointer.x + ", " + pointer.y)
      
		// 	if (pointer.touches?.length === 2) {
		// 		pointer.event.preventDefault() // Prevent default browser pinch zoom

		// 		const touch1 = pointer.touches[0]
		// 		const touch2 = pointer.touches[1]

		// 		const currentDistance = Math.hypot(
		// 			touch1.pageX - touch2.pageX,
		// 			touch1.pageY - touch2.pageY
		// 		)

		// 		if (startDistance > 0) {
		// 			const scale = currentDistance / startDistance
		// 			const deltaScale = scale - lastScale
		// 			const zoomDelta = deltaScale * 0.5 // Adjust sensitivity

		// 			// Calculate midpoint between touches using Phaser coordinates
		// 			const midX = (touch1.x + touch2.x) / 2
		// 			const midY = (touch1.y + touch2.y) / 2
		// 			const zoomPoint = {x: midX, y: midY}

		// 			this.handleZoom(zoomPoint, zoomDelta)
		// 			lastScale = scale
		// 		}
		// 	}
		// })

		// // Reset on touch end
		// this.scene.input.on("touchend", () => {
		// 	this.scene.debugOverlay.message("touchend", "reset zoom state")
		// 	startDistance = 0
		// 	lastScale = 1
		// })
	}

	#handleZoom(pointer: {x: number, y: number}, zoomDelta: number): void {
		const camera = this.#scene.cameras.main
		const currentZoom = camera.zoom
    
		// Define available zoom levels
		const zoomLevels = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5]
    
		// Find current zoom level index
		let currentIndex = zoomLevels.findIndex(zoom => Math.abs(zoom - currentZoom) < 0.01)
		if (currentIndex === -1) {
			currentIndex = zoomLevels.findIndex(zoom => zoom > currentZoom) - 1
			if (currentIndex === -2) currentIndex = zoomLevels.length - 1
		}
    
		// Determine next zoom level based on zoom direction
		let nextIndex
		if (zoomDelta > 0) {
			// Zooming in
			nextIndex = Math.min(currentIndex + 1, zoomLevels.length - 1)
		} else {
			// Zooming out
			nextIndex = Math.max(currentIndex - 1, 0)
		}
    
		// Get pointer position in world space before zoom
		const worldPoint = camera.getWorldPoint(pointer.x, pointer.y)
    
		// Set new zoom level
		camera.zoom = zoomLevels[nextIndex];
    
		// Force camera to update its internal values
		(camera as any).preRender()
    
		// Adjust camera position to zoom toward pointer position
		const newWorldPoint = camera.getWorldPoint(pointer.x, pointer.y)
		camera.scrollX += worldPoint.x - newWorldPoint.x
		camera.scrollY += worldPoint.y - newWorldPoint.y;

		// Force camera to update its internal values
		(camera as any).preRender()
    
		this.#onUpdate()

	}
}