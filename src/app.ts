import Phaser from "phaser"
import { PrepareScene } from "./scene/prepare"
import { MapViewScene } from "./scene/map-view/map-view"


const _game: Phaser.Game = new Phaser.Game({
	type: Phaser.AUTO,
	width: window.innerWidth,
	height: window.innerHeight,
	scene: [PrepareScene, MapViewScene],
	scale: {
		mode: Phaser.Scale.RESIZE,
		autoCenter: Phaser.Scale.CENTER_BOTH
	}
})