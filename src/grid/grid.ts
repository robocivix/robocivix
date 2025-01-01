import EventEmitter from "eventemitter3"
type Listener<T> = (value: T | null, x: number, y: number) => void

export const GridEvents = {
	add: Symbol("add"),
	update: Symbol("update"),
	remove: Symbol("remove")
}


export interface IGrid<T> {
	get(x: number, y: number): T | undefined;

	set(x: number, y: number, v: T): void
	
	remove(x: number, y: number): void

	events(): EventEmitter<symbol>

	forEach(callback: (value: T | undefined, x: number, y: number) => void): void
	
	readonly width: number
	readonly height: number
}

export class Grid<T> implements IGrid<T> {
	readonly width: number
	readonly height: number
	#data: (T | undefined)[]
	#events: EventEmitter<symbol>

	constructor(width: number, height: number) {
		this.width = width
		this.height = height
		this.#data = new Array(height * width).fill(undefined)
		this.#events = new EventEmitter()
	}

	forEach(callback: (value: T | undefined, x: number, y: number) => void): void {
		for (let y = 0; y < this.height; y++) {
			for (let x = 0; x < this.width; x++) {
				callback(this.get(x, y), x, y)
			}
		}
	}

	get(x: number, y: number): T | undefined {
		return this.#data[y * this.width + x]
	}

	set(x: number, y: number, v: T): void {
		const pos = y * this.width + x
		const existing = this.#data[pos]
		if (existing === v) {
			this.#events.emit(GridEvents.update, v, x, y)
			return
		}
		this.#data[pos] = v
		if (existing !== null) {
			this.#events.emit(GridEvents.remove, existing, x, y)
		}
		this.#events.emit(GridEvents.add, v, x, y)
	}

	remove(x: number, y: number): void {
		const pos = y * this.width + x
		const v = this.#data[pos]
		if (v === null)
			return
		this.#data[pos] = undefined
		this.#events.emit(GridEvents.remove, v, x, y)
	}

	events(): EventEmitter<symbol> {
		return this.#events
	}
}
