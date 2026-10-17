/** Local level measurement only. No recording, transcription, upload, or model. */
export class MicrophoneMeter {
  private stream: MediaStream | null = null;
  private audio: AudioContext | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private generation = 0;
  async start(level: (value: number) => void) {
    this.stop();
    const generation = this.generation;
    if (!navigator.mediaDevices?.getUserMedia || typeof AudioContext === 'undefined') throw Error('Microphone testing is unavailable in this browser. You can skip this step.');
    const audio = new AudioContext(); this.audio = audio;
    try {
      await audio.resume();
      if (generation !== this.generation) return false;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      if (generation !== this.generation) { stream.getTracks().forEach(track => track.stop()); return false; }
      this.stream = stream;
      const analyser = audio.createAnalyser(); analyser.fftSize = 256;
      audio.createMediaStreamSource(stream).connect(analyser);
      const samples = new Uint8Array(analyser.fftSize);
      this.timer = setInterval(() => {
        analyser.getByteTimeDomainData(samples);
        const rms = Math.sqrt(samples.reduce((sum, sample) => sum + ((sample - 128) / 128) ** 2, 0) / samples.length);
        level(Math.min(1, rms * 5));
      }, 100);
      return true;
    } catch (error) { if (generation === this.generation) this.stop(); throw error; }
  }
  stop() {
    this.generation++;
    if (this.timer) clearInterval(this.timer); this.timer = null;
    this.stream?.getTracks().forEach(track => track.stop()); this.stream = null;
    void this.audio?.close().catch(() => {}); this.audio = null;
  }
}
