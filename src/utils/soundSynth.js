// Self-contained Web Audio API synthesizer for celestial ambient sounds
class SoundSynth {
  constructor() {
    this.ctx = null;
    this.ambientOsc1 = null;
    this.ambientOsc2 = null;
    this.ambientGain = null;
    this.muted = false;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      // Setup automatic unlock on first user interaction
      const unlock = () => {
        if (this.ctx && this.ctx.state === "suspended") {
          this.ctx.resume().then(() => {
            removeListeners();
          }).catch(err => console.warn("Failed to resume AudioContext", err));
        } else {
          removeListeners();
        }
      };

      const removeListeners = () => {
        window.removeEventListener("click", unlock);
        window.removeEventListener("touchstart", unlock);
        window.removeEventListener("keydown", unlock);
      };

      window.addEventListener("click", unlock);
      window.addEventListener("touchstart", unlock);
      window.addEventListener("keydown", unlock);
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  resume() {
    this.init();
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopAmbient();
    } else {
      this.startAmbient();
    }
    return this.muted;
  }

  // Soft wooden click when placing card
  playClick() {
    this.resume();
    if (!this.ctx || this.muted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(220, t); // Higher starting pitch for better laptop speaker audibility
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.12); // Prevent dropping into inaudible bass

    gain.gain.setValueAtTime(0.6, t); // Increased volume slightly
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.14);
  }

  // Soft high-frequency sweep when hovering
  playHover() {
    this.resume();
    if (!this.ctx || this.muted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(1100, t + 0.1); // Slightly longer sweep

    gain.gain.setValueAtTime(0.08, t); // Increased volume from 0.02 for clear audibility
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  // Gentle sliding tone when drawing a card
  playDraw() {
    this.resume();
    if (!this.ctx || this.muted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(650, t + 0.28);

    gain.gain.setValueAtTime(0.22, t); // Increased volume for presence
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  // Celestial major chord chime when matching
  playScore() {
    this.resume();
    if (!this.ctx || this.muted) return;

    const t = this.ctx.currentTime;
    // Frequencies for a beautiful major 7th chord (C4, E4, G4, B4, C5)
    const freqs = [261.63, 329.63, 392.00, 493.88, 523.25];
    const duration = 1.5; // Slightly longer sustain

    freqs.forEach((freq, index) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      // Slight arpeggiation delay
      const noteDelay = index * 0.06;
      osc.frequency.setValueAtTime(freq, t + noteDelay);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.18, t + noteDelay + 0.05); // Boosted chord volume for reward
      gain.gain.exponentialRampToValueAtTime(0.001, t + noteDelay + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + noteDelay);
      osc.stop(t + noteDelay + duration + 0.1);
    });
  }

  // Rising pentatonic sweep when winning a round
  playWin() {
    this.resume();
    if (!this.ctx || this.muted) return;

    const t = this.ctx.currentTime;
    const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
    
    notes.forEach((freq, index) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteDelay = index * 0.08;

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t + noteDelay);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.12, t + noteDelay + 0.02); // Boosted win chime
      gain.gain.exponentialRampToValueAtTime(0.001, t + noteDelay + 0.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + noteDelay);
      osc.stop(t + noteDelay + 0.9);
    });
  }

  // Descending minor sweep/drone when losing
  playLose() {
    this.resume();
    if (!this.ctx || this.muted) return;

    const t = this.ctx.currentTime;
    const notes = [311.13, 277.18, 233.08, 196.00, 155.56, 116.54];

    notes.forEach((freq, index) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteDelay = index * 0.15;

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, t + noteDelay);

      // Simple low pass filter to make the sawtooth warm
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(250, t);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.14, t + noteDelay + 0.05); // Boosted lose drone
      gain.gain.exponentialRampToValueAtTime(0.001, t + noteDelay + 1.5);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + noteDelay);
      osc.stop(t + noteDelay + 1.6);
    });
  }

  // Card flipping/woosh sound
  playFlip() {
    this.resume();
    if (!this.ctx || this.muted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.25);

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(500, t);
    filter.frequency.exponentialRampToValueAtTime(150, t + 0.25);

    gain.gain.setValueAtTime(0.22, t); // Boosted volume for flips
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.27);
  }

  // Low ambient space background hum
  startAmbient() {
    this.resume();
    if (!this.ctx || this.muted || this.ambientOsc1) return;

    const t = this.ctx.currentTime;
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0, t);
    this.ambientGain.gain.linearRampToValueAtTime(0.08, t + 2); // Raised gain to 0.08 for clear background volume

    // Low pass filter to make the drone warm while keeping some harmonics audible on mobile/laptop speakers
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(220, t);

    // Detuned oscillators around A2 (110Hz and 110.6Hz) using triangle waves to add warm, audible harmonics
    this.ambientOsc1 = this.ctx.createOscillator();
    this.ambientOsc1.type = "triangle";
    this.ambientOsc1.frequency.setValueAtTime(110, t);

    this.ambientOsc2 = this.ctx.createOscillator();
    this.ambientOsc2.type = "triangle";
    this.ambientOsc2.frequency.setValueAtTime(110.6, t);

    this.ambientOsc1.connect(filter);
    this.ambientOsc2.connect(filter);
    filter.connect(this.ambientGain);
    this.ambientGain.connect(this.ctx.destination);

    this.ambientOsc1.start(t);
    this.ambientOsc2.start(t);
  }

  stopAmbient() {
    if (this.ambientOsc1 && this.ambientGain && this.ctx) {
      const t = this.ctx.currentTime;
      try {
        this.ambientGain.gain.cancelScheduledValues(t);
        this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, t);
        this.ambientGain.gain.linearRampToValueAtTime(0, t + 0.5); // Fade-out
        
        const osc1 = this.ambientOsc1;
        const osc2 = this.ambientOsc2;
        
        setTimeout(() => {
          try {
            osc1.stop();
            osc2.stop();
          } catch(e) {}
        }, 600);
      } catch (e) {
        console.error(e);
      }
      this.ambientOsc1 = null;
      this.ambientOsc2 = null;
      this.ambientGain = null;
    }
  }
}

// Singleton pattern so the context is shared
const synth = new SoundSynth();
export default synth;
