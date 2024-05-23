import { Vector2D } from "./vector.js";

/**
 * @typedef StrokeOpt
 * @property {string} color
 * @property {"normal" | "dashed"} style
 * @property {number} width
 */

/**
 * @typedef ShapeOpt
 * @property {{color: string}} fillOpt
 * @property {StrokeOpt} strokeOpt
 */

export class Circle {
    /**
     * @param {Vector2D} c
     * @param {number} r
     * @param {number} a1
     * @param {number} a2
     * @return {Circle}
     */
    constructor(c = new Vector2D(0, 0), r = 1, a1 = 0, a2 = 2 * Math.PI) {
        this.c = c;
        this.r = r;
        this.a1 = Math.abs(a1) > 2 * Math.PI ? (a1 % 2) * Math.PI : a1;
        this.a2 = Math.abs(a2) > 2 * Math.PI ? (a2 % 2) * Math.PI : a2;
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {ShapeOpt} opt
     */
    draw(
        ctx,
        {
            fillOpt = { color: "black" },
            strokeOpt = { color: "black", style: "normal", width: 1 },
        } = {
            fillOpt: { color: "black" },
            strokeOpt: { color: "black", style: "normal", width: 1 },
        },
    ) {
        const aMin = Math.min(this.a1, this.a2);
        const aMax = Math.max(this.a1, this.a2);
        for (let a = aMin; a <= aMax; a += Math.abs(Math.PI / 4 / this.r)) {
            const x = this.r * Math.cos(a);
            const y = this.r * Math.sin(a);
            ctx.fillStyle = strokeOpt?.color || "black";
            ctx.fillRect(this.c.x + x, this.c.y + y, 1, 1);
        }
    }

    /**
     * @param {Vector2D} p
     * @return {boolean}
     */
    collidePoint(p) {
        const centerToP = p.add(this.c.scale(-1, -1));
        const angleP = Math.acos(
            centerToP.dot(new Vector2D(this.r, 0)) /
                (centerToP.norm() * this.r),
        );
        const aMin = Math.min(
            this.a1 < 0 ? 2 * Math.PI + this.a1 : this.a1,
            this.a2 < 0 ? 2 * Math.PI + this.a2 : this.a2,
        );
        const aMax = Math.max(
            this.a1 < 0 ? 2 * Math.PI + this.a1 : this.a1,
            this.a2 < 0 ? 2 * Math.PI + this.a2 : this.a2,
        );
        return centerToP.norm() <= this.r && angleP >= aMin && angleP <= aMax;
    }

    /**
     * @param {Circle} other
     * @return {boolean}
     */
    collideCircle(other) {
        const distCenters = this.c.add(other.c.scale(-1, -1)).norm();
        return distCenters <= this.r + other.r;
    }
}

export class Rect {
    /**
     * @param {Vector2D} p1
     * @param {Vector2D} p2
     * @return {Rect}
     */
    constructor(p1 = new Vector2D(0, 0), p2 = new Vector2D(0, 0)) {
        this.p1 = p1;
        this.p2 = p2;
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {ShapeOpt} opt
     */
    draw(
        ctx,
        {
            fillOpt = { color: "black" },
            strokeOpt = { color: "black", style: "normal", width: 1 },
        } = {
            fillOpt: { color: "black" },
            strokeOpt: { color: "black", style: "normal", width: 1 },
        },
    ) {
        for (let x = p1.x; x <= p2.x; x++) {
            ctx.fillStyle = strokeOpt?.color || "black";
            ctx.fillRect(x, p1.y, 1, 1);
            ctx.fillRect(x, p2.y, 1, 1);
        }
        for (let y = p1.y; y <= p2.y; y++) {
            ctx.fillStyle = strokeOpt?.color || "black";
            ctx.fillRect(p1.x, y, 1, 1);
            ctx.fillRect(p2.x, y, 1, 1);
        }
    }

    /**
     * @param {Vector2D} p
     * @return {boolean}
     */
    collidePoint(p) {
        return p.x >= p1.x && p.x <= p2.x && p.y >= p1.y && p.y <= p2.y;
    }
}

export class LineSegment {
    /**
     * @param {Vector2D} p1
     * @param {Vector2D} p2
     * @return {LineSegment}
     */
    constructor(p1 = new Vector2D(0, 0), p2 = new Vector2D(0, 0)) {
        this.p1 = p1;
        this.p2 = p2;
    }
    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {StrokeOpt} opt
     */
    draw(ctx, opt = { color: "black", style: "normal", width: 1 }) {
        const dx = this.p2.x - this.p1.x;
        const dy = this.p2.y - this.p1.y;
        const minX = Math.min(this.p1.x, this.p2.x);
        const maxX = Math.max(this.p1.x, this.p2.x);
        const minY = Math.min(this.p1.y, this.p2.y);
        const maxY = Math.max(this.p1.y, this.p2.y);

        let noPixel = false;

        if (Math.abs(dx) >= Math.abs(dy)) {
            const m = dy / dx;
            let y = minX === this.p1.x ? this.p1.y : this.p2.y;
            let partsCount = 0;
            for (let x = minX; x <= maxX; x += 1) {
                y += m;
                if (opt.style === "dashed") {
                    if (partsCount % 12 === 0) {
                        noPixel = !noPixel;
                    }
                    partsCount += 1;
                    if (noPixel) continue;
                }
                ctx.fillStyle = opt.color;
                ctx.fillRect(x, y, 1, 1);
            }
        } else {
            const m = dx / dy;
            let x = minY === this.p1.y ? this.p1.x : this.p2.x;
            let partsCount = 0;
            for (let y = minY; y <= maxY; y += 1) {
                x += m;
                if (opt.style === "dashed") {
                    if (partsCount % 12 === 0) {
                        noPixel = !noPixel;
                    }
                    partsCount += 1;
                    if (noPixel) continue;
                }
                ctx.fillStyle = opt.color;
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }
}
