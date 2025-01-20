
function randChoice(array) {
	return array[Math.floor(Math.random() * array.length)]
}
/**
 * Generates a map with randomly placed ore and water resources
 * @returns {Object} Map data organized by chunk coordinates
 */
export function generateMap(chunkSize, width, height, config = {}) {
	const data = {}
	const types = ["ore", "water", "stone", "crystal"]
	const defaultConfig = {	
		density: 0.1
	}

	const actualConfig = {...defaultConfig, ...config}

	for (let y = 0; y < height; y++) {
		let cy = y * chunkSize
		for (let x = 0; x < width; x++) {
			let cx = x * chunkSize
			const chunk = new Array(chunkSize)
			const chunkKey = `${cx},${cy}`
			data[chunkKey] = chunk

			for (let row = 0; row < chunkSize; row++) {
				chunk[row] = new Array(chunkSize)
				for (let col = 0; col < chunkSize; col++) {
					if (Math.random() > actualConfig.density) {
						continue
					}

					const cell = {
						type: randChoice(types),
						value: Math.floor(Math.random() * 10000)
					}
					chunk[row][col] = cell
				}
			}
		}
	}

	return data
}
