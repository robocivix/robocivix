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

	createRectangle() {
		let baseX = 13
		let baseY = 7
		let w = 5
		let r = new Actor("rectangle", "rectangle", baseX, baseY, onActorUpdate)
		const path = [baseX + w, baseY, baseX + w, baseY + w, baseX, baseY + w, baseX, baseY]
		function moveRectangle() {
			r.move(path).then(() => setTimeout(moveRectangle, 0))
		}
		moveRectangle()
	}

	createBackAndForth() {
		let baseX = 13
		let baseY = 13
		let w = 7
		let r = new Actor("backAndForth", "backAndForth", baseX, baseY, onActorUpdate)
		const path = [baseX + w, baseY, baseX, baseY]
		function moveBackAndForth() {
			r.move(path).then(() => setTimeout(moveBackAndForth, 0))
		}
		moveBackAndForth()
	}

	createRandom(n) {
		for (let i = 0; i < n; i++) {
			const id = `rand${i}`
			let x = rand(10) + 5
			let y = rand(10) + 5
			let d = new Actor(id, id, x, y, onActorUpdate)
			this.randBehavior(d)
		}
	}

	createStatic() {
		let a = new Actor("r1", "r1", 5, 5, onActorUpdate)
		let b = new Actor("r2", "r2", 25, 7, onActorUpdate)
		
		onActorUpdate(a)
		onActorUpdate(b)
	}
	
	createMovingStopped() {
		let a = new Actor("move-and-stop", "move-and-stop", 5, 6, onActorUpdate)
		a.move([10, 6])
		setTimeout(() => a.cancel(), 2000)			
	}

	createMovingDestroyed() {
		let a = new Actor("move-and-destroy", "move-and-destroy", 5, 7, onActorUpdate)
		a.move([10, 7])
		setTimeout(() => {
			a.cancel()
			mapState.deleteActor(a)
		}, 2000)			
	}

	init() {


		setTimeout(() => {
			//this.createStatic()
			this.createMovingStopped()
			this.createMovingDestroyed()
			//this.createRandom(1000)
			this.createRectangle()
			this.createBackAndForth()


			
			// a.move([10, 5, 12, 7])
			// 	.then(() => console.log("move complete"))
			// 	.catch(err => console.log("Move interrupted:", err))

			// setTimeout(() => a.cancel("demo"), 11000)

			// a.work("mining", 3000)
			// 	.then(a => console.log("work done", a))
			// 	.catch(a => console.log("work interrupted", a))

			// setTimeout(() => a.cancel("demo"), 5000)

			// this.randBehavior(a)
			// this.randBehavior(b)

			// for (let x = 0; x < 20; x++) {
			// 	for (let y = 0; y < 10; y++) {
			// 		id = `r-${x}-${y}`
			// 		let b = new Actor(id, id, x, y, onActorUpdate)
			// 		this.randBehavior(b)
			// 	}
			// }
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
			let n = rand(4) + 1
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
					} else {
						tx = x
					}
					if (randBool()) {
						if (randBool())
							ty = y + rand(5) + 1
						else
							ty = y - rand(5) - 1
					} else {
						ty = y
					}
					if (tx > 0 && ty > 0 && tx < 20 && ty < 20 && (tx !== x || ty !== y))
						break
				}
				path.push(tx)
				path.push(ty)
				x = tx
				y = ty
			}
			promise = actor.move(path, 1)
		}

		promise.then(() => setTimeout(() => this.randBehavior(actor), 0))
	}
}

export const demoDriver = new DemoDriver() 