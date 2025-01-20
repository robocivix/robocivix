import { LayeredGrid } from "../grid/layered-grid"
import { devInit, starterMap1 } from "./dev-driver"
import { Actor } from "../entity/actor"
import { Building } from "../entity/building"

export class World {

	readonly grid: LayeredGrid

	constructor() {
		this.grid = starterMap1()
	}

	init() {
		this.grid.initPathfinder()
		devInit()
	}

	/**
	 * Finds an actor by its id.
	 * @param id - The id of the actor to find.
	 * @returns The actor if found, otherwise undefined.
	 */
	actor(id: string): Actor | undefined {
		return this.grid.actors.find(id)
	}

	/**
	 * Finds a machine by its id.
	 * @param id - The id of the machine to find.
	 * @returns The machine if found, otherwise undefined.
	 */
	machine(id: string): Building | undefined {
		return this.grid.buildings.find(id)
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
