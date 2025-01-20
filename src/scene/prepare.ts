import { Scene } from "phaser"
import { world } from "../core/world"

export class PrepareScene extends Scene {
	constructor() {
		super("PrepareScene")
	}

	preload(): void {
		world.init()
	}

	create(): void {
		this.scene.start("MapViewScene") 
	}
}
