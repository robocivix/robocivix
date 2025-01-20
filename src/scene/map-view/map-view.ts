import Phaser from "phaser"
import { world } from "../../core/world"
import { Res, TILE_SIZE } from "./res"
import { CoordinationHelper } from "./coordination-helper"
import { Avatar } from "./avatar"
import { DetailsPanel } from "./details-panel"
import { Focus } from "./focus"
import { DebugOverlay } from "./debug-overlay"
import { Panning } from "./panning"
import { Zooming } from "./zooming"
import { Actor } from "../../entity/actor"
import { DragSelection } from "./drag-selection"
import { ActorUI, BuildingUI } from "./actor-ui"
import { ActorGridEvents } from "../../grid/actor-grid"

interface Config {
	drawChunkBoundaries: boolean
	drawDebugOverlay: boolean
}

export class MapViewScene extends Phaser.Scene {
	readonly config: Config
	readonly res: Res
	readonly coordinationHelper: CoordinationHelper
	readonly avatar: Avatar
	readonly detailsPanel: DetailsPanel
	readonly focus: Focus
	readonly panning: Panning
	readonly zooming: Zooming
	readonly dragSelection: DragSelection
	readonly debugOverlay: DebugOverlay

	constructor() {
		super("MapViewScene")
		this.config = {
			drawChunkBoundaries: true,
			drawDebugOverlay: true
		}
		this.res = new Res(this)
		this.coordinationHelper = new CoordinationHelper(this)
		this.avatar = new Avatar(this)
		this.detailsPanel = new DetailsPanel(this)
		
		this.focus = new Focus(this)
		this.dragSelection = new DragSelection(this)

		const onCameraUpdate = (): void => {
			//this.updateVisibleChunks()
			if (this.debugOverlay) {
				this.debugOverlay.update()
			}
		}
		this.panning = new Panning(this, onCameraUpdate)
		this.zooming = new Zooming(this, onCameraUpdate)

		this.debugOverlay = new DebugOverlay(this)
	}

	preload(): void {		
		this.res.preloadSprites()
		this.res.prepareTextures()
	}

	create(): void {
		this.res.createAnimations()
		this.#disableContextMenu()
		
		this.panning.init()
		this.zooming.init()
		this.dragSelection.init()
		this.focus.init()
		if (this.config.drawDebugOverlay) {			
			this.debugOverlay.init()
		}

		world.grid.actors.events().on(ActorGridEvents.add, this.#onActorUpdate.bind(this))
		world.grid.actors.events().on(ActorGridEvents.update, this.#onActorUpdate.bind(this))
		world.grid.actors.events().on(ActorGridEvents.remove, this.#onActorDelete.bind(this))
		
		this.cameras.main.setBounds(0, 0, world.grid.width * TILE_SIZE, world.grid.height * TILE_SIZE)
		//this.updateVisibleChunks()
		this.#drawMap()

		let isTouch = false
		window.addEventListener("touchstart", () => {			
			isTouch = true
			this.debugOverlay?.message("touchstart", `IS_TOUCH: ${isTouch}`)
		})

		this.createTimePanel()
	}

	#drawMap(): void {
		const grid = world.grid

		// Draw ground tiles
		grid.ground.forEach((tile, x, y) => {
			const worldX = x * TILE_SIZE
			const worldY = y * TILE_SIZE
			let textureName = "tile-default"
			if (!tile) {
				textureName = "tile-empty"
			} else {
				textureName = `tile-${tile}`
			}
			const img = this.add.image(worldX, worldY, textureName)
				.setOrigin(0)
				.setDepth(-100)
		})

		grid.blocks.forEach((block, x, y) => {
			if (!block)
				return
			const worldX = x * TILE_SIZE
			const worldY = y * TILE_SIZE
			const img = this.add.image(worldX, worldY, `tile-${block}`)
				.setOrigin(0)
				.setDepth(-100)
		})

		grid.resources.forEach((resource, x, y) => {
			if (!resource)
				return
			const worldX = x * TILE_SIZE
			const worldY = y * TILE_SIZE
			const img = this.add.image(worldX, worldY, `tile-${resource}`)
				.setOrigin(0)
				.setDepth(-100)
		})

		grid.buildings.forEach((building) => {
        
			const worldX = Math.round(building.x * TILE_SIZE + TILE_SIZE / 2)
			const worldY = Math.round(building.y * TILE_SIZE + TILE_SIZE / 2)
			const sprite = this.add.sprite(
				worldX,
				worldY,
				`building-${building.type}`
			)
			sprite.setInteractive()
			sprite.on("pointerup", (pointer: Phaser.Input.Pointer) => {
				if ((pointer.leftButtonReleased() || pointer.wasTouch) && pointer.upTime - pointer.downTime < 200) {
					pointer.event.stopPropagation()
					this.focus.onBuilding(building)
				}
			})
			const buildingUI = building as BuildingUI
			buildingUI._sprite = sprite
		})

		// Create actors
		grid.actors.forEach((actor) => this.#onActorUpdate(actor))
	}

	#disableContextMenu(): void {
		this.game.canvas.addEventListener("contextmenu", (e: Event) => {
			e.preventDefault()
		})
	}
	
	#onActorUpdate(actor: Actor): void {
		const actorUI = actor as ActorUI
		this.avatar.draw(actorUI)
		if (this.focus.isOn(actorUI)) {
			this.detailsPanel.showActor(actorUI)
		}
	}

	#onActorDelete(actor: Actor): void {
		const actorUI = actor as ActorUI
		this.avatar.destroy(actorUI)
	}

	createTimePanel() {
		// Create a tinted background (similar to debug overlay)
		const timePanel = this.add.rectangle(10, 10, 150, 40, 0xffffff)
			.setOrigin(0, 0)
			.setAlpha(0.2)         // Translucent white background
			.setScrollFactor(0)    // Fix to camera
			.setDepth(1000);       // Ensure it's on top

		// Add text for time display
		const timeText = this.add.text(20, 20, 'Time: 0', {
			font: '16px Arial',
			fill: '#ffffff'
		})
			.setScrollFactor(0)
			.setDepth(1000);

		// Store reference to update later
		this.timeText = timeText;

		// Update the time display
		this.time.addEvent({
			delay: 1000,
			callback: () => {
				const currentTime = Math.floor(this.time.now / 1000);
				this.timeText.setText(`Time: ${currentTime}s`);
			},
			loop: true
		});
	}
}
