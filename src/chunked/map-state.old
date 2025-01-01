import { generateMap } from "./map-gen.js"
import { starter } from "./dev.js"

export const CHUNK_SIZE = 16

class MapChunk {
	constructor(x, y) {
		this.x = x
		this.y = y
		this.actors = {}
		this.groundLayer = null
		this.groundImages = null
	}

	key() {
		return `${this.x},${this.y}`
	}
}

class MapState {

	constructor() {
		this.chunks = {}
		this.subscribedChunks = {}
		this.addListeners = new Set()
		this.updateListeners = new Set()
		this.deleteListeners = new Set()
		this._devMapGround = null
		this.bounds = {
			x: 0,
			y: 0,
			w: 0,
			h: 0
		}

		const w = 48
		const h = 32	
		this.bounds.w = w * CHUNK_SIZE
		this.bounds.h = h * CHUNK_SIZE

		//this._devMapGround = generateMap(CHUNK_SIZE, w, h)

		const map = starter()
		this._devMapGround = map.ground
		const chunk = this.getChunk(0, 0)
		chunk.actors = map.actors
	}

	// async _devInit() {
	// 	if (this._devMapGround == null) {
	// 		await fetch('data/map-data.json')
	// 			.then(response => response.json())
	// 			.then(data => {
	// 				console.log(data)
	// 				this._devMapGround = data
	// 				this.bounds.w = 48 * CHUNK_SIZE
	// 				this.bounds.h = 32 * CHUNK_SIZE
	// 			}).catch(console.error)
	// 	}
	// }


	getChunkGround(cx, cy) {
		const k = `${cx},${cy}`
		return this._devMapGround[k]
	}


	subscribeToAdd(listener) {
		this.addListeners.add(listener)
		return () => this.addListeners.delete(listener)
	}

	subscribeToUpdate(listener) {
		this.updateListeners.add(listener)
		return () => this.updateListeners.delete(listener)
	}

	subscribeToDelete(listener) {
		this.deleteListeners.add(listener)
		return () => this.deleteListeners.delete(listener)
	}

	getChunk(x, y, create = true) {
		const cx = Math.floor(x / CHUNK_SIZE) * CHUNK_SIZE
		const cy = Math.floor(y / CHUNK_SIZE) * CHUNK_SIZE
		const k = `${cx},${cy}`
		let chunk = this.chunks[k]
		if (!chunk && create) {
			const groundLayer = this.getChunkGround(cx, cy)
			if (groundLayer) {
				chunk = new MapChunk(cx, cy)
				chunk.groundLayer = groundLayer
				this.chunks[k] = chunk
			} else {
				chunk = null
			}
		}
		return chunk
	}

	getChunks(x, y, right, bottom) {
		const chunks = []
		const cxStart = Math.floor(x / CHUNK_SIZE) * CHUNK_SIZE
		const cyStart = Math.floor(y / CHUNK_SIZE) * CHUNK_SIZE
		for (let cx = cxStart; cx < right + CHUNK_SIZE; cx += CHUNK_SIZE) {
			for (let cy = cyStart; cy < bottom + CHUNK_SIZE; cy += CHUNK_SIZE) {
				const chunk = this.getChunk(cx, cy)	
				if (chunk) {
					chunks.push(chunk)
				}
			}
		}
		return chunks
	}

	updateSubscription(view) {
		const added = []
		const removed = []
		const subscribed = this.getChunks(view.left, view.top, view.right, view.bottom)

		const newSubscribed = {}
		for (const chunk of subscribed) {
			newSubscribed[chunk.key()] = chunk
		}

		for (const k in this.subscribedChunks) {
			if (!newSubscribed[k]) {
				removed.push(this.subscribedChunks[k])
			}
		}

		for (const k in newSubscribed) {
			if (!this.subscribedChunks[k]) {
				added.push(newSubscribed[k])
			}
		}

		this.subscribedChunks = newSubscribed

		return {
			added,
			removed,
			subscribed: newSubscribed
		}
	}
	
	addActor(actor) {
		const chunk = this.getChunk(actor.x, actor.y)
		chunk.actors[actor.id] = actor

		if (chunk.key() in this.subscribedChunks) {
			for (const listener of this.addListeners) {
				listener(actor)
			}
		}
	}

	updateActor(actor) {
		let chunk = this.getChunk(actor.x, actor.y)
		chunk.actors[actor.id] = actor
		if (chunk.key() in this.subscribedChunks) {
			for (const listener of this.updateListeners) {
				listener(actor)
			}
		}
	}

	deleteActor(actor) {
		let chunk = this.getChunk(actor.x, actor.y, false)
		if (chunk && chunk.key() in this.subscribedChunks) {
			delete chunk.actors[actor.id]
			for (const listener of this.deleteListeners) {
				listener(actor)
			}
		}
	}
}

export const mapState = new MapState() 