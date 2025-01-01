import { Scene } from "phaser"
import { Actor } from "../../entity/actor"

const ID = "details-panel"

export class DetailsPanel {
	private scene: Scene
	private panel: HTMLElement | null

	constructor(scene: Scene) {
		this.scene = scene
		this.panel = null
	}

	private _ensurePanel(): HTMLElement {
		if (!this.panel) {
			let panel = document.getElementById(ID)
			if (!panel) {
				panel = document.createElement("div")
				panel.id = ID
				panel.style.cssText = `
					position: fixed;
					right: 10px;
					bottom: 250px;
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
			this.panel = panel
		}
		return this.panel
	}

	show(actor: Actor): void {
		const panel = this._ensurePanel()

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

	hide(): void {
		if (this.panel) {
			this.panel.innerHTML = ""
			this.panel.style.display = "none"
		}
	}

	destroy(): void {
		if (this.panel) {
			this.panel.remove()
			this.panel = null
		}
	}
}
