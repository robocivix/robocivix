import { Scene } from "phaser"
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
import { ActorUI } from "./actor-ui"

interface Config {
	drawChunkBoundaries: boolean
	drawDebugOverlay: boolean
}

export class MapViewScene extends Scene {
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
		this.disableContextMenu()
		
		this.panning.init()
		this.zooming.init()
		this.dragSelection.init()
		this.focus.init()
		if (this.config.drawDebugOverlay) {			
			this.debugOverlay.init()
		}

		world.map.actors.onAdd(this.onActorUpdate.bind(this))
		world.map.actors.onUpdate(this.onActorUpdate.bind(this))
		world.map.actors.onDelete(this.onActorDelete.bind(this))
		
		const bounds = world.map.bounds
		this.cameras.main.setBounds(0, 0, world.map.width * TILE_SIZE, world.map.height * TILE_SIZE)
		//this.updateVisibleChunks()
		this.drawMap()

		let isTouch = false
		window.addEventListener("touchstart", () => {			
			isTouch = true
			this.debugOverlay?.message("touchstart", `IS_TOUCH: ${isTouch}`)
		})

	}

	private drawMap(): void {
		const map = world.map

		// Draw ground tiles
		map.ground.forEach((tile, x, y) => {
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

		map.blocks.forEach((block, x, y) => {
			if (!block)
				return
			const worldX = x * TILE_SIZE
			const worldY = y * TILE_SIZE
			const img = this.add.image(worldX, worldY, `tile-${block}`)
				.setOrigin(0)
				.setDepth(-100)
		})

		map.resources.forEach((resource, x, y) => {
			if (!resource)
				return
			const worldX = x * TILE_SIZE
			const worldY = y * TILE_SIZE
			const img = this.add.image(worldX, worldY, `tile-${resource}`)
				.setOrigin(0)
				.setDepth(-100)
		})

		map.machines.forEach((machine, x, y) => {
			if (!machine)
				return
        
			const worldX = x * TILE_SIZE
			const worldY = y * TILE_SIZE
			const img = this.add.image(worldX, worldY, `machine-${machine.type}`)
				.setOrigin(0)
				.setDepth(-100)
		})

		// Create actors
		map.actors.forEach((actor, x, y) => {
			this.onActorUpdate(actor)
		})
	}

	private disableContextMenu(): void {
		this.game.canvas.addEventListener("contextmenu", (e: Event) => {
			e.preventDefault()
		})
	}

	// private updateVisibleChunks(): void {
	// 	// Get viewport dimensions in world coordinates
	// 	const bufferMargin = Math.floor(CHUNK_SIZE / 2)
	// 	//const bufferMargin = 0
	// 	const view = this.coordinationHelper.getViewWorldPosition()
	// 	view.left -= bufferMargin
	// 	view.top -= bufferMargin
	// 	view.right += bufferMargin
	// 	view.bottom += bufferMargin

	// 	// Get chunks that cover the viewport
	// 	const update = world.map.updateSubscription(view)
	// 	if (update.removed.length > 0) {
	// 		console.log("remove chunks", update.removed.map(x => x.key()))
	// 		for (const chunk of update.removed) {
	// 			this.destroyChunkView(chunk)
	// 		}
	// 	}
	// 	if (update.added.length > 0) {
	// 		console.log("add chunks", update.added.map(x => x.key()))
	// 		for (const chunk of update.added) {
	// 			this.drawChunkView(chunk)
	// 		}
	// 	}

	// 	if (update.added.length > 0 || update.removed.length > 0)
	// 		console.log("updateVisibleChunks", Object.keys(update.subscribed).length, Object.keys(update.subscribed))
	// }

	// private destroyChunkView(chunk: Chunk): void {
	// 	// Destroy actor sprites
	// 	for (const [_, actor] of Object.entries(chunk.actors)) {
	// 		this.avatar.destroy(actor)
	// 	}

	// 	// Destroy ground tile textures
	// 	if (chunk.groundImages) {
	// 		chunk.groundImages.forEach(img => img.destroy())
	// 		chunk.groundImages = null
	// 	}
	// }

	// private drawChunkView(chunk: Chunk): void {
	// 	// Draw the ground tiles for this chunk using pre-created tile textures
	// 	if (chunk.groundLayer) {
	// 		if (chunk.groundImages) {
	// 			throw new Error("chunk.groundImages already exists")
	// 		}
	// 		console.log("drawChunkView", chunk.key())
			
	// 		chunk.groundImages = []
			
	// 		// Draw chunk boundary
	// 		if (this.config.drawChunkBoundaries) {
	// 			const chunkWorldX = chunk.x * TILE_SIZE
	// 			const chunkWorldY = chunk.y * TILE_SIZE
	// 			const chunkWorldWidth = CHUNK_SIZE * TILE_SIZE
	// 			const chunkWorldHeight = CHUNK_SIZE * TILE_SIZE
			
	// 			const boundary = this.add.rectangle(chunkWorldX, chunkWorldY, chunkWorldWidth, chunkWorldHeight)
	// 				.setStrokeStyle(4, 0x33CC33)
	// 				.setOrigin(0)
	// 				.setDepth(-99)
	// 			chunk.groundImages.push(boundary)

	// 			// Draw chunk key text
	// 			const info = `${chunk.key()} (${chunk.x / CHUNK_SIZE}, ${chunk.y / CHUNK_SIZE})`
	// 			const text = this.add.text(chunkWorldX + 4, chunkWorldY + 4, info, {
	// 				fontSize: "18px",
	// 				color: "#33CC33"
	// 			})
	// 			text.setDepth(-99)
	// 			chunk.groundImages.push(text)
	// 		}
	// 		// Draw ground tiles
	// 		for (let y = 0; y < CHUNK_SIZE; y++) {
	// 			for (let x = 0; x < CHUNK_SIZE; x++) {
	// 				const tile = chunk.groundLayer[y][x]
	// 				const worldX = (chunk.x + x) * TILE_SIZE
	// 				const worldY = (chunk.y + y) * TILE_SIZE
					
	// 				let textureName = "tile-default"
	// 				if (!tile) {
	// 					textureName = "tile-empty"
	// 				} else if (tile.type) {
	// 					textureName = `tile-${tile.type}`
	// 				}
					
	// 				const img = this.add.image(worldX, worldY, textureName)
	// 					.setOrigin(0)
	// 					.setDepth(-100)
	// 				chunk.groundImages.push(img)
	// 			}
	// 		}
	// 	}

	// 	// Create actors for this chunk
	// 	for (const [_, actor] of Object.entries(chunk.actors)) {
	// 		this.onActorUpdate(actor)
	// 	}
	// }
	
	private onActorUpdate(actor: Actor): void {
		const actorUI = actor as ActorUI
		this.avatar.draw(actorUI)
		if (this.focus.isOn(actorUI)) {
			this.detailsPanel.show(actorUI)
		}
	}

	private onActorDelete(actor: Actor): void {
		const actorUI = actor as ActorUI
		this.avatar.destroy(actorUI)
	}
}
