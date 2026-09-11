/**
 * A short paper-crumple-ish noise burst, synthesized on the fly via the Web
 * Audio API. Deliberately not a downloaded/bundled audio asset — same
 * reasoning as the wallpaper decision: no shipped third-party media, only
 * things generated at runtime.
 */
export function playCrumpleSound(): void {
  const AudioContextCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (AudioContextCtor === undefined) return;

  const ctx = new AudioContextCtor();
  const duration = 0.35;
  const sampleCount = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < sampleCount; i++) {
    const decay = 1 - i / sampleCount;
    data[i] = (Math.random() * 2 - 1) * decay * decay;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 1200;

  const gain = ctx.createGain();
  gain.gain.value = 0.5;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();
  source.onended = () => void ctx.close();
}
