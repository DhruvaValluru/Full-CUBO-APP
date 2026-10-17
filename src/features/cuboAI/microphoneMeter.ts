/** Local level measurement only. No recording, transcription, upload, or model. */
export class MicrophoneMeter {
  private stream: MediaStream | null = null;
  private audio: AudioContext | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private generation = 0;
  async start(level: (value: number) => void) {
    this.stop();
    const generation = this.generation;
    const Audio = globalThis.AudioContext || (globalThis as typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!navigator.mediaDevices?.getUserMedia || !Audio) throw Error('Microphone testing is unavailable in this browser. You can skip this step.');
    const audio = new Audio(); this.audio = audio;
    try {
      // Request permission in the tap's call stack, before waiting for Web Audio.
      // Release late grants even if resume fails or the user cancels/navigates away.
      const permission = navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(stream => {
        if (generation !== this.generation) stream.getTracks().forEach(track => track.stop());
        else this.stream = stream;
        return stream;
      });
      const [stream] = await Promise.all([permission, audio.resume()]);
      if (generation !== this.generation) return false;
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
