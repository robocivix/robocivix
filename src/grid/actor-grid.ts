import EventEmitter from "eventemitter3"
import { IGrid, Grid } from "./grid"
import { Actor } from "../entity/actor"


export interface IActorGrid {
	add(actor: Actor): void
	remove(actor: Actor): void
	move(actor: Actor, x: number, y: number): void
	get(x: number, y: number): Actor[]
	find(id: string): Actor | undefined
	forEach(callback: (actor: Actor) => void): void
	events(): EventEmitter<symbol>
}

export const ActorGridEvents = {
	add: Symbol("add"),
	update: Symbol("update"),
	remove: Symbol("remove")
}

export class ActorGrid implements IActorGrid {
	#grid: IGrid<Actor[]>
	#events: EventEmitter<symbol>
	#counter: number = 0
	#idMap: Map<string, Actor>

	constructor(width: number, height: number) {
		this.#grid = new Grid(width, height)
		this.#idMap = new Map()
		this.#events = new EventEmitter()
	}

	add(actor: Actor): void {
		const id = `a${this.#counter++}`
		if (actor.id) {
			throw new Error(`Actor already has an id: ${actor.id}`)
		}
		actor.id = id

		this.#addToGrid(actor)
		this.#idMap.set(id, actor)
		this.#events.emit(ActorGridEvents.add, actor)
	}

	#addToGrid(actor: Actor): void {
		const actors = this.#grid.get(actor.x, actor.y)
		if (actors === undefined) {
			this.#grid.set(actor.x, actor.y, [actor])
		} else {
			actors.push(actor)
		}
	}

	remove(actor: Actor): void {
		this.#removeFromGrid(actor)
		this.#idMap.delete(actor.id!)
		this.#events.emit(ActorGridEvents.remove, actor)
	} 

	#removeFromGrid(actor: Actor): void {
		const actors = this.#grid.get(actor.x, actor.y)
		if (actors === undefined) {
			throw new Error("Actor not found")
		}
		const index = actors.indexOf(actor)
		if (index === -1) {
			throw new Error("Actor not found")
		}
		actors.splice(index, 1)
	}
	
	move(actor: Actor, x: number, y: number, _trigger: boolean = true): void {
		this.#removeFromGrid(actor)
		actor.x = x
		actor.y = y
		this.#addToGrid(actor)
		if (_trigger) {
			this.#events.emit(ActorGridEvents.update, actor)
		}
	}

	get(x: number, y: number): Actor[] {
		return this.#grid.get(x, y) ?? []
	}

	find(id: string): Actor | undefined {
		return this.#idMap.get(id)
	}

	forEach(callback: (actor: Actor) => void): void {
		this.#grid.forEach((actors, x, y) => {
			if (actors === undefined || actors.length === 0)
				return
			for (const actor of actors) {
				callback(actor)
			}
		})
	}

	events(): EventEmitter<symbol> {
		return this.#events
	}
}
