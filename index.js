let CANVAS_WIDTH = window.innerWidth;
let CANVAS_HEIGHT = window.innerHeight;

const fps = 60;
const requiredElapsed = 1000 / fps;

let prevTime = Date.now();

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
/**
 * @type {number}
 */
let M = 0;

let simMult;
let typeMult;

const CURSOR_NORMAL = 0;
const CURSOR_PORTAL = 1;

/**
 * @type {typeof CURSOR_NORMAL | typeof CURSOR_PORTAL}
 */
let cursorMode = CURSOR_NORMAL;

const PORTAL_NONE = 0;
const PORTAL_IN_START = 1;
const PORTAL_IN_END = 2;
const PORTAL_OUT_START = 3;
const PORTAL_OUT_END = 4;

/**
 * @type {typeof PORTAL_NONE | typeof PORTAL_IN_START | typeof PORTAL_IN_END | typeof PORTAL_OUT_START | typeof PORTAL_OUT_END}
 */
let portalShotState = PORTAL_NONE;

let portalIn = { x1: 0, y1: 0, x2: 0, y2: 0, dir: 1 };
let portalOut = { x1: 0, y1: 0, x2: 0, y2: 0, dir: -1 };

let needleX = -4 * inputScaling;
let needleY = 3 * inputScaling;

let paperX = 0;
let paperY = 0;

const OBJ_NAIL = 0;
const OBJ_BALLOON = 1;

let objType = OBJ_NAIL;

const BALLOON_INFLATED = 0;
const BALLOON_POPPED = 1;
const BALLOON_OPENED_PAPER = 2;

let balloonState = BALLOON_INFLATED;

const controlsContainerEl = document.querySelector(".controls");

const fInputEl = document.getElementById("f");
const doInputEl = document.getElementById("do");
const hoInputEl = document.getElementById("ho");

const simMirrorInputEl = document.getElementById("cermin");
const simLensInputEl = document.getElementById("lensa");

const typeCekungInputEl = document.getElementById("cekung");
const typeCembungInputEl = document.getElementById("cembung");

const cursorModeSelectEl = document.getElementById("cursor-mode");

const objTypeSelectEl = document.getElementById("obj");

const clearPortalBtn = document.getElementById("clear-portal-btn");

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

    doInputEl.max = ORIGIN_X / inputScaling;
    fInputEl.max = ORIGIN_X / inputScaling;
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
    needle: false,
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

    document.body.style.cursor = "default";

    if (cursorMode === CURSOR_PORTAL) {
        document.body.style.cursor = "crosshair";
        if (pointerX >= ORIGIN_X || pointerY >= ORIGIN_Y) return;

        switch (portalShotState) {
            case PORTAL_IN_END:
                {
                    portalIn.x2 = ORIGIN_X - pointerX;
                    portalIn.y2 = ORIGIN_Y - pointerY;
                }
                break;
            case PORTAL_OUT_END:
                {
                    portalOut.x2 = ORIGIN_X - pointerX;
                    portalOut.y2 = ORIGIN_Y - pointerY;
                }
                break;
        }
    }

    if (cursorMode !== CURSOR_NORMAL) return;

    if (
        isAroundObj(pointerX, pointerY) ||
        isAroundObjImg(pointerX, pointerY) ||
        isAroundFocal(pointerX, pointerY) ||
        isAroundCurvature(pointerX, pointerY) ||
        (simMult === -1 &&
            (isAroundSecondFocal(pointerX, pointerY) ||
                isAroundSecondCurvature(pointerX, pointerY))) ||
        isAroundNeedle(pointerX, pointerY)
    ) {
        document.body.style.cursor = "grab";
        if (
            isHolding.obj ||
            isHolding.objImg ||
            isHolding.focal ||
            isHolding.curvature ||
            (simMult === -1 &&
                (isHolding.secondFocal || isHolding.secondCurvature))
        ) {
            document.body.style.cursor = "grabbing";
        }
    }

    if (isHolding.focal || isHolding.secondFocal) {
        if (isHolding.secondFocal) {
            pointerXUnscaled *= -1;
        }
        if (simMult * typeMult === -1) {
            pointerXUnscaled *= -1;
        }
        fInputEl.value = Math.max(Math.min(pointerXUnscaled, doInputEl.max), 0);
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

        return;
    }
    if (isHolding.needle && objType === OBJ_BALLOON) {
        needleX = ORIGIN_X - (pointerX - Math.max(inputScaling, 25));
        needleY = ORIGIN_Y - pointerY;

        return;
    }
    if (isHolding.cvSim) {
        ORIGIN_X += dPointerX;
        ORIGIN_Y += dPointerY;
    }
});

cvSim.addEventListener("pointerdown", (e) => {
    pointerX = e.clientX;
    pointerY = e.clientY;

    document.body.style.cursor = "default";

    if (cursorMode === CURSOR_PORTAL) {
        document.body.style.cursor = "crosshair";
        if (pointerX >= ORIGIN_X || pointerY >= ORIGIN_Y) return;

        switch (portalShotState) {
            case PORTAL_IN_START:
                {
                    portalIn.x1 = ORIGIN_X - pointerX;
                    portalIn.y1 = ORIGIN_Y - pointerY;
                }
                break;
            case PORTAL_IN_END:
                {
                    portalIn.x2 = ORIGIN_X - pointerX;
                    portalIn.y2 = ORIGIN_Y - pointerY;
                }
                break;
            case PORTAL_OUT_START:
                {
                    portalOut.x1 = ORIGIN_X - pointerX;
                    portalOut.y1 = ORIGIN_Y - pointerY;
                }
                break;
            case PORTAL_OUT_END:
                {
                    portalOut.x2 = ORIGIN_X - pointerX;
                    portalOut.y2 = ORIGIN_Y - pointerY;
                }
                break;
        }

        portalShotState += 1;
        if (portalShotState > PORTAL_OUT_END) portalShotState = PORTAL_IN_START;
    }

    if (cursorMode !== CURSOR_NORMAL) return;

    if (isAroundObj(pointerX, pointerY)) {
        isHolding.obj = true;
        document.body.style.cursor = "grabbing";
    }
    if (isAroundObjImg(pointerX, pointerY)) {
        isHolding.objImg = true;
        document.body.style.cursor = "grabbing";
    }
    if (isAroundFocal(pointerX, pointerY)) {
        isHolding.focal = true;
        document.body.style.cursor = "grabbing";
    }
    if (isAroundSecondFocal(pointerX, pointerY)) {
        isHolding.secondFocal = true;
        document.body.style.cursor = "grabbing";
    }
    if (isAroundCurvature(pointerX, pointerY)) {
        isHolding.curvature = true;
        if (simMult === -1) {
            document.body.style.cursor = "grabbing";
        }
    }
    if (isAroundSecondCurvature(pointerX, pointerY)) {
        isHolding.secondCurvature = true;
        if (simMult === -1) {
            document.body.style.cursor = "grabbing";
        }
    }
    if (isAroundNeedle(pointerX, pointerY)) {
        isHolding.needle = true;
        document.body.style.cursor = "grabbing";
    }
    if (isAroundPaper(pointerX, pointerY) && objType === OBJ_BALLOON) {
        window.open(
            "https://www.youtube.com/watch?v=dQw4w9WgXcQ&pp=ygUJcmljayByb2xs",
            "_blank",
        );
        return;
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
    isHolding.needle = false;

    pointerX = e.clientX;
    pointerY = e.clientY;

    document.body.style.cursor = "default";

    if (cursorMode === CURSOR_PORTAL) {
        document.body.style.cursor = "crosshair";
        if (pointerX >= ORIGIN_X || pointerY >= ORIGIN_Y) return;

        switch (portalShotState) {
            case PORTAL_IN_END:
                {
                    portalIn.x2 = ORIGIN_X - pointerX;
                    portalIn.y2 = ORIGIN_Y - pointerY;
                }
                break;
            case PORTAL_OUT_END:
                {
                    portalOut.x2 = ORIGIN_X - pointerX;
                    portalOut.y2 = ORIGIN_Y - pointerY;
                }
                break;
        }
    }

    if (cursorMode !== CURSOR_NORMAL) return;

    if (
        isAroundObj(pointerX, pointerY) ||
        isAroundObjImg(pointerX, pointerY) ||
        isAroundFocal(pointerX, pointerY) ||
        isAroundCurvature(pointerX, pointerY) ||
        (simMult === -1 &&
            (isAroundSecondFocal(pointerX, pointerY) ||
                isAroundSecondCurvature(pointerX, pointerY))) ||
        isAroundNeedle(pointerX, pointerY)
    ) {
        document.body.style.cursor = "grab";
    }
});

clearPortalBtn.addEventListener("click", () => {
    portalIn = { x1: 0, y1: 0, x2: 0, y2: 0, dir: 1 };
    portalOut = { x1: 0, y1: 0, x2: 0, y2: 0, dir: -1 };
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
    const balloonRadius = Math.max(45, threshold);

    switch (objType) {
        case OBJ_NAIL: {
            return (
                x >= ORIGIN_X - d_o - hatRadius &&
                x <= ORIGIN_X - d_o + hatRadius &&
                y >= ORIGIN_Y - h_o - hatRadius / 2 &&
                y <= ORIGIN_Y - h_o + hatRadius / 4
            );
        }
        case OBJ_BALLOON: {
            return (
                (x - (ORIGIN_X - d_o)) ** 2 +
                (y - (ORIGIN_Y - h_o + balloonRadius)) ** 2 <=
                balloonRadius ** 2
            );
        }
    }
}

/**
 * @function
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function isAroundObjImg(x, y) {
    const threshold = 25;
    const hatRadius = Math.max(0.75 * Math.abs(h_i), threshold);
    const balloonRadius =
        Math.sign(h_i) * Math.max(45, threshold) * Math.abs(M);

    switch (objType) {
        case OBJ_NAIL: {
            return (
                x >= ORIGIN_X - d_i - hatRadius &&
                x <= ORIGIN_X - d_i + hatRadius &&
                y >= ORIGIN_Y - h_i - hatRadius / 2 &&
                y <= ORIGIN_Y - h_i + hatRadius / 4
            );
        }
        case OBJ_BALLOON: {
            return (
                (x - (ORIGIN_X - d_i)) ** 2 +
                (y - (ORIGIN_Y - h_i + balloonRadius)) ** 2 <=
                balloonRadius ** 2
            );
        }
    }
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
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function isAroundNeedle(x, y) {
    const threshold = 25;
    return (
        x >= ORIGIN_X - needleX &&
        x <= ORIGIN_X - needleX + inputScaling &&
        y >= ORIGIN_Y - needleY - threshold &&
        y <= ORIGIN_Y - needleY + threshold
    );
}

/**
 * @function
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function isAroundPaper(x, y) {
    return (
        x >= ORIGIN_X - paperX - 25 &&
        x <= ORIGIN_X - paperX + 25 &&
        y >= ORIGIN_Y - paperY - 25 &&
        y <= ORIGIN_Y - paperY + 25
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
    const oPortalIn = {
        x1: ORIGIN_X - portalIn.x1,
        y1: ORIGIN_Y - portalIn.y1,
        x2: ORIGIN_X - portalIn.x2,
        y2: ORIGIN_Y - portalIn.y2,
    };
    const oPortalOut = {
        x1: ORIGIN_X - portalOut.x1,
        y1: ORIGIN_Y - portalOut.y1,
        x2: ORIGIN_X - portalOut.x2,
        y2: ORIGIN_Y - portalOut.y2,
    };

    const mIn = (oPortalIn.y2 - oPortalIn.y1) / (oPortalIn.x2 - oPortalIn.x1);
    const cIn = oPortalIn.y2 - mIn * oPortalIn.x2;

    const mOut =
        (oPortalOut.y2 - oPortalOut.y1) / (oPortalOut.x2 - oPortalOut.x1);
    const cOut = oPortalOut.y2 - mOut * oPortalOut.x2;

    const rotA = Math.atan((mIn - mOut) / (1 + mIn * mOut));

    const interPx = (cOut - cIn) / (mIn - mOut);
    const interPy = mIn * interPx + cIn;

    const pathIn = new Path2D();
    if (mIn !== 0) {
        pathIn.moveTo((0 - cIn) / mIn, 0);
        pathIn.lineTo((CANVAS_HEIGHT - cIn) / mIn, CANVAS_HEIGHT);
    } else {
        pathIn.moveTo(0, oPortalIn.y1);
        pathIn.lineTo(CANVAS_WIDTH, oPortalIn.y1);
    }
    if (portalIn.dir === 1) {
        pathIn.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
        pathIn.lineTo(CANVAS_WIDTH, 0);
    } else if (portalIn.dir === -1) {
        pathIn.lineTo(0, CANVAS_HEIGHT);
        pathIn.lineTo(0, 0);
    }

    const pathOut = new Path2D();
    if (mOut !== 0) {
        pathOut.moveTo((0 - cOut) / mOut, 0);
        pathOut.lineTo((CANVAS_HEIGHT - cOut) / mOut, CANVAS_HEIGHT);
    } else {
        pathOut.moveTo(0, oPortalOut.y1);
        pathOut.lineTo(CANVAS_WIDTH, oPortalOut.y1);
    }
    if (portalOut.dir === 1) {
        pathOut.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
        pathOut.lineTo(CANVAS_WIDTH, 0);
    } else if (portalOut.dir === -1) {
        pathOut.lineTo(0, CANVAS_HEIGHT);
        pathOut.lineTo(0, 0);
    }

    ctx.save();

    if (
        (portalIn.x1 !== 0 &&
            portalIn.y1 !== 0 &&
            portalIn.x2 !== 0 &&
            portalIn.y2 !== 0) ||
        (portalOut.x1 !== 0 &&
            portalOut.y1 !== 0 &&
            portalOut.x2 !== 0 &&
            portalOut.y2 !== 0)
    ) {
        ctx.clip(pathIn);
    }

    const hatRadius = 0.75 * h_o;
    const balloonRadius = 45 * Math.sign(h_o);

    switch (objType) {
        case OBJ_NAIL:
            {
                drawLine(
                    ctx,
                    ORIGIN_X - d_o,
                    ORIGIN_Y,
                    ORIGIN_X - d_o,
                    ORIGIN_Y - h_o,
                );

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
            break;
        case OBJ_BALLOON:
            {
                if (balloonState !== BALLOON_OPENED_PAPER) {
                    drawLine(
                        ctx,
                        ORIGIN_X - d_o,
                        ORIGIN_Y,
                        ORIGIN_X - d_o,
                        ORIGIN_Y - h_o + 2 * balloonRadius + 12.5,
                    );

                    if (balloonState === BALLOON_INFLATED) {
                        drawCircle(
                            ctx,
                            ORIGIN_X - d_o,
                            ORIGIN_Y - h_o + balloonRadius,
                            balloonRadius,
                            67.5,
                            -247.5,
                        );
                    }
                    drawLine(
                        ctx,
                        ORIGIN_X - d_o - 0.6 * balloonRadius,
                        ORIGIN_Y - h_o + 1.8 * balloonRadius,
                        ORIGIN_X - d_o,
                        ORIGIN_Y - h_o + 2 * balloonRadius + 12.5,
                    );
                    drawLine(
                        ctx,
                        ORIGIN_X - d_o,
                        ORIGIN_Y - h_o + 2 * balloonRadius + 12.5,
                        ORIGIN_X - d_o + 0.6 * balloonRadius,
                        ORIGIN_Y - h_o + 1.8 * balloonRadius,
                    );
                }
            }
            break;
    }

    ctx.restore();

    if (
        (portalIn.x1 === 0 &&
            portalIn.y1 === 0 &&
            portalIn.x2 === 0 &&
            portalIn.y2 === 0) ||
        (portalOut.x1 === 0 &&
            portalOut.y1 === 0 &&
            portalOut.x2 === 0 &&
            portalOut.y2 === 0)
    )
        return;

    ctx.save();

    ctx.clip(pathOut);

    ctx.translate(interPx, interPy);
    console.log((rotA * 180) / Math.PI);
    ctx.rotate(-rotA);
    ctx.rotate(-(Math.PI / 2 - Math.atan(mIn)));
    const dPIn = Math.sqrt(
        (interPx -
            (oPortalIn.y2 > oPortalIn.y1 ? oPortalIn.x2 : oPortalIn.x1)) **
        2 +
        (interPy -
            (oPortalIn.y2 > oPortalIn.y1 ? oPortalIn.y2 : oPortalIn.y1)) **
        2,
    );
    const dPOut = Math.sqrt(
        (interPx -
            (oPortalOut.y2 > oPortalOut.y1 ? oPortalOut.x2 : oPortalOut.x1)) **
        2 +
        (interPy -
            (oPortalOut.y2 > oPortalOut.y1
                ? oPortalOut.y2
                : oPortalOut.y1)) **
        2,
    );

    ctx.translate(0, mOut >= 0 ? dPOut - dPIn : dPIn - dPOut);
    ctx.scale(-portalOut.dir * portalIn.dir, 1);
    ctx.rotate(Math.PI / 2 - Math.atan(mIn));
    ctx.translate(-interPx, -interPy);

    switch (objType) {
        case OBJ_NAIL:
            {
                drawLine(
                    ctx,
                    ORIGIN_X - d_o,
                    ORIGIN_Y,
                    ORIGIN_X - d_o,
                    ORIGIN_Y - h_o,
                );

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
            break;
        case OBJ_BALLOON:
            {
                if (balloonState !== BALLOON_OPENED_PAPER) {
                    drawLine(
                        ctx,
                        ORIGIN_X - d_o,
                        ORIGIN_Y,
                        ORIGIN_X - d_o,
                        ORIGIN_Y - h_o + 2 * balloonRadius + 12.5,
                    );

                    if (balloonState === BALLOON_INFLATED) {
                        drawCircle(
                            ctx,
                            ORIGIN_X - d_o,
                            ORIGIN_Y - h_o + balloonRadius,
                            balloonRadius,
                            67.5,
                            -247.5,
                        );
                    }
                    drawLine(
                        ctx,
                        ORIGIN_X - d_o - 0.6 * balloonRadius,
                        ORIGIN_Y - h_o + 1.8 * balloonRadius,
                        ORIGIN_X - d_o,
                        ORIGIN_Y - h_o + 2 * balloonRadius + 12.5,
                    );
                    drawLine(
                        ctx,
                        ORIGIN_X - d_o,
                        ORIGIN_Y - h_o + 2 * balloonRadius + 12.5,
                        ORIGIN_X - d_o + 0.6 * balloonRadius,
                        ORIGIN_Y - h_o + 1.8 * balloonRadius,
                    );
                }
            }
            break;
    }

    ctx.restore();
}

/**
 * @function
 * @param {CanvasRenderingContext2D} ctx
 */
function drawObjImg(ctx) {
    const hatRadius = 0.75 * h_i;
    const balloonRadius = 45 * Math.sign(h_i) * Math.abs(M);

    switch (objType) {
        case OBJ_NAIL:
            {
                drawLine(
                    ctx,
                    ORIGIN_X - d_i,
                    ORIGIN_Y,
                    ORIGIN_X - d_i,
                    ORIGIN_Y - h_i,
                );

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
            break;
        case OBJ_BALLOON:
            {
                if (balloonState !== BALLOON_OPENED_PAPER) {
                    drawLine(
                        ctx,
                        ORIGIN_X - d_i,
                        ORIGIN_Y,
                        ORIGIN_X - d_i,
                        ORIGIN_Y -
                        h_i +
                        2 * balloonRadius +
                        Math.sign(h_i) * 12.5,
                    );

                    if (balloonState === BALLOON_INFLATED) {
                        drawCircle(
                            ctx,
                            ORIGIN_X - d_i,
                            ORIGIN_Y - h_i + balloonRadius,
                            balloonRadius,
                            67.5,
                            -247.5,
                        );
                    }

                    drawLine(
                        ctx,
                        ORIGIN_X - d_i - 0.6 * balloonRadius,
                        ORIGIN_Y - h_i + 1.8 * balloonRadius,
                        ORIGIN_X - d_i,
                        ORIGIN_Y -
                        h_i +
                        2 * balloonRadius +
                        Math.sign(h_i) * 12.5,
                    );
                    drawLine(
                        ctx,
                        ORIGIN_X - d_i,
                        ORIGIN_Y -
                        h_i +
                        2 * balloonRadius +
                        Math.sign(h_i) * 12.5,
                        ORIGIN_X - d_i + 0.6 * balloonRadius,
                        ORIGIN_Y - h_i + 1.8 * balloonRadius,
                    );
                }
            }
            break;
    }
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
function drawPortals(ctx) {
    drawLine(
        ctx,
        ORIGIN_X - portalIn.x1,
        ORIGIN_Y - portalIn.y1,
        ORIGIN_X - portalIn.x2,
        ORIGIN_Y - portalIn.y2,
        { lineColor: "blue" },
    );
    drawLine(
        ctx,
        ORIGIN_X - portalOut.x1,
        ORIGIN_Y - portalOut.y1,
        ORIGIN_X - portalOut.x2,
        ORIGIN_Y - portalOut.y2,
        { lineColor: "purple" },
    );
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

    clearPortalBtn.parentElement.style.display =
        cursorMode !== CURSOR_PORTAL ? "none" : "block";

    ctx.fillStyle = "white";
    ctx.fillRect(
        ORIGIN_X + 4 * inputScaling,
        ORIGIN_Y - 4 * inputScaling,
        inputScaling * 0.98,
        inputScaling * 1.05,
    );

    drawLine(
        ctx,
        ORIGIN_X - needleX,
        ORIGIN_Y - needleY,
        ORIGIN_X - needleX + inputScaling,
        ORIGIN_Y - needleY,
        {
            lineColor: "lightgray",
        },
    );

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
    drawPortals(ctx);
    drawLabels(ctx);

    if (balloonState === BALLOON_POPPED) {
        drawLine(
            ctx,
            ORIGIN_X - paperX - 25,
            ORIGIN_Y - paperY - 25,
            ORIGIN_X - paperX + 25,
            ORIGIN_Y - paperY - 25,
        );
        drawLine(
            ctx,
            ORIGIN_X - paperX - 25,
            ORIGIN_Y - paperY + 25,
            ORIGIN_X - paperX + 25,
            ORIGIN_Y - paperY + 25,
        );
        drawLine(
            ctx,
            ORIGIN_X - paperX - 25,
            ORIGIN_Y - paperY - 25,
            ORIGIN_X - paperX - 25,
            ORIGIN_Y - paperY + 25,
        );
        drawLine(
            ctx,
            ORIGIN_X - paperX + 25,
            ORIGIN_Y - paperY - 25,
            ORIGIN_X - paperX + 25,
            ORIGIN_Y - paperY + 25,
        );
    }
}

function update() {
    cvSim.style.setProperty("--input-scaling", inputScaling + "px");
    cvSim.style.setProperty("--origin-x", ORIGIN_X + "px");
    cvSim.style.setProperty("--origin-y", ORIGIN_Y + "px");

    const selectedSim = document.querySelector('input[name="sim"]:checked');
    const selectedType = document.querySelector('input[name="type"]:checked');
    simMult = Number(selectedSim.value);
    typeMult = Number(selectedType.value);

    objType = Number(objTypeSelectEl.value);

    cursorMode = Number(cursorModeSelectEl.value);

    f = simMult * typeMult * inputScaling * Number(fInputEl.value);
    d_o = inputScaling * Number(doInputEl.value);
    h_o = inputScaling * Number(hoInputEl.value);

    if (objType === OBJ_BALLOON) {
        if (isAroundObj(ORIGIN_X - needleX, ORIGIN_Y - needleY)) {
            const balloonRadius = 45 * Math.sign(h_o);
            balloonState = BALLOON_POPPED;
            paperX = d_o;
            paperY = h_o - balloonRadius;
        }
    } else {
        balloonState = BALLOON_INFLATED;
    }

    if (cursorMode === CURSOR_PORTAL) {
        if (portalShotState === PORTAL_NONE) portalShotState = PORTAL_IN_START;
    } else {
        portalShotState = PORTAL_NONE;
    }
    if (
        (portalIn.x1 !== 0 &&
            portalIn.y1 !== 0 &&
            portalIn.x2 !== 0 &&
            portalIn.y2 !== 0) ||
        (portalOut.x1 !== 0 &&
            portalOut.y1 !== 0 &&
            portalOut.x2 !== 0 &&
            portalOut.y2 !== 0)
    ) {
        const oPortalIn = {
            x1: ORIGIN_X - portalIn.x1,
            y1: ORIGIN_Y - portalIn.y1,
            x2: ORIGIN_X - portalIn.x2,
            y2: ORIGIN_Y - portalIn.y2,
        };

        const mIn =
            (oPortalIn.y2 - oPortalIn.y1) / (oPortalIn.x2 - oPortalIn.x1);
        const cIn = oPortalIn.y2 - mIn * oPortalIn.x2;

        const hatRadius = Math.max(0.75 * h_o, 25);
        const edgeX = ORIGIN_X - d_o + hatRadius - 7.5 * (h_o / 50);
        const edgeY = ORIGIN_Y - h_o;

        const overlapness = mIn * edgeX + cIn - edgeY;
        if (Math.sign(overlapness) !== Math.sign(mIn)) {
            doInputEl.value =
                (Math.max(portalOut.x1, portalOut.x2) + hatRadius / 2) /
                inputScaling;
            isHolding.obj = false;
            isHolding.cvSim = false;
        }
    }

    d_i = (simMult * f * d_o) / (d_o - f);
    M = (-simMult * d_i) / d_o;
    h_i = M * h_o;

    if (!isHolding.obj && !isHolding.objImg && objType === OBJ_BALLOON) {
        if (balloonState === BALLOON_INFLATED) {
            hoInputEl.value = Number(hoInputEl.value) + 0.05;
        } else if (balloonState === BALLOON_POPPED) {
            if (hoInputEl.value > 0) {
                hoInputEl.value = Number(hoInputEl.value) - 0.05;
            }
        }
    }
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

function main() {
    const deltaTime = Date.now() - prevTime;
    if (deltaTime >= requiredElapsed) {
        update();
        draw();
        prevTime = Date.now();
    }
    requestAnimationFrame(main);
}

setup();
requestAnimationFrame(main);
