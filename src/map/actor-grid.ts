import { IGrid, Grid } from "./grid"
import { Actor } from "../entity/actor"

type Listener = (value: Actor) => void

export class ActorGrid {

	private map: IGrid<Actor[]>
	private _actors: Map<string, Actor>
	private _addListeners: Set<Listener>
	private _updateListeners: Set<Listener>
	private _deleteListeners: Set<Listener>

	constructor(width: number, height: number) {
		this.map = new Grid(width, height)
		this._actors = new Map()
		this._addListeners = new Set()
		this._updateListeners = new Set()
		this._deleteListeners = new Set()
	}

	add(actor: Actor, _triggerEvent: boolean = true): void {
		const actors = this.map.get(actor.x, actor.y)
		if (actors === null) {
			this.map.set(actor.x, actor.y, [actor])
		} else {
			if (actors.includes(actor)) {
				throw new Error(`Actor already exists at (${actor.x},${actor.y}), id: ${actor.id}`)
			}
			actors.push(actor)
		}
		if (_triggerEvent) {
			this._addListeners.forEach(listener => listener(actor))
		} else {
			this._actors.set(actor.id, actor)
		}
	}

	remove(actor: Actor, _triggerEvent: boolean = true): void {
		const actors = this.map.get(actor.x, actor.y)
		if (actors === null) {
			throw new Error("Actor not found")
		}
		const index = actors.indexOf(actor)
		if (index === -1) {
			throw new Error("Actor not found")
		}
		actors.splice(index, 1)
		if (_triggerEvent) {
			this._deleteListeners.forEach(listener => listener(actor))
		} else {
			this._actors.delete(actor.id)
		}
	} 

	move(actor: Actor, x: number, y: number, _triggerEvent: boolean = true): void {
		this.remove(actor, false)
		actor.x = x
		actor.y = y
		this.add(actor, false)
		if (_triggerEvent) {
			this._updateListeners.forEach(listener => listener(actor))
		}
	}

	get(x: number, y: number): Actor[] {
		return this.map.get(x, y) ?? []
	}

	getActor(id: string): Actor | undefined {
		return this._actors.get(id)
	}

	forEach(callback: (value: Actor, x: number, y: number) => void): void {
		this.map.forEach((actors, x, y) => {
			if (actors === null || actors.length === 0)
				return
			for (const actor of actors) {
				callback(actor, x, y)
			}
		})
	}

	triggerUpdate(actor: Actor) {
		this._updateListeners.forEach(listener => listener(actor))
	}
	
	onAdd(listener: Listener) {
		this._addListeners.add(listener)
		return () => this._addListeners.delete(listener)
	}

	onUpdate(listener: Listener) {
		this._updateListeners.add(listener)
		return () => this._updateListeners.delete(listener)
	}

	onDelete(listener: Listener) {
		this._deleteListeners.add(listener)
		return () => this._deleteListeners.delete(listener)
	}
}

