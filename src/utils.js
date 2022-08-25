function clamp(v, min, max) {
    return Math.max(Math.min(v,max), min);
}

export {
    clamp,
}