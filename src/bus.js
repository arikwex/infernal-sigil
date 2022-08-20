let HANDLES = {};
  
function clear() {
  HANDLES = {};
}

function on(e, handler) {
  (HANDLES[e] || (HANDLES[e] = [])).push(handler)
}

function off(e, handler) {
  (HANDLES[e] = (HANDLES[e] || []).filter((x) => x != handler))
}

function emit(e, data) {
  (HANDLES[e] || []).map((handler) => handler(data));
}

export {
  clear,
  on,
  off,
  emit,
};