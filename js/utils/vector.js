export class Vector2D {
    /**
     * @param {number} x
     * @param {number} y
     * @return {Vector2D}
     */
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    /**
     * @return {number}
     */
    norm() {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }

    /**
     * @return {Vector2D}
     */
    normalize() {
        return this.scale(1 / this.norm(), 1 / this.norm());
    }

    /**
     * @param {Vector2D} other
     * @return {Vector2D}
     */
    add(other) {
        return new Vector2D(this.x + other.x, this.y + other.y);
    }

    /**
     * @param {number} x
     * @param {number} y
     * @return {Vector2D}
     */
    scale(x, y) {
        return new Vector2D(x * this.x, y * this.y);
    }

    /**
     * @param {Vector2D} other
     * @return {number}
     */
    dot(other) {
        return this.x * other.x + this.y * other.y;
    }

    /**
     * @param {Vector2D} other
     * @return {number}
     */
    cross(other) {
        return this.x * other.y - other.x * this.y;
    }

    /**
     * @param {number} angle
     * @return {Vector2D}
     */
    rotate(angle) {
        return this.transform([
            [Math.cos(angle), -Math.sin(angle)],
            [Math.sin(angle), Math.cos(angle)],
        ]);
    }

    /**
     * @param {number[][]} transformMat
     * @return {Vector2D}
     */
    transform(transformMat) {
        return new Vector2D(
            transformMat[0][0] * this.x + transformMat[0][1] * this.y,
            transformMat[1][0] * this.x + transformMat[1][1] * this.y,
        );
    }
}
