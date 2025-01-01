
import { Actor } from "../entity/actor"
import { world } from "./world"

function rand(n: number): number {
	return Math.random() * n | 0
}

function randBool(): boolean {
	return Math.random() > 0.5
}

function onActorUpdate(actor: Actor): void {
	world.map.actors.triggerUpdate(actor)
}

function onActorMove(actor: Actor, toX: number, toY: number): void {
	world.map.actors.move(actor, toX, toY, false)
}

class ActorDefault extends Actor {
	constructor(id: string, x: number, y: number) {
		super(id, id, x, y, onActorUpdate, onActorMove)
		world.map.actors.add(this)
	}
}

export function createRectangle(): void {
	const baseX = 13
	const baseY = 7
	const w = 5
	const r = new ActorDefault("rectangle", baseX, baseY)
	const path = [baseX + w, baseY, baseX + w, baseY + w, baseX, baseY + w, baseX, baseY]
	function moveRectangle(): void {
		r.move(path).then(() => setTimeout(moveRectangle, 0))
	}
	moveRectangle()
}

export function createBackAndForth(): void {
	const baseX = 13
	const baseY = 13
	const w = 7
	const r = new ActorDefault("backAndForth", baseX, baseY)
	const path = [baseX + w, baseY, baseX, baseY]
	function moveBackAndForth(): void {
		r.move(path).then(() => setTimeout(moveBackAndForth, 0))
	}
	moveBackAndForth()
}

export function createRandom(n: number): void {
	for (let i = 0; i < n; i++) {
		const id = `rand${i}`
		const x = rand(10) + 5
		const y = rand(10) + 5
		const d = new ActorDefault(id, x, y)
		randBehavior(d)
	}
}

export function createStatic(): void {
	const a = new ActorDefault("r1", 5, 5)
	const b = new ActorDefault("r2", 25, 7)
	
	onActorUpdate(a)
	onActorUpdate(b)
}
	
export function createMovingStopped(): void {
	const a = new ActorDefault("move-and-stop", 5, 6)
	a.move([10, 6])
	setTimeout(() => a.cancel(), 2000)			
}

export function createMovingDestroyed(): void {
	const a = new ActorDefault("move-and-destroy", 5, 7)
	a.move([10, 7])
	setTimeout(() => {
		a.cancel()
		world.map.actors.remove(a)
	}, 2000)			
}

export function createFindPath(): void {
	const a = new ActorDefault("r-find-path", 6, 6)	
	onActorUpdate(a)

	// const path = world.map.pathfinder.findPathToAdjacent(a.x, a.y, 12, 2)
	// if (path) {
	// 	a.move(path)
	// }
	a.walk(12, 2)
}

export function devInit(): void {
	setTimeout(() => {
		// createStatic()
		// createMovingStopped()
		// createMovingDestroyed()
		// //createRandom(10000)
		//createRectangle()
		// //createBackAndForth()

		createFindPath()
		
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

export function randBehavior(actor: Actor): void {
	let promise: Promise<Actor>
	if (randBool()) {
		const name = "mining"
		promise = actor.work(name, rand(1000) + 500)
	} else {
		let x = actor.x
		let y = actor.y
		const n = rand(4) + 1
		const path: number[] = []
		for (let i = 0; i < n; i++) {
			let tx: number
			let ty: number
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

	promise.then(() => setTimeout(() => randBehavior(actor), 0))
}
