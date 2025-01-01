// app.ts
import { Game, Scale, AUTO } from "phaser"
import { PrepareScene } from "./scene/prepare"
import { MapViewScene } from "./scene/map-view/map-view"


const game: Game = new Game({
	type: AUTO,
	width: window.innerWidth,
	height: window.innerHeight,
	scene: [PrepareScene, MapViewScene],
	scale: {
		mode: Scale.RESIZE,
		autoCenter: Scale.CENTER_BOTH
	}
})
