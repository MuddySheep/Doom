let audioCtx: AudioContext | null = null;

export const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

const createOscillator = (type: OscillatorType, frequency: number, duration: number, volume: number = 0.1) => {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
  
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
};

const createNoise = (duration: number, volume: number = 0.1) => {
  if (!audioCtx) return;
  const bufferSize = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  const gain = audioCtx.createGain();
  
  // Simple lowpass filter for "thud" or "boom"
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1000;

  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  noise.start();
};

export const playSound = (sound: 'shoot_pistol' | 'shoot_shotgun' | 'shoot_chaingun' | 'hit' | 'die' | 'pickup' | 'hurt') => {
  initAudio();
  if (!audioCtx) return;

  switch (sound) {
    case 'shoot_pistol':
      createOscillator('square', 150, 0.1, 0.1);
      break;
    case 'shoot_shotgun':
      createNoise(0.3, 0.3);
      createOscillator('sawtooth', 100, 0.2, 0.2);
      break;
    case 'shoot_chaingun':
      createOscillator('sawtooth', 200, 0.05, 0.1);
      createNoise(0.05, 0.1);
      break;
    case 'hit':
      createOscillator('sawtooth', 50, 0.1, 0.1);
      break;
    case 'die':
      createNoise(0.4, 0.2);
      createOscillator('sawtooth', 50, 0.5, 0.2); // Low growl
      break;
    case 'pickup':
      createOscillator('sine', 600, 0.1, 0.1);
      setTimeout(() => createOscillator('sine', 1200, 0.2, 0.1), 100);
      break;
    case 'hurt':
      createOscillator('sawtooth', 80, 0.2, 0.2);
      break;
  }
};