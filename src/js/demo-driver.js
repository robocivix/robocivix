import { mapState } from './map-state.js'

class DemoDriver {
	constructor() {
		setTimeout(() => {
			// for (let x = 0; x < 2; x++) {
			// 	for (let y = 0; y < 3; y++) {
			// 		let id = `r-${x}-${y}`
			// 		let r = {
			// 			id,
			// 			name: id,
			// 			x, 
			// 			y
			// 		}

			// 		this.createAction(r, "mining", 5000)
			// 	}
			// }

			let id = `r1`
			let r = {
				id,
				name: id,
				x: 5, 
				y: 5
			}
			this.move(r, 1, [10, 5, 15, 10])

			id = `r2`
			r = {
				id,
				name: id,
				x: 7, 
				y: 7
			}
			this.move(r, 2, [3, 7, 3, 3])
		}, 1000)
	}

	createAction(robot, name,  duration) {
		//console.log("Creating action for robot", robot, name, duration)

		let action = {
			type: name,
			start: new Date().getTime(),
			end: new Date().getTime() + duration,
		}
		robot.action = action
		mapState.updateActor(robot)
		setTimeout(() => {
			//console.log("Action ended for robot", robot)
			robot.action = null
			mapState.updateActor(robot)
		}, duration)
	}

	move(robot, speed, path) {
		console.log("Moving robot", robot, path)
		robot.move = {
			path,
			speed,
			lastUpdate: new Date().getTime()
		}
		mapState.updateActor(robot)
	}
}

export const demoDriver = new DemoDriver() 