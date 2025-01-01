import PF from "pathfinding"


export class Pathfinder {
	private grid: PF.Grid
	private finder: PF.AStarFinder

	constructor(width: number, height: number) {
		this.finder = new PF.AStarFinder({
			diagonalMovement: PF.DiagonalMovement.OnlyWhenNoObstacles
		})
		this.grid = new PF.Grid(width, height)
	}

	init(isWalkable: (x: number, y: number) => boolean) {
		for (let y = 0; y < this.grid.height; y++) {
			for (let x = 0; x < this.grid.width; x++) {
				this.grid.setWalkableAt(x, y, isWalkable(x, y))
			}
		}
	}

	findPath(fromX: number, fromY: number, toX: number, toY: number): number[] | null{
		// Quick checks before pathfinding
		if (fromX === toX && fromY === toY) return [fromX, fromY]
		if (!this.grid.isWalkableAt(toX, toY)) return [] // Target is blocked

		const path = this.finder.findPath(fromX, fromY, toX, toY, this.grid.clone())
		if (path.length === 0) return null
		return path.flatMap(p => [p[0], p[1]])
	}

	findPathToAdjacent(fromX: number, fromY: number, toX: number, toY: number): number[] | null {
		// temporarily set the target to be walkable
		const originalWalkable = this.grid.isWalkableAt(toX, toY)
		if (!originalWalkable) {
			this.grid.setWalkableAt(toX, toY, true)
		}
		const path = this.findPath(fromX, fromY, toX, toY)
		if (!originalWalkable) {
			this.grid.setWalkableAt(toX, toY, false)
		}
		if (!path) {
			return null
		}
		return path.slice(0, -2)
	}	
}
