// app.js
import { Scene, Game, Scale, AUTO } from '../node_modules/phaser/dist/phaser.esm.js'
import { PrepareScene } from './scene/prepare.js'
import { MapViewScene } from './scene/map-view.js'
import { mapState } from './state/map-state.js'
import { demoDriver } from './state/demo-driver.js'	 

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


mapState._devInit().then(() => {
	const game = new Phaser.Game(getConfig())
	console.log(game)
	demoDriver.init()
})
