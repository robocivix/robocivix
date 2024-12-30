

function calculateMoveStep(actor) {
	const move = actor._move
	if (move.path.length === 0)
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

function startAction(actor, impl) {
	if (actor._future) {
		const msg = "Error creating action: Already doing something"
		console.error(msg, actor)
		throw msg
	}

	const future = {}
	future.promise = new Promise((resolve, _reject) => {
		future.resolve = resolve
		impl(resolve, future)
	})
	future.cancel = () => {
		clearTimeout(future.timer)
		actor._future = null
		future.resolve(actor)
		actor._move = null
		actor._onUpdate(actor)
	}
	actor._future = future
	actor._onUpdate(actor)
	return future.promise
}

export class Actor {
	constructor(id, name, x, y, onUpdate) {
		this.id = id
		this.name = name
		this.x = x
		this.y = y
		this.action = null
		this._onUpdate = onUpdate
		this._move = null
		this._future = null
	}

	work(name, duration) {
		const now = new Date().getTime()
		const action = {
			type: name,
			start: now,
			end: now + duration,
		}
		this.action = action
		const actor = this
		return startAction(this, (resolve, future) => {
			future.timer = setTimeout(() => {
				actor._future = null
				resolve(actor)
				actor.action = null
				actor._onUpdate(actor)
			}, duration)
		})
	}

	move(path, speed = 1) {

		this._move = {
			path: [...path], // Create a clone of the path array
			speed,
			lastUpdate: new Date().getTime()
		}

		const step = calculateMoveStep(this)
		if (!step)
			throw `Invalid move config. No need to move. id=${this.id}, xy=(${this.x},${this.y}), path=${path}`

		const actor = this
		return startAction(this, (resolve, future) => {
			function onStepComplete() {
				if (!actor._move)
					return
				actor.x = actor._move.step.x
				actor.y = actor._move.step.y
				const newStep = calculateMoveStep(actor)
				if (newStep) {
					actor._move.lastUpdate = new Date().getTime()
					future.timer = setTimeout(onStepComplete, newStep.duration)
				} else {
					//move complete
					actor._future = null
					resolve(actor)
					actor._move = null
				}
				actor._onUpdate(actor)
			}
			future.timer = setTimeout(onStepComplete, step.duration)
		})
	}


	cancel(reason) {
		if (this._future) {
			this._future.cancel(reason)
		}
	}
}