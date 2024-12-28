import { mapState } from './map-state.js'
import {Actor} from './actor.js'

function rand(n) {
	return Math.random() * n | 0
}

function randBool() {
	return Math.random() > 0.5
}

function onActorUpdate(actor) {
	mapState.updateActor(actor)
}

class DemoDriver {

	constructor() {
		let id = 'r1'
		let a = new Actor(id, id, 5, 5, onActorUpdate)

		setTimeout(() => {
			

			// a.move([10, 5, 12, 7])
			// 	.then(() => console.log("move complete"))
			// 	.catch(err => console.log("Move interrupted:", err))

			// setTimeout(() => a.cancel("demo"), 11000)

			// a.work("mining", 3000)
			// 	.then(a => console.log("work done", a))
			// 	.catch(a => console.log("work interrupted", a))

			// setTimeout(() => a.cancel("demo"), 5000)

			this.randBehavior(a)
		}, 1000)
	}

	randBehavior(actor) {
		let promise
		if (randBool()) {
			let name = 'mining'
			promise = actor.work(name, rand(1000) + 500)
		} else {
			let x = actor.x
			let y = actor.y
			let n = rand(3) + 1
			let path = []
			for (let i = 0; i < n; i++) {
				let tx
				let ty
				while (true) {
					if (randBool()) {
						if (randBool())
							tx = x + rand(5) + 1
						else
							tx = x - rand(5) - 1
						ty = y
					} else {
						tx = x
						if (randBool())
							ty = y + rand(5) + 1
						else
							ty = y - rand(5) - 1
					}
					if (tx > 0 && ty > 0 && tx < 20 && ty < 20)
						break
				}
				path.push(tx)
				path.push(ty)
				x = tx
				y = ty
			}
			console.log('path', path)
			promise = actor.move(path, 1)
		}

		promise.then(() => this.randBehavior(actor))
	}
}

export const demoDriver = new DemoDriver() 