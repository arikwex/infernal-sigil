import { horizontal, jump, holdingJump } from './controls';
import { color, renderMesh } from './canvas';

function Player(x, y) {
    const thickness = 9;
    let anim = 0;
    let climbAnim = 0;
    let vx = 0;
    let vy = 0;
    let facing = 1;
    let targetFacing = 1;
    let targetRunning = 0;
    let tailWhip = 0;
    let groundTime = 0;
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

    function update(dT, gameObjects, physicsObjects) {
        anim += dT;
        climbAnim += 14 * dT;

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
        if (jump() && groundTime > 0) {
            vy = -800;
        }

        // Wall physics
        physicsObjects.map((phys) => {
            if (phys.isAABB(x-14,y-55,28,50)) {
                // Sides
                if (x < phys.x) {
                    x = phys.x - 14;
                    vx -= vx * 0.25;
                    return;
                }
                if (x > phys.x + phys.w) {
                    x = phys.x + phys.w + 14;
                    vx -= vx * 0.25;
                    return;
                }
                // Falling to hit top of surface
                if (y - 55 < phys.y && vy >= 0) {
                    vy = 0;
                    y = phys.y + 5.1;
                    groundTime = 0.15;
                }
                // Hit head on bottom of surface)
                if (y + 30 > phys.y + phys.h) {
                    vy = 0;
                    y = phys.y + phys.h + 55;
                }
            }
        });

        if (groundTime <= 0.1 || vy < 0) {
            if (!holdingJump() && vy < 0) {
                vy += 4000 * dT;
            } else {
                vy += 2000 * dT;
            }
        }

        facing += (targetFacing - facing) * 15 * dT;
        vx = Math.max(Math.min(vx, MAX_SPEED), -MAX_SPEED);
        vy = Math.min(vy, TERMINAL_VELOCITY);
        tailWhip += (vy - tailWhip) * 17 * dT;
        smoothGrounded += (((groundTime > 0) ? 1 : 0) - smoothGrounded) * 17 * dT;
        y += dT * vy;
        x += dT * vx;
        groundTime -= dT;
    }

    function render(ctx) {
        const heading = Math.sign(vx) * Math.pow(Math.abs(vx / MAX_SPEED), 0.5);
        const climbing = 1;
        const notClimbing = 1 - climbing;
        const jumping = (1 - smoothGrounded) * notClimbing;
        const notJumping = 1 - jumping;
        const running = targetRunning * notClimbing;
        const idle = (1 - running) * notClimbing;

        const a = anim * 6;
        const t = 
            (-facing * 0.7 + Math.cos(anim * 2) * 0.2) * idle +
            (- 0.6 * heading + Math.cos(a*0.5) * 0.1) * running +
            (- 0.6 * facing) * climbing;

        let pHand1X = 0 + 5 * heading + Math.min(5 * Math.cos(climbAnim*1.5), 0) * facing * climbing;
        let pHand1Y = -37 * idle + (-31 - heading) * running - 39 * climbing;
        let pHand1A = -0.5 * running - 1.2 * tailWhip/800 * notClimbing + (0.9 - 2 * facing) * climbing; // -1.1, 2.9
        let pHand2X = 0 + 4 * heading + Math.min(5 * Math.cos(climbAnim*1.5 + 3), 0) * facing * climbing;
        let pHand2Y = -37 * idle + (-31 + heading) * running - (37 + 2 * facing) * climbing;
        let pHand2A = 0.5 * running + 1.2 * tailWhip/800 * notClimbing + (-1.5*facing - 1) * climbing;
        let pHeadX = 0 + 10 * heading * notClimbing - facing * climbing * 4;
        let pHeadY = -37 * idle + (-23) * running - 39 * climbing;
        let pHeadA = t * 0.3 + 0.2 * heading + (facing * tailWhip/2000) * notClimbing + (-facing * 0.8) * climbing;

        renderMesh(tailMesh, x, y - 8, 0, t + 1.57 + t * 0.3, 0);
        renderMesh(handMesh, x + pHand1X, y + pHand1Y - Math.cos(a + 3) * 1.5 + 1, 0, t, pHand1A);
        renderMesh(bodyMesh, x, y - 8, 0, t, 0);
        renderMesh(handMesh, x + pHand2X, y + pHand2Y - Math.cos(a + 3) * 1.5 + 1, 0, t+3.14, pHand2A);
        renderMesh(headMesh, x + pHeadX, y + pHeadY + Math.cos(a + 1) * 1.5 + 1, 10, t, pHeadA);

        // Body animation
        bodyMesh[1][0] = 10 * heading - 7 * climbing * facing;
        bodyMesh[1][1] = -37 * idle - 23 * running - 35 * climbing;

        // Leg animation
        bodyMesh[2][2] =
            (7 * idle + (Math.cos(a) * 7 - 4) * heading) * notJumping * notClimbing +
            (5 + tailWhip/50) * jumping * facing * notClimbing +
            (14 * facing + Math.min(Math.sin(-climbAnim) * 7, 0)) * climbing;
        bodyMesh[2][3] =
            (Math.min(Math.sin(a) * 7, 0) * running) * notJumping * notClimbing +
            (-4 - tailWhip/70) * jumping * notClimbing +
            (9 * Math.cos(climbAnim) - 8) * climbing;
        bodyMesh[3][2] =
            (-7 * idle + (Math.cos(a + 3.2) * 7 - 4) * heading) * notJumping * notClimbing +
            (-6 + tailWhip/50) * jumping * facing * notClimbing +
            (14 * facing + Math.min(Math.sin(-climbAnim+3) * 7, 0)) * climbing;
        bodyMesh[3][3] =
            (Math.min(Math.sin(a + 3.2) * 7, 0) * running) * notJumping * notClimbing +
            (2 - tailWhip/70) * jumping * notClimbing +
            (9 * Math.cos(climbAnim+3) - 8) * climbing;

        // Tail animation while running
        tailMesh[1][3] = Math.cos(a) * 1 + 31-37-tailWhip/50;
        tailMesh[1][5] = Math.cos(a + 1) * 1 + 31-37-tailWhip/40;
        tailMesh[1][6] = -32-Math.abs(tailWhip/190);
        tailMesh[1][7] = Math.cos(a + 2) * 2 + 22-37-tailWhip/30;
        tailMesh[1][8] = -34+tailWhip/70;
        tailMesh[1][9] = Math.cos(a + 3) * 1 + 15-37-tailWhip/20;
    }

    return {
        update,
        render,
    };
}

export default Player;