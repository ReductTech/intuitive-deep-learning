/** Synthesized rift, impact and loot feedback, unlocked by the player’s start gesture. */
export class GameAudio {
  private context: AudioContext | null = null;
  enabled = false;
  async toggle() { this.enabled = !this.enabled; if (this.enabled) { this.context ??= new AudioContext(); try { await this.context.resume(); this.play('pickup'); } catch { this.enabled = false; } } return this.enabled; }
  play(kind: 'jump' | 'pickup' | 'warning' | 'rescue' | 'impact') {
    if (!this.enabled || !this.context) return;
    const ctx = this.context, start = ctx.currentTime, duration = kind === 'rescue' ? .8 : .23;
    if(kind==='jump'||kind==='impact'){
      const length=kind==='impact'?.4:.32,buffer=ctx.createBuffer(1,ctx.sampleRate*length,ctx.sampleRate),samples=buffer.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=(Math.random()*2-1)*Math.pow(1-i/samples.length,2);
      const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();source.buffer=buffer;filter.type='lowpass';filter.frequency.setValueAtTime(kind==='impact'?2000:400,start);filter.frequency.exponentialRampToValueAtTime(kind==='impact'?90:5000,start+length);gain.gain.setValueAtTime(.16,start);gain.gain.exponentialRampToValueAtTime(.001,start+length);source.connect(filter);filter.connect(gain);gain.connect(ctx.destination);source.start(start);
      const bass=ctx.createOscillator(),volume=ctx.createGain();bass.frequency.setValueAtTime(kind==='impact'?110:220,start);bass.frequency.exponentialRampToValueAtTime(35,start+.3);volume.gain.setValueAtTime(.12,start);volume.gain.exponentialRampToValueAtTime(.001,start+.3);bass.connect(volume);volume.connect(ctx.destination);bass.start(start);bass.stop(start+.32);
    }
    const notes = kind === 'pickup' ? [523, 659, 784] : kind === 'rescue' ? [392, 494, 587, 784] : kind === 'warning' ? [155, 130] : [180, 440];
    notes.forEach((note, i) => { const oscillator = ctx.createOscillator(), gain = ctx.createGain(); oscillator.type = kind === 'jump' ? 'sine' : 'triangle'; oscillator.frequency.setValueAtTime(note, start + i * .075); if (kind === 'jump') oscillator.frequency.exponentialRampToValueAtTime(note * 1.7, start + duration); gain.gain.setValueAtTime(0, start + i * .075); gain.gain.linearRampToValueAtTime(.035, start + i * .075 + .015); gain.gain.exponentialRampToValueAtTime(.001, start + i * .075 + duration); oscillator.connect(gain); gain.connect(ctx.destination); oscillator.start(start + i * .075); oscillator.stop(start + i * .075 + duration); });
  }
  dispose() { void this.context?.close(); this.context = null; }
}
