import { ctx } from './canvas';

function inBound(x, w, x2, w2) {
    return (x2 + w2 > x) && (x2 < x + w);
}

function containPt(a, x, y) {
    // DEBUG
    // ctx.beginPath();
    // ctx.lineWidth = 10;
    // ctx.strokeStyle = '#f00';
    // ctx.rect(x - 2, y - 2, 4, 4);
    // ctx.stroke();
    //
    return (x > a.x+a.ox) && (x < a.x+a.ox+a.w) && (y > a.y+a.oy) && (y < a.y+a.oy+a.h);
}

function isTouching(a, b) {
    const c = inBound(a.x+a.ox, a.w, b.x+b.ox, b.w) && inBound(a.y+a.oy, a.h, b.y+b.oy, b.h);
    // DEBUG
    // if (a.debug) {
    //     ctx.beginPath();
    //     ctx.lineWidth = 3;
    //     ctx.strokeStyle = c ? '#f0f' : '#0f0';
    //     ctx.rect(a.x+a.ox, a.y+a.oy, a.w, a.h);
    //     ctx.stroke();
    // }
    // if (b.debug) {
    //     ctx.beginPath();
    //     ctx.lineWidth = 3;
    //     ctx.strokeStyle = c ? '#f0f' : '#0f0';
    //     ctx.rect(b.x+b.ox, b.y+b.oy, b.w, b.h);
    //     ctx.stroke();
    // }
    //
    return c;
}

function BoundingBox(x, y, ox, oy, w, h) {
    const self = {};
    self.set = (x_,y_,ox_,oy_,w_,h_) => { self.x=x_;self.y=y_;self.ox=ox_;self.oy=oy_;self.w=w_;self.h=h_; }
    self.isTouching = (other) => { return isTouching(self, other); }
    self.set(x,y,ox,oy,w,h);
    return self;
}

export {
    BoundingBox,
    isTouching,
    containPt,
};