
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

export function devMap1() {
	let starter = generateMap(16, 1, 1)
	let chunk = starter[0][0]

	let s = `
		................
		................
		....w.......p...
		...cw...........
		....wwwwwwwwwww.
		.......w..o.o...
		.......w........
		................
		................
		................
		................
		................
		................
		................
		................
		................
		................
	`
	let actors = []
	s.split("\n").forEach((line, row) => {		
		line = line.trim()
			.split("")
			.forEach((char, col) => {
				if (char === ".") {
					return
				} else if (char === "w") {
					chunk[row][col] = {type: "wall"}
				} else if (char === "c") {
					chunk[row][col] = {type: "wall", color: "red"}
					actors.push(new Machine("crasher", col, row))
				} else if (char === "p") {
					actors.push(new Machine("power-station", col, row))
				} else if (char === "o") {
					chunk[row][col] = {type: "ore", value: 1000}
				}
			})
	})
	return starter, actors
}
