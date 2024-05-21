import { Vector2D } from "../utils/vector.js";
import { Circle, LineSegment } from "../utils/shapes.js";

const cvSim = document.getElementById("cv-uam");
const ctx = cvSim.getContext("2d");

const playBtn = document.getElementById("play");
const addBtn = document.getElementById("add-btn");
const removeBtn = document.getElementById("remove-btn");

const gInputEl = document.getElementById("gravity");
const restitutionInputEl = document.getElementById("restitution");

const modeInputEl = document.getElementById("vmode");

const cartesianInputContainerEl = document.querySelector(
    ".ball-input-cartesian",
);
const polarInputContainerEl = document.querySelector(".ball-input-polar");

const velXInputEl = document.getElementById("velx");
const velYInputEl = document.getElementById("vely");
const velAInputEl = document.getElementById("vela");
const velLInputEl = document.getElementById("vell");

const SCALE = 50;

let lastTimestamp, deltaTime, isPaused;

/**
 * @type {Vector2D}
 */
let gAcc;

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

addBtn.addEventListener("click", () => {
    balls.push({
        shape: new Circle(
            new Vector2D(
                (balls.length > 0
                    ? balls[balls.length - 1].shape.c.x
                    : cvSim.width / 2) +
                    (Math.random() * 400 - 200),
                120,
            ),
            50,
        ),
        vel: new Vector2D(0, 0),
        acc: gAcc.scale(1, 1),
        rot: 0,
    });
    formBi = balls.length - 1;
});

removeBtn.addEventListener("click", () => {
    balls.splice(formBi, 1);
});

function setup() {
    lastTimestamp = 0;
    deltaTime = 0;
    isPaused = true;

    cvSim.width = window.innerWidth;
    cvSim.height = window.innerHeight;

    playBtn.checked = !isPaused;

    cartesianInputContainerEl.hidden = modeInputEl.value !== "cartesian";
    polarInputContainerEl.hidden = modeInputEl.value !== "polar";

    velXInputEl.readOnly = !isPaused;
    velYInputEl.readOnly = !isPaused;
    velAInputEl.readOnly = !isPaused;
    velLInputEl.readOnly = !isPaused;

    modeInputEl.value = "cartesian";

    velXInputEl.value = 0;
    velYInputEl.value = 0;
    velAInputEl.value = 0;
    velLInputEl.value = 0;

    gAcc = new Vector2D(0, 700);
    gInputEl.value = gAcc.y / SCALE;
    restitutionInputEl.value = restitution;

    balls = [];
    balls.push({
        shape: new Circle(
            new Vector2D(cvSim.width / 2 + (Math.random() * 400 - 200), 200),
            50,
        ),
        vel: new Vector2D(0, 0),
        acc: new Vector2D(0, 0),
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
        acc: new Vector2D(0, 0),
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
        acc: new Vector2D(0, 0),
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

    cartesianInputContainerEl.hidden = modeInputEl.value !== "cartesian";
    polarInputContainerEl.hidden = modeInputEl.value !== "polar";

    velXInputEl.readOnly = !isPaused;
    velYInputEl.readOnly = !isPaused;
    velAInputEl.readOnly = !isPaused;
    velLInputEl.readOnly = !isPaused;

    gAcc.y = Number(gInputEl.value) * SCALE;
    restitution = Number(restitutionInputEl.value);

    if (!pointerDown) {
        holdingBi = -1;
    }

    if (holdingBi >= 0) {
        formBi = holdingBi;
    }

    if (!balls[formBi]) {
        formBi = balls.length - 1;
    }

    const bColor = `hsl(${(formBi / balls.length) * 255}, 100%, 25%)`;
    document.body.style.setProperty("--bcolor", bColor);

    if (isPaused && holdingBi < 0 && balls[formBi]) {
        if (modeInputEl.value === "cartesian") {
            balls[formBi].vel.x = Number(velXInputEl.value) * SCALE;
            balls[formBi].vel.y = Number(velYInputEl.value) * SCALE;
        } else if (modeInputEl.value === "polar") {
            const velA = (Number(velAInputEl.value) * Math.PI) / 180;
            const velL = Number(velLInputEl.value) * SCALE;
            balls[formBi].vel.x = velL * Math.cos(velA);
            balls[formBi].vel.y = velL * Math.sin(velA);
        }
    }

    const formBVel = balls[formBi].vel;
    velXInputEl.value = formBVel.x / SCALE;
    velYInputEl.value = formBVel.y / SCALE;
    if (!isPaused || holdingBi >= 0 || modeInputEl.value !== "polar") {
        velAInputEl.value =
            formBVel.norm() === 0
                ? 0
                : (Math.atan2(formBVel.y, formBVel.x) * 180) / Math.PI;
        velLInputEl.value = formBVel.norm() / SCALE;
    }

    for (let bi = 0; bi < balls.length; ++bi) {
        const ball = balls[bi];
        const circle = ball.shape;
        const vel = ball.vel;
        ball.acc = gAcc.scale(1, 1);
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
            vel.x *= Math.abs(restitution);
            vel.y *= -restitution;
        }
        if (circle.c.y - circle.r <= 0) {
            circle.c.y = circle.r;
            vel.x *= Math.abs(restitution);
            vel.y *= -restitution;
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
            // x2 - x1
            const distV = otherCircle.c.add(circle.c.scale(-1, -1));
            // x1 - x2
            const distVO = distV.scale(-1, -1);

            if (holdingBi < 0 || holdingBi === bi) {
                otherCircle.c = circle.c.add(
                    distV
                        .normalize()
                        .scale(
                            circle.r + otherCircle.r + 0.05,
                            circle.r + otherCircle.r + 0.05,
                        ),
                );
            } else {
                circle.c = otherCircle.c.add(
                    distVO
                        .normalize()
                        .scale(
                            circle.r + otherCircle.r + 0.05,
                            circle.r + otherCircle.r + 0.05,
                        ),
                );
            }

            // v1 - v2
            const v1v2 = vel.add(otherBall.vel.scale(-1, -1));
            // v2 - v1
            const v2v1 = v1v2.scale(-1, -1);

            // <v1 - v2, x1 - x2> / ||x1 - x2||**2
            const c1 = v1v2.dot(distVO) / distVO.norm() ** 2;
            // <v1 - v2, x1 - x2> / ||x2 - x1||**2
            const c2 = v2v1.dot(distV) / distV.norm() ** 2;

            // v1 - c1*(x1-x2)
            ball.vel = vel.add(distVO.scale(-c1, -c1));
            // v2 - c2*(x2-x1)
            otherBall.vel = otherBall.vel.add(distV.scale(-c2, -c2));

            otherBall.rot +=
                ((otherBall.vel.x / otherCircle.r) * deltaTime) / 1000;

            otherCircle.c.x += (otherBall.vel.x * deltaTime) / 1000;
            otherCircle.c.y += (otherBall.vel.y * deltaTime) / 1000;

            // const otherVel = otherBall.vel;
            // const tempVel = vel.scale(1, 1);
            // vel.x = otherVel.x;
            // vel.y = otherVel.y;
            // otherVel.x = tempVel.x;
            // otherVel.y = tempVel.y;
            // otherBall.rot += ((otherVel.x / otherCircle.r) * deltaTime) / 1000;
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
