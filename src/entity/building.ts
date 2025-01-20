class AccessPoint {
	readonly x!: number
	readonly y!: number
	readonly type?: string
}

class BuildingPrototype {
	readonly width!: number
	readonly height!: number
	readonly accessPoints?: AccessPoint[]
}

const Prototypes: Record<string, BuildingPrototype> = {
	"crusher": { 
		width: 3, 
		height: 1,
		accessPoints: [
			{ x: 0, y: 0, type: "input" },
			{ x: 2, y: 0, type: "output" },
		]
	},
	"power-station": { 
		width: 1, 
		height: 1
	}
}

export class Building {
	id?: string
	readonly type: string
	readonly x: number
	readonly y: number
	readonly prototype: BuildingPrototype

	constructor(type: string, x: number, y: number) {
		this.type = type
		this.x = x
		this.y = y
		this.prototype = Prototypes[type]
	}
}
