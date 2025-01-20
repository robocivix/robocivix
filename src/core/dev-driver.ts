
import { Actor } from "../entity/actor"
import { world } from "./world"
import { fromText } from "../grid/generator"
import { LayeredGrid } from "../grid/layered-grid"
import { ActorGridEvents } from "../grid/actor-grid"

function rand(n: number): number {
	return Math.random() * n | 0
}

function randBool(): boolean {
	return Math.random() > 0.5
}

function onActorUpdate(actor: Actor): void {
	world.grid.actors.events().emit(ActorGridEvents.update, actor)
}

function onActorMove(actor: Actor, toX: number, toY: number): void {
	world.grid.actors.move(actor, toX, toY, false)
}

class ActorDefault extends Actor {
	constructor(name: string, x: number, y: number) {
		super("robot1", name, x, y, onActorUpdate, onActorMove)
		world.grid.actors.add(this)
	}
}

function createRectangle(): void {
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

function createBackAndForth(): void {
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

function createRandom(n: number): void {
	for (let i = 0; i < n; i++) {
		const id = `rand${i}`
		const x = rand(10) + 5
		const y = rand(10) + 5
		const d = new ActorDefault(id, x, y)
		randBehavior(d)
	}
}

function createStatic(): void {
	const a = new ActorDefault("r1", 5, 5)
	const b = new ActorDefault("r2", 25, 7)
	
	onActorUpdate(a)
	onActorUpdate(b)
}
	
function createMovingStopped(): void {
	const a = new ActorDefault("move-and-stop", 5, 6)
	a.move([10, 6])
	setTimeout(() => a.cancel(), 2000)			
}

function createMovingDestroyed(): void {
	const a = new ActorDefault("move-and-destroy", 5, 7)
	a.move([10, 7])
	setTimeout(() => {
		a.cancel()
		world.grid.actors.remove(a)
	}, 2000)			
}

function createFindPath(): void {
	const a = new ActorDefault("find-path", 6, 6)	
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
		//createRandom(100)
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
		let x = rand(30)
		let y = rand(20)
		promise = actor.walk(x, y)
	}

	promise.then(() => setTimeout(() => randBehavior(actor), 0))
}


export function starterMap1(): LayeredGrid {
	return fromText(`
		................................................
		................................................
		....s.......P...................................
		...Cs...........................................
		....sssssssssss.................................
		.......s..o.....................................
		.......s....o...................................
		................................................
		...wwwww........................................
		...wwwww........................................
		....c...........................................
		................................................
		................................................
		................................................
		................................................
		................................................
		................................................
		................................................
		................................................
		................................................
		................................................
		................................................
		................................................
		................................................
		................................................
	`)
}
