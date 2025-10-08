import Block from "../Block.js";
import BoundingBox from "../../../util/BoundingBox.js";

export default class BlockLadder extends Block {
    constructor(id, textureSlotId) {
        super(id, textureSlotId);
        this.name = "Ladder";
        this.sound = Block.sounds.wood;
    }

    isLadder() {
        return true;
    }

    isSolid() {
        return false;
    }

    shouldRenderFace(world, x, y, z, face) {
        const data = world.getBlockDataAt(x, y, z);

        // 文字列 → {x,y,z} に復元
        let facing = data;
        if (typeof facing === "string") {
            const [xv, yv, zv] = facing.split(",").map(Number);
            facing = { x: xv, y: yv, z: zv };
        }

        // 描画したい面だけ描画（反対向き）
        if (facing && face.x === -facing.x && face.y === -facing.y && face.z === -facing.z) {
            return true; // この面だけ描画
        }

        return false; // 他の面は描画しない
    }

    onBlockPlaced(world, x, y, z, face) {
        const validFaces = [
            {x: 0, y: 0, z: -1},
            {x: 0, y: 0, z: 1},
            {x: -1, y: 0, z: 0},
            {x: 1, y: 0, z: 0}
        ];

        const isValid = validFaces.some(f => f.x === face.x && f.y === face.y && f.z === face.z);

        if (isValid) {
            const key = `${face.x},${face.y},${face.z}`;
            world.setBlockDataAt(x, y, z, key); // ← 文字列として保存！
        } else {
            world.setBlockAt(x, y, z, 0); // 無効な面 → 削除
        }
    }


    getTextureForFace(face, data) {
        if (!data) return this.textureSlotId;

        // ← ここで文字列を {x,y,z} に復元
        if (typeof data === "string") {
            const [x, y, z] = data.split(",").map(Number);
            data = {x, y, z};
        }

        const fx = -data.x;
        const fy = -data.y;
        const fz = -data.z;

        const match = face.x === fx && face.y === fy && face.z === fz;
        return match ? this.textureSlotId : null;
    }


    getBoundingBox(world, x, y, z) {
        if (!world) {
            return new BoundingBox(x, y, z, x + 1.0, y + 1.0, z + 1.0);
        }

        let face = world.getBlockDataAt(x, y, z);

        // 文字列を {x, y, z} に変換（描画と同じ処理）
        if (typeof face === "string") {
            const [xv, yv, zv] = face.split(",").map(Number);
            face = {x: xv, y: yv, z: zv};
        }

        const t = 0.2;

        if (face.x === 0 && face.y === 0 && face.z === -1) {
            return new BoundingBox(x, y, z + 1.0 - t, x + 1.0, y + 1.0, z + 1.0); // NORTH
        }
        if (face.x === 0 && face.y === 0 && face.z === 1) {
            return new BoundingBox(x, y, z, x + 1.0, y + 1.0, z + t); // SOUTH
        }
        if (face.x === -1 && face.y === 0 && face.z === 0) {
            return new BoundingBox(x + 1.0 - t, y, z, x + 1.0, y + 1.0, z + 1.0); // WEST
        }
        if (face.x === 1 && face.y === 0 && face.z === 0) {
            return new BoundingBox(x, y, z, x + t, y + 1.0, z + 1.0); // EAST
        }

        // fallback: フルブロック
        return new BoundingBox(x, y, z, x + 1.0, y + 1.0, z + 1.0);
    }
}