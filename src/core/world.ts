import { LayeredMap } from "../map/layered-map"
import { starter } from "../map/dev-maps"
import { devInit } from "./dev-driver"
import { Actor } from "../entity/actor"

export class World {
	readonly map: LayeredMap

	constructor() {
		this.map = starter()
	}

	init() {
		this.map.initPathfinder()
		devInit()

	}

	actor(id: string): Actor | undefined {
		return this.map.actors.getActor(id)
	}
}

export const world = new World()

// Expose world instance to global scope for debugging
declare global {
	interface Window {
		world: World
	}
}

window.world = world
