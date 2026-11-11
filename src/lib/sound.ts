import type { Move } from 'chess.js';
let context: AudioContext | undefined;
export type Sound = 'move' | 'capture' | 'check' | 'castle' | 'correct' | 'incorrect' | 'complete';
const notes: Record<Sound, number[]> = { move: [240], capture: [170, 110], check: [620, 780], castle: [260, 340], correct: [440, 660], incorrect: [220, 165], complete: [440, 554, 660, 880] };
export function playSound(kind: Sound, muted: boolean) {
  if (muted) return;
  try {
    context ??= new AudioContext();
    void context.resume().catch(() => {});
    notes[kind].forEach((hz, i) => {
      const oscillator = context!.createOscillator();
      const gain = context!.createGain();
      const start = context!.currentTime + i * .085;
      oscillator.type = kind === 'incorrect' ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(hz, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(.09, start + .008);
      gain.gain.exponentialRampToValueAtTime(.001, start + .15);
      oscillator.connect(gain); gain.connect(context!.destination);
      oscillator.start(start); oscillator.stop(start + .16);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    });
  } catch { /* Audio may be unavailable; training remains usable. */ }
}
export function moveSound(move: Pick<Move, 'san' | 'captured'>): Sound {
  return /[+#]/.test(move.san) ? 'check' : move.san.startsWith('O-O') ? 'castle' : move.captured || move.san.includes('x') ? 'capture' : 'move';
}
