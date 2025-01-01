import Phaser from "phaser"

interface PanInfo {
	vx: number
	vy: number
	p1: {x: number, y: number, time: number}
	p2: {x: number, y: number, time: number}
}

export class Panning {
	private scene: Phaser.Scene
	private onUpdate: () => void

	constructor(scene: Phaser.Scene, onUpdate: () => void) {
		this.scene = scene
		this.onUpdate = onUpdate
	}

	init(): void {
		let isPanning = false

		const panInfo: PanInfo = { 
			vx: 0, 
			vy: 0, 
			p1: {x: 0, y: 0, time: 0},
			p2: {x: 0, y: 0, time: 0}
		}

		function updatePanInfo(pointer: Phaser.Input.Pointer): void {
			panInfo.p2 = panInfo.p1
			panInfo.p1 = {
				x: pointer.x,
				y: pointer.y,
				time: new Date().getTime()
			}
		}

		this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
            
			if (pointer.rightButtonDown() || pointer.middleButtonDown()) {
				isPanning = true
				panInfo.vx = 0
				panInfo.vy = 0
				panInfo.p1 = {x: pointer.x, y: pointer.y, time: new Date().getTime()}
				panInfo.p2 = panInfo.p1
				updatePanInfo(pointer)
			}
		})

		this.scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
			if (isPanning) {
			//if (this.isPanning && (pointer.pointerType === 'touch' || pointer.rightButtonDown() || pointer.middleButtonDown())) {
				const deltaX = pointer.x - panInfo.p1.x
				const deltaY = pointer.y - panInfo.p1.y
				
				const camera = this.scene.cameras.main
				camera.scrollX -= deltaX / camera.zoom
				camera.scrollY -= deltaY / camera.zoom
				
				updatePanInfo(pointer)
				this.onUpdate()
			}
		})

		this.scene.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {			
			if (isPanning) {
			//if (this.isPanning && (pointer.pointerType === 'touch' || pointer.rightButtonReleased() || pointer.middleButtonReleased())) {
				isPanning = false
				
				// Calculate final velocity based on total movement
				const now = new Date().getTime()
				const deltaTime = (now - panInfo.p2.time) / 1000
				const deltaX = pointer.x - panInfo.p2.x
				const deltaY = pointer.y - panInfo.p2.y
				
				const camera = this.scene.cameras.main
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
					
					let startTime: number | null = null
					const animate = (timestamp: number): void => {
						if (!startTime) startTime = timestamp
						const progress = (timestamp - startTime) / decayDuration
						
						if (progress < 1) {
							const easeOut = 1 - Math.pow(1 - progress, 2)
							const timeScale = 1/60 // Convert to roughly 60 FPS time steps
							
							panInfo.vx = startVelocity.vx * (1 - easeOut)
							panInfo.vy = startVelocity.vy * (1 - easeOut)
							
							const camera = this.scene.cameras.main
							camera.scrollX -= panInfo.vx * timeScale
							camera.scrollY -= panInfo.vy * timeScale
							
							this.onUpdate()
							requestAnimationFrame(animate)
						} else {
							this.onUpdate()
						}
					}
					
					requestAnimationFrame(animate)
				} else {
					this.onUpdate()
				}
			}
		})
	}
}
