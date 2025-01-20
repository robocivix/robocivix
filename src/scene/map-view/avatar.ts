import Phaser from "phaser"
import { MovementPath } from "./movement-path"
import { TILE_SIZE } from "./res"
import { Actor } from "../../entity/actor"
import { Focus } from "./focus"
import { ActorUI } from "./actor-ui"
import { DragSelection } from "./drag-selection"
import { world } from "../../core/world"

interface MapViewScene extends Phaser.Scene {
  focus: Focus
  dragSelection?: DragSelection
}

export class Avatar {
	#scene: MapViewScene
	readonly movementPath: MovementPath

	constructor(scene: MapViewScene) {
		this.#scene = scene
		this.movementPath = new MovementPath(scene)
	}

	create(actor: ActorUI): void {
		this.#scene.events.on('update', this.#update, this)
	}

	#update(): void {
	}

	draw(actor: ActorUI): void {
		let sprite = actor._sprite
		const x = Math.round(actor.x * TILE_SIZE + TILE_SIZE / 2)
		const y = Math.round(actor.y * TILE_SIZE + TILE_SIZE / 2)

		if (sprite) {
			//if (!actor._move) {
				sprite.x = x
				sprite.y = y
			//}
		} else {
			sprite = this.#scene.add.sprite(
				x,
				y,
				actor.name
			)
			sprite.setInteractive()
			sprite.on("pointerup", (pointer: Phaser.Input.Pointer) => {
				// Only handle left mouse button or touch device tap
				if ((pointer.leftButtonReleased() || pointer.wasTouch) && pointer.upTime - pointer.downTime < 200) {
					pointer.event.stopPropagation()
					this.#scene.focus.onActor(actor)
				}
			})
			actor._sprite = sprite
		}

		let direction = actor._direction || "right"
		let action: string
		if (actor.action) {
			action = "work"
		} else if (actor._move) {
			action = "move"
			const nextX = actor._move.path[0]
			if (actor.x > nextX)
				direction = "left"
			if (actor.x < nextX)
				direction = "right"
			actor._direction = direction

			const nextY = actor._move.path[1]

			// Calculate target position in pixels
			const targetX = Math.round(nextX * TILE_SIZE + TILE_SIZE/2)
			const targetY = Math.round(nextY * TILE_SIZE + TILE_SIZE/2)

			// Check if there's an existing tween with different target
			const existingTween = this.#scene.tweens.getTweensOf(sprite)[0]
			if (existingTween) {
				const d0 = existingTween.data[0] as Phaser.Tweens.TweenData
				const d1 = existingTween.data[1] as Phaser.Tweens.TweenData
				if (d0.end === targetX && d1.end === targetY) {
					// If target is the same, keep existing tween
					return
				}
				// Target changed, kill existing tween
				existingTween.stop()
				existingTween.remove()
				//console.log("recreate tween", d0.end, d1.end, targetX, targetY)
			}

			// Calculate distance to target
			const dx = targetX - sprite.x
			const dy = targetY - sprite.y
			const length = Math.round(Math.sqrt(dx * dx + dy * dy))

			if (length > 0) {
				// Calculate movement duration based on distance and speed
				const pixelsPerSecond = actor._move.speed * TILE_SIZE
				const durationInMs = Math.round(length / pixelsPerSecond * 1000)

				// Create a new tween to move the sprite
				const tween = this.#scene.tweens.add({
					targets: sprite,
					x: targetX,
					y: targetY,
					duration: durationInMs,
					ease: "Linear",
					repeat: 0,
					yoyo: false,
					onUpdate: () => {
						// Check if movement was reset
						if (!actor._move) {
							tween.stop()
							tween.remove()
							actor._tween = undefined
							return
						}
					},
					onComplete: () => {
						tween.stop()
						tween.remove()
						actor._tween = undefined
					}
				})

				if (this.#scene.focus.isOn(actor)) {
					this.movementPath.draw(actor)
				}
				actor._tween = tween
			}
		} else {
			action = "idle"
			this.movementPath.destroy(actor)
		}
		const name = `robot1-${action}-${direction}`
		if ((sprite as any)._actionName !== name) {
			(sprite as any)._actionName = name
			sprite.play(name, true)
		}

		if (this.#scene.dragSelection && this.#scene.dragSelection.isInSelectionArea(actor)) {
			sprite.setTint(0x00ff00)
		} else {
			sprite.setTint(0xffffff)
		}  
	}

	destroy(actor: ActorUI): void {
		if (actor._tween) {
			actor._tween.stop()
			actor._tween.remove()
			actor._tween = undefined
		}
		this.movementPath.destroy(actor)
		if (actor._sprite) {
			actor._sprite.destroy()
			actor._sprite = undefined
		}
		if (this.#scene.focus.isOn(actor)) {
			this.#scene.focus.remove()
		}
	}

	private updateSpritePosition(sprite: Phaser.GameObjects.Sprite, actor: ActorUI): void {
		if (!actor._move) return

		const [nextX, nextY] = actor._move.path
		
		// Calculate target position in pixels
		const targetX = Math.round(nextX * TILE_SIZE + TILE_SIZE/2)
		const targetY = Math.round(nextY * TILE_SIZE + TILE_SIZE/2)

		// Calculate current position
		const now = performance.now()
		const elapsed = now - (actor._move.lastUpdate || now)
		
		// Speed is in tiles per second, convert to pixels per second
		// Normalize speed to be between 0 and 1 for visualization
		const baseSpeed = 2 // Base speed in tiles per second
		const normalizedSpeed = actor._move.speed / baseSpeed
		const pixelsPerSecond = normalizedSpeed * TILE_SIZE * 4 // Adjust multiplier for desired speed
		
		// Calculate distance to target
		const dx = targetX - sprite.x
		const dy = targetY - sprite.y
		const distance = Math.sqrt(dx * dx + dy * dy)
		
		// For speed visualization/debugging
		const currentSpeed = (pixelsPerSecond * elapsed) / 1000
		console.log('Speed:', normalizedSpeed.toFixed(2), 'Distance:', distance.toFixed(2), 'Current Speed:', currentSpeed.toFixed(2))
		
		if (distance < 1) {
			// If very close to target, snap to it
			sprite.x = targetX
			sprite.y = targetY
			return
		}

		// Calculate movement this frame
		const moveDistance = (pixelsPerSecond * elapsed) / 1000
		const ratio = Math.min(moveDistance / distance, 1)

		// Update position
		sprite.x += dx * ratio
		sprite.y += dy * ratio
		
		// Update last update time
		actor._move.lastUpdate = now
	}
}