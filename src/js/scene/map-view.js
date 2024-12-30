// map-view.js
import { Scene, GameObjects } from '../../node_modules/phaser/dist/phaser.esm.js'
import { mapState, CHUNK_SIZE } from '../state/map-state.js'
import { DebugOverlay } from '../components/debug-overlay.js'
import { Res } from '../misc/res.js'

export class MapViewScene extends Scene
{
	TILE_SIZE = 64

	constructor() {
		super('MapViewScene')
		this.debugOverlay = new DebugOverlay(this)
		this.focus = null
		this.res = new Res(this)
	}

	preload () {
		this.res.preloadSprites()
		this.res.prepareTextures()
	}

	create () {
		
		this.renderMap()
		this.enablePanning()
		this.enableZoom()
		this.res.createAnimations()
		this.enableClickHandler()
		this.debugOverlay.init()
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
		// Destroy actor sprites
		for (const [_, actor] of Object.entries(chunk.actors)) {
			if (actor.sprite) {
				//console.log('destroy sprite', actor.id, actor.name)
				this.destroyActor(actor)
			}
		}

		// Destroy ground tile textures
		if (chunk.groundImages) {
			chunk.groundImages.forEach(img => img.destroy())
			chunk.groundImages = null
		}
	}
	createChunkView(chunk) {
		// Draw the ground tiles for this chunk using pre-created tile textures
		if (chunk.groundLayer) {
			chunk.groundImages = []
			for (let y = 0; y < CHUNK_SIZE; y++) {
				for (let x = 0; x < CHUNK_SIZE; x++) {
					const tile = chunk.groundLayer[y][x]
					const worldX = (chunk.x + x) * this.TILE_SIZE
					const worldY = (chunk.y + y) * this.TILE_SIZE
					
					let textureName = 'tile-default'
					if (tile === null) {
						textureName = 'tile-empty'
					} else if (tile.type) {
						textureName = `tile-${tile.type}`
					}
					
					const img = this.add.image(worldX, worldY, textureName)
						.setOrigin(0)
						.setDepth(-100)
					chunk.groundImages.push(img)
				}
			}
		}

		// Create actors for this chunk
		for (const [_, actor] of Object.entries(chunk.actors)) {
			this.handleActorUpdate(actor)
		}
	}

	renderMap() {
		
		this.cameras.main.setBounds(mapState.bounds.x, mapState.bounds.y, mapState.bounds.w * this.TILE_SIZE, mapState.bounds.h * this.TILE_SIZE)

		this.updateVisibleChunks()
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
				const decayDuration = 500 // 1 second
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
				if (!pointer.gameObject || !(pointer.gameObject instanceof GameObjects.Sprite)) {
					this.focusOnActor(null)
				}
			}
		})
	}

	handleActorUpdate(actor) {
		let sprite = actor.sprite
		let x = Math.round(actor.x * this.TILE_SIZE + this.TILE_SIZE / 2)
		let y = Math.round(actor.y * this.TILE_SIZE + this.TILE_SIZE / 2)
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
		} else if (actor._move) {
			action = 'move'
			let nextX = actor._move.path[0]
			if (actor.x > nextX)
				direction = 'left'
			if (actor.x < nextX)
				direction = 'right'
			actor.direction = direction

			let nextY = actor._move.path[1]

			// Calculate target position in pixels
			const targetX = Math.round(nextX * this.TILE_SIZE + this.TILE_SIZE/2)
			const targetY = Math.round(nextY * this.TILE_SIZE + this.TILE_SIZE/2)

			// Check if there's an existing tween with different target
			const existingTween = this.tweens.getTweensOf(sprite)[0]
			if (existingTween) {
				if (existingTween.data[0].end !== targetX || existingTween.data[1].end !== targetY) {
					// If target changed, kill existing tween
					existingTween.stop()
				} else {
					// If target is the same, keep existing tween
					return
				}
			}

			// Calculate distance to target
			const dx = targetX - sprite.x
			const dy = targetY - sprite.y
			const length = Math.sqrt(dx * dx + dy * dy)

			if (length > 0) {
				// Calculate movement duration based on distance and speed
				const pixelsPerSecond = actor._move.speed * this.TILE_SIZE
				const durationInSeconds = length / pixelsPerSecond

				// Create a new tween to move the sprite
				const tween = this.tweens.add({
					targets: sprite,
					x: targetX,
					y: targetY,
					duration: durationInSeconds * 1000, // Convert to milliseconds
					ease: 'Linear',
					repeat: 0,
					yoyo: false,
					onUpdate: () => {
						// Check if movement was reset
						if (!actor._move) {
							console.log("handleActorUpdate, tween stopped")
							tween.stop()
							tween.remove() // Remove tween from Phaser's tween manager
							return
						}
					},
					onComplete: () => {
					}
				})

				if (this.focus === actor) {
					this.drawMovementPath(actor)
				}
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

	drawMovementPath(actor) {
		const sprite = actor.sprite
		// If sprite is moving, draw path indicator
		if (sprite._pathGraphics) {
			sprite._pathGraphics.destroy()
		}

		if (actor._move && actor._move.path.length >= 2) {
			// Create graphics object for path
			sprite._pathGraphics = this.add.graphics()
			sprite._pathGraphics.setDepth(-1) // Set depth below sprites
			sprite._pathGraphics.lineStyle(2, 0x00ff00, 0.5) // Green line, 50% opacity


			// Create update function to redraw path from current position
			const updatePath = () => {
				sprite._pathGraphics.clear()
				
				// Draw thick grey line
				sprite._pathGraphics.lineStyle(8, 0x888888, 0.6)
				sprite._pathGraphics.moveTo(sprite.x, sprite.y)
				if (!actor._move || actor._move.path.length < 2) {
					sprite._pathGraphics.destroy()
					sprite._pathGraphics = null
					return
				}
				for (let i = 0; i < actor._move.path.length; i += 2) {
					const pathX = actor._move.path[i] * this.TILE_SIZE + this.TILE_SIZE/2
					const pathY = actor._move.path[i+1] * this.TILE_SIZE + this.TILE_SIZE/2
					sprite._pathGraphics.lineTo(pathX, pathY)
				}
				sprite._pathGraphics.strokePath()
			}

			// Initial draw
			updatePath()

			// Update path each frame while moving
			sprite._pathGraphics.update = updatePath
			// this.events.on('preupdate', updatePath)
		}
	}

	focusOnActor(actor) {
		if (actor) {
			console.log('focusOnActor', actor)
			this.focus = actor
			let sprite = actor.sprite

			// Create a tween that updates each frame to follow the moving sprite
			const tween = {
				camera: this.cameras.main,
				sprite,
				progress: 0,
				duration: 500,
				startX: this.cameras.main.scrollX,
				startY: this.cameras.main.scrollY,
				active: true
			}

			// Add update function to scene
			const tweenUpdate = () => {
				if (!tween.active) return

				// Calculate current target position (center of sprite)
				const targetX = Math.round(sprite.x - tween.camera.width/2 + this.TILE_SIZE/2)
				const targetY = Math.round(sprite.y - tween.camera.height/2 + this.TILE_SIZE/2)

				// Update progress
				tween.progress += this.game.loop.delta
				const t = Math.min(tween.progress / tween.duration, 1)
				
				// Cubic ease out
				const ease = 1 - Math.pow(1 - t, 3)

				// Interpolate camera position
				tween.camera.scrollX = tween.startX + (targetX - tween.startX) * ease
				tween.camera.scrollY = tween.startY + (targetY - tween.startY) * ease

				// When complete, start following
				if (t === 1) {
					tween.active = false
					this.cameras.main.startFollow(sprite, true)
					this.cameras.main.setFollowOffset(-sprite.width/2, -sprite.height/2)
					this.events.off('update', tweenUpdate)
				}
			}

			this.events.on('update', tweenUpdate)
			
			this.drawMovementPath(actor)
		} else {
			console.log('focusOnActor', 'stopFollow')
			this.cameras.main.stopFollow()
			if (this.focus && this.focus.sprite && this.focus.sprite._pathGraphics) {
				this.focus.sprite._pathGraphics.destroy()
				this.focus.sprite._pathGraphics = null
			}
			this.focus = null
		}
	}

	handleActorDelete(actor) {
		this.destroyActor(actor)
	}

	destroyActor(actor) {
		if (actor.sprite) {
			actor.sprite.destroy()
			if (actor.sprite._pathGraphics) {
				actor.sprite._pathGraphics.destroy()
				actor.sprite._pathGraphics = null
			}
			actor.sprite = null
		}
	}
}
