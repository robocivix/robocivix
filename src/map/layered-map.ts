import { IGrid, Grid } from "./grid"
import { Machine } from "../entity/machine"
import { Pathfinder } from "./pathfinder"
import { ActorGrid } from "./actor-grid"

export class LayeredMap {
	
	readonly width: number
	readonly height: number

	readonly ground: IGrid<string>		// Ground layer (terrain), unchangeable
	readonly blocks: IGrid<string>		// Wall/obstacle layer, unchangeable. Not walkable.
	readonly resources: IGrid<string>	// Resources layer. Unchangeable. Walkable.
	readonly machines: IGrid<Machine>	// Machines layer. Changeable. Never moves. Not walkable.
	readonly actors: ActorGrid			// Moving entities layer. Changeable. Multiple entities per cell. Walkable.
	readonly pathfinder: Pathfinder
	bounds: any

	constructor(width: number, height: number) {
		this.width = width
		this.height = height
		this.ground = new Grid(width, height)
		this.blocks = new Grid(width, height)
		this.resources = new Grid(width, height)
		this.machines = new Grid(width, height)
		this.actors = new ActorGrid(width, height)
		this.pathfinder = new Pathfinder(this.width, this.height)
	}

	initPathfinder() {
		this.pathfinder.init((x, y) => {
			const block = this.blocks.get(x, y)
			return block === null
		})
	}
}
