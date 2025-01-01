import Phaser from "phaser"
import { CoordinationHelper } from "./coordination-helper"

interface SelectionArea {
	left: number
	top: number
	right: number
	bottom: number
}

interface Actor {
	x: number
	y: number
}

interface MapViewScene extends Phaser.Scene {
    coordinationHelper: CoordinationHelper
}

export class DragSelection {
	#selectionArea?: SelectionArea
	#scene: MapViewScene
	#enabled: boolean = false

	constructor(scene: MapViewScene) {
		this.#scene = scene
	}

	init(): void {

		if (!this.#enabled)
			return

		let dragDiv: HTMLDivElement | null = null
		let dragStartX = 0
		let dragStartY = 0

		this.#scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
			if (pointer.leftButtonDown()) {
				// Get the canvas element's bounding rect
				const canvas = this.#scene.game.canvas
				const rect = canvas.getBoundingClientRect()

				// Store initial screen position, adjusted for canvas position
				dragStartX = pointer.x + rect.left
				dragStartY = pointer.y + rect.top

				// Get or create div element
				dragDiv = document.getElementById("drag-selection-div") as HTMLDivElement
				if (!dragDiv) {
					dragDiv = document.createElement("div")
					dragDiv.id = "drag-selection-div"
					dragDiv.style.position = "absolute"
					dragDiv.style.border = "1px solid #4488ff"
					dragDiv.style.backgroundColor = "rgba(135, 206, 250, 0.1)"
					dragDiv.style.pointerEvents = "none"
				}
				dragDiv.style.left = dragStartX + "px"
				dragDiv.style.top = dragStartY + "px"
				document.body.appendChild(dragDiv)
			}
		})

		this.#scene.input.on("pointermove", (pointer: any) => {
			if (!dragDiv)
				return
			// Get canvas position
			const rect = this.#scene.game.canvas.getBoundingClientRect()
			const currentX = pointer.x + rect.left
			const currentY = pointer.y + rect.top

			// Calculate width and height
			const width = currentX - dragStartX
			const height = currentY - dragStartY

			// Set position and size based on drag direction
			if (width < 0) {
				dragDiv.style.left = currentX + "px"
				dragDiv.style.width = Math.abs(width) + "px"
			} else {
				dragDiv.style.width = width + "px"
			}

			if (height < 0) {
				dragDiv.style.top = currentY + "px"
				dragDiv.style.height = Math.abs(height) + "px"
			} else {
				dragDiv.style.height = height + "px"
			}

			// Calculate selection area
			// Convert screen coordinates to world coordinates using helper
			const topLeft = this.#scene.coordinationHelper.getMapPosition(Math.min(dragStartX, currentX), Math.min(dragStartY, currentY))
			const bottomRight = this.#scene.coordinationHelper.getMapPosition(Math.max(dragStartX, currentX), Math.max(dragStartY, currentY))

			// Store selection area in world coordinates
			this.#selectionArea = {
				left: topLeft.x,
				top: topLeft.y,
				right: bottomRight.x,
				bottom: bottomRight.y
			}
		})

		this.#scene.input.on("pointerup", () => {
			if (dragDiv) {
				dragDiv.remove()
				dragDiv = null
				console.log(this.#selectionArea)
			}			
			this.#selectionArea = undefined
		})
	}

	isInSelectionArea(actor: Actor): boolean {
		if (!this.#selectionArea) return false
		return actor.x >= this.#selectionArea.left && actor.x <= this.#selectionArea.right &&
			actor.y >= this.#selectionArea.top && actor.y <= this.#selectionArea.bottom
	}
}