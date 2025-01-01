import { Scene } from "phaser"
import { ActorUI } from "./actor-ui"
import { TILE_SIZE } from "./res"

export class MovementPath {
	private scene: Scene

	constructor(scene: Scene) {
		this.scene = scene
	}

	draw(actor: ActorUI): void {
		// If sprite is moving, draw path indicator
		this.destroy(actor)

		if (actor._move && actor._move.path.length >= 2) {
			// Create graphics object for path
			const pathGraphics = this.scene.add.graphics()
			actor._pathGraphics = pathGraphics
			pathGraphics.setDepth(-1) // Set depth below sprites
			pathGraphics.lineStyle(2, 0x00ff00, 0.5) // Green line, 50% opacity

			// Create update function to redraw path from current position
			const updatePath = () => {
				pathGraphics.clear()
				
				// Draw thick grey line
				pathGraphics.lineStyle(4, 0xAAAAAA, 0.6)
				pathGraphics.moveTo(actor._sprite!.x, actor._sprite!.y)
				if (!actor._move || actor._move.path.length < 2) {
					pathGraphics.destroy()
					actor._pathGraphics = undefined
					return
				}
				for (let i = 0; i < actor._move.path.length; i += 2) {
					const pathX = Math.round(actor._move.path[i] * TILE_SIZE + TILE_SIZE/2)
					const pathY = Math.round(actor._move.path[i+1] * TILE_SIZE + TILE_SIZE/2)
					pathGraphics.lineTo(pathX, pathY)
				}
				pathGraphics.strokePath()
			}

			// Initial draw
			updatePath()

			// Update path each frame while moving
			;(pathGraphics as any).update = updatePath
		}
	}
	
	destroy(actor: ActorUI): void {
		if (actor._pathGraphics) {
			actor._pathGraphics.destroy()
			actor._pathGraphics = undefined
		}
	}
}
