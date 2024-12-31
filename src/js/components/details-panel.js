
const ID = 'details-panel'

export class DetailsPanel {
	constructor(scene) {
		this.scene = scene
		this.panel = null
	}

	_ensurePanel() {
		if (!this.panel) {
			let panel = document.getElementById(ID)
			if (!panel) {
				panel = document.createElement('div')
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

	show(actor) {
		let panel = this._ensurePanel()

		panel.style.display = 'block'

		let text = 
			`Id: ${actor.id}<br>` +
			`Name: ${actor.name}<br>` +
			`Positio: ${actor.x},${actor.y}<br>`

		if (actor.action) {
			text += `Action: ${actor.action.name}<br>`
		}
			
		panel.innerHTML = text
	}

	hide() {
		if (this.panel) {
			this.panel.innerHTML = ''
			this.panel.style.display = 'none'
		}
	}

	destroy() {
		if (this.panel) {
			this.panel.remove()
			this.panel = null
		}
	}
} 

