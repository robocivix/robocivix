import { world } from "../core/world"

interface MoveStep {
    duration: number
    x: number
    y: number
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
    cancel: (reason?: any) => void
    timer?: NodeJS.Timeout
}

interface Action {
    type: string
    start: number
    end: number
}

function calculateMoveStep(actor: Actor): MoveStep | undefined {
	const move = actor._move
	if (!move || move.path.length === 0)
		return
        
	const targetX = move.path[0]
	const targetY = move.path[1]
	const currentX = actor.x
	const currentY = actor.y

	if (targetX === currentX && targetY === currentY) {
		move.path = move.path.slice(2)
		return calculateMoveStep(actor)
	}

	const stepX = targetX > currentX ? currentX + 1 : (targetX < currentX ? currentX - 1 : currentX) 
	const stepY = targetY > currentY ? currentY + 1 : (targetY < currentY ? currentY - 1 : currentY) 
	const d = stepX !== currentX && stepY !== currentY ? Math.SQRT2 : 1

	return move.step = {
		duration: (d * 1000 / move.speed) | 0,
		x: stepX,
		y: stepY
	}
}

function startAction(actor: Actor, impl: (resolve: (actor: Actor) => void, future: Future) => void): Promise<Actor> {
	if (actor._future) {
		const msg = "Error creating action: Already doing something"
		console.error(msg, actor)
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
		actor._future = undefined
		future.resolve(actor)
		actor._move = undefined
		actor._onUpdate(actor)
	}
    
	actor._future = future
	actor._onUpdate(actor)
	return future.promise
}

export class Actor {
	id: string
	name: string
	x: number
	y: number
	action?: Action
	_onUpdate: (actor: Actor) => void
	_onMove: (actor: Actor, toX: number, toY: number) => void
	_move?: MoveState
	_future?: Future

	constructor(id: string, name: string, x: number, y: number, onUpdate: (actor: Actor) => void, onMove: (actor: Actor, toX: number, toY: number) => void) {
		this.id = id
		this.name = name
		this.x = x
		this.y = y
		this.action = undefined
		this._onUpdate = onUpdate
		this._onMove = onMove
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
		return startAction(this, (resolve, future) => {
			future.timer = setTimeout(() => {
				actor._future = undefined
				resolve(actor)
				actor.action = undefined
				actor._onUpdate(actor)
			}, duration)
		})
	}

	walk(targetX: number, targetY: number, adjacent: boolean = true, cancel: boolean = true,speed = 1): Promise<Actor> {
		let path: number[] | null = null
		if (adjacent) {
			path = world.map.pathfinder.findPathToAdjacent(this.x, this.y, targetX, targetY)
		} else {
			path = world.map.pathfinder.findPathToAdjacent(this.x, this.y, targetX, targetY)
		}
		if (!path)
			return Promise.reject(`No path found from (${this.x},${this.y}) to (${targetX},${targetY})`)

		if (cancel) {
			this.cancel()
		}
		return this.move(path, speed)
	}

	move(path: number[], speed = 1): Promise<Actor> {
		this._move = {
			path: [...path], // Create a clone of the path array
			speed,
			lastUpdate: new Date().getTime()
		}

		const step = calculateMoveStep(this)
		if (!step)
			return Promise.resolve(this)

		const actor = this
		return startAction(this, (resolve, future) => {
			function onStepComplete() {
				if (!actor._move)
					return
				const nextX = actor._move.step!.x
				const nextY = actor._move.step!.y
				actor._onMove(actor, nextX, nextY)
				if (actor.x !== nextX || actor.y !== nextY) {
					throw Error(`Actor moved to (${nextX},${nextY}) but was at (${actor.x},${actor.y}). Something broken, the actor xy is supposed to be updated by the _onMove callback.`)
				}

				const newStep = calculateMoveStep(actor)
				if (newStep) {
					actor._move.lastUpdate = new Date().getTime()
					future.timer = setTimeout(onStepComplete, newStep.duration)
				} else {
					//move complete
					actor._future = undefined
					resolve(actor)
					actor._move = undefined
				}

				actor._onUpdate(actor)
			}
			future.timer = setTimeout(onStepComplete, step.duration)
		})
	}

	cancel(): void {
		if (this._future) {
			this._future.cancel()
		}
	}
}