export default class BoundingBox {
    constructor(minX, minY, minZ, maxX, maxY, maxZ) {
        this.minX = minX;
        this.minY = minY;
        this.minZ = minZ;
        this.maxX = maxX;
        this.maxY = maxY;
        this.maxZ = maxZ;
    }

    width() {
        return this.maxX - this.minX;
    }

    height() {
        return this.maxY - this.minY;
    }

    depth() {
        return this.maxZ - this.minZ;
    }
}
