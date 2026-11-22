// SUNLIT VAULT — tiny synthesised sounds, no audio files.
// One job: short WebAudio bleeps for pickup, alarm, smoke, win and caught.
// Silence is fine: every call is guarded, and audio starts on first input.

let ctx = null;

function audio() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  } catch {
    return null;
  }
  return ctx;
}

export function unlockAudio() {
  const c = audio();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
}

function beep(freq, dur, type, vol, when = 0) {
  const c = audio();
  if (!c) return;
  try {
    const t0 = c.currentTime + when;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  } catch {
    // Sound never blocks the game.
  }
}

export const sfx = {
  pickup() { beep(880, 0.14, 'sine', 0.12); beep(1320, 0.18, 'sine', 0.1, 0.07); },
  coin() { beep(1560, 0.08, 'triangle', 0.1); },
  smoke() { beep(220, 0.3, 'sawtooth', 0.05); },
  spotted() { beep(520, 0.12, 'square', 0.07); beep(520, 0.12, 'square', 0.07, 0.16); },
  vault() { beep(660, 0.12, 'sine', 0.12); beep(880, 0.12, 'sine', 0.12, 0.1); beep(1100, 0.22, 'sine', 0.12, 0.2); },
  win() { [523, 659, 784, 1046].forEach((f, i) => beep(f, 0.22, 'sine', 0.13, i * 0.13)); },
  caught() { [392, 330, 262, 196].forEach((f, i) => beep(f, 0.2, 'sawtooth', 0.08, i * 0.14)); },
  step() { beep(140, 0.04, 'sine', 0.03); },
};
