import * as bus from './bus';
import { EVENT_ATTACK, EVENT_ATTACK_HIT } from './events';

function HealthSystem(hp, myHitbox, onHitCallback, allowFireball = true, knockback = 0) {
    // [attackHitbox, direction, owner, isFireball]
    function hitCheck(args) {
        if (myHitbox.isTouching(args[0]) && hp > 0 && (!args[3] || allowFireball)) {
            hp -= args[3] ? 2 : 1;
            onHitCallback(args);
            bus.emit(EVENT_ATTACK_HIT, [args[2], args[3] ? 0 : args[1] * knockback]);
        }
    }

    // Enable
    function e() {
        bus.on(EVENT_ATTACK, hitCheck);
    }

    // Disable
    function d() {
        bus.off(EVENT_ATTACK, hitCheck);
    }

    function g() {
        return hp;
    }

    return {
        e,
        d,
        g,
    };
}

export default HealthSystem;