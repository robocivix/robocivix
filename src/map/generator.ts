import { LayeredMap } from "./layered-map"
import { Machine } from "../entity/machine"
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

export function randomMap(width: number, height: number, config: MapConfig = {}): LayeredMap {
	const layeredMap = new LayeredMap(width, height)
	
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


const charToMachineType: Record<string, string>  = {
	"C": "crusher",
	"P": "power-station",
}

const charToResourceType: Record<string, string> = {
	"o": "ore",
	"c": "crystal",
}

export function fromText(text: string): LayeredMap {
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
				const machineType = charToMachineType[char]
				if (machineType) {
					layeredMap.machines.set(x, y, new Machine(machineType))
				}
			}
		}
	}

	return layeredMap
}