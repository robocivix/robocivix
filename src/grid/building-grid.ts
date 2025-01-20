import EventEmitter from "eventemitter3"
import { IGrid, Grid } from "./grid"
import { Building } from "../entity/building"


export interface IBuildingGrid {
	add(building: Building): void
	remove(building: Building): void
	get(x: number, y: number): Building | undefined
	find(id: string): Building | undefined
	forEach(callback: (building: Building) => void): void
	events(): EventEmitter<symbol>
}

export const BuildingGridEvents = {
	add: Symbol("add"),
	update: Symbol("update"),
	remove: Symbol("remove")
}

function forEachGrid(buildding: Building, callback: (x: number, y: number) => void): void {
	for (let x = 0; x < buildding.prototype.width; x++) {
		for (let y = 0; y < buildding.prototype.height; y++) {
			callback(buildding.x + x, buildding.y + y)
		}
	}
}

export class BuildingGrid implements IBuildingGrid {
	#grid: IGrid<Building>
	#events: EventEmitter<symbol>	
	#counter: number = 0
	#idMap: Map<string, Building>

	constructor(width: number, height: number) {
		this.#grid = new Grid(width, height)
		this.#idMap = new Map()
		this.#events = new EventEmitter()
	}

	add(building: Building): void {
		
		if (building.id) {
			throw new Error(`building already has an id: ${building.id}`)
		}

		const existing = this.#getAny(building.x, building.y, building.prototype.width, building.prototype.height)
		if (existing) {
			throw new Error(`building already exists at ${building.x}, ${building.y}`)
		}

		const id = `b${this.#counter++}`
		building.id = id

		for (let x = 0; x < building.prototype.width; x++) {
			for (let y = 0; y < building.prototype.height; y++) {
				this.#grid.set(building.x + x, building.y + y, building)
			}
		}

		this.#idMap.set(id, building)
		this.#events.emit(BuildingGridEvents.add, building)
	}

	#getAny(x: number, y: number, width: number, height: number): Building | undefined {
		for (let dx = 0; dx < width; dx++) {
			for (let dy = 0; dy < height; dy++) {
				const building = this.#grid.get(x + dx, y + dy)
				if (building) {
					return building
				}
			}
		}
	}

	remove(building: Building | string): void {
		const id = typeof building === "string" ? building : building.id!
		const instance = this.#idMap.get(id)
		if (!instance) {
			throw new Error(`building not found: ${id}`)
		}
		forEachGrid(instance, (x, y) => {
			this.#grid.remove(x, y)
		})
		this.#idMap.delete(id)
		this.#events.emit(BuildingGridEvents.remove, instance)
	}

	get(x: number, y: number): Building | undefined {
		return this.#grid.get(x, y)
	}

	find(id: string): Building | undefined {
		return this.#idMap.get(id)
	}

	forEach(callback: (building: Building) => void): void {
		this.#grid.forEach((building, x, y) => {
			if (!building || building.x !== x || building.y !== y)
				return
			callback(building)
		})
	}

	events(): EventEmitter<symbol> {
		return this.#events
	}
}
