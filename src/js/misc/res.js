export class Res {

	constructor(scene) {
		this.scene = scene
	}

	preload() {
		this.preloadSprites()
	}

	create() {
		this.prepareTextures()
		this.createAnimations()
	}

	preloadSprites() {
		this.scene.load.spritesheet('robot1', 'assets/spritesheets/robot1.png', {
			frameWidth: 64,
			frameHeight: 64,
		})
	}

	prepareTextures(tileSize) {
		// Helper function to create a tile texture
		const createTileTexture = (key, color, borderColor = 0xA9A9A9) => {
			const graphics = this.scene.add.graphics()
			
			// Fill
			graphics.fillStyle(color, 1)
			graphics.fillRect(0, 0, tileSize, tileSize)
			
			// Border
			graphics.lineStyle(1, borderColor, 1)
			graphics.strokeRect(0, 0, tileSize, tileSize)
	
			// Generate texture from graphics
			graphics.generateTexture(key, tileSize, tileSize)
			
			graphics.destroy()
		}
	
		// Create different tile textures
		createTileTexture('tile-default', 0xD3D3D3)    // Light grey for default
		createTileTexture('tile-empty', 0x808080)      // Dark grey for empty
		createTileTexture('tile-ore', 0xFFD700)        // Gold color for ore
		createTileTexture('tile-water', 0x0000FF)     // Blue color for water
	}

	createAnimations() {
		const anims = this.scene.anims
		anims.create({
			key: "robot1-move-left",
			frames: anims.generateFrameNumbers("robot1", { start: 0, end: 0 }),
			frameRate: 0.1,
			repeat: -1,
		})
		anims.create({
			key: "robot1-move-right",
			frames: anims.generateFrameNumbers("robot1", { start: 2, end: 2 }),
			frameRate: 0.1,
			repeat: -1,
		})
		anims.create({
			key: "robot1-work-left",
			frames: anims.generateFrameNumbers("robot1", { start: 4, end: 4 }),
			frameRate: 0.1,
			repeat: -1,
		})
		anims.create({
			key: "robot1-work-right",
			frames: anims.generateFrameNumbers("robot1", { start: 6, end: 6 }),
			frameRate: 0.1,
			repeat: -1,
		})
		anims.create({
			key: "robot1-idle-left",
			frames: anims.generateFrameNumbers("robot1", { start: 8, end: 8 }),
			frameRate: 0.1,
			repeat: -1,
		})
		anims.create({
			key: "robot1-idle-right",
			frames: anims.generateFrameNumbers("robot1", { start: 10, end: 10 }),
			frameRate: 0.1,
			repeat: -1,
		})
		anims.create({
			key: "robot1-damaged-left",
			frames: anims.generateFrameNumbers("robot1", { start: 12, end: 12 }),
			frameRate: 0.1,
			repeat: -1,
		})
		anims.create({
			key: "robot1-damaged-right",
			frames: anims.generateFrameNumbers("robot1", { start: 14, end: 14 }),
			frameRate: 0.1,
			repeat: -1,
		})
	}
}