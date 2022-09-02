import { horizontal, vertical, jump, holdingJump, attack, ignite } from './controls';
import { color, renderMesh } from './canvas';
import { getObjectsByTag } from './engine';
import { BoundingBox } from './bbox';
import * as bus from './bus';
import { copy, physicsCheck } from './utils';
import { getCurrentGameState } from './gamestate';
import { headMeshAsset } from './assets';

function Player(x, y) {
    const thickness = 9;
    let anim = 0;
    let climbAnim = 0;
    let vx = 0;
    let vy = 0;
    let facing = 1;
    let targetFacing = 1;
    let targetRunning = 0;
    let targetClimbing = 0;
    let tailWhip = 0;
    let groundTime = 0;
    let smoothGrounded = 0;
    let playerHitbox = new BoundingBox(x, y, -14, -55, 28, 50);
    let injured = 0;
    let hasClaws = false;
    let isDead = false;

    // Climbing
    let unstick = 0; // Disallow sticking while positive
    let stick = 0; // How long have you been stuck to the wall

    // Basic attack
    let smoothAttacking = 0;
    let attackSwipe = 2;
    let attackSwipe2 = 2;
    let attackTime = 1;
    let attackHandFlag = false;
    let attackSeq = 0;
    let MAX_NUM_ATTACK = 3;

    // Fireball attack
    let fireballTime = 0;
    let hasFlame = false;

    // Air jump
    let numAirjumpsUsed = 0;
    let airJump = 0;
    let smoothAirjump = 0;
    let timeSinceJump = 0;
    let MAX_NUM_AIRJUMP = 0;

    // STATES (not really using these tbh, just 0 and 3)
    // IDLE = 0,
    // CLIMBING = 3,
    let state = 0;

    const MAX_SPEED = 400;
    const TERMINAL_VELOCITY = 800;
    const CLIMB_SPEED = 370;

    const headMesh = copy(headMeshAsset);
    const bodyMesh = [
        ['#e22', thickness, 0],
        [0, -37, 0, 20-37],
        [0, 20-37, 7, 0],
        [0, 20-37, -7, 0],
    ];
    const handMesh = [
        ['#e22', thickness, 0],
        [4, 0, 14, 6]
    ];
    const tailMesh = [
        ['#e22', thickness, 0],
        [0, 20-37, -16, 31-37, -26, 31-37, -32, 22-37, -34, 15-37]
    ];
    const flameMesh = [
        ['#ee2', 6, 0],
        [0, 0, -5, -5, 0, -17, 5, -5],
        ['#e62', 6, 0],
        [0, 0, 0, -9]
    ];
    const wingMesh = [
        ['#e22', 3, 0]
    ];
    const WING_FILL = 'rgba(230,100,70,0.5)';

    function grant(ability) {
        // Claws
        if (ability == 0) {
            hasClaws = true;
            handMesh.push(['#def', 3, 0], [18, 5, 25, 8], [15, 9, 22, 13]);
        }
        // Flame
        if (ability == 1) {
            hasFlame = true;
        }
        // Wings
        if (ability == 2) {
            MAX_NUM_AIRJUMP = 1;
            wingMesh.push([0, 0, -20, -10, -50, -5, -55, 15, -25, 6, -40, -5, -25, 6, -20, -10, -25, 6, 0, 4]);
        }
    }


    function update(dT) {
        if (isDead) { return; }
        anim += dT;

        attackTime = Math.min(attackTime + dT, 1);
        attackSwipe = Math.min(attackSwipe + 2 * dT, 1);
        attackSwipe2 = Math.min(attackSwipe2 + 2 * dT, 1);
        fireballTime += dT;

        // Horizontal movement
        const h = horizontal();
        let v = vertical();
        const requestAttack = attack();
        const requestFireball = ignite();

        // If wall-climbing, respect horizontal control as "up"
        if (state == 3 && Math.abs(v) < 0.3 && (Math.abs(h) > 0.3 && Math.sign(h) == Math.sign(facing))) {
            v = 1;
        }

        // Wall physics
        let onGround, onRightWall, onLeftWall, onRoof;
        [x, y, onGround, onRightWall, onLeftWall, onRoof] = physicsCheck(getObjectsByTag('physics'), playerHitbox);
        let onWall = (onRightWall && facing > 0) || (onLeftWall && facing < 0);

        // Disallow sticking to wall during timeout period
        if (onWall && unstick >= 0) {
            onWall = false;
        }

        if (onGround) {
            vy = 0;
            groundTime = 0.15;
            numAirjumpsUsed = 0;
            onGround = true;
        }

        if (onRoof) {
            vy = 0;
        }

        if (state != 3) {
            // Default controls
            if (Math.abs(h) > 0.3) {
                if (attackTime > 0.2) {
                    vx += 3000 * Math.sign(h) * dT * Math.pow(1 - targetClimbing, 6);
                    anim += 2 * dT;
                    targetRunning += (1 - targetRunning) * 4 * dT;
                }
                targetFacing = Math.sign(h);
            } else {
                targetRunning += (0 - targetRunning) * 4 * dT;
            }
            if (Math.sign(h) != Math.sign(vx) || (attackTime < 0.2)) {
                vx -= vx * 14 * dT;
            }

            // Attack
            if (requestAttack && attackTime > 0.18 && attackSeq < MAX_NUM_ATTACK) {
                if (attackHandFlag) {
                    attackSwipe = 0;
                } else {
                    attackSwipe2 = 0;
                }
                attackSeq += 1;
                attackHandFlag = !attackHandFlag;
                attackTime = 0;
                smoothAttacking = 1;
                vx = targetFacing * 850;
                vy = vy * 0.25 - 100;
                bus.emit('attack', [new BoundingBox(x, y, -50 + 50 * targetFacing, -50, 100, 50), targetFacing]);
            }
            if (attackTime > 0.4) {
                attackSeq = 0;
            }
            
            // Fireball
            if (requestFireball && fireballTime > 1.0 && hasFlame) {
                fireballTime = 0;
                attackTime = 0;
                smoothAttacking = 1;
                vx = -targetFacing * 850;
                vy = vy * 0.25 - 100;
                bus.emit('fireball', [x, y-30, targetFacing]);
            }
        } else {
            // Climbing controls
            numAirjumpsUsed = 0;
            if (Math.abs(v) > 0.3) {
                const inf = Math.min(stick * 6, 1);
                y -= CLIMB_SPEED * Math.sign(v) * dT * inf;
                climbAnim += 18 * dT * v * inf;
            } else {
                anim += dT;
                climbAnim -= Math.sin(climbAnim) * 15 * dT;
            }
        }

        if (jump() && timeSinceJump > 0.15) {
            if (state != 3) {
                // Default jump
                if (groundTime > 0) {
                    vy = -1000;
                    timeSinceJump = 0;
                    groundTime = 0;
                } else if (numAirjumpsUsed < MAX_NUM_AIRJUMP) {
                    // Air jump
                    numAirjumpsUsed += 1;
                    airJump = 1;
                    vy = -1000;
                    timeSinceJump = 0;
                    groundTime = 0;
                }
            } else {
                // Wall Jumping
                vy = -1000;
                vx = -facing * 300;
                unstick = 0.1;
                state = 0;
                numAirjumpsUsed = 0;
                groundTime = 0;
                timeSinceJump = 0;
                onWall = false;
            }
        }

        if (!onWall) {
            // If not on the wall while moving up, pop upward
            if (state == 3 && (v > 0.3 || vy < -0.3)) {
                vy = -CLIMB_SPEED * 1.4;
                vx = facing * 300;
                unstick = 0.1;
            }
            state = 0;
        }
        else if (onGround && state == 3) {
            // Touching ground while climbing should release climb
            state = 0;
        }
        else if (onWall && !onGround && attackTime > 0.3 && hasClaws) {
            // Touching wall and no ground should enter climbing mode
            state = 3;
            attackTime = 1;
            vx = 0;
        }
        else if (onWall && onGround && v > 0.3 && hasClaws) {
            // Trying to moving up on wall from ground should engage climbing
            state = 3;
            attackTime = 1;
            vx = 0;
        }


        if (state == 3) {
            // Wall climb physics
            if (vy >= 0) {
                vy -= 20 * vy * dT;
                climbAnim += vy / 10 * dT;
            } else {
                vy -= 10 * vy * dT;
                climbAnim += -vy / 10 * dT;
            }
        } else {
            // Default physics
            if (attackTime < 0.2) {
                vy += 1000 * dT;
            } else if (groundTime <= 0.1 || vy < 0) {
                if (!holdingJump() && vy < 0) {
                    vy += 6000 * dT;
                } else {
                    vy += 2000 * dT;
                }
            }
            stick = 0;
        }

        // Enemy collision checks
        getObjectsByTag('enemy').map(({ enemyHitbox }) => {
            if (isDead) { return; }
            if (playerHitbox.isTouching(enemyHitbox) && injured <= 0 && attackTime > 0.15) {
                injured = 1;
                attackTime = 0;
                vx = Math.sign(x - enemyHitbox.x - enemyHitbox.w/2) * 1100;
                vy = -100;
                if (state == 3) {
                    state = 0;
                    vx = -targetFacing * 300;
                }
                bus.emit('player:hit', 1);
                if (getCurrentGameState().getHp() <= 0) {
                    playerHitbox.ox = -1000;
                    bus.emit('bone:spawn', [x, y - 30, 1, 2]);
                    bus.emit('bone:spawn', [x, y - 30, 8, 1]);
                    isDead = true;
                    setTimeout((() => bus.emit('player:rst')), 1500);
                }
            }
        });

        facing += (targetFacing - facing) * 15 * dT;
        if (injured <= 0.7) {
            vx = Math.max(Math.min(vx, MAX_SPEED), -MAX_SPEED);
        }
        vy = Math.min(vy, TERMINAL_VELOCITY);
        tailWhip += (vy - tailWhip) * 17 * dT;
        smoothGrounded += (((groundTime > 0) ? 1 : 0) - smoothGrounded) * 17 * dT;
        targetClimbing += (((state == 3) ? 1 : 0) - targetClimbing) * ((state == 3) ? 17 : 8) * dT;
        smoothAttacking += (((attackTime < 0.35) ? 1 : 0) - smoothAttacking) * 17 * dT;
        smoothAirjump += (airJump - smoothAirjump) * 17 * dT;
        y += dT * vy;
        x += dT * vx;
        groundTime -= dT;
        unstick -= dT;
        stick += dT;
        airJump = Math.max(airJump - ((state==3) ? 3 * dT : dT), 0);
        timeSinceJump += dT;
        injured = Math.max(0, injured - dT);

        if (!isDead) { playerHitbox.set(x, y, -14, -55, 28, 50); }
    }

    function render(ctx) {
        if (isDead) { return; }

        const heading = Math.sign(vx) * Math.pow(Math.abs(vx / MAX_SPEED), 0.5);
        const attacking = smoothAttacking;
        const notAttack = 1 - attacking;
        const climbing = targetClimbing;
        const notClimbing = 1 - climbing;
        const jumping = (1 - smoothGrounded) * notClimbing;
        const notJumping = 1 - jumping;
        const running = targetRunning * notClimbing * notAttack;
        const idle = (1 - running) * notClimbing;
        const wings = smoothAirjump;
        const notWings = 1 - wings;
        const attackSwipePre = 1 - Math.exp(-attackSwipe * 6.0);
        const attackSwipeTiming = attackSwipePre - Math.pow(attackSwipe/1.5, 2);
        const attackSwipePre2 = 1 - Math.exp(-attackSwipe2 * 6.0);
        const attackSwipeTiming2 = attackSwipePre2 - Math.pow(attackSwipe2/1.5, 2);

        const a = anim * 6;
        const t =
            (-facing * 0.7 + Math.cos(anim * 2) * 0.2) * idle +
            (- 0.6 * heading + Math.cos(a*0.5) * 0.1) * running +
            (- 0.6 * facing) * climbing;

        let pHand1X =
            5 * heading +
            Math.min(5 * Math.cos(climbAnim*1.5), 0) * facing * climbing +
            (facing > 0 ?
                (15 + 35 * attackSwipeTiming - 40 * attackSwipeTiming * attackSwipeTiming) :
                (- 15 * attackSwipeTiming)
             ) * attacking;
        let pHand1Y =
            -37 * idle * notAttack +
            (-31 - heading) * running * notAttack +
            (-39 + 2 * Math.sin(climbAnim*1.5)) * climbing +
            (facing > 0 ?
                (-40 + 10 * attackSwipeTiming) :
                (-28)
            ) * attacking;
        let pHand1A =
            -0.5 * running +
            -1.2 * tailWhip/800 * notClimbing * notAttack +
            (0.9 - 2 * facing) * climbing +
            (facing > 0 ?
                (-1.2 + 2.8 * attackSwipeTiming):
                (-0.9 + 4.0 * attackSwipeTiming)
            ) * attacking;

        let pHand2X =
            4 * heading * notAttack +
            Math.min(5 * Math.cos(climbAnim*1.5 + 3), 0) * facing * climbing +
            (facing > 0 ?
                (-3 + 15 * attackSwipeTiming2) :
                (-15 - 35 * attackSwipeTiming2 + 40 * attackSwipeTiming2 * attackSwipeTiming2)
            ) * attacking
        let pHand2Y =
            -37 * idle * notAttack +
            (-31 + heading) * running * notAttack +
            (-37 - 2 * facing + 2 * Math.sin(climbAnim*1.5 + 3)) * climbing +
            (facing > 0 ?
                (-28) :
                (-40 + 10 * attackSwipeTiming2)
             ) * attacking;
        let pHand2A =
            0.5 * running * notAttack +
            1.2 * tailWhip/800 * notClimbing +
            (-1.5 * facing - 1) * climbing +
            (facing > 0 ?
                (0.9 - 4.0 * attackSwipeTiming2) :
                (1.6 - 2.9 * attackSwipeTiming2)
            ) * attacking;

        let pHeadX =
            10 * (heading * notClimbing * notAttack + attacking * facing) +
            facing * climbing * 6;
        let pHeadY =
            -37 * idle * notAttack +
            (-23) * (running * notAttack + attacking) +
            -43 * climbing;
        let pHeadA =
            t * 0.3 +
            0.2 * heading +
            (facing * tailWhip/2000) * notClimbing +
            (-facing * 1.1) * climbing;
        let pHeadT =
            t +
            (Math.sin(climbAnim*1.2) * 0.15 - 0.2) * climbing +
            (attackSwipeTiming * 0.5 - attackSwipeTiming2 * 0.5) * attacking;

        // Back swipe render
        const xfm = ctx.getTransform();
        const swipe1 = (facing > 0) ? attackSwipePre : attackSwipePre2;
        const swipe2 = (facing > 0) ? attackSwipePre2 : attackSwipePre;
        color(hasClaws ? '#3af' : '#999');
        ctx.translate(x, y);
        if (facing < 0) {
            ctx.scale(-1, 1);
        }
        if (swipe1 < 0.95) {
            ctx.lineWidth = hasClaws ? 4 : 2;
            ctx.beginPath();
            ctx.ellipse(5, -25, 80, 20, 0.1, -2.5 + 4 * swipe1, 0.5 + swipe1);
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(5, -25, 70, 30, -0.2, -2.5 + 4 * swipe1, 0.5 + swipe1);
            ctx.stroke();
        }
        ctx.setTransform(xfm);

        // Body animation
        bodyMesh[1][0] = 10 * heading * notAttack - 7 * climbing * facing + 15 * attacking * facing;
        bodyMesh[1][1] = -37 * idle * notAttack - 23 * (running * notAttack + attacking) - 35 * climbing;

        // Leg animation
        bodyMesh[2][2] =
            (7 * idle + (Math.cos(a) * 7 - 4) * heading) * notJumping * notClimbing +
            (5 + tailWhip/50) * jumping * facing * notClimbing +
            (14 * facing + Math.min(Math.sin(-climbAnim) * 7, 0)) * climbing;
        bodyMesh[2][3] =
            (Math.min(Math.sin(a) * 7, 0) * running) * notJumping * notClimbing +
            (-4 - tailWhip/70) * jumping * notClimbing +
            (9 * Math.cos(climbAnim) * facing - 8) * climbing;
        bodyMesh[3][2] =
            (-7 * idle + (Math.cos(a + 3.2) * 7 - 4) * heading) * notJumping * notClimbing +
            (-6 + tailWhip/50) * jumping * facing * notClimbing +
            (14 * facing + Math.min(Math.sin(-climbAnim+3) * 7, 0)) * climbing;
        bodyMesh[3][3] =
            (Math.min(Math.sin(a + 3.2) * 7, 0) * running) * notJumping * notClimbing +
            (2 - tailWhip/70) * jumping * notClimbing +
            (9 * Math.cos(climbAnim+3) * facing - 8) * climbing;

        // Tail animation while running
        tailMesh[1][3] = Math.cos(a) * 1 + 31-37-tailWhip/50;
        tailMesh[1][5] = Math.cos(a + 1) * 1 + 31-37-tailWhip/40;
        tailMesh[1][6] = -32-Math.abs(tailWhip/290);
        tailMesh[1][7] = Math.cos(a + 2) * 2 + 22-37-tailWhip/30;
        tailMesh[1][8] = -34+tailWhip/70;
        tailMesh[1][9] = Math.cos(a + 3) * 1 + 15-37-tailWhip/20;

        // Render layers of mesh
        if (injured > 0.1) {
            ctx.globalAlpha = Math.cos(injured*50) > 0 ? 0.2 : 1;
        }
        renderMesh(tailMesh, x, y - 8, 0, t + 1.57 + t * 0.3, 0);
        if (hasFlame) {
            renderMesh(flameMesh, x, y+tailMesh[1][9]-8, tailMesh[1][8], t + t * 0.3, -heading * 0.3 + Math.cos(y/14) * 0.1);
        }
        if (facing > 0) {
            renderMesh(handMesh, x + pHand1X, y + pHand1Y - Math.cos(a + 3) * 1.5 + 1, 0, t, pHand1A);
        } else {
            renderMesh(handMesh, x + pHand2X, y + pHand2Y - Math.cos(a + 3) * 1.5 + 1, 0, t+3.14, pHand2A);
        }
        ctx.fillStyle
        renderMesh(wingMesh, x-2, y - 37 + attacking * 6, 0, 0 * wings + (t * 0.4 + 1.4) * notWings, -0.7 * notWings + tailWhip/2000 - wings * wings * 4 + 2.8 * airJump, WING_FILL);
        renderMesh(wingMesh, x+2, y - 37 + attacking * 6, 0, 3.14 * wings + (t * 0.4 + 1.6) * notWings, 0.7 * notWings + tailWhip/2000 + wings * wings * 4.4 - 2.8 * airJump, WING_FILL);
        renderMesh(bodyMesh, x, y - 8, 0, t, 0);
        renderMesh(headMesh, x + pHeadX, y + pHeadY + Math.cos(a + 1) * 1.5 + 1, 10, pHeadT, pHeadA);
        if (facing > 0) {
            renderMesh(handMesh, x + pHand2X, y + pHand2Y - Math.cos(a + 3) * 1.5 + 1, 0, t+3.14, pHand2A);
        } else {
            renderMesh(handMesh, x + pHand1X, y + pHand1Y - Math.cos(a + 3) * 1.5 + 1, 0, t, pHand1A);
        }
        ctx.globalAlpha = 1;

        // Front swipe render
        color(hasClaws ? '#3af' : '#999');
        ctx.translate(x, y);
        if (facing < 0) {
            ctx.scale(-1, 1);
        }
        if (swipe2 < 0.95) {
            ctx.lineWidth = hasClaws ? 4 : 2;
            ctx.beginPath();
            ctx.ellipse(5, -25, 80, 20, 0.2, -swipe2, 3 - 4 * swipe2);
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(5, -25, 70, 30, 0.1, -swipe2, 3 - 4 * swipe2);
            ctx.stroke();
        }
        ctx.setTransform(xfm);
    }

    function reset(x_, y_) {
        isDead = false;
        playerHitbox.x = x_ + 50;
        playerHitbox.y = y_;
        getObjectsByTag('camera')[0].aim(x_, y_, 1, true);
    }

    function enable() {
        bus.on('player:grant', grant);
    }

    function disable() {
        bus.off('player:grant', grant);
    }

    return {
        update,
        render,
        enable,
        disable,
        order: 1000,
        tags: ['player'],
        playerHitbox,
        grant,
        reset,
    };
}

export default Player;