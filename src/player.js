import { horizontal, vertical, jump, holdingJump, attack, ignite, dash } from './controls';
import { color, renderMesh, retainTransform } from './canvas';
import { getObjectsByTag } from './engine';
import { BoundingBox } from './bbox';
import * as bus from './bus';
import { clamp, copy, physicsCheck } from './utils';
import { getHp } from './gamestate';
import { headMeshAsset } from './assets';
import { EVENT_ATTACK, EVENT_ATTACK_HIT, EVENT_BONE_SPAWN, EVENT_DASH, EVENT_FIREBALL, EVENT_FLAP, EVENT_JUMP, EVENT_PLAYER_ABILITY_GRANT, EVENT_PLAYER_HIT, EVENT_PLAYER_RESET, EVENT_WALK } from './events';
import { TAG_CAMERA, TAG_ENEMY, TAG_PLAYER } from './tags';

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
    let playerHitbox = BoundingBox(x, y, -14, -55, 28, 50);
    let injured = 0;
    let hasClaws = false;
    let isDead = false;
    let walkTick = 0;

    // Climbing
    let isClimbingWall = false;
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

    // Dash
    let dashTimer = 1;
    let dashing = false;
    let canDash = false; // can you dash right now? (grounded or walled)
    let hasDash = false; // was ability learned yet?

    // Fireball attack
    let fireballTime = 0;
    let hasFlame = false;

    // Air jump
    let numAirjumpsUsed = 0;
    let airJump = 0;
    let smoothAirjump = 0;
    let timeSinceJump = 0;
    let MAX_NUM_AIRJUMP = 0;

    const MAX_SPEED = 400;
    const TERMINAL_VELOCITY = 800;
    const CLIMB_SPEED = 370;

    // True allows using fireball and dash from wall
    let allowWallAbilities = false;

    // Head with no horns
    let headMesh = copy(headMeshAsset);
    headMesh[1].pop(); headMesh[1].pop();
    headMesh[1].shift(); headMesh[1].shift();
    headMesh[1][0] = 10;
    headMesh[1][6] = -10;
    headMesh[1][1] = headMesh[1][7] = -16;
    headMesh.unshift([10, -16, 11, -27]);
    headMesh.unshift([-10, -16, -11, -27]);
    headMesh.unshift(['#caa', 6, 0]);

    const bodyMesh = [
        ['#e22', thickness, 0],
        [0, -37, 0, 20-37],
        [0, 20-37, 7, 0],
        [0, 20-37, -7, 0],
    ];
    const handMesh = [
        ['#e22', thickness, 0],
        [4, 0, 14, 6],
        ['#e66', 2, 0], [18, 5, 20, 6], [15, 9, 17, 11]
    ];
    const tailMesh = [
        ['#e22', thickness, 0],
        [0, 20-37, -16, 0, -26, 0, 0, 0, 0, 0]
    ];
    const flameMesh = [
        ['#f93', 6, 0],
        [0, 0, -5, -5, 0, -17, 5, -5],
        ['#f53', 6, 0],
        [0, 0, 0, -9]
    ];
    const wingMesh = [
        ['#e22', 3, 0]
    ];
    const WING_FILL = 'rgba(230,100,70,0.5)';

    function grant(ability) {
        // Dash
        if (ability == 0) {
            hasDash = true;
            headMesh = copy(headMeshAsset);
        }
        // Claws
        if (ability == 1) {
            hasClaws = true;
            handMesh.pop();handMesh.pop();handMesh.pop();
            handMesh.push(['#def', 3, 0], [18, 5, 25, 8], [15, 9, 22, 13]);
        }
        // Flame
        if (ability == 2) {
            hasFlame = true;
        }
        // Wings
        if (ability == 3) {
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
        dashTimer += dT;

        // Horizontal movement
        const h = horizontal();
        let v = vertical();
        const requestAttack = attack();
        const requestFireball = ignite();
        const requestDash = dash();

        if (requestDash && canDash && hasDash && (!isClimbingWall || allowWallAbilities) && dashTimer > 0.8) {
            dashTimer = 0;
            dashing = true;
            attackTime = 0.0;
            canDash = false;
            if (isClimbingWall && allowWallAbilities) {
                // Dash away from wall (if applicable)
                targetFacing *= -1;
                facing = targetFacing;
                vx = targetFacing * 1000;
                x += targetFacing * 10;
                playerHitbox.x = x;
                isClimbingWall = false;
            } else {
                vx = targetFacing * 1000;
            }
            bus.emit(EVENT_DASH);
        }

        // If wall-climbing, respect horizontal control as "up"
        if (isClimbingWall && Math.abs(v) < 0.3 && (Math.abs(h) > 0.3 && Math.sign(h) == Math.sign(facing))) {
            v = 1;
        }

        // Wall physics
        let onGround, onRightWall, onLeftWall, onRoof;
        [x, y, onGround, onRightWall, onLeftWall, onRoof] = physicsCheck(playerHitbox);
        let onWall = (onRightWall && facing > 0) || (onLeftWall && facing < 0);

        // Disallow sticking to wall during timeout period
        if (onWall && unstick >= 0) {
            onWall = false;
        }

        if (onGround) {
            if (vy > -100 && !holdingJump()) {
                vy = 0;
            }
            groundTime = 0.15;
            numAirjumpsUsed = 0;
            onGround = true;
            canDash = true;
        }

        if (onRoof) {
            vy = 0;
        }

        if (!isClimbingWall) {
            // Default controls
            if (!dashing) {
                if (Math.abs(h) > 0.3) {
                    if (attackTime > 0.2) {
                        vx += 3000 * Math.sign(h) * dT * Math.pow(1 - targetClimbing, 6);
                        anim += 2 * dT;
                        targetRunning += (1 - targetRunning) * 4 * dT;
                    }
                    targetFacing = Math.sign(h);
                    if (onGround) {
                        walkTick += dT;
                        if (walkTick > 0.13) {
                            bus.emit(EVENT_WALK);
                            walkTick = -Math.random()/40;
                        }
                    }
                } else {
                    targetRunning += (0 - targetRunning) * 4 * dT;
                }
                if (Math.sign(h) != Math.sign(vx) || (attackTime < 0.2)) {
                    vx -= vx * 14 * dT;
                }
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
                bus.emit(EVENT_ATTACK, [BoundingBox(x, y, -50 + 50 * targetFacing, -50, 100, 50), targetFacing]);
            }
            if (attackTime > 0.4) {
                attackSeq = 0;
            }
            
            // Fireball
            if (requestFireball && fireballTime > 1 && hasFlame) {
                fireballTime = 0;
                attackTime = 0;
                smoothAttacking = 1;
                vx = -targetFacing * 850;
                vy = vy * 0.25 - 100;
                bus.emit(EVENT_FIREBALL, [x, y-30, targetFacing]);
            }
        } else {
            // Climbing controls
            numAirjumpsUsed = 0;
            if (Math.abs(v) > 0.3) {
                y -= CLIMB_SPEED * Math.sign(v) * dT * Math.min(stick * 6, 1);
                climbAnim += 18 * dT * v * Math.min(stick * 6, 1);
                walkTick += dT;
                if (walkTick > 0.13) {
                    bus.emit(EVENT_WALK);
                    walkTick = -Math.random()/40;
                }
            } else {
                anim += dT;
                climbAnim -= Math.sin(climbAnim) * 15 * dT;
            }

            // Fireball from wall
            if (allowWallAbilities && requestFireball && fireballTime > 1 && hasFlame) {
                fireballTime = 0;
                facing = -targetFacing;
                smoothAttacking = 1;
                bus.emit(EVENT_FIREBALL, [x, y-30, -targetFacing]);
            }
        }

        if (jump() && timeSinceJump > 0.15) {
            if (!isClimbingWall) {
                // Default jump
                if (groundTime > 0) {
                    vy = -1000;
                    timeSinceJump = 0;
                    groundTime = 0;
                    dashing = false;
                    bus.emit(EVENT_JUMP);
                } else if (numAirjumpsUsed < MAX_NUM_AIRJUMP) {
                    // Air jump
                    numAirjumpsUsed += 1;
                    airJump = 1;
                    vy = -1000;
                    timeSinceJump = 0;
                    groundTime = 0;
                    dashing = false;
                    canDash = true;
                    dashTimer = 1;
                    bus.emit(EVENT_FLAP);
                }
            } else {
                // Wall Jumping
                vy = -1000;
                vx = -facing * 300;
                unstick = 0.1;
                isClimbingWall = false;
                numAirjumpsUsed = 0;
                groundTime = 0;
                timeSinceJump = 0;
                onWall = false;
                bus.emit(EVENT_JUMP);
            }
        }

        if (!onWall) {
            // If not on the wall while moving up, pop upward
            if (isClimbingWall && (v > 0.3 || vy < -0.3)) {
                vy = -CLIMB_SPEED * 1.4;
                vx = facing * 300;
                unstick = 0.1;
            }
            isClimbingWall = false;
        }
        else if (onGround && isClimbingWall) {
            // Touching ground while climbing should release climb
            isClimbingWall = false;
        }
        else if (onWall && !onGround && (attackTime > 0.3 || dashing) && hasClaws) {
            // Touching wall and no ground should enter climbing mode
            isClimbingWall = true;
            if (dashTimer < 0.7) { dashTimer = 0.7; }
            dashing = false;
            attackTime = 1;
            vx = 0;
        }
        else if (onWall && onGround && v > 0.3 && hasClaws) {
            // Trying to moving up on wall from ground should engage climbing
            isClimbingWall = true;
            if (dashTimer < 0.7) { dashTimer = 0.7; }
            dashing = false;
            attackTime = 1;
            vx = 0;
        }


        if (isClimbingWall) {
            canDash = true;
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
        getObjectsByTag(TAG_ENEMY).map(({ enemyHitbox }) => {
            if (isDead || dashTimer < 0.3) { return; }
            if (playerHitbox.isTouching(enemyHitbox) && injured <= 0 && attackTime > 0.15) {
                injured = 1;
                attackTime = 0;
                vx = Math.sign(x - enemyHitbox.x - enemyHitbox.w/2) * 1100;
                vy = -100;
                if (isClimbingWall) {
                    isClimbingWall = false;
                    vx = -targetFacing * 300;
                }
                bus.emit(EVENT_PLAYER_HIT, 1);
                if (getHp() <= 0) {
                    playerHitbox.ox = -1000;
                    bus.emit(EVENT_BONE_SPAWN, [x, y - 30, 1, 2]);
                    bus.emit(EVENT_BONE_SPAWN, [x, y - 30, 8, 1]);
                    isDead = true;
                    setTimeout((() => bus.emit(EVENT_PLAYER_RESET)), 1500);
                }
            }
        });

        // DASH
        if (dashing) {
            if (dashTimer < 0.27) {
                vx = targetFacing * 4800 * (0.33 - dashTimer);
                vy = 0;
            } else {
                dashing = false;
            }
        }

        facing += (targetFacing - facing) * 15 * dT;
        if (injured <= 0.7) {
            if (!dashing) {
                vx = clamp(vx, -MAX_SPEED, MAX_SPEED);
            }
        }
        vy = Math.min(vy, TERMINAL_VELOCITY);
        tailWhip += (vy - tailWhip) * 17 * dT;
        smoothGrounded += (((groundTime > 0) ? 1 : 0) - smoothGrounded) * 17 * dT;
        targetClimbing += ((isClimbingWall ? 1 : 0) - targetClimbing) * (isClimbingWall ? 17 : 8) * dT;
        smoothAttacking += (((attackTime < 0.35) ? 1 : 0) - smoothAttacking) * 17 * dT;
        smoothAirjump += (airJump - smoothAirjump) * 17 * dT;
        
        // Smoother player physics to avoid clipping
        playerHitbox.x = x;
        playerHitbox.y = y;
        for (let i = 0; i < 3; i++) {
            playerHitbox.x += dT * vx / 3;
            playerHitbox.y += dT * vy / 3;
            [x, y, _, _, _, onRoof] = physicsCheck(playerHitbox);
            if (onRoof) { vy = 0; }
            if (!isDead) { playerHitbox.set(x, y, -14, -55, 28, 50); }
        }

        groundTime -= dT;
        unstick -= dT;
        stick += dT;
        airJump = Math.max(airJump - (isClimbingWall ? 3 * dT : dT), 0);
        timeSinceJump += dT;
        injured = Math.max(0, injured - dT);
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
            (-facing * 1.1) * climbing +
            (dashing ? (0.3-dashTimer)*4*facing : 0);
        let pHeadT =
            t +
            (Math.sin(climbAnim*1.2) * 0.15 - 0.2) * climbing +
            (attackSwipeTiming * 0.5 - attackSwipeTiming2 * 0.5) * attacking;

        // Back swipe render
        const swipe1 = (facing > 0) ? attackSwipePre : attackSwipePre2;
        const swipe2 = (facing > 0) ? attackSwipePre2 : attackSwipePre;
        retainTransform(() => {
            color(hasClaws ? '#3af' : '#999');
            ctx.translate(x, y);
            if (facing < 0) {
                ctx.scale(-1, 1);
            }
            if (swipe1 < 0.95) {
                ctx.lineWidth = hasClaws ? 4 : 2;
                ctx.beginPath();
                ctx.ellipse(5, -25, 86, 20, 0.1, -2.5 + 4 * swipe1, 0.5 + swipe1);
                ctx.stroke();
                ctx.beginPath();
                ctx.ellipse(5, -25, 76, 30, -0.2, -2.5 + 4 * swipe1, 0.5 + swipe1);
                ctx.stroke();
            }
        });

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
        tailMesh[1][3] = Math.cos(a) + 31-37-tailWhip/50;
        tailMesh[1][5] = Math.cos(a + 1) + 31-37-tailWhip/40;
        tailMesh[1][6] = -32-Math.abs(tailWhip/290);
        tailMesh[1][7] = Math.cos(a + 2) * 2 + 22-37-tailWhip/30;
        tailMesh[1][8] = -34+tailWhip/70;
        tailMesh[1][9] = Math.cos(a + 3) + 15-37-tailWhip/20;

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

        retainTransform(() => {
            // Front swipe render
            color(hasClaws ? '#3af' : '#999');
            ctx.translate(x, y);
            if (facing < 0) {
                ctx.scale(-1, 1);
            }
            if (swipe2 < 0.95) {
                ctx.lineWidth = hasClaws ? 4 : 2;
                ctx.beginPath();
                ctx.ellipse(5, -25, 86, 20, 0.2, -swipe2, 3 - 4 * swipe2);
                ctx.stroke();
                ctx.beginPath();
                ctx.ellipse(5, -25, 76, 30, 0.1, -swipe2, 3 - 4 * swipe2);
                ctx.stroke();
            }

            // Dash trail
            if (dashTimer < 0.24) {
                ctx.translate(-120, 0);
                color('#eee');
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.ellipse(5, -36, 80, 10, -0.1, 1 - dashTimer * 8, 3 - dashTimer * 15);
                ctx.stroke();
                ctx.beginPath();
                ctx.ellipse(5, -36, 70, 5, 0.1, 1 - dashTimer * 8, 3 - dashTimer * 15);
                ctx.stroke();
            }
        });
    }

    function reset(x_, y_) {
        isDead = false;
        x = x_; y = y_;
        playerHitbox.set(x, y, -14, -55, 28, 50);
        vx = vy = 0;
        getObjectsByTag(TAG_CAMERA)[0].aim(x, y, 1, true);
    }

    function onAttackHit([, dir]) {
        if (dir) {
            vx = -dir * 300;
        }
    }

    bus.on(EVENT_PLAYER_ABILITY_GRANT, grant);
    bus.on(EVENT_ATTACK_HIT, onAttackHit);

    return {
        update,
        render,
        order: 1000,
        tags: [TAG_PLAYER],
        playerHitbox,
        grant,
        reset,
        getDir: () => targetFacing,
        getVX: () => vx,
        getVY: () => vy,
    };
}

export default Player;