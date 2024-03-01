let CANVAS_WIDTH = window.innerWidth;
let CANVAS_HEIGHT = window.innerHeight;
let ORIGIN_X = CANVAS_WIDTH / 2;
let ORIGIN_Y = CANVAS_HEIGHT / 2;

const inputScaling = 50;

/**
 * @type {number}
 */
let f;
/**
 * @type {number}
 */
let d_o;
/**
 * @type {number}
 */
let h_o;
/**
 * @type {number}
 */
let d_i;
/**
 * @type {number}
 */
let h_i;

let simMult;
let typeMult;

const controlsContainerEl = document.querySelector(".controls");

const fInputEl = document.getElementById("f");
const doInputEl = document.getElementById("do");
const hoInputEl = document.getElementById("ho");

const simMirrorInputEl = document.getElementById("cermin");
const simLensInputEl = document.getElementById("lensa");

const typeCekungInputEl = document.getElementById("cekung");
const typeCembungInputEl = document.getElementById("cembung");

/**
 * @type {HTMLCanvasElement}
 */
const cvSim = document.getElementById("cv-sim");
const ctx = cvSim.getContext("2d");

window.addEventListener("resize", () => {
    CANVAS_WIDTH = window.innerWidth;
    CANVAS_HEIGHT = window.innerHeight;
    ORIGIN_X = CANVAS_WIDTH / 2;
    ORIGIN_Y = CANVAS_HEIGHT / 2;
    cvSim.width = CANVAS_WIDTH;
    cvSim.height = CANVAS_HEIGHT;

    requestAnimationFrame(all);
});

fInputEl.addEventListener("input", () => {
    requestAnimationFrame(all);
});

doInputEl.addEventListener("input", () => {
    requestAnimationFrame(all);
});

hoInputEl.addEventListener("input", () => {
    requestAnimationFrame(all);
});

simMirrorInputEl.addEventListener("change", () => {
    requestAnimationFrame(all);
});

simLensInputEl.addEventListener("change", () => {
    requestAnimationFrame(all);
});

typeCekungInputEl.addEventListener("change", () => {
    requestAnimationFrame(all);
});

typeCembungInputEl.addEventListener("change", () => {
    requestAnimationFrame(all);
});

let pointerX = 0;
let pointerY = 0;
let isHolding = {
    controlsContainer: false,
    cvSim: false,
    obj: false,
    objImg: false,
    focal: false,
    secondFocal: false,
    curvature: false,
    secondCurvature: false,
};

document.body.addEventListener("pointermove", (e) => {
    if (e.target === controlsContainerEl) e.preventDefault();

    if (isHolding.controlsContainer) {
        controlsContainerEl.style.setProperty(
            "--_offset-x",
            `${window.innerWidth - e.clientX - controlsContainerEl.clientWidth / 2}px`,
        );
        controlsContainerEl.style.setProperty(
            "--_offset-y",
            `${window.innerHeight - e.clientY - controlsContainerEl.clientHeight / 4}px`,
        );
    }
});

controlsContainerEl.addEventListener("pointerdown", (e) => {
    if (e.target === controlsContainerEl) e.preventDefault();
    if (
        e.target !== controlsContainerEl &&
        e.target.parentElement !== controlsContainerEl
    )
        return;
    isHolding.controlsContainer = true;
});

document.body.addEventListener("pointerup", (e) => {
    if (e.target === controlsContainerEl) e.preventDefault();
    isHolding.controlsContainer = false;
});

cvSim.addEventListener("pointermove", (e) => {
    let pointerXUnscaled = (e.clientX - ORIGIN_X) / -inputScaling;
    let pointerYUnscaled = (e.clientY - ORIGIN_Y) / -inputScaling;

    const dPointerX = e.clientX - pointerX;
    const dPointerY = e.clientY - pointerY;

    pointerX = e.clientX;
    pointerY = e.clientY;

    if (isHolding.focal || isHolding.secondFocal) {
        if (isHolding.secondFocal) {
            pointerXUnscaled *= -1;
        }
        if (simMult * typeMult === -1) {
            pointerXUnscaled *= -1;
        }
        fInputEl.value = Math.max(Math.min(pointerXUnscaled, doInputEl.max), 0);
        requestAnimationFrame(all);
        return;
    }
    if (isHolding.curvature || isHolding.secondCurvature) {
        if (isHolding.secondCurvature) {
            pointerXUnscaled *= -1;
        }
        if (simMult * typeMult === -1) {
            pointerXUnscaled *= -1;
        }
        fInputEl.value = Math.max(
            Math.min(pointerXUnscaled / 2, fInputEl.max),
            0,
        );
        requestAnimationFrame(all);
        return;
    }
    if (isHolding.obj) {
        doInputEl.value = Math.max(
            Math.min(pointerXUnscaled, doInputEl.max),
            0,
        );
        hoInputEl.value = Math.max(
            Math.min(pointerYUnscaled, hoInputEl.max),
            0,
        );
        requestAnimationFrame(all);
        return;
    }
    if (isHolding.objImg) {
        const diUnscaled = pointerXUnscaled;
        const hiUnscaled = pointerYUnscaled;
        const fUnscaled = (simMult * f) / inputScaling;

        const doUnscaled =
            (simMult * fUnscaled * diUnscaled) / (diUnscaled - fUnscaled);
        const M = (-simMult * diUnscaled) / doUnscaled;
        const hoUnscaled = hiUnscaled / M;

        doInputEl.value = Math.max(Math.min(doUnscaled, doInputEl.max), 0);
        hoInputEl.value = Math.max(Math.min(hoUnscaled, hoInputEl.max), 0);

        requestAnimationFrame(all);
        return;
    }
    if (isHolding.cvSim) {
        ORIGIN_X += dPointerX;
        ORIGIN_Y += dPointerY;
        requestAnimationFrame(all);
    }
});

cvSim.addEventListener("pointerdown", (e) => {
    const pointerXUnscaled = (e.clientX - ORIGIN_X) / -inputScaling;
    const pointerYUnscaled = (e.clientY - ORIGIN_Y) / -inputScaling;

    pointerX = e.clientX;
    pointerY = e.clientY;

    if (
        isAroundObj(
            ORIGIN_X - pointerXUnscaled * inputScaling,
            ORIGIN_Y - pointerYUnscaled * inputScaling,
        )
    ) {
        isHolding.obj = true;
    }
    if (
        isAroundObjImg(
            ORIGIN_X - pointerXUnscaled * inputScaling,
            ORIGIN_Y - pointerYUnscaled * inputScaling,
        )
    ) {
        isHolding.objImg = true;
    }
    if (
        isAroundFocal(
            ORIGIN_X - pointerXUnscaled * inputScaling,
            ORIGIN_Y - pointerYUnscaled * inputScaling,
        )
    ) {
        isHolding.focal = true;
    }
    if (
        isAroundSecondFocal(
            ORIGIN_X - pointerXUnscaled * inputScaling,
            ORIGIN_Y - pointerYUnscaled * inputScaling,
        )
    ) {
        isHolding.secondFocal = true;
    }
    if (
        isAroundCurvature(
            ORIGIN_X - pointerXUnscaled * inputScaling,
            ORIGIN_Y - pointerYUnscaled * inputScaling,
        )
    ) {
        isHolding.curvature = true;
    }
    if (
        isAroundSecondCurvature(
            ORIGIN_X - pointerXUnscaled * inputScaling,
            ORIGIN_Y - pointerYUnscaled * inputScaling,
        )
    ) {
        isHolding.secondCurvature = true;
    }
    if (simMult === 1 || isHolding.focal || isHolding.curvature) {
        isHolding.secondFocal = false;
        isHolding.secondCurvature = false;
    }
    isHolding.cvSim = true;
});

cvSim.addEventListener("pointerup", (e) => {
    isHolding.controlsContainer = false;

    isHolding.cvSim = false;
    isHolding.obj = false;
    isHolding.objImg = false;
    isHolding.focal = false;
    isHolding.secondFocal = false;
    isHolding.curvature = false;
    isHolding.secondCurvature = false;

    pointerX = e.clientX;
    pointerY = e.clientY;
});

/**
 * @function
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function isAroundObj(x, y) {
    const threshold = 25;
    const hatRadius = Math.max(0.75 * h_o, threshold);
    return (
        x >= ORIGIN_X - d_o - hatRadius &&
        x <= ORIGIN_X - d_o + hatRadius &&
        y >= ORIGIN_Y - h_o - hatRadius / 2 &&
        y <= ORIGIN_Y - h_o + hatRadius / 4
    );
}

/**
 * @function
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function isAroundObjImg(x, y) {
    const threshold = 25;
    const hatRadius = Math.max(Math.abs(0.75 * h_i), threshold);
    return (
        x >= ORIGIN_X - d_i - hatRadius &&
        x <= ORIGIN_X - d_i + hatRadius &&
        y >= ORIGIN_Y - h_i - hatRadius / 2 &&
        y <= ORIGIN_Y - h_i + hatRadius / 4
    );
}

/**
 * @function
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function isAroundFocal(x, y) {
    const threshold = 25;
    return (
        x >= ORIGIN_X - f - threshold &&
        x <= ORIGIN_X - f + threshold &&
        y >= ORIGIN_Y - threshold &&
        y <= ORIGIN_Y + threshold
    );
}

/**
 * @function
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function isAroundSecondFocal(x, y) {
    const threshold = 25;
    return (
        x >= ORIGIN_X + f - threshold &&
        x <= ORIGIN_X + f + threshold &&
        y >= ORIGIN_Y - threshold &&
        y <= ORIGIN_Y + threshold
    );
}

/**
 * @function
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function isAroundCurvature(x, y) {
    const threshold = 25;
    return (
        x >= ORIGIN_X - f * 2 - threshold &&
        x <= ORIGIN_X - f * 2 + threshold &&
        y >= ORIGIN_Y - threshold &&
        y <= ORIGIN_Y + threshold
    );
}

/**
 * @function
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function isAroundSecondCurvature(x, y) {
    const threshold = 25;
    return (
        x >= ORIGIN_X + f * 2 - threshold &&
        x <= ORIGIN_X + f * 2 + threshold &&
        y >= ORIGIN_Y - threshold &&
        y <= ORIGIN_Y + threshold
    );
}

/**
 * @function
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @param {{lineStyle:"normal" | "dashed", lineColor: string}} [{lineStyle="normal", lineColor="black"}={lineStyle: "normal", lineColor: "black"}]
 */
function drawLine(
    ctx,
    x1,
    y1,
    x2,
    y2,
    { lineStyle = "normal", lineColor = "black" } = {
        lineStyle: "normal",
        lineColor: "black",
    },
) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    let noPixel = false;

    if (Math.abs(dx) >= Math.abs(dy)) {
        const m = dy / dx;
        let y = minX === x1 ? y1 : y2;
        let partsCount = 0;
        for (let x = minX; x <= maxX; x += 1) {
            y += m;
            if (lineStyle === "dashed") {
                if (partsCount % 12 === 0) {
                    noPixel = !noPixel;
                }
                partsCount += 1;
                if (noPixel) continue;
            }
            ctx.fillStyle = lineColor;
            ctx.fillRect(x, y, 1, 1);
        }
    } else {
        const m = dx / dy;
        let x = minY === y1 ? x1 : x2;
        let partsCount = 0;
        for (let y = minY; y <= maxY; y += 1) {
            x += m;
            if (lineStyle === "dashed") {
                if (partsCount % 12 === 0) {
                    noPixel = !noPixel;
                }
                partsCount += 1;
                if (noPixel) continue;
            }
            ctx.fillStyle = lineColor;
            ctx.fillRect(x, y, 1, 1);
        }
    }
}

/**
 * @function
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx
 * @param {number} cy
 * @param {number} r
 * @param {number} a1
 * @param {number} a2
 */
function drawCircle(ctx, cx, cy, r, a1, a2) {
    if (Math.abs(a1) > 360) a1 = a1 % 360;
    if (Math.abs(a2) > 360) a2 = a2 % 360;
    if (a1 < a2) {
        for (let a = a1; a <= a2; a += Math.abs(45 / r)) {
            const x = r * Math.cos((Math.PI / 180) * a);
            const y = r * Math.sin((Math.PI / 180) * a);
            ctx.fillStyle = "black";
            ctx.fillRect(cx + x, cy + y, 1, 1);
        }
    } else if (a1 > a2) {
        for (let a = a1; a >= a2; a -= Math.abs(45 / r)) {
            const x = r * Math.cos((Math.PI / 180) * a);
            const y = r * Math.sin((Math.PI / 180) * a);
            ctx.fillStyle = "black";
            ctx.fillRect(cx + x, cy + y, 1, 1);
        }
    }
}

/**
 * @function
 * @param {CanvasRenderingContext2D} ctx
 */
function drawPrincipalLine(ctx) {
    drawLine(ctx, 0, ORIGIN_Y, CANVAS_WIDTH, ORIGIN_Y);
}

/**
 * @function
 * @param {CanvasRenderingContext2D} ctx
 */
function drawVertCenter(ctx) {
    drawLine(ctx, ORIGIN_X, 0, ORIGIN_X, CANVAS_HEIGHT);
}

/**
 * @function
 * @param {CanvasRenderingContext2D} ctx
 */
function drawMirror(ctx) {
    drawCircle(ctx, ORIGIN_X - f * 2, ORIGIN_Y, f * 2, -45, 45);
}

/**
 * @function
 * @param {CanvasRenderingContext2D} ctx
 */
function drawLens(ctx) {
    if (typeMult === 1) {
        drawCircle(ctx, ORIGIN_X - f * 2, ORIGIN_Y, f * 2, -45, 45);
        drawCircle(ctx, ORIGIN_X + f * 2, ORIGIN_Y, -f * 2, -45, 45);
    } else if (typeMult === -1) {
        drawCircle(ctx, ORIGIN_X + f * 1.4, ORIGIN_Y, -f * 2, -45, 45);
        drawCircle(ctx, ORIGIN_X - f * 1.4, ORIGIN_Y, f * 2, -45, 45);
    }
}

/**
 * @function
 * @param {CanvasRenderingContext2D} ctx
 */
function drawFocal(ctx) {
    ctx.fillStyle = "black";
    ctx.fillRect(ORIGIN_X - f, ORIGIN_Y, 4, 4);
}

/**
 * @function
 * @param {CanvasRenderingContext2D} ctx
 */
function drawSecondFocal(ctx) {
    ctx.fillStyle = "black";
    ctx.fillRect(ORIGIN_X + f, ORIGIN_Y, 4, 4);
}

/**
 * @function
 * @param {CanvasRenderingContext2D} ctx
 */
function drawCurvature(ctx) {
    ctx.fillStyle = "black";
    ctx.fillRect(ORIGIN_X - f * 2, ORIGIN_Y, 4, 4);
}

/**
 * @function
 * @param {CanvasRenderingContext2D} ctx
 */
function drawSecondCurvature(ctx) {
    ctx.fillStyle = "black";
    ctx.fillRect(ORIGIN_X + f * 2, ORIGIN_Y, 4, 4);
}

/**
 * @function
 * @param {CanvasRenderingContext2D} ctx
 */
function drawObj(ctx) {
    drawLine(ctx, ORIGIN_X - d_o, ORIGIN_Y, ORIGIN_X - d_o, ORIGIN_Y - h_o);

    const hatRadius = 0.75 * h_o;

    drawCircle(
        ctx,
        ORIGIN_X - d_o,
        ORIGIN_Y - h_o + hatRadius,
        hatRadius,
        -45,
        -135,
    );
    drawLine(
        ctx,
        ORIGIN_X - d_o - hatRadius + 7.5 * (h_o / 50),
        ORIGIN_Y - h_o + hatRadius / 2 - 8 * (h_o / 50),
        ORIGIN_X - d_o + hatRadius - 7.5 * (h_o / 50),
        ORIGIN_Y - h_o + hatRadius / 2 - 8 * (h_o / 50),
    );
}

/**
 * @function
 * @param {CanvasRenderingContext2D} ctx
 */
function drawObjImg(ctx) {
    drawLine(ctx, ORIGIN_X - d_i, ORIGIN_Y, ORIGIN_X - d_i, ORIGIN_Y - h_i);

    const hatRadius = 0.75 * h_i;

    drawCircle(
        ctx,
        ORIGIN_X - d_i,
        ORIGIN_Y - h_i + hatRadius,
        hatRadius,
        -45,
        -135,
    );
    drawLine(
        ctx,
        ORIGIN_X - d_i - hatRadius + 7.5 * (h_i / 50),
        ORIGIN_Y - h_i + hatRadius / 2 - 8 * (h_i / 50),
        ORIGIN_X - d_i + hatRadius - 7.5 * (h_i / 50),
        ORIGIN_Y - h_i + hatRadius / 2 - 8 * (h_i / 50),
    );
}

/**
 * @function
 * @param {CanvasRenderingContext2D} ctx
 */
function drawMirrorRaylines(ctx) {
    const objLeft = ORIGIN_X - d_o;
    const objTop = ORIGIN_Y - h_o;
    const fPos = ORIGIN_X - f;
    const cPos = ORIGIN_X - f * 2;

    // Rule 1
    const m1 = (ORIGIN_Y - objTop) / (fPos - ORIGIN_X);
    const c1 = ORIGIN_Y - fPos * m1;
    drawLine(ctx, 0, objTop, ORIGIN_X, objTop, {
        lineColor: "red",
    });
    if (m1 !== 0) {
        if (f >= 0) {
            drawLine(
                ctx,
                ORIGIN_X,
                objTop,
                (CANVAS_HEIGHT - c1) / m1,
                CANVAS_HEIGHT,
                {
                    lineColor: "red",
                },
            );
            if (d_i < 0) {
                drawLine(ctx, ORIGIN_X, objTop, (0 - c1) / m1, 0, {
                    lineStyle: "dashed",
                    lineColor: "red",
                });
            }
        } else {
            drawLine(
                ctx,
                ORIGIN_X,
                objTop,
                (CANVAS_HEIGHT - c1) / m1,
                CANVAS_HEIGHT,
                {
                    lineStyle: "dashed",
                    lineColor: "red",
                },
            );
            drawLine(ctx, ORIGIN_X, objTop, (0 - c1) / m1, 0, {
                lineColor: "red",
            });
        }
    }

    // Rule 2
    if (f * 2 !== d_o) {
        const m2 = (ORIGIN_Y - objTop) / (cPos - objLeft);
        const c2 = ORIGIN_Y - cPos * m2;
        if (f * 2 > d_o) {
            if (m2 !== 0) {
                drawLine(
                    ctx,
                    (CANVAS_HEIGHT - c2) / m2,
                    CANVAS_HEIGHT,
                    ORIGIN_X,
                    ORIGIN_X * m2 + c2,
                    { lineColor: "green" },
                );
                if (d_i < 0) {
                    drawLine(
                        ctx,
                        ORIGIN_X,
                        ORIGIN_X * m2 + c2,
                        CANVAS_WIDTH,
                        CANVAS_WIDTH * m2 + c2,
                        { lineStyle: "dashed", lineColor: "green" },
                    );
                }
            } else {
                drawLine(ctx, 0, c2, ORIGIN_X, c2, { lineColor: "green" });
            }
        } else {
            if (m2 !== 0) {
                drawLine(ctx, ORIGIN_X, ORIGIN_X * m2 + c2, (0 - c2) / m2, 0, {
                    lineColor: "green",
                });
                if (d_i < 0) {
                    drawLine(
                        ctx,
                        ORIGIN_X,
                        ORIGIN_X * m2 + c2,
                        CANVAS_WIDTH,
                        CANVAS_WIDTH * m2 + c2,
                        { lineStyle: "dashed", lineColor: "green" },
                    );
                }
            } else {
                drawLine(ctx, ORIGIN_X, c2, 0, c2, {
                    lineColor: "green",
                });
            }
        }
    }

    // Rule 3
    if (f !== d_o) {
        const m3 = (objTop - ORIGIN_Y) / (objLeft - fPos);
        const c3 = ORIGIN_Y - fPos * m3;
        drawLine(ctx, 0, ORIGIN_X * m3 + c3, ORIGIN_X, ORIGIN_X * m3 + c3, {
            lineColor: "blue",
        });
        if (m3 !== 0) {
            if (d_i < 0) {
                if (f >= 0) {
                    drawLine(
                        ctx,
                        (CANVAS_HEIGHT - c3) / m3,
                        CANVAS_HEIGHT,
                        ORIGIN_X,
                        ORIGIN_X * m3 + c3,
                        { lineColor: "blue" },
                    );
                } else {
                    drawLine(
                        ctx,
                        ORIGIN_X,
                        ORIGIN_X * m3 + c3,
                        (0 - c3) / m3,
                        0,
                        {
                            lineColor: "blue",
                        },
                    );
                }
                drawLine(
                    ctx,
                    ORIGIN_X,
                    ORIGIN_X * m3 + c3,
                    CANVAS_WIDTH,
                    ORIGIN_X * m3 + c3,
                    { lineStyle: "dashed", lineColor: "blue" },
                );
            } else {
                drawLine(ctx, ORIGIN_X, ORIGIN_X * m3 + c3, (0 - c3) / m3, 0, {
                    lineColor: "blue",
                });
            }
        }
    }

    // Rule 4
    const m4 = (ORIGIN_Y - objTop) / (ORIGIN_X - objLeft);
    const c4 = ORIGIN_Y - ORIGIN_X * m4;
    const m4alt = (ORIGIN_Y - (ORIGIN_Y + h_o)) / (ORIGIN_X - objLeft);
    const c4alt = ORIGIN_Y - ORIGIN_X * m4alt;
    if (m4 !== 0) {
        drawLine(ctx, (0 - c4) / m4, 0, ORIGIN_X, ORIGIN_Y, {
            lineColor: "purple",
        });
        drawLine(
            ctx,
            ORIGIN_X,
            ORIGIN_Y,
            (CANVAS_HEIGHT - c4alt) / m4alt,
            CANVAS_HEIGHT,
            {
                lineColor: "purple",
            },
        );
    } else {
        drawLine(ctx, 0, ORIGIN_Y, ORIGIN_X, ORIGIN_Y, {
            lineColor: "purple",
        });
    }
    if (d_i < 0) {
        if (m4 !== 0) {
            drawLine(ctx, ORIGIN_X, ORIGIN_Y, (0 - c4alt) / m4alt, 0, {
                lineStyle: "dashed",
                lineColor: "purple",
            });
        } else {
            drawLine(ctx, ORIGIN_X, ORIGIN_Y, CANVAS_WIDTH, ORIGIN_Y, {
                lineStyle: "dashed",
                lineColor: "purple",
            });
        }
    }
}

/**
 * @function
 * @param {CanvasRenderingContext2D} ctx
 */
function drawLensRaylines(ctx) {
    const objLeft = ORIGIN_X - d_o;
    const objTop = ORIGIN_Y - h_o;
    const f1Pos = ORIGIN_X - f;
    const f2Pos = ORIGIN_X + f;
    const cPos = ORIGIN_X - f * 2;

    // Rule 1
    const m1 = (ORIGIN_Y - objTop) / (f2Pos - ORIGIN_X);
    const c1 = ORIGIN_Y - m1 * f2Pos;
    drawLine(ctx, 0, objTop, ORIGIN_X, objTop, { lineColor: "red" });
    if (m1 !== 0) {
        if (f <= 0) {
            drawLine(ctx, ORIGIN_X, objTop, (0 - c1) / m1, 0, {
                lineColor: "red",
            });
            drawLine(
                ctx,
                ORIGIN_X,
                objTop,
                (CANVAS_HEIGHT - c1) / m1,
                CANVAS_HEIGHT,
                { lineStyle: "dashed", lineColor: "red" },
            );
        } else {
            drawLine(
                ctx,
                ORIGIN_X,
                objTop,
                (CANVAS_HEIGHT - c1) / m1,
                CANVAS_HEIGHT,
                { lineColor: "red" },
            );
            if (f > d_o) {
                drawLine(ctx, ORIGIN_X, objTop, (0 - c1) / m1, 0, {
                    lineStyle: "dashed",
                    lineColor: "red",
                });
            }
        }
    }

    // Rule 2
    const m2 = (ORIGIN_Y - objTop) / (ORIGIN_X - objLeft);
    const c2 = ORIGIN_Y - m2 * ORIGIN_X;
    if (m2 !== 0) {
        drawLine(
            ctx,
            (0 - c2) / m2,
            0,
            (CANVAS_HEIGHT - c2) / m2,
            CANVAS_HEIGHT,
            {
                lineColor: "green",
            },
        );
    }

    // Rule 3
    if (f !== d_o) {
        const m3 = (ORIGIN_Y - objTop) / (f1Pos - objLeft);
        const c3 = ORIGIN_Y - m3 * f1Pos;
        drawLine(
            ctx,
            ORIGIN_X,
            ORIGIN_X * m3 + c3,
            CANVAS_WIDTH,
            ORIGIN_X * m3 + c3,
            { lineColor: "blue" },
        );
        if (m3 !== 0) {
            if (f < d_o) {
                drawLine(ctx, (0 - c3) / m3, 0, ORIGIN_X, ORIGIN_X * m3 + c3, {
                    lineColor: "blue",
                });
                if (f < 0) {
                    drawLine(
                        ctx,
                        ORIGIN_X,
                        ORIGIN_X * m3 + c3,
                        0,
                        ORIGIN_X * m3 + c3,
                        {
                            lineStyle: "dashed",
                            lineColor: "blue",
                        },
                    );
                }
            } else {
                drawLine(ctx, 0, 0 * m3 + c3, ORIGIN_X, ORIGIN_X * m3 + c3, {
                    lineColor: "blue",
                });
                if (f > 0) {
                    drawLine(
                        ctx,
                        ORIGIN_X,
                        ORIGIN_X * m3 + c3,
                        0,
                        ORIGIN_X * m3 + c3,
                        {
                            lineStyle: "dashed",
                            lineColor: "blue",
                        },
                    );
                }
            }
        }
    }
}

/**
 * @function
 * @param {CanvasRenderingContext2D} ctx
 */
function drawRaylines(ctx) {
    if (simMult === 1) {
        drawMirrorRaylines(ctx);
    } else if (simMult === -1) {
        drawLensRaylines(ctx);
    }
}

/**
 * @function
 * @param {CanvasRenderingContext2D} ctx
 */
function drawLabels(ctx) {
    const fontSize = 16;
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = "black";
    ctx.textAlign = "left";

    if (simMult === 1) {
        ctx.fillText("Fokus", ORIGIN_X - f, ORIGIN_Y);
        ctx.fillText(f / inputScaling, ORIGIN_X - f, ORIGIN_Y + fontSize);

        ctx.fillText("Curvature", ORIGIN_X - f * 2, ORIGIN_Y);
        ctx.fillText(
            (f * 2) / inputScaling,
            ORIGIN_X - f * 2,
            ORIGIN_Y + fontSize,
        );
    } else if (simMult === -1) {
        ctx.fillText("Fokus (1)", ORIGIN_X - f, ORIGIN_Y);
        ctx.fillText(f / inputScaling, ORIGIN_X - f, ORIGIN_Y + fontSize);
        ctx.fillText("Fokus (2)", ORIGIN_X + f, ORIGIN_Y);
        ctx.fillText(-f / inputScaling, ORIGIN_X + f, ORIGIN_Y + fontSize);

        ctx.fillText("Curvature (1)", ORIGIN_X - f * 2, ORIGIN_Y);
        ctx.fillText(
            (f * 2) / inputScaling,
            ORIGIN_X - f * 2,
            ORIGIN_Y + fontSize,
        );
        ctx.fillText("Curvature (2)", ORIGIN_X + f * 2, ORIGIN_Y);
        ctx.fillText(
            -(f * 2) / inputScaling,
            ORIGIN_X + f * 2,
            ORIGIN_Y + fontSize,
        );
    }

    ctx.fillText("Objek", ORIGIN_X - d_o, ORIGIN_Y - h_o);
    ctx.fillText(d_o / inputScaling, ORIGIN_X - d_o, ORIGIN_Y + fontSize);
    ctx.textAlign = "right";
    ctx.fillText(h_o / inputScaling, ORIGIN_X, ORIGIN_Y - h_o);
    ctx.textAlign = "left";
    ctx.fillText("Bayangan", ORIGIN_X - d_i, ORIGIN_Y - h_i);
    ctx.fillText(
        (d_i / inputScaling).toPrecision(3),
        ORIGIN_X - d_i,
        ORIGIN_Y + fontSize,
    );
    ctx.textAlign = "right";
    ctx.fillText((h_i / inputScaling).toPrecision(3), ORIGIN_X, ORIGIN_Y - h_i);
    ctx.textAlign = "left";
}

function draw() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawPrincipalLine(ctx);
    drawVertCenter(ctx);
    if (simMult === 1) {
        drawMirror(ctx);
    } else if (simMult === -1) {
        drawLens(ctx);
    }
    drawFocal(ctx);
    drawCurvature(ctx);
    if (simMult === -1) {
        drawSecondFocal(ctx);
        drawSecondCurvature(ctx);
    }
    drawObj(ctx);
    if (f !== d_o) {
        drawObjImg(ctx);
    }
    drawRaylines(ctx);
    drawLabels(ctx);
}

function update() {
    cvSim.style.setProperty("--input-scaling", inputScaling + "px");
    cvSim.style.setProperty("--origin-x", ORIGIN_X + "px");
    cvSim.style.setProperty("--origin-y", ORIGIN_Y + "px");

    const selectedSim = document.querySelector('input[name="sim"]:checked');
    const selectedType = document.querySelector('input[name="type"]:checked');
    simMult = Number(selectedSim.value);
    typeMult = Number(selectedType.value);
    f = simMult * typeMult * inputScaling * Number(fInputEl.value);
    d_o = inputScaling * Number(doInputEl.value);
    h_o = inputScaling * Number(hoInputEl.value);

    d_i = (simMult * f * d_o) / (d_o - f);
    const M = (-simMult * d_i) / d_o;
    h_i = M * h_o;
}

function setup() {
    cvSim.width = CANVAS_WIDTH;
    cvSim.height = CANVAS_HEIGHT;

    cvSim.style.setProperty("--input-scaling", inputScaling + "px");
    cvSim.style.setProperty("--origin-x", ORIGIN_X + "px");
    cvSim.style.setProperty("--origin-y", ORIGIN_Y + "px");

    doInputEl.max = ORIGIN_X / inputScaling;
    fInputEl.max = ORIGIN_X / inputScaling;

    const selectedSim = document.querySelector('input[name="sim"]:checked');
    const selectedType = document.querySelector('input[name="type"]:checked');
    simMult = Number(selectedSim.value);
    typeMult = Number(selectedType.value);
    f = typeMult * inputScaling * Number(fInputEl.value);
    d_o = inputScaling * Number(doInputEl.value);
    h_o = inputScaling * Number(hoInputEl.value);
}

function all() {
    update();
    draw();
}

setup();
requestAnimationFrame(all);
