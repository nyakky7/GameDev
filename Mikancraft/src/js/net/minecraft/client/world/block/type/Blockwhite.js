import Block from "../Block.js";

export default class Blockwhite extends Block {

    constructor(id, textureSlotId) {
        super(id, textureSlotId);

        // Sound
        this.sound = Block.sounds.stone;
    }

}