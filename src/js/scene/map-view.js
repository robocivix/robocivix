// map-view.js
import { Scene, GameObjects } from '../../node_modules/phaser/dist/phaser.esm.js'
import { mapState, CHUNK_SIZE } from '../state/map-state.js'
import { DebugOverlay } from '../components/debug-overlay.js'
import { Res } from '../misc/res.js'

export const TILE_SIZE = 64
class MapViewHelper {
	constructor(scene) {
		this.scene = scene
	}

	viewToWorldPosition(viewX, viewY) {
		const camera = this.scene.cameras.main
		const worldPoint = camera.getWorldPoint(viewX, viewY)
		const mapX = Math.max(0, Math.floor(worldPoint.x / TILE_SIZE))
		const mapY = Math.max(0, Math.floor(worldPoint.y / TILE_SIZE))
		return { x: mapX, y: mapY }
	}

	getViewWorldPosition() {
		const camera = this.scene.cameras.main
		const viewLeftTop = this.viewToWorldPosition(0, 0)
		const viewRightBottom = this.viewToWorldPosition(camera.width, camera.height)
		return {
			left: viewLeftTop.x,
			top: viewLeftTop.y,
			right: viewRightBottom.x,
			bottom: viewRightBottom.y
		}
	}

	// getMapPosition(viewX, viewY) {
	// 	const camera = this.cameras.main
	// 	const worldPoint = camera.getWorldPoint(viewX, viewY)
	// 	const mapX = Math.max(0, Math.floor(worldPoint.x / TILE_SIZE))
	// 	const mapY = Math.max(0, Math.floor(worldPoint.y / TILE_SIZE))
	// 	return { x: mapX, y: mapY }
	// }
}

export class MapViewScene extends Scene
{
	constructor() {
		super('MapViewScene')
		this.focus = null
		this.res = new Res(this)
		this.config = {
			drawChunkBoundaries: true,
			drawDebugOverlay: true
		}
		this.helper = new MapViewHelper(this)
	}

	preload () {
		this.res.preloadSprites()
		this.res.prepareTextures(TILE_SIZE)
	}

	create () {
		
		this.renderMap()
		this.enablePanning()
		this.enableZoom()
		this.res.createAnimations()
		this.enableClickHandler()
		mapState.subscribeToAdd(this.onActorUpdate.bind(this))
		mapState.subscribeToUpdate(this.onActorUpdate.bind(this))
		mapState.subscribeToDelete(this.onActorDelete.bind(this))

		if (this.config.drawDebugOverlay) {
			this.debugOverlay = new DebugOverlay(this)
			this.debugOverlay.init()
		}
	}


	updateVisibleChunks() {
		// Get viewport dimensions in world coordinates
		const bufferMargin = Math.floor(CHUNK_SIZE / 2)
		//const bufferMargin = 0
		const view = this.helper.getViewWorldPosition()
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
			this.destroyActor(actor)
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
			if (chunk.groundImages) {
				throw new Error('chunk.groundImages already exists')
			}
			console.log("createChunkView", chunk.key())
			
			chunk.groundImages = []
			
			// Draw chunk boundary
			if (this.config.drawChunkBoundaries) {
				const chunkWorldX = chunk.x * TILE_SIZE
				const chunkWorldY = chunk.y * TILE_SIZE
				const chunkWorldWidth = CHUNK_SIZE * TILE_SIZE
				const chunkWorldHeight = CHUNK_SIZE * TILE_SIZE
			
				const boundary = this.add.rectangle(chunkWorldX, chunkWorldY, chunkWorldWidth, chunkWorldHeight)
					.setStrokeStyle(4, 0x33CC33)
					.setOrigin(0)
					.setDepth(-99)
				chunk.groundImages.push(boundary)

				// Draw chunk key text
				const info = `${chunk.key()} (${chunk.x / CHUNK_SIZE}, ${chunk.y / CHUNK_SIZE})`
				const text = this.add.text(chunkWorldX + 4, chunkWorldY + 4, info, {
					fontSize: '18px',
					color: '#33CC33'
				})
				text.setDepth(-99)
				chunk.groundImages.push(text)
			}
			// Draw ground tiles
			for (let y = 0; y < CHUNK_SIZE; y++) {
				for (let x = 0; x < CHUNK_SIZE; x++) {
					const tile = chunk.groundLayer[y][x]
					const worldX = (chunk.x + x) * TILE_SIZE
					const worldY = (chunk.y + y) * TILE_SIZE
					
					let textureName = 'tile-default'
					if (!tile) {
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
			this.onActorUpdate(actor)
		}
	}

	renderMap() {
		
		this.cameras.main.setBounds(mapState.bounds.x, mapState.bounds.y, mapState.bounds.w * TILE_SIZE, mapState.bounds.h * TILE_SIZE)

		this.updateVisibleChunks()
	}

	enablePanning() {
		const panInfo = { 
			vx: 0, 
			vy: 0, 
			p1: {x: 0, y: 0, time: 0 },
			p2: {x: 0, y: 0, time: 0 }
		}

		this.isPanning = false

		function updatePanInfo(pointer) {
			panInfo.p2 = panInfo.p1
			panInfo.p1 = {
				x: pointer.x,
				y: pointer.y,
				time: new Date().getTime()
			}
		}

		this.input.on('pointerdown', (pointer) => {
			if (pointer.leftButtonDown()) {
				this.isPanning = true
				updatePanInfo(pointer)
			}
		})

		this.input.on('pointermove', (pointer) => {
			if (this.isPanning && pointer.isDown) {
				const deltaX = pointer.x - panInfo.p1.x
				const deltaY = pointer.y - panInfo.p1.y
				
				const camera = this.cameras.main
				camera.scrollX -= deltaX / camera.zoom
				camera.scrollY -= deltaY / camera.zoom
				
				updatePanInfo(pointer)
				this.updateVisibleChunks()
			}
		})

		this.input.on('pointerup', pointer => {
			if (this.isPanning) {
				this.isPanning = false
				
				// Calculate final velocity based on total movement
				const now = new Date().getTime()
				const deltaTime = (now - panInfo.p2.time) / 1000
				const deltaX = pointer.x - panInfo.p2.x
				const deltaY = pointer.y - panInfo.p2.y
				
				const camera = this.cameras.main
				panInfo.vx = (deltaX / camera.zoom) / deltaTime
				panInfo.vy = (deltaY / camera.zoom) / deltaTime

				this.updateVisibleChunks()

				// Start decay animation only if there was significant movement speed
				const velocityMagnitude = Math.sqrt(
					Math.pow(panInfo.vx, 2) + 
					Math.pow(panInfo.vy, 2)
				)

				if (velocityMagnitude > 100) { // Units per second threshold
					const decayDuration = 500
					const startVelocity = { vx: panInfo.vx, vy: panInfo.vy }
					
					let startTime = null
					const animate = (timestamp) => {
						if (!startTime) startTime = timestamp
						const progress = (timestamp - startTime) / decayDuration
						
						if (progress < 1) {
							const easeOut = 1 - Math.pow(1 - progress, 2)
							const timeScale = 1/60 // Convert to roughly 60 FPS time steps
							
							panInfo.vx = startVelocity.vx * (1 - easeOut)
							panInfo.vy = startVelocity.vy * (1 - easeOut)
							
							const camera = this.cameras.main
							camera.scrollX -= panInfo.vx * timeScale
							camera.scrollY -= panInfo.vy * timeScale
							
							this.updateVisibleChunks()
							requestAnimationFrame(animate)
						} else {
							this.updateVisibleChunks()
							if (this.debugOverlay) {
								this.debugOverlay.update()
							}
						}
					}
					
					requestAnimationFrame(animate)
				}
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

	

	enableClickHandler() {
		this.input.on('pointerdown', (pointer) => {
			if (pointer.leftButtonDown()) {
				// Only log if click wasn't on a sprite (which would trigger sprite's own handler)
				if (!pointer.gameObject || !(pointer.gameObject instanceof GameObjects.Sprite)) {
					this.focusOnActor(null)
				}
			}
		})
	}

	destroyMovementPath(actor) {
		if (actor._pathGraphics) {
			actor._pathGraphics.destroy()
			actor._pathGraphics = null
		}
	}

	drawMovementPath(actor) {
		// If sprite is moving, draw path indicator
		this.destroyMovementPath(actor)

		if (actor._move && actor._move.path.length >= 2) {
			// Create graphics object for path
			const pathGraphics = this.add.graphics()
			actor._pathGraphics = pathGraphics
			pathGraphics.setDepth(-1) // Set depth below sprites
			pathGraphics.lineStyle(2, 0x00ff00, 0.5) // Green line, 50% opacity


			// Create update function to redraw path from current position
			const updatePath = () => {
				pathGraphics.clear()
				
				// Draw thick grey line
				pathGraphics.lineStyle(8, 0x888888, 0.6)
				pathGraphics.moveTo(actor._sprite.x, actor._sprite.y)
				if (!actor._move || actor._move.path.length < 2) {
					pathGraphics.destroy()
					actor._pathGraphics = null
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
			pathGraphics.update = updatePath
		}
	}

	focusOnActor(actor) {
		if (actor) {
			this.focus = actor
			let sprite = actor._sprite

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
				const targetX = Math.round(sprite.x - tween.camera.width/2 + TILE_SIZE/2)
				const targetY = Math.round(sprite.y - tween.camera.height/2 + TILE_SIZE/2)

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
			this.cameras.main.stopFollow()
			if (this.focus) {
				if (this.focus && this.focus._pathGraphics) {
					this.focus._pathGraphics.destroy()
					this.focus._pathGraphics = null
				}
				this.focus = null
			}
		}
	}

	drawActor(actor) {
		let sprite = actor._sprite
		let x = Math.round(actor.x * TILE_SIZE + TILE_SIZE / 2)
		let y = Math.round(actor.y * TILE_SIZE + TILE_SIZE / 2)
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
			actor._sprite = sprite
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
			const targetX = Math.round(nextX * TILE_SIZE + TILE_SIZE/2)
			const targetY = Math.round(nextY * TILE_SIZE + TILE_SIZE/2)

			// Check if there's an existing tween with different target
			const existingTween = this.tweens.getTweensOf(sprite)[0]
			if (existingTween) {
				if (existingTween.data[0].end !== targetX || existingTween.data[1].end !== targetY) {
					// If target changed, kill existing tween
					existingTween.stop()
					existingTween.remove()
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
				const pixelsPerSecond = actor._move.speed * TILE_SIZE
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
							tween.stop()
							tween.remove()
							actor._tween = null
							return
						}
					},
					onComplete: () => {
						tween.stop()
						tween.remove()
						actor._tween = null
					}
				})

				if (this.focus === actor) {
					this.drawMovementPath(actor)
				}
				actor._tween = tween
			}
		} else {
			action = 'idle'
			this.destroyMovementPath(actor)
		}
		let name = `robot1-${action}-${direction}`
		if (sprite._actionName !== name) {
			sprite._actionName = name
			sprite.play(name, true)
		}
	}

	destroyActor(actor) {
		if (actor._tween) {
			actor._tween.stop()
			actor._tween.remove()
			actor._tween = null
		}
		this.destroyMovementPath(actor)
		if (actor._sprite) {
			actor._sprite.destroy()
			actor._sprite = null
		}
	}

	onActorUpdate(actor) {
		this.drawActor(actor)
	}

	onActorDelete(actor) {
		this.destroyActor(actor)
	}
}
