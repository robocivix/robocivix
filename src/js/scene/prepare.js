// app.js
import { Scene } from '../../node_modules/phaser/dist/phaser.esm.js'

export class PrepareScene extends Scene
{
	constructor() {
		super()
	}

	preload () {
		//this.load.json("map-data", 'map-data.json')

	}

	create () {
		this.scene.start('MapViewScene')
	}
}
