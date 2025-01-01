
import { Actor } from "../../entity/actor"

export type ActorUI = Actor & {
    _sprite?: Phaser.GameObjects.Sprite
    _move?: boolean
    _tween?: Phaser.Tweens.Tween
    _direction?: string
    _action?: string
    _pathGraphics?: Phaser.GameObjects.Graphics
}