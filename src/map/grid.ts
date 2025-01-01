type Listener<T> = (value: T | null, x: number, y: number) => void

export interface IGrid<T> {
	get(x: number, y: number): T | null;

	set(x: number, y: number, v: T): void
	
	delete(x: number, y: number): void

	/**
	 * Notifies all update listeners that a value at the specified coordinates has changed
	 * @param x The x coordinate of the updated value
	 * @param y The y coordinate of the updated value 
	 * @param v Optional new value. If not provided, the current value at (x,y) will be used
	 */
	triggerUpdate(x: number, y: number, v?: T): void

	onAdd(listener: Listener<T>): () => void

	onUpdate(listener: Listener<T>): () => void

	onDelete(listener: Listener<T>): () => void

	forEach(callback: (value: T | null, x: number, y: number) => void): void
	
	readonly width: number
	readonly height: number
}

export class Grid<T> implements IGrid<T> {
	readonly width: number
	readonly height: number
	private data: (T | null)[]
	private _addListeners: Set<Listener<T>>
	private _updateListeners: Set<Listener<T>>
	private _deleteListeners: Set<Listener<T>>

	constructor(width: number, height: number) {
		this.width = width
		this.height = height
		this.data = new Array(height * width).fill(null)

		this._addListeners = new Set()
		this._updateListeners = new Set()
		this._deleteListeners = new Set()
	}

	forEach(callback: (value: T | null, x: number, y: number) => void): void {
		for (let y = 0; y < this.height; y++) {
			for (let x = 0; x < this.width; x++) {
				callback(this.get(x, y), x, y)
			}
		}
	}

	get(x: number, y: number): T | null {
		return this.data[y * this.width + x]
	}

	set(x: number, y: number, v: T): void {
		const pos = y * this.width + x
		const existing = this.data[pos]
		if (existing === v)
			return
		this.data[pos] = v
		if (existing === null) {
			this._addListeners.forEach(listener => listener(v, x, y))
		} else {
			this._updateListeners.forEach(listener => listener(v, x, y))
		}
	}

	delete(x: number, y: number): void {
		const pos = y * this.width + x
		const v = this.data[pos]
		if (v === null)
			return
		this.data[pos] = null
		this._deleteListeners.forEach(listener => listener(v, x, y))
	}
	
	triggerUpdate(x: number, y: number, v: any = null): void {
		if (v === null)
			v = this.get(x, y)
		this._updateListeners.forEach(listener => listener(v, x, y))
	}
	
	onAdd(listener: Listener<T>): () => void {
		this._addListeners.add(listener)
		return () => this._addListeners.delete(listener)
	}

	onUpdate(listener: Listener<T>): () => void {
		this._updateListeners.add(listener)
		return () => this._updateListeners.delete(listener)
	}

	onDelete(listener: Listener<T>): () => void {
		this._deleteListeners.add(listener)
		return () => this._deleteListeners.delete(listener)
	}
}
