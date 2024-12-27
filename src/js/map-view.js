// map-view.js
import { Scene, Game, Scale, AUTO } from '../node_modules/phaser/dist/phaser.esm.js'
import { mapState, CHUNK_SIZE } from './map-state.js'
import { demoDriver } from './demo-driver.js'	// eslint-disable-line no-unused-vars
import { DebugOverlay } from './debug-overlay.js'

const Phaser = {
	Scene,
	Game,
	Scale,
	AUTO
}

class MapView extends Phaser.Scene
{
	TILE_SIZE = 64

	constructor() {
		super()
		this.debugOverlay = new DebugOverlay(this)
	}

	preload () {
		this.load.json("map-data", 'map-data.json')
		this.load.spritesheet('robot1', 'assets/spritesheets/robot1.png', {
			frameWidth: 64,
			frameHeight: 64,
		})
	}

	create () {
		this.renderMap()
		this.enablePanning()
		this.enableZoom()
		this.createAnimations()
		this.enableClickHandler()
		this.debugOverlay.init()
		// Subscribe to individual events
		mapState.subscribeToAdd(this.handleActorUpdate.bind(this))
		mapState.subscribeToUpdate(this.handleActorUpdate.bind(this))
		mapState.subscribeToDelete(this.handleActorDelete.bind(this))
	}

	getMapPosition(viewX, viewY) {
		const camera = this.cameras.main
		const worldPoint = camera.getWorldPoint(viewX, viewY)
		const mapX = Math.max(0, Math.floor(worldPoint.x / this.TILE_SIZE))
		const mapY = Math.max(0, Math.floor(worldPoint.y / this.TILE_SIZE))
		return { x: mapX, y: mapY }
	}

	createAnimations() {
		this.anims.create({
			key: "robot1-move-left",
			frames: this.anims.generateFrameNumbers("robot1", { start: 0, end: 1 }),
			frameRate: 4,
			repeat: -1,
		})
		this.anims.create({
			key: "robot1-move-right",
			frames: this.anims.generateFrameNumbers("robot1", { start: 2, end: 3 }),
			frameRate: 4,
			repeat: -1,
		})
		this.anims.create({
			key: "robot1-work-left",
			frames: this.anims.generateFrameNumbers("robot1", { start: 4, end: 5 }),
			frameRate: 8,
			repeat: -1,
		})
		this.anims.create({
			key: "robot1-work-right",
			frames: this.anims.generateFrameNumbers("robot1", { start: 6, end: 7 }),
			frameRate: 8,
			repeat: -1,
		})
		this.anims.create({
			key: "robot1-idle-left",
			frames: this.anims.generateFrameNumbers("robot1", { start: 8, end: 9 }),
			frameRate: 2,
			repeat: -1,
		})
		this.anims.create({
			key: "robot1-idle-right",
			frames: this.anims.generateFrameNumbers("robot1", { start: 10, end: 11 }),
			frameRate: 2,
			repeat: -1,
		})
	}

	updateVisibleChunks() {
		// Get viewport dimensions in world coordinates
		const bufferMargin = Math.floor(CHUNK_SIZE / 2)
		//const bufferMargin = 0
		const view = this.getViewWorldPosition()
		view.left -= bufferMargin
		view.top -= bufferMargin
		view.right += bufferMargin
		view.bottom += bufferMargin

		// Get chunks that cover the viewport
		const update = mapState.updateSubscription(view)
		if (update.removed.length > 0) {
			console.log("remove chunks", update.removed.map(x => x.key()))
			for (const chunk of update.removed) {
				this.destroyChunkView(chunk)
			}
		}
		if (update.added.length > 0) {
			console.log("add chunks", update.added.map(x => x.key()))
			for (const chunk of update.added) {
				this.createChunkView(chunk)
			}
		}

		if (update.added.length > 0 || update.removed.length > 0)
			console.log("updateVisibleChunks", Object.keys(update.subscribed).length, Object.keys(update.subscribed))
	}

	destroyChunkView(chunk) {
		for (const [_, actor] of Object.entries(chunk.actors)) {
			if (actor.sprite) {
				//console.log('destroy sprite', actor.id, actor.name)
				actor.sprite.destroy()
				actor.sprite = null
			}
		}
	}

	createChunkView(chunk) {
		// create chunk view
		for (const [_, actor] of Object.entries(chunk.actors)) {
			this.handleActorUpdate(actor)
		}
		//console.log("createChunkView", chunk.key(), "created sprites:", chunk.actors.length)
	}

	renderMap() {
		const mapData = this.game.cache.json.get('map-data')
		// Set camera bounds to match the full size of the map
		this.cameras.main.setBounds(0, 0, mapData[0].length * this.TILE_SIZE, mapData.length * this.TILE_SIZE)

		this.updateVisibleChunks()
		
		let n = 0
		// Render the map tiles based on the map data
		for (let row = 0; row < mapData.length; row++) {
			for (let col = 0; col < mapData[row].length; col++) {
				const tile = mapData[row][col]
				let color
				if (tile === null) {
					color = 0xD3D3D3 // Light grey for empty
				} else {
					switch (tile.type) {
					case "ore":
						color = 0xFFD700 // Gold color for ore
						break
					case "water":
						color = 0x0000FF // Blue color for water
						break
					default:
						color = 0x808080 // Default gray for unknown types
					}
				}
				this.add.rectangle(col * this.TILE_SIZE, row * this.TILE_SIZE, this.TILE_SIZE, this.TILE_SIZE, color)
					.setOrigin(0)
					.setDepth(-100)
				n++
			}
		}

		console.log("renderMap", n)
		// Draw grid lines (grey)
		const graphics = this.add.graphics()
		graphics.lineStyle(1, 0xA9A9A9, 1)
		graphics.setDepth(-100)
		for (let row = 0; row <= mapData.length; row++) {
			graphics.moveTo(0, row * this.TILE_SIZE)
			graphics.lineTo(mapData[0].length * this.TILE_SIZE, row * this.TILE_SIZE)
		}
		for (let col = 0; col <= mapData[0].length; col++) {
			graphics.moveTo(col * this.TILE_SIZE, 0)
			graphics.lineTo(col * this.TILE_SIZE, mapData.length * this.TILE_SIZE)
		}
		graphics.strokePath()
	}

	enablePanning() {
		this.panVelocity = { x: 0, y: 0 }
		this.isPanning = false

		this.input.on('pointerdown', (pointer) => {
			if (pointer.leftButtonDown()) {
				this.isPanning = true
				this.lastPointerPosition = { x: pointer.x, y: pointer.y }
				this.panVelocity = { x: 0, y: 0 }
			}
		})

		this.input.on('pointermove', (pointer) => {
			if (this.isPanning) {
				const deltaX = pointer.x - this.lastPointerPosition.x
				const deltaY = pointer.y - this.lastPointerPosition.y
				
				const camera = this.cameras.main
				// Adjust panning speed based on zoom level
				camera.scrollX -= deltaX / camera.zoom
				camera.scrollY -= deltaY / camera.zoom

				// Update velocity based on movement, accounting for zoom
				this.panVelocity = { 
					x: deltaX / camera.zoom,
					y: deltaY / camera.zoom
				}

				this.lastPointerPosition = { x: pointer.x, y: pointer.y }
			}
		})

		this.input.on('pointerup', () => {
			this.isPanning = false

			this.updateVisibleChunks()

			// Start decay animation
			if (Math.abs(this.panVelocity.x) > 0 || Math.abs(this.panVelocity.y) > 0) {
				const decayDuration = 1000 // 1 second
				const startVelocity = { ...this.panVelocity }
				
				let startTime = null
				const animate = (timestamp) => {
					if (!startTime) startTime = timestamp
					const progress = (timestamp - startTime) / decayDuration
					
					if (progress < 1) {
						const easeOut = 1 - Math.pow(1 - progress, 2) // Quadratic ease out
						this.panVelocity = {
							x: startVelocity.x * (1 - easeOut),
							y: startVelocity.y * (1 - easeOut)
						}
						
						const camera = this.cameras.main
						camera.scrollX -= this.panVelocity.x
						camera.scrollY -= this.panVelocity.y
						
						requestAnimationFrame(animate)
					} else {
						this.updateVisibleChunks()
						this.debugOverlay.update()
					}
				}
				
				requestAnimationFrame(animate)
			}
		})
	}

	enableZoom() {
		this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {	// eslint-disable-line no-unused-vars
			const camera = this.cameras.main
			const currentZoom = camera.zoom
			
			// Calculate new zoom level based on scroll direction
			// Reduce the zoom factor for smoother zooming
			const zoomFactor = 0.1
			const newZoom = deltaY > 0 ? 
				currentZoom * (1 - zoomFactor) : // Zoom out
				currentZoom * (1 + zoomFactor)  // Zoom in
			
			// Clamp zoom between reasonable limits
			const minZoom = 0.25 // Maximum zoom out (show more of the map)
			const maxZoom = 1.5    // Maximum zoom in
			const clampedZoom = Math.min(Math.max(newZoom, minZoom), maxZoom)
			
			// Get pointer position in world space before zoom
			const worldPoint = camera.getWorldPoint(pointer.x, pointer.y)
			
			// Set new zoom level
			camera.zoom = clampedZoom
			
			// Adjust camera position to zoom toward cursor position
			const newWorldPoint = camera.getWorldPoint(pointer.x, pointer.y)
			camera.scrollX += worldPoint.x - newWorldPoint.x
			camera.scrollY += worldPoint.y - newWorldPoint.y

			this.updateVisibleChunks()
		})
	}

	viewToWorldPosition(viewX, viewY) {
		const camera = this.cameras.main
		const worldPoint = camera.getWorldPoint(viewX, viewY)
		const mapX = Math.max(0, Math.floor(worldPoint.x / this.TILE_SIZE))
		const mapY = Math.max(0, Math.floor(worldPoint.y / this.TILE_SIZE))
		return { x: mapX, y: mapY }
	}

	getViewWorldPosition() {
		const camera = this.cameras.main
		const viewLeftTop = this.viewToWorldPosition(0, 0)
		const viewRightBottom = this.viewToWorldPosition(camera.width, camera.height)
		return {
			left: viewLeftTop.x,
			top: viewLeftTop.y,
			right: viewRightBottom.x,
			bottom: viewRightBottom.y
		}
	}

	enableClickHandler() {
		this.input.on('pointerdown', (pointer) => {
			if (pointer.leftButtonDown()) {
				// const worldPosition = this.viewToWorldPosition(pointer.x, pointer.y)
				// console.log(worldPosition)

				// Only log if click wasn't on a sprite (which would trigger sprite's own handler)
				if (!pointer.gameObject || !(pointer.gameObject instanceof Phaser.GameObjects.Sprite)) {
					this.focusOnActor(null)
				}
			}
		})
	}

	handleActorUpdate(actor) {
		let sprite = actor.sprite
		let x = actor.x * this.TILE_SIZE + this.TILE_SIZE / 2
		let y = actor.y * this.TILE_SIZE + this.TILE_SIZE / 2
		if (sprite) {
			sprite.x = x
			sprite.y = y
		} else {
			sprite = this.add.sprite(
				x,
				y,
				actor.name
			)
			sprite.setInteractive()
			sprite.on('pointerup', (pointer) => {
				if (pointer.upTime - pointer.downTime < 200) { // Only trigger for quick taps/clicks
					pointer.event.stopPropagation()
					this.focusOnActor(actor)
				}
			})
			actor.sprite = sprite
			//console.log('create sprite', actor.id, actor.name)
		}

		let direction = actor.direction || 'right'
		let action
		if (actor.action) {
			action = 'work'
		} else if (actor.move) {
			action = 'move'
			let nextX = actor.move.path[0]
			if (actor.x > nextX)
				direction = 'left'
			if (actor.x < nextX)
				direction = 'right'
			actor.direction = direction

			let lastUpdate = actor.move.lastUpdate
			let nextY = actor.move.path[1]

			// Calculate target position in pixels
			const targetX = nextX * this.TILE_SIZE + this.TILE_SIZE/2
			const targetY = nextY * this.TILE_SIZE + this.TILE_SIZE/2

			// Stop any existing tweens on this sprite
			this.tweens.killTweensOf(sprite)

			// Calculate distance to target
			const dx = targetX - sprite.x
			const dy = targetY - sprite.y
			const length = Math.sqrt(dx * dx + dy * dy)

			if (length > 0) {
				// Calculate movement duration based on distance and speed
				const pixelsPerSecond = actor.move.speed * this.TILE_SIZE
				const durationInSeconds = length / pixelsPerSecond

				// Create a new tween to move the sprite
				this.tweens.add({
					targets: sprite,
					x: targetX,
					y: targetY,
					duration: durationInSeconds * 1000, // Convert to milliseconds
					ease: 'Linear',
					repeat: 0,
					yoyo: false,
					onUpdate: () => {
						// Update the actor's position based on sprite position
						actor.x = (sprite.x - this.TILE_SIZE/2) / this.TILE_SIZE
						actor.y = (sprite.y - this.TILE_SIZE/2) / this.TILE_SIZE
					},
					onComplete: () => {
						// When reaching waypoint, remove first pair from path
						actor.move.path.splice(0, 2)
						// Update last update time
						actor.move.lastUpdate = Date.now()
						
						// If there are more waypoints, trigger next movement
						if (actor.move.path.length >= 2) {
							this.handleActorUpdate(actor)
						} else {
							// there's no movement, 
							delete actor.move
							this.handleActorUpdate(actor)
						}
					}
				})
			}
		} else {
			action = 'idle'
		}
		let name = `robot1-${action}-${direction}`
		if (sprite._actionName !== name) {
			sprite._actionName = name
			sprite.play(name, true)
		}
	}

	focusOnActor(actor) {
		if (actor) {
			console.log('focusOnActor', actor)
			let sprite = actor.sprite

			// Pan smoothly to sprite position first, then start following
			const targetX = sprite.x - this.cameras.main.width / 2
			const targetY = sprite.y - this.cameras.main.height / 2
			this.cameras.main.pan(targetX, targetY, 0) // Set position immediately
			this.cameras.main.startFollow(sprite, true)
			this.cameras.main.setFollowOffset(-sprite.width/2, -sprite.height/2)
			//this.cameras.main.setLerp(0.05) // Reduced lerp for smoother movement
			// If sprite is moving, draw path indicator
			if (sprite._pathGraphics) {
				sprite._pathGraphics.destroy()
			}

			if (actor.move && actor.move.path.length >= 2) {
				// Create graphics object for path
				sprite._pathGraphics = this.add.graphics()
				sprite._pathGraphics.setDepth(-1) // Set depth below sprites
				sprite._pathGraphics.lineStyle(2, 0x00ff00, 0.5) // Green line, 50% opacity

				// Draw path starting from current sprite position
				const startX = sprite.x 
				const startY = sprite.y

				// Create update function to redraw path from current position
				const updatePath = () => {
					sprite._pathGraphics.clear()
					
					// Draw thick grey line
					sprite._pathGraphics.lineStyle(8, 0x888888, 0.6)
					sprite._pathGraphics.moveTo(sprite.x, sprite.y)
					if (!actor.move) {
						sprite._pathGraphics.destroy()
						return
					}
					for (let i = 0; i < actor.move.path.length; i += 2) {
						const pathX = actor.move.path[i] * this.TILE_SIZE + this.TILE_SIZE/2
						const pathY = actor.move.path[i+1] * this.TILE_SIZE + this.TILE_SIZE/2
						sprite._pathGraphics.lineTo(pathX, pathY)
					}
					sprite._pathGraphics.strokePath()
				}

				// Initial draw
				updatePath()

				// Update path each frame while moving
				sprite._pathGraphics.update = updatePath
				this.events.on('preupdate', updatePath)
			}
		} else {
			console.log('focusOnActor', 'stopFollow')
			this.cameras.main.stopFollow()
		}
	}

	handleActorDelete(actor) {
		if (actor.sprite) {
			actor.sprite.destroy()
		}
	}
}

// Export the config and create the game instance
function getConfig() {
	return {
		type: Phaser.AUTO,
		width: window.innerWidth,
		height: window.innerHeight,
		scene: MapView,
		scale: {
			mode: Phaser.Scale.RESIZE,
			autoCenter: Phaser.Scale.CENTER_BOTH
		}
	}
}

const game = new Phaser.Game(getConfig())

console.log(game)
