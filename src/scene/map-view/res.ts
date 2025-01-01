import Phaser from "phaser"

export const TILE_SIZE = 32

export class Res {

	private scene: Phaser.Scene

	constructor(scene: Phaser.Scene) {
		this.scene = scene
	}

	preloadSprites(): void {
		this.scene.load.spritesheet("robot1", "assets/spritesheets/robot1_32.png", {
			frameWidth: TILE_SIZE,
			frameHeight: TILE_SIZE,
		})
	}

	prepareTextures(): void {
		// Helper function to create a tile texture
		const createTileTexture = (key: string, color: number, borderColor: number = 0xA9A9A9, text: string = ""): void => {
			const graphics = this.scene.add.graphics()
			
			// Fill
			graphics.fillStyle(color, 1)
			graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE)
			
			// Border
			graphics.lineStyle(1, borderColor, 1)
			graphics.strokeRect(0, 0, TILE_SIZE, TILE_SIZE)

			const renderTexture = this.scene.add.renderTexture(0, 0, TILE_SIZE, TILE_SIZE)
			renderTexture.draw(graphics)
			if (text) {
				const textObj = this.scene.add.text(TILE_SIZE / 2, TILE_SIZE / 2, text, { fontSize: "12px", color: "white" }).setOrigin(0.5, 0.5)
				renderTexture.draw(textObj)
				textObj.destroy()
			}
	
			renderTexture.saveTexture(key)
			// Generate texture from graphics
			//graphics.generateTexture(key, TILE_SIZE, TILE_SIZE)
			
			graphics.destroy()
		}
	
		// Create different tile textures
		createTileTexture("tile-default", 0x808080)    // Light grey for default
		createTileTexture("tile-empty", 0xD3D3D3)      // Dark grey for empty
		createTileTexture("tile-ore", 0xFFD700)        // Gold color for ore
		createTileTexture("tile-water", 0x0000FF)     // Blue color for water
		createTileTexture("tile-stone", 0x555555)     
		createTileTexture("tile-crystal", 0x00FFFF)     // Blue color for water
		createTileTexture("machine-crusher", 0xCCAAAA, 0xA9A9A9, "C")
		createTileTexture("machine-power-station", 0xCCAAAA, 0xA9A9A9, "P")
	}

	createAnimations(): void {
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