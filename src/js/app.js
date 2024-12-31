// app.js
import { Scene, Game, Scale, AUTO } from '../node_modules/phaser/dist/phaser.esm.js'
import { PrepareScene } from './scene/prepare.js'
import { MapViewScene } from './scene/map-view.js'
import { demoDriver } from './state/demo-driver.js'	 
import { World } from './core/world.js'

const Phaser = {
	Scene,
	Game,
	Scale,
	AUTO
}

// Export the config and create the game instance
function getConfig() {
	return {
		type: Phaser.AUTO,
		width: window.innerWidth,
		height: window.innerHeight,
		scene: [PrepareScene, MapViewScene],
		scale: {
			mode: Phaser.Scale.RESIZE,
			autoCenter: Phaser.Scale.CENTER_BOTH
		}
	}
}



const game = new Phaser.Game(getConfig())
console.log(game)
demoDriver.init()
