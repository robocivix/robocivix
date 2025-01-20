import { LayeredGrid } from "./layered-grid"
import { Building } from "../entity/building"
function randChoice<T>(array: readonly T[]): T {
	return array[Math.floor(Math.random() * array.length)]
}

interface MapConfig {
	block?: number
	resource?: number
}

export const GeneratorConfigs = {
	EMPTY: {
		block: 0,
		resource: 0,
	},
	DEFAULT: {
		block: 0.1,
		resource: 0.1,
	}
}

export function randomMap(width: number, height: number, config: MapConfig = {}): LayeredGrid {
	const layeredMap = new LayeredGrid(width, height)
	
	const types = ["ore", "water", "crystal"]
	const actualConfig = {...GeneratorConfigs.DEFAULT, ...config}

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			if (Math.random() < actualConfig.block) {
				layeredMap.blocks.set(x, y, "stone")
				continue
			}

			if (Math.random() < actualConfig.resource) {
				layeredMap.resources.set(x, y, randChoice(types))
				continue
			}
		}
	}

	return layeredMap
}


const charToBuildingType: Record<string, string>  = {
	"C": "crusher",
	"P": "power-station",
}

const charToResourceType: Record<string, string> = {
	"o": "ore",
	"c": "crystal",
}

export function fromText(text: string): LayeredGrid {
	const originalLines = text.split("\n")
	const lines: string[] = []
	let width = -1
	for (let i = 0; i < originalLines.length; i++) {
		const line = originalLines[i].trim()
		if (line.length === 0) {
			continue
		}
		lines.push(line)
		if (width === -1) {
			width = line.length
		} else if (width !== line.length) {
			throw new Error(`Invalid map, width=${width}, line=${line}`)
		}
	}
	const height = lines.length
	
	const layeredMap = randomMap(width, height, GeneratorConfigs.EMPTY)

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const char = lines[y][x]
			switch (char) {
			case ".":
				break
			case "s":
				layeredMap.blocks.set(x, y, "stone")
				break
			case "w":
				layeredMap.ground.set(x, y, "water")
				break
			default:
				const resourceType = charToResourceType[char]
				if (resourceType) {
					layeredMap.resources.set(x, y, resourceType)
					break
				}
				const machineType = charToBuildingType[char]
				if (machineType) {
					layeredMap.buildings.add(new Building(machineType, x, y))
				}
			}
		}
	}

	return layeredMap
}