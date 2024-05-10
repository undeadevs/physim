import { Vector2D } from "../utils/vector.js";
import { Circle, LineSegment } from "../utils/shapes.js";

const cvSim = document.getElementById("cv-uam");
const ctx = cvSim.getContext("2d");

const playBtn = document.getElementById("play");

const velXInputEl = document.getElementById("velx");
const velYInputEl = document.getElementById("vely");

const SCALE = 50;

let lastTimestamp, deltaTime, isPaused;

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

let pointerDown = false;
let pointerPos = new Vector2D(0, 0);
let pointerPrevPos = new Vector2D(0, 0);

let holdingBi = -1;
let formBi = 0;

cvSim.addEventListener("pointerdown", (e) => {
    pointerPos.x = e.clientX;
    pointerPos.y = e.clientY;
    pointerDown = true;
});
cvSim.addEventListener("pointermove", (e) => {
    pointerPos.x = e.clientX;
    pointerPos.y = e.clientY;
});
cvSim.addEventListener("pointerup", (e) => {
    pointerPos.x = e.clientX;
    pointerPos.y = e.clientY;
    pointerDown = false;
});

function setup() {
    lastTimestamp = 0;
    deltaTime = 0;
    isPaused = true;

    cvSim.width = window.innerWidth;
    cvSim.height = window.innerHeight;

    playBtn.checked = !isPaused;
    velXInputEl.readOnly = !isPaused;
    velYInputEl.readOnly = !isPaused;

    velXInputEl.value = 0;
    velYInputEl.value = 0;

    const gAcc = new Vector2D(0, 700);

    balls = [];
    balls.push({
        shape: new Circle(
            new Vector2D(cvSim.width / 2 + (Math.random() * 400 - 200), 200),
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
                120,
            ),
            50,
        ),
        vel: new Vector2D(0, 0),
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
        const vel = ball.vel;
        const rot = ball.rot;
        const bColor = `hsl(${(bi / balls.length) * 255}, 100%, 25%)`;

        circle.draw(ctx, {
            strokeOpt: {
                color: bColor,
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
        ).draw(ctx, { color: bColor });

        new LineSegment(
            new Vector2D(circle.c.x, circle.c.y - circle.r)
                .add(circle.c.scale(-1, -1))
                .rotate(rot)
                .add(circle.c),
            new Vector2D(circle.c.x, circle.c.y + circle.r)
                .add(circle.c.scale(-1, -1))
                .rotate(rot)
                .add(circle.c),
        ).draw(ctx, { color: bColor });

        if (vel.norm() > 0) {
            new LineSegment(circle.c, circle.c.add(vel)).draw(ctx, {
                color: bColor,
            });
        }
    }
}

function update() {
    cvSim.width = window.innerWidth;
    cvSim.height = window.innerHeight;
    isPaused = !playBtn.checked;

    velXInputEl.readOnly = !isPaused;
    velYInputEl.readOnly = !isPaused;

    if (!pointerDown) {
        holdingBi = -1;
    }

    if (holdingBi >= 0) {
        formBi = holdingBi;
    }

    const bColor = `hsl(${(formBi / balls.length) * 255}, 100%, 25%)`;
    velXInputEl.style.setProperty("--bcolor", bColor);
    velYInputEl.style.setProperty("--bcolor", bColor);

    if (isPaused && holdingBi < 0) {
        balls[formBi].vel.x = Number(velXInputEl.value) * SCALE;
        balls[formBi].vel.y = Number(velYInputEl.value) * SCALE;
    }

    velXInputEl.value = balls[formBi].vel.x / SCALE;
    velYInputEl.value = balls[formBi].vel.y / SCALE;

    for (let bi = 0; bi < balls.length; ++bi) {
        const ball = balls[bi];
        const circle = ball.shape;
        const vel = ball.vel;
        const acc = ball.acc;

        if (
            !isPaused &&
            (circle.c.x + circle.r >= cvSim.width ||
                circle.c.x - circle.r <= 0 ||
                circle.c.y + circle.r >= cvSim.height ||
                circle.c.y - circle.r <= 0)
        ) {
            vel.x *= Math.abs(restitution);
            vel.y *= Math.abs(restitution);
        }

        if (circle.c.x + circle.r >= cvSim.width) {
            circle.c.x = cvSim.width - circle.r;
            vel.x *= -1;
        }
        if (circle.c.x - circle.r <= 0) {
            circle.c.x = circle.r;
            vel.x *= -1;
        }
        if (circle.c.y + circle.r >= cvSim.height) {
            circle.c.y = cvSim.height - circle.r;
            vel.y *= -1;
        }
        if (circle.c.y - circle.r <= 0) {
            circle.c.y = circle.r;
            vel.y *= -1;
        }

        if (
            pointerDown &&
            circle.collidePoint(pointerPos) &&
            holdingBi === -1
        ) {
            holdingBi = bi;
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

        if (holdingBi === bi) {
            circle.c.x = Math.max(
                Math.min(pointerPos.x, cvSim.clientWidth - circle.r),
                circle.r,
            );
            circle.c.y = Math.max(
                Math.min(pointerPos.y, cvSim.clientHeight - circle.r),
                circle.r,
            );
            vel.x = (pointerPos.x - pointerPrevPos.x) * 25;
            vel.y = (pointerPos.y - pointerPrevPos.y) * 25;
        } else {
            circle.c.x += (vel.x * deltaTime) / 1000;
            circle.c.y += (vel.y * deltaTime) / 1000;
            vel.x += (acc.x * deltaTime) / 1000;
            vel.y += (acc.y * deltaTime) / 1000;
            ball.rot += ((vel.x / circle.r) * deltaTime) / 1000;
        }
    }

    pointerPrevPos.x = pointerPos.x;
    pointerPrevPos.y = pointerPos.y;
}

function main(timestamp) {
    if (isPaused) {
        deltaTime = 0;
        lastTimestamp = timestamp;
    } else {
        deltaTime = timestamp - lastTimestamp;
    }

    update();
    draw();

    lastTimestamp = timestamp;
    requestAnimationFrame(main);
}

setup();
requestAnimationFrame(main);
