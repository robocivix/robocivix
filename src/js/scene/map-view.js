// map-view.js
import { Scene, GameObjects } from '../../node_modules/phaser/dist/phaser.esm.js'
import { mapState, CHUNK_SIZE } from '../state/map-state.js'
import { DebugOverlay } from '../components/debug-overlay.js'
import { DetailsPanel } from '../components/details-panel.js'
import { Res } from '../misc/res.js'

export const TILE_SIZE = 64

class CoordinationHelper {
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

	getMapPosition(viewX, viewY) {
		const camera = this.scene.cameras.main
		const worldPoint = camera.getWorldPoint(viewX, viewY)
		const mapX = Math.max(0, Math.floor(worldPoint.x / TILE_SIZE))
		const mapY = Math.max(0, Math.floor(worldPoint.y / TILE_SIZE))
		return { x: mapX, y: mapY }
	}
}

class MovementPath {
	constructor(scene) {
		this.scene = scene
	}

	draw(actor) {
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
				pathGraphics.lineStyle(8, 0xAAAAAA, 0.6)
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
	
	destroy(actor) {
		if (actor._pathGraphics) {
			actor._pathGraphics.destroy()
			actor._pathGraphics = null
		}
	}
}


class Avatar {
	constructor(scene) {
		this.scene = scene
		this.movementPath = new MovementPath(scene)
	}

	draw(actor) {
		let sprite = actor._sprite
		let x = Math.round(actor.x * TILE_SIZE + TILE_SIZE / 2)
		let y = Math.round(actor.y * TILE_SIZE + TILE_SIZE / 2)
		if (sprite) {
			sprite.x = x
			sprite.y = y
		} else {
			sprite = this.scene.add.sprite(
				x,
				y,
				actor.name
			)
			sprite.setInteractive()
			sprite.on('pointerup', (pointer) => {
				// Only handle left mouse button or touch device tap
				if ((pointer.leftButtonReleased() || pointer.isTouch) && pointer.upTime - pointer.downTime < 200) {
					pointer.event.stopPropagation()
					this.scene.focus.on(actor)
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
			const existingTween = this.scene.tweens.getTweensOf(sprite)[0]
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
				const tween = this.scene.tweens.add({
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

				if (this.scene.focus.isOn(actor)) {
					this.movementPath.draw(actor)
				}
				actor._tween = tween
			}
		} else {
			action = 'idle'
			this.movementPath.destroy(actor)
		}
		let name = `robot1-${action}-${direction}`
		if (sprite._actionName !== name) {
			sprite._actionName = name
			sprite.play(name, true)
		}

		if (this.scene.dragSelection &&this.scene.dragSelection.isInSelectionArea(actor)) {
			sprite.setTint(0x00ff00)
		} else {
			sprite.setTint(0xffffff)
		}	
	}

	destroy(actor) {
		if (actor._tween) {
			actor._tween.stop()
			actor._tween.remove()
			actor._tween = null
		}
		this.movementPath.destroy(actor)
		if (actor._sprite) {
			actor._sprite.destroy()
			actor._sprite = null
		}
		if (this.scene.focus.isOn(actor)) {
			this.scene.focus.remove()
		}
	}
}

class DragSelection {	// eslint-disable-line no-unused-vars
	constructor(scene) {
		this.selectionArea = null

		let dragDiv = null
		
		let dragStartX = 0
		let dragStartY = 0

		scene.input.on('pointerdown', (pointer) => {
			if (pointer.leftButtonDown()) {
				// Get the canvas element's bounding rect
				const canvas = scene.game.canvas
				const rect = canvas.getBoundingClientRect()

				// Store initial screen position, adjusted for canvas position
				dragStartX = pointer.x + rect.left
				dragStartY = pointer.y + rect.top

				// Get or create div element
				dragDiv = document.getElementById('drag-selection-div')
				if (!dragDiv) {
					dragDiv = document.createElement('div')
					dragDiv.id = 'drag-selection-div'
					dragDiv.style.position = 'absolute'
					dragDiv.style.border = '1px solid #4488ff'
					dragDiv.style.backgroundColor = 'rgba(135, 206, 250, 0.1)'
					dragDiv.style.pointerEvents = 'none'
				}
				dragDiv.style.left = dragStartX + 'px'
				dragDiv.style.top = dragStartY + 'px'
				document.body.appendChild(dragDiv)
			}
		})

		scene.input.on('pointermove', (pointer) => {
			if (!dragDiv)
				return
			// Get canvas position
			const rect = scene.game.canvas.getBoundingClientRect()
			const currentX = pointer.x + rect.left
			const currentY = pointer.y + rect.top

			// Calculate width and height
			const width = currentX - dragStartX
			const height = currentY - dragStartY

			// Set position and size based on drag direction
			if (width < 0) {
				dragDiv.style.left = currentX + 'px'
				dragDiv.style.width = Math.abs(width) + 'px'
			} else {
				dragDiv.style.width = width + 'px'
			}

			if (height < 0) {
				dragDiv.style.top = currentY + 'px'
				dragDiv.style.height = Math.abs(height) + 'px'
			} else {
				dragDiv.style.height = height + 'px'
			}

			// Calculate selection area
			// Convert screen coordinates to world coordinates using helper
			const topLeft = scene.coordinationHelper.getMapPosition(Math.min(dragStartX, currentX), Math.min(dragStartY, currentY))
			const bottomRight = scene.coordinationHelper.getMapPosition(Math.max(dragStartX, currentX), Math.max(dragStartY, currentY))

			// Store selection area in world coordinates
			this.selectionArea = {
				left: topLeft.x,
				top: topLeft.y,
				right: bottomRight.x,
				bottom: bottomRight.y
			}
		})

		scene.input.on('pointerup', () => {
			if (dragDiv) {
				dragDiv.remove()
				dragDiv = null
			}
			console.log(this.selectionArea)
			this.selectionArea = null
		})
	}

	isInSelectionArea(actor) {
		if (!this.selectionArea) return false
		return actor.x >= this.selectionArea.left && actor.x <= this.selectionArea.right &&
			actor.y >= this.selectionArea.top && actor.y <= this.selectionArea.bottom
	}
}

class Focus {
	constructor(scene) {
		this.scene = scene
		this.actor = null
		this.tweenUpdate = null

		scene.input.on('pointermove', (pointer) => {
			if (pointer.isDown) {
				this.remove()
			}
		})

		scene.input.on('pointerdown', (pointer) => {
			if (pointer.gameObject && (pointer.gameObject instanceof GameObjects.Sprite)) {
				return
			}

			this.remove()
		})
	}

	on(actor) {
		this.actor = actor
		let sprite = actor._sprite

		// Create a tween that updates each frame to follow the moving sprite
		const tween = {
			camera: this.scene.cameras.main,
			sprite,
			progress: 0,
			duration: 500,
			startX: this.scene.cameras.main.scrollX,
			startY: this.scene.cameras.main.scrollY,
			active: true
		}

		// Add update function to scene
		const tweenUpdate = () => {
			if (!tween.active) return

			// Calculate current target position (center of sprite)
			const targetX = Math.round(sprite.x - tween.camera.width/2 + TILE_SIZE/2)
			const targetY = Math.round(sprite.y - tween.camera.height/2 + TILE_SIZE/2)

			// Update progress
			tween.progress += this.scene.game.loop.delta
			const t = Math.min(tween.progress / tween.duration, 1)
			
			// Cubic ease out
			const ease = 1 - Math.pow(1 - t, 3)

			// Interpolate camera position
			tween.camera.scrollX = tween.startX + (targetX - tween.startX) * ease
			tween.camera.scrollY = tween.startY + (targetY - tween.startY) * ease

			// When complete, start following
			if (t === 1) {
				tween.active = false
				this.scene.cameras.main.startFollow(sprite, true)
				this.scene.cameras.main.setFollowOffset(-sprite.width/2, -sprite.height/2)
				this.scene.events.off('update', tweenUpdate)
				this.tweenUpdate = null
			}
		}

		this.scene.events.on('update', tweenUpdate)
		this.tweenUpdate = tweenUpdate
		
		this.scene.avatar.movementPath.draw(actor)
		this.scene.detailsPanel.show(actor)
	}

	isOn(actor) {
		return this.actor === actor
	}

	remove() {
		this.scene.cameras.main.stopFollow()
		if (this.actor) {
			this.scene.avatar.movementPath.destroy(this.actor)
			this.actor = null
			this.scene.detailsPanel.hide()
		}
		if (this.tweenUpdate) {
			this.scene.events.off('update', this.tweenUpdate)
			this.tweenUpdate = null
		}
	}
}

class Panning {
	constructor(scene, onUpdate) {
		let isPanning = false

		const panInfo = { 
			vx: 0, 
			vy: 0, 
			p1: {x: 0, y: 0, time: 0 },
			p2: {x: 0, y: 0, time: 0 }
		}

		function updatePanInfo(pointer) {
			panInfo.p2 = panInfo.p1
			panInfo.p1 = {
				x: pointer.x,
				y: pointer.y,
				time: new Date().getTime()
			}
		}

		scene.input.on('pointerdown', (pointer) => {
			// For touch devices, treat single touch as panning
			// For mouse, only right/middle button triggers panning
			//if (pointer.pointerType === 'touch' || pointer.rightButtonDown() || pointer.middleButtonDown()) {
			isPanning = true
			panInfo.vx = 0
			panInfo.vy = 0
			panInfo.p1 = {x: pointer.x, y: pointer.y, time: new Date().getTime()}
			panInfo.p2 = panInfo.p1
			updatePanInfo(pointer)
		})

		scene.input.on('pointermove', (pointer) => {
			if (isPanning) {
			//if (this.isPanning && (pointer.pointerType === 'touch' || pointer.rightButtonDown() || pointer.middleButtonDown())) {
				const deltaX = pointer.x - panInfo.p1.x
				const deltaY = pointer.y - panInfo.p1.y
				
				const camera = scene.cameras.main
				camera.scrollX -= deltaX / camera.zoom
				camera.scrollY -= deltaY / camera.zoom
				
				updatePanInfo(pointer)
				onUpdate()
			}
		})

		scene.input.on('pointerup', pointer => {			
			if (isPanning) {
			//if (this.isPanning && (pointer.pointerType === 'touch' || pointer.rightButtonReleased() || pointer.middleButtonReleased())) {
				isPanning = false
				
				// Calculate final velocity based on total movement
				const now = new Date().getTime()
				const deltaTime = (now - panInfo.p2.time) / 1000
				const deltaX = pointer.x - panInfo.p2.x
				const deltaY = pointer.y - panInfo.p2.y
				
				const camera = scene.cameras.main
				panInfo.vx = (deltaX / camera.zoom) / deltaTime
				panInfo.vy = (deltaY / camera.zoom) / deltaTime

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
							
							const camera = scene.cameras.main
							camera.scrollX -= panInfo.vx * timeScale
							camera.scrollY -= panInfo.vy * timeScale
							
							onUpdate()
							requestAnimationFrame(animate)
						} else {
							onUpdate()
						}
					}
					
					requestAnimationFrame(animate)
				} else {
					onUpdate()
				}
			}
		})
	}
}

class Zooming {
	constructor(scene, onUpdate) {
		this.scene = scene
		this.onUpdate = onUpdate

		this.handleMouseZoom()
		this.handlePinchZoom()
	}

	handleMouseZoom() {
		// Handle mouse wheel zoom
		this.scene.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {	// eslint-disable-line no-unused-vars
			this.handleZoom(pointer, deltaY > 0 ? -0.1 : 0.1)
		})
	}

	handlePinchZoom() {
		// Handle pinch zoom on touch devices
		let startDistance = 0
		let lastScale = 1

		this.scene.input.on('touchstart', (pointer) => {
			this.debugOverlay.message("touchstart", "touches: " + pointer.touches?.length)
			
			if (pointer.touches?.length === 2) {
				const touch1 = pointer.touches[0]
				const touch2 = pointer.touches[1]
				
				// Use pointer coordinates directly from Phaser's touch objects
				startDistance = Math.hypot(
					touch1.pageX - touch2.pageX,
					touch1.pageY - touch2.pageY
				)
				lastScale = 1
			}
		})

		// Listen for touchmove to handle zoom
		this.scene.input.on('touchmove', (pointer) => {
			this.scene.debugOverlay.message("touchmove p2", pointer.x + ", " + pointer.y)
			
			if (pointer.touches?.length === 2) {
				pointer.event.preventDefault() // Prevent default browser pinch zoom

				const touch1 = pointer.touches[0]
				const touch2 = pointer.touches[1]

				const currentDistance = Math.hypot(
					touch1.pageX - touch2.pageX,
					touch1.pageY - touch2.pageY
				)

				if (startDistance > 0) {
					const scale = currentDistance / startDistance
					const deltaScale = scale - lastScale
					const zoomDelta = deltaScale * 0.5 // Adjust sensitivity

					// Calculate midpoint between touches using Phaser coordinates
					const midX = (touch1.x + touch2.x) / 2
					const midY = (touch1.y + touch2.y) / 2
					const zoomPoint = {x: midX, y: midY}

					this.handleZoom(zoomPoint, zoomDelta)
					lastScale = scale
				}
			}
		})

		// Reset on touch end
		this.scene.input.on('touchend', () => {
			this.scene.debugOverlay.message("touchend", "reset zoom state")
			startDistance = 0
			lastScale = 1
		})
	}

	handleZoom(pointer, zoomDelta) {
		const camera = this.scene.cameras.main
		const currentZoom = camera.zoom
		
		// Define available zoom levels
		const zoomLevels = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5]
		
		// Find current zoom level index
		let currentIndex = zoomLevels.findIndex(zoom => Math.abs(zoom - currentZoom) < 0.01)
		if (currentIndex === -1) {
			currentIndex = zoomLevels.findIndex(zoom => zoom > currentZoom) - 1
			if (currentIndex === -2) currentIndex = zoomLevels.length - 1
		}
		
		// Determine next zoom level based on zoom direction
		let nextIndex
		if (zoomDelta > 0) {
			// Zooming in
			nextIndex = Math.min(currentIndex + 1, zoomLevels.length - 1)
		} else {
			// Zooming out
			nextIndex = Math.max(currentIndex - 1, 0)
		}
		
		// Get pointer position in world space before zoom
		const worldPoint = camera.getWorldPoint(pointer.x, pointer.y)
		
		// Set new zoom level
		camera.zoom = zoomLevels[nextIndex]
		
		// Force camera to update its internal values
		camera.preRender()
		
		// Adjust camera position to zoom toward pointer position
		const newWorldPoint = camera.getWorldPoint(pointer.x, pointer.y)
		camera.scrollX += worldPoint.x - newWorldPoint.x
		camera.scrollY += worldPoint.y - newWorldPoint.y

		// Force another update before getting chunks
		camera.preRender()
		
		this.onUpdate()
	}	
}

export class MapViewScene extends Scene {
	constructor() {
		super('MapViewScene')
		this.config = {
			drawChunkBoundaries: true,
			drawDebugOverlay: true
		}
	}

	preload () {
		this.res = new Res(this)
		this.res.preloadSprites()
		this.res.prepareTextures(TILE_SIZE)
	}

	create () {
		this.res.createAnimations()
		this.disableContextMenu()
		this.coordinationHelper = new CoordinationHelper(this)
		this.avatar = new Avatar(this)
		this.detailsPanel = new DetailsPanel(this)
		//this.dragSelection = new DragSelection(this)		
		this.focus = new Focus(this)

		const onCameraUpdate = () => {
			this.updateVisibleChunks()
			if (this.debugOverlay) {
				this.debugOverlay.update()
			}
		}
		this.panning = new Panning(this, onCameraUpdate)
		this.zooming = new Zooming(this, onCameraUpdate)

		
		mapState.subscribeToAdd(this.onActorUpdate.bind(this))
		mapState.subscribeToUpdate(this.onActorUpdate.bind(this))
		mapState.subscribeToDelete(this.onActorDelete.bind(this))

		if (this.config.drawDebugOverlay) {
			this.debugOverlay = new DebugOverlay(this)
			this.debugOverlay.init()
		}

		this.cameras.main.setBounds(mapState.bounds.x, mapState.bounds.y, mapState.bounds.w * TILE_SIZE, mapState.bounds.h * TILE_SIZE)
		this.updateVisibleChunks()

		var IS_TOUCH	= false
		window.addEventListener('touchstart', function()
		{			
			IS_TOUCH	= true
			this.debugOverlay.message("touchstart", "IS_TOUCH: " + IS_TOUCH)
		})
	}

	disableContextMenu() {
		this.game.canvas.addEventListener('contextmenu', (e) => {
			e.preventDefault()
		})
	}

	updateVisibleChunks() {
		// Get viewport dimensions in world coordinates
		const bufferMargin = Math.floor(CHUNK_SIZE / 2)
		//const bufferMargin = 0
		const view = this.coordinationHelper.getViewWorldPosition()
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
				this.drawChunkView(chunk)
			}
		}

		if (update.added.length > 0 || update.removed.length > 0)
			console.log("updateVisibleChunks", Object.keys(update.subscribed).length, Object.keys(update.subscribed))
	}

	destroyChunkView(chunk) {
		// Destroy actor sprites
		for (const [_, actor] of Object.entries(chunk.actors)) {
			this.avatar.destroy(actor)
		}

		// Destroy ground tile textures
		if (chunk.groundImages) {
			chunk.groundImages.forEach(img => img.destroy())
			chunk.groundImages = null
		}
	}

	drawChunkView(chunk) {
		// Draw the ground tiles for this chunk using pre-created tile textures
		if (chunk.groundLayer) {
			if (chunk.groundImages) {
				throw new Error('chunk.groundImages already exists')
			}
			console.log("drawChunkView", chunk.key())
			
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
	
	onActorUpdate(actor) {
		this.avatar.draw(actor)
		if (this.focus.isOn(actor)) {
			this.detailsPanel.show(actor)
		}
	}

	onActorDelete(actor) {
		this.avatar.destroy(actor)
	}
}
