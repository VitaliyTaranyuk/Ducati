let audioCtx: AudioContext | null = null;

export function playWheelTick(): void {
  try {
    if (!window.AudioContext) return;
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') void audioCtx.resume();
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1680, t);
    osc.frequency.exponentialRampToValueAtTime(920, t + 0.028);
    gain.gain.setValueAtTime(0.055, t);
    gain.gain.exponentialRampToValueAtTime(0.0008, t + 0.04);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.045);
  } catch {
    /* autoplay or missing audio */
  }
}
