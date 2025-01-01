import Phaser from "phaser"
import { TILE_SIZE } from "./res"
import { DetailsPanel } from "./details-panel"
import { ActorUI, BuildingUI } from "./actor-ui"
import { Avatar } from "./avatar"


interface MapViewScene extends Phaser.Scene {
  avatar: Avatar
  detailsPanel: DetailsPanel
}

export class Focus {
	#scene: MapViewScene
	#actor: ActorUI | null
	#building: BuildingUI | null
	#tweenUpdate: (() => void) | null

	constructor(scene: MapViewScene) {
		this.#scene = scene
		this.#actor = null
		this.#building = null
		this.#tweenUpdate = null
	}

	init(): void {
		this.#scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
			if (pointer.isDown) {
				this.remove()
			}
		})

		this.#scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
			this.remove()
		})
	}

	onActor(actor: ActorUI): void {
		this.#actor = actor
		const sprite = actor._sprite

		if (!sprite) return

		// Create a tween that updates each frame to follow the moving sprite
		const tween = {
			camera: this.#scene.cameras.main,
			sprite,
			progress: 0,
			duration: 500,
			startX: this.#scene.cameras.main.scrollX,
			startY: this.#scene.cameras.main.scrollY,
			active: true
		}

		// Add update function to scene
		const tweenUpdate = () => {
			if (!tween.active) return

			// Calculate current target position (center of sprite)
			const targetX = Math.round(sprite.x - tween.camera.width/2 + TILE_SIZE/2)
			const targetY = Math.round(sprite.y - tween.camera.height/2 + TILE_SIZE/2)

			// Update progress
			tween.progress += this.#scene.game.loop.delta
			const t = Math.min(tween.progress / tween.duration, 1)
      
			// Cubic ease out
			const ease = 1 - Math.pow(1 - t, 3)

			// Interpolate camera position
			tween.camera.scrollX = tween.startX + (targetX - tween.startX) * ease
			tween.camera.scrollY = tween.startY + (targetY - tween.startY) * ease

			// When complete, start following
			if (t === 1) {
				tween.active = false
				this.#scene.cameras.main.startFollow(sprite, true)
				this.#scene.cameras.main.setFollowOffset(-sprite.width/2, -sprite.height/2)
				this.#scene.events.off("update", tweenUpdate)
				this.#tweenUpdate = null
			}
		}

		this.#scene.events.on("update", tweenUpdate)
		this.#tweenUpdate = tweenUpdate
    
		this.#scene.avatar.movementPath.draw(actor)
		this.#scene.detailsPanel.showActor(actor)
	}

	onBuilding(building: BuildingUI): void {
		if (this.#actor) {
			this.remove()
		}
		this.#building = building
		this.#scene.detailsPanel.showBuilding(building)
	}

	isOn(actor: ActorUI | BuildingUI): boolean {
		return this.#actor === actor || this.#building === actor
	}

	remove(): void {
		this.#scene.cameras.main.stopFollow()
		if (this.#actor) {
			this.#scene.avatar.movementPath.destroy(this.#actor)
			this.#actor = null
		}
		if (this.#tweenUpdate) {
			this.#scene.events.off("update", this.#tweenUpdate)
			this.#tweenUpdate = null
		}
		if (this.#building) {
			this.#building = null            
		}
		this.#scene.detailsPanel.hide()
	}
}