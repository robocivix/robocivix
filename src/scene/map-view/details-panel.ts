import { Scene } from "phaser"
import { Actor } from "../../entity/actor"
import { Building } from "../../entity/building"

const ID = "details-panel"

export class DetailsPanel {
	#scene: Scene
	#panel: HTMLElement | null

	constructor(scene: Scene) {
		this.#scene = scene
		this.#panel = null
	}

	#ensurePanel(): HTMLElement {
		if (!this.#panel) {
			let panel = document.getElementById(ID)
			if (!panel) {
				panel = document.createElement("div")
				panel.id = ID
				panel.style.cssText = `
					position: fixed;
					right: 9px;
					bottom: 9px;
					background: rgba(0, 0, 0, 0.2);
					color: white;
					padding: 10px;
					font-family: monospace;
					font-size: 16px;
					width: 220px;
					height: 190px;
					z-index: 1000;
					pointer-events: none;
				`
				document.body.appendChild(panel)
			}
			this.#panel = panel
		}
		return this.#panel
	}

	showActor(actor: Actor): void {
		const panel = this.#ensurePanel()

		panel.style.display = "block"

		let text = 
			`Id: ${actor.id}<br>` +
			`Name: ${actor.name}<br>` +
			`Position: ${actor.x},${actor.y}<br>`

		if (actor.action) {
			text += `Action: ${actor.action.type}<br>`
		}
			
		panel.innerHTML = text
	}

	showBuilding(building: Building): void {
		const panel = this.#ensurePanel()

		panel.style.display = "block"

		const text = 
			`Type: ${building.type}<br>` +
			`Position: ${building.x},${building.y},${building.prototype.width}x${building.prototype.height}<br>`
			
		panel.innerHTML = text
	}

	hide(): void {
		if (this.#panel) {
			this.#panel.innerHTML = ""
			this.#panel.style.display = "none"
		}
	}

	destroy(): void {
		if (this.#panel) {
			this.#panel.remove()
			this.#panel = null
		}
	}
}
