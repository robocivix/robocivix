import { Actor } from "../entity/actor"

export class Neuro {

    #actor: Actor

    constructor(actor: Actor) {
        this.#actor = actor
    }

    getActions(): string[] {
        return ["work", "move"]
    }
}
