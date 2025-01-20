import { world } from "../core/world"

interface MoveStep {
    duration: number
    x: number
    y: number
	distance: number
}

interface MoveState {
    path: number[]
    speed: number
    lastUpdate: number
    step?: MoveStep
}

interface Future {
    promise: Promise<Actor>
    resolve: (actor: Actor) => void
    cancel: () => void
    timer?: NodeJS.Timeout
}

interface Action {
    type: string
    start: number
    end: number
}
interface Value {
	value: number
	max: number
}

export class WalkConfig {
	adjacent: boolean = true
	cancel: boolean = true
	speed: number = 1
}
const DEFAULT_WALK_CONFIG = new WalkConfig()
export interface IActor {
	id?: string
	readonly type: string
	name: string
	x: number
	y: number
	action?: Action
	_move?: MoveState
	readonly battery: Value

	work(name: string, duration: number): Promise<Actor>
	walk(targetX: number, targetY: number, config?: WalkConfig): Promise<Actor>
	move(path: number[], speed?: number): Promise<Actor>
	cancel(): void
}


export class Actor implements IActor {
	id?: string

	readonly type: string
	name: string
	x: number
	y: number
	action?: Action
	#onUpdate: (actor: Actor) => void
	#onMove: (actor: Actor, toX: number, toY: number) => void
	_move?: MoveState
	_future?: Future
	
	battery: Value = { value: 100000, max: 100000 }
	maintenance: Value = { value: 100000, max: 100000 }


	constructor(type: string, name: string, x: number, y: number, onUpdate: (actor: Actor) => void, onMove: (actor: Actor, toX: number, toY: number) => void) {
		this.type = type
		this.name = name
		this.x = x
		this.y = y
		this.action = undefined
		this.#onUpdate = onUpdate
		this.#onMove = onMove
		this._move = undefined
		this._future = undefined
	}

	work(name: string, duration: number): Promise<Actor> {
		const now = new Date().getTime()
		const action: Action = {
			type: name,
			start: now,
			end: now + duration,
		}
		this.action = action
		const actor = this
		return this.#startAction((resolve, future) => {
			future.timer = setTimeout(() => {
				actor._future = undefined
				resolve(actor)
				actor.action = undefined
				actor.#onUpdate(actor)
			}, duration)
		})
	}

	walk(targetX: number, targetY: number, config?: WalkConfig): Promise<Actor> {
		let path: number[] | null = null
		const walkConfig = config ?? DEFAULT_WALK_CONFIG
		if (walkConfig.adjacent) {
			path = world.grid.pathfinder.findPathToAdjacent(this.x, this.y, targetX, targetY)
		} else {
			path = world.grid.pathfinder.findPath(this.x, this.y, targetX, targetY)
		}
		if (!path) {
			const msg = `No path found from (${this.x},${this.y}) to (${targetX},${targetY})`
			console.warn(msg, this)
			//return Promise.reject()
			return Promise.resolve(this)
		}

		if (walkConfig.cancel) {
			this.cancel()
		}
		return this.move(path, walkConfig.speed)
	}

	move(path: number[], speed = 1): Promise<Actor> {
		this._move = {
			path: [...path], // Create a clone of the path array
			speed,
			lastUpdate: new Date().getTime()
		}

		const step = this.#calculateMoveStep()
		if (!step)
			return Promise.resolve(this)

		const actor = this
		return this.#startAction((resolve, future) => {
			function onStepComplete() {
				if (!actor._move)
					return
				const step = actor._move.step!
				const nextX = step.x
				const nextY = step.y
				actor.#onMove(actor, nextX, nextY)
				if (actor.x !== nextX || actor.y !== nextY) {
					throw Error(`Actor moved to (${nextX},${nextY}) but was at (${actor.x},${actor.y}). Something broken, the actor xy is supposed to be updated by the #onMove callback.`)
				}

				// apply cost
				actor.battery.value -= (step.distance * 100) | 0
				actor.maintenance.value -= (step.distance * 10) | 0
				
				const newStep = actor.#calculateMoveStep()
				if (newStep) {
					actor._move.lastUpdate = new Date().getTime()
					future.timer = setTimeout(onStepComplete, newStep.duration)
				} else {
					//move complete
					actor._future = undefined
					resolve(actor)
					actor._move = undefined
				}

				actor.#onUpdate(actor)
			}
			future.timer = setTimeout(onStepComplete, step.duration)
		})
	}

	cancel(): void {
		if (this._future) {
			this._future.cancel()
		}
	}

	
	#startAction(impl: (resolve: (actor: Actor) => void, future: Future) => void): Promise<Actor> {
		if (this._future) {
			const msg = "Error creating action: Already doing something"
			console.error(msg, this)
			throw msg
		}

		const future: Future = {
			promise: undefined!,
			resolve: undefined!,
			cancel: undefined!
		}
		
		future.promise = new Promise((resolve, _reject) => {
			future.resolve = resolve
			impl(resolve, future)
		})
		
		future.cancel = () => {
			if (future.timer) clearTimeout(future.timer)
			this._future = undefined
			future.resolve(this)
			this._move = undefined
			this.#onUpdate(this)
		}
		
		this._future = future
		this.#onUpdate(this)
		return future.promise
	}
	
	#calculateMoveStep(): MoveStep | undefined {
		const move = this._move
		if (!move || move.path.length === 0)
			return
			
		const targetX = move.path[0]
		const targetY = move.path[1]
		const currentX = this.x
		const currentY = this.y

		if (targetX === currentX && targetY === currentY) {
			move.path = move.path.slice(2)
			return this.#calculateMoveStep()
		}

		const stepX = targetX > currentX ? currentX + 1 : (targetX < currentX ? currentX - 1 : currentX) 
		const stepY = targetY > currentY ? currentY + 1 : (targetY < currentY ? currentY - 1 : currentY) 
		const d = stepX !== currentX && stepY !== currentY ? Math.SQRT2 : 1

		return move.step = {
			duration: (d * 1000 / move.speed) | 0,
			x: stepX,
			y: stepY,
			distance: d
		}
	}
}