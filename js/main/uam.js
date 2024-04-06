import { Vector2D } from "../utils/vector.js";
import { Circle, LineSegment } from "../utils/shapes.js";

const cvSim = document.getElementById("cv-uam");
const ctx = cvSim.getContext("2d");

let lastTimestamp, deltaTime;

/**
 * @type {{shape: Circle, vel: Vector2D, acc: Vector2D, rot: number}[]}
 */
let balls;

/**
 * @type {number}
 */
let rot;

/**
 * @type {number}
 */
let restitution;

function setup() {
    lastTimestamp = 0;
    deltaTime = 0;

    cvSim.width = window.innerWidth;
    cvSim.height = window.innerHeight;

    const gAcc = new Vector2D(0, 700);

    balls = [];
    balls.push({
        shape: new Circle(
            new Vector2D(cvSim.width / 2 + (Math.random() * 400 - 200), 200),
            50,
        ),
        vel: new Vector2D(200, 0),
        acc: gAcc.scale(1, 1),
        rot: 0,
    });
    balls.push({
        shape: new Circle(
            new Vector2D(
                balls[balls.length - 1].shape.c.x + (Math.random() * 400 - 200),
                120,
            ),
            50,
        ),
        vel: new Vector2D(0, 0),
        acc: gAcc.scale(1, 1),
        rot: 0,
    });
    balls.push({
        shape: new Circle(
            new Vector2D(
                balls[balls.length - 1].shape.c.x + (Math.random() * 400 - 200),
                200,
            ),
            50,
        ),
        vel: new Vector2D(-50, 0),
        acc: gAcc.scale(1, 1),
        rot: 0,
    });

    restitution = 0.5;
}

function draw() {
    ctx.clearRect(0, 0, cvSim.width, cvSim.height);

    for (let bi = 0; bi < balls.length; ++bi) {
        const ball = balls[bi];
        const circle = ball.shape;
        const rot = ball.rot;

        circle.draw(ctx, {
            strokeOpt: {
                color: `hsl(${(bi / balls.length) * 255}, 100%, 25%)`,
            },
        });

        new LineSegment(
            new Vector2D(circle.c.x - circle.r, circle.c.y)
                .add(circle.c.scale(-1, -1))
                .rotate(rot)
                .add(circle.c),
            new Vector2D(circle.c.x + circle.r, circle.c.y)
                .add(circle.c.scale(-1, -1))
                .rotate(rot)
                .add(circle.c),
        ).draw(ctx, { color: `hsl(${(bi / balls.length) * 255}, 100%, 25%)` });

        new LineSegment(
            new Vector2D(circle.c.x, circle.c.y - circle.r)
                .add(circle.c.scale(-1, -1))
                .rotate(rot)
                .add(circle.c),
            new Vector2D(circle.c.x, circle.c.y + circle.r)
                .add(circle.c.scale(-1, -1))
                .rotate(rot)
                .add(circle.c),
        ).draw(ctx, { color: `hsl(${(bi / balls.length) * 255}, 100%, 25%)` });
    }
}

function update() {
    cvSim.width = window.innerWidth;
    cvSim.height = window.innerHeight;

    for (let bi = 0; bi < balls.length; ++bi) {
        const ball = balls[bi];
        const circle = ball.shape;
        const vel = ball.vel;
        const acc = ball.acc;

        if (circle.c.x + circle.r >= cvSim.width) {
            circle.c.x = cvSim.width - circle.r;
            vel.x *= -restitution;
        }
        if (circle.c.x - circle.r <= 0) {
            circle.c.x = circle.r;
            vel.x *= -restitution;
        }
        if (circle.c.y + circle.r >= cvSim.height) {
            circle.c.y = cvSim.height - circle.r;
            vel.y *= -restitution;
        }
        if (circle.c.y - circle.r <= 0) {
            circle.c.y = circle.r;
            vel.y *= -restitution;
        }

        for (let oi = 0; oi < balls.length; ++oi) {
            if (oi === bi) continue;
            const otherBall = balls[oi];
            const otherCircle = otherBall.shape;
            if (!circle.collideCircle(otherCircle)) continue;
            const distV = otherCircle.c.add(circle.c.scale(-1, -1));
            otherCircle.c = otherCircle.c.add(
                distV
                    .normalize()
                    .scale(
                        circle.r + otherCircle.r - distV.norm(),
                        circle.r + otherCircle.r - distV.norm(),
                    ),
            );
            const otherVel = otherBall.vel;
            const tempVel = vel.scale(1, 1);
            vel.x = otherVel.x;
            vel.y = otherVel.y;
            otherVel.x = tempVel.x;
            otherVel.y = tempVel.y;
            otherBall.rot += ((otherVel.x / otherCircle.r) * deltaTime) / 1000;
        }

        circle.c.x += (vel.x * deltaTime) / 1000;
        circle.c.y += (vel.y * deltaTime) / 1000;
        vel.x += (acc.x * deltaTime) / 1000;
        vel.y += (acc.y * deltaTime) / 1000;
        ball.rot += ((vel.x / circle.r) * deltaTime) / 1000;
    }
}

function main(timestamp) {
    deltaTime = timestamp - lastTimestamp;

    update();
    draw();

    lastTimestamp = timestamp;
    requestAnimationFrame(main);
}

setup();
requestAnimationFrame(main);
