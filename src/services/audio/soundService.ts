type AlarmSoundType = 'chime' | 'digital' | 'soft_bell' | 'marimba';

class SoundService {
  private audioCtx: AudioContext | null = null;
  private currentLoopTimer: number | null = null;
  private isPlaying = false;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Play a single tone or sequence based on selected type.
   */
  public playTone(type: AlarmSoundType = 'chime', volume = 0.7): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    switch (type) {
      case 'chime': {
        // E5 (659.25Hz), A5 (880Hz), C#6 (1108.73Hz)
        const notes = [659.25, 880, 1108.73];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;

          const startTime = now + idx * 0.12;
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(volume * 0.5, startTime + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + 0.85);
        });
        break;
      }
      case 'digital': {
        // Double beep 880Hz square wave
        [0, 0.15].forEach((offset) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.value = 880;

          const startTime = now + offset;
          gain.gain.setValueAtTime(volume * 0.3, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.08);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + 0.09);
        });
        break;
      }
      case 'soft_bell': {
        // 523.25Hz (C5) with rich harmonics
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.value = 523.25;

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, now);
        filter.frequency.exponentialRampToValueAtTime(400, now + 1.2);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(volume * 0.6, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 1.55);
        break;
      }
      case 'marimba': {
        // Wooden percussion tone
        const freqs = [440, 880];
        freqs.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;

          const startTime = now + i * 0.08;
          gain.gain.setValueAtTime(volume * 0.6, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + 0.35);
        });
        break;
      }
    }
  }

  /**
   * Start looping alarm sound for reminders.
   */
  public startAlarmLoop(type: AlarmSoundType = 'chime', volume = 0.7): void {
    if (this.isPlaying) return;
    this.isPlaying = true;

    this.playTone(type, volume);
    this.currentLoopTimer = window.setInterval(() => {
      if (this.isPlaying) {
        this.playTone(type, volume);
      } else {
        this.stopAlarmLoop();
      }
    }, 2000);
  }

  /**
   * Stop alarm playback immediately.
   */
  public stopAlarmLoop(): void {
    this.isPlaying = false;
    if (this.currentLoopTimer !== null) {
      clearInterval(this.currentLoopTimer);
      this.currentLoopTimer = null;
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const soundService = new SoundService();
