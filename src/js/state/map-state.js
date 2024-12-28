
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
		let c = this.chunks[k]
		if (!c && create) {
			c = new MapChunk(cx, cy)
			this.chunks[k] = c
		}
		return c
	}

	getChunks(x, y, right, bottom) {
		const chunks = []
		const cxStart = Math.floor(x / CHUNK_SIZE) * CHUNK_SIZE
		const cyStart = Math.floor(y / CHUNK_SIZE) * CHUNK_SIZE
		for (let cx = cxStart; cx < right + CHUNK_SIZE; cx += CHUNK_SIZE) {
			for (let cy = cyStart; cy < bottom + CHUNK_SIZE; cy += CHUNK_SIZE) {
				chunks.push(this.getChunk(cx, cy))
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