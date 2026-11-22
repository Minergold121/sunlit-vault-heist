// SUNLIT VAULT — keyboard, mouse and touch input.
// One job: turn device events into one plain input object per frame.
// The game also reads clicks: click = toss a coin at that spot.

export function makeInput() {
  return {
    left: false, right: false, up: false, down: false,
    sneak: false, sprint: false, action: false,
    coinAt: null, // {x, y} in canvas coordinates, consumed by main.js
    smokePressed: false,
    anyKey: false,
  };
}

const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ShiftLeft: 'sneak', ShiftRight: 'sneak',
  Space: 'sprint',
  KeyE: 'action',
  Enter: 'action',
};

export function bindInput(input, canvas, onKey) {
  const down = (e) => {
    const field = KEYMAP[e.code];
    if (field) {
      input[field] = true;
      input.anyKey = true;
      e.preventDefault();
    }
    if (e.code === 'KeyQ') {
      input.smokePressed = true;
      input.anyKey = true;
    }
    if (e.code === 'Space') e.preventDefault();
    if (onKey) onKey(e.code);
  };
  const up = (e) => {
    const field = KEYMAP[e.code];
    if (field) input[field] = false;
  };
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);

  const point = (e) => {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * canvas.width,
      y: ((e.clientY - r.top) / r.height) * canvas.height,
    };
  };
  canvas.addEventListener('mousedown', (e) => {
    input.coinAt = point(e);
    input.anyKey = true;
  });
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
      const t = e.touches[0];
      input.coinAt = point(t);
      input.anyKey = true;
    }
  }, { passive: true });
  return () => {
    window.removeEventListener('keydown', down);
    window.removeEventListener('keyup', up);
  };
}
