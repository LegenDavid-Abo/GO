"use client";

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext || (window as any).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, duration: number, type: OscillatorType, gainPeak: number) {
  const audio = getContext();
  if (!audio) return;

  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audio.currentTime + start);

  gain.gain.setValueAtTime(0, audio.currentTime + start);
  gain.gain.linearRampToValueAtTime(gainPeak, audio.currentTime + start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + start + duration);

  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(audio.currentTime + start);
  osc.stop(audio.currentTime + start + duration + 0.05);
}

/** A short, cheerful ascending "hurray" chime for a verified scan. */
export function playVerifiedChime() {
  tone(523.25, 0, 0.14, "triangle", 0.22); // C5
  tone(659.25, 0.1, 0.14, "triangle", 0.22); // E5
  tone(783.99, 0.2, 0.16, "triangle", 0.22); // G5
  tone(1046.5, 0.32, 0.3, "triangle", 0.25); // C6
}

/** A short, low buzzer for a denied scan. */
export function playDeniedBuzz() {
  tone(180, 0, 0.18, "sawtooth", 0.2);
  tone(140, 0.16, 0.22, "sawtooth", 0.2);
}
