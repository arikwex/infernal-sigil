import { horizontal, jump, holdingJump } from './controls';
import { color, renderMesh } from './canvas';

function Player(x, y) {
    const thickness = 9;
    let anim = 0;
    let vx = 0;
    let vy = 0;
    let facing = 1;
    let targetFacing = 1;
    let targetRunning = 0;
    let tailWhip = 0;
    let grounded = 0;
    let smoothGrounded = 0;
    
    const MAX_SPEED = 400;
    const TERMINAL_VELOCITY = 800;

    const headMesh = [
        ['#e22', thickness, 0],
        [14, -40, 18, -26, 1, 0, -1, 0, -18, -26, -14, -40],
        [-7, -11, 7, -11],
        ['#fff', 4, 5],
        [-9, -11, -3, -9],
        [9, -11, 3, -9],
    ];
    const bodyMesh = [
        ['#e22', thickness, 0],
        [0, -37, 0, 20-37],
        [0, 20-37, 7, 0],
        [0, 20-37, -7, 0],
    ];
    const handMesh = [
        ['#e22', thickness, 0],
        [4, 0, 14, 6],
        ['#ee2', 3, 0],
        [18, 5, 22, 8],
        [15, 9, 19, 13],
    ];
    const tailMesh = [
        ['#e22', thickness, 0],
        [0, 20-37, -16, 31-37, -26, 31-37, -32, 22-37, -34, 15-37]
    ];

    function update(dT) {
        anim += dT;

        // Running
        const h = horizontal();
        if (Math.abs(h) > 0.3) {
            vx += 3000 * Math.sign(h) * dT;
            anim += 2 * dT;
            targetRunning += (1 - targetRunning) * 4 * dT;
            targetFacing = Math.sign(h);
        } else {
            targetRunning += (0 - targetRunning) * 4 * dT;
        }
        if (Math.sign(h) != Math.sign(vx)) {
            vx -= vx * 14 * dT;
        }

        // jumping
        if (jump() && vy == 0) {
            vy = -800;
            grounded = 0;
        }
        if (y < 300 || vy < 0) {
            if (!holdingJump() && vy < 0) {
                vy += 4000 * dT;
            } else {
                vy += 2000 * dT;
            }
        } else {
            vy = 0;
            y = 300;
            grounded = 1;
        }

        facing += (targetFacing - facing) * 15 * dT;
        vx = Math.max(Math.min(vx, MAX_SPEED), -MAX_SPEED);
        vy = Math.min(vy, TERMINAL_VELOCITY);
        tailWhip += (vy - tailWhip) * 17 * dT;
        smoothGrounded += (grounded - smoothGrounded) * 17 * dT;
        y += dT * vy;
        x += dT * vx;
    }

    function render(ctx) {
        const heading = Math.sign(vx) * Math.pow(Math.abs(vx / MAX_SPEED), 0.5);
        const jumping = 1 - smoothGrounded;
        const notJumping = 1 - jumping;
        const running = targetRunning;
        const idle = 1 - running;

        const a = anim * 6;
        const t = (-facing * 0.7 + Math.cos(anim * 2) * 0.2) * idle + (- 0.6 * heading + Math.cos(a*0.5) * 0.1) * running;
        const p = 0.4;

        let pHand1X = 0 + 5 * heading;
        let pHand1Y = -37 * idle + (-31 - heading) * running;
        let pHand1A = -0.5 * running;
        let pHand2X = 0 + 4 * heading;
        let pHand2Y = -37 * idle + (-31 + heading) * running;
        let pHand2A = 0.5 * running;
        let pHeadX = 0 + 10 * heading;
        let pHeadY = -37 * idle + (-23) * running;

        renderMesh(tailMesh, x, y - 8, 0, t + 1.57 + t * 0.3, 0);
        renderMesh(handMesh, x + pHand1X, y + pHand1Y - Math.cos(a + 3) * 1.5 + 1, 0, t, pHand1A-1.2 * tailWhip/800);
        renderMesh(bodyMesh, x, y - 8, 0, t, 0);
        renderMesh(handMesh, x + pHand2X, y + pHand2Y - Math.cos(a + 3) * 1.5 + 1, 0, t+3.14, pHand2A+1.2 * tailWhip/800);
        renderMesh(headMesh, x + pHeadX, y + pHeadY + Math.cos(a + 1) * 1.5 + 1, 10, t, t*0.3 + 0.2 * heading + facing * tailWhip/2000);

        // Body animation
        bodyMesh[1][0] = 10 * heading;
        bodyMesh[1][1] = -37 * idle - 23 * running;

        // Leg animation
        bodyMesh[2][2] = (7 * idle + (Math.cos(a) * 7 - 4) * heading) * notJumping + (5 + tailWhip/50) * jumping * facing;
        bodyMesh[2][3] = (Math.min(Math.sin(a) * 7, 0) * running) * notJumping + (-4 - tailWhip/70) * jumping;
        bodyMesh[3][2] = (-7 * idle + (Math.cos(a + 3.2) * 7 - 4) * heading) * notJumping + (-6 + tailWhip/50) * jumping * facing;
        bodyMesh[3][3] = (Math.min(Math.sin(a + 3.2) * 7, 0) * running) * notJumping + (2 - tailWhip/70) * jumping;

        // Tail animation while running
        tailMesh[1][3] = Math.cos(a) * 1 + 31-37-tailWhip/50;
        tailMesh[1][5] = Math.cos(a + 1) * 1 + 31-37-tailWhip/40;
        tailMesh[1][7] = Math.cos(a + 2) * 2 + 22-37-tailWhip/30;
        tailMesh[1][9] = Math.cos(a + 3) * 1 + 15-37-tailWhip/20;
    }

    return {
        update,
        render,
    };
}

export default Player;