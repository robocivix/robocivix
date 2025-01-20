import { IGrid, Grid } from "./grid"
import { Pathfinder } from "./pathfinder"
import { ActorGrid } from "./actor-grid"
import { BuildingGrid } from "./building-grid"

export class LayeredGrid {
	
	readonly width: number
	readonly height: number

	readonly ground: IGrid<string>		// Ground layer (terrain), unchangeable
	readonly blocks: IGrid<string>		// Wall/obstacle layer, unchangeable. Not walkable.
	readonly resources: IGrid<string>	// Resources layer. Unchangeable. Walkable.
	readonly buildings: BuildingGrid	// Building layer. Changeable. Never moves. Not walkable.
	readonly actors: ActorGrid			// Moving entities layer. Changeable. Multiple entities per cell. Walkable.
	readonly pathfinder: Pathfinder

	constructor(width: number, height: number) {
		this.width = width
		this.height = height
		this.ground = new Grid(width, height)
		this.blocks = new Grid(width, height)
		this.resources = new Grid(width, height)
		this.buildings = new BuildingGrid(width, height)
		this.actors = new ActorGrid(width, height)
		this.pathfinder = new Pathfinder(this.width, this.height)
	}

	initPathfinder() {
		this.pathfinder.init((x, y) => {
			const block = this.blocks.get(x, y)
			if (block)
				return false
			const building = this.buildings.get(x, y)
			if (building)
				return false
			return true
		})
	}
}

