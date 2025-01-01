import { Actor } from "../../entity/actor"
import { Building } from "../../entity/building"


export type ActorUI = Actor & {
    _sprite?: Phaser.GameObjects.Sprite
    _move?: boolean
    _tween?: Phaser.Tweens.Tween
    _direction?: string
    _action?: string
    _pathGraphics?: Phaser.GameObjects.Graphics
}

export type BuildingUI = Building & {
    _sprite?: Phaser.GameObjects.Sprite
}
