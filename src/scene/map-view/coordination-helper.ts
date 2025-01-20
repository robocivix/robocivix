import { Scene } from "phaser"
import { TILE_SIZE } from "./res"

interface Position {
	x: number
	y: number
}

interface ViewBounds {
	left: number
	top: number
	right: number
	bottom: number
}

export class CoordinationHelper {
	#scene: Scene

	constructor(scene: Scene) {
		this.#scene = scene
	}

	viewToWorldPosition(viewX: number, viewY: number): Position {
		const camera = this.#scene.cameras.main
		const worldPoint = camera.getWorldPoint(viewX, viewY)
		const mapX = Math.max(0, Math.floor(worldPoint.x / TILE_SIZE))
		const mapY = Math.max(0, Math.floor(worldPoint.y / TILE_SIZE))
		return { x: mapX, y: mapY }
	}

	getViewWorldPosition(): ViewBounds {
		const camera = this.#scene.cameras.main
		const viewLeftTop = this.viewToWorldPosition(0, 0)
		const viewRightBottom = this.viewToWorldPosition(camera.width, camera.height)
		return {
			left: viewLeftTop.x,
			top: viewLeftTop.y,
			right: viewRightBottom.x,
			bottom: viewRightBottom.y
		}
	}

	getMapPosition(viewX: number, viewY: number): Position {
		const camera = this.#scene.cameras.main
		const worldPoint = camera.getWorldPoint(viewX, viewY)
		const mapX = Math.max(0, Math.floor(worldPoint.x / TILE_SIZE))
		const mapY = Math.max(0, Math.floor(worldPoint.y / TILE_SIZE))
		return { x: mapX, y: mapY }
	}
}
