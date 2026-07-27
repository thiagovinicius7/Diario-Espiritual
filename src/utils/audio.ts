/**
 * Helper to play 24kHz raw PCM base64 audio returned by Gemini TTS
 * or fallback to browser's SpeechSynthesis API.
 */

let activeAudioContext: AudioContext | null = null;

export async function playPcmAudio(base64Data: string, sampleRate = 24000): Promise<void> {
  stopAudio();

  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Convert 16-bit PCM to Float32
  const pcm16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(pcm16.length);
  for (let i = 0; i < pcm16.length; i++) {
    float32[i] = pcm16[i] / 32768.0;
  }

  activeAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
    sampleRate,
  });

  const buffer = activeAudioContext.createBuffer(1, float32.length, sampleRate);
  buffer.getChannelData(0).set(float32);

  const source = activeAudioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(activeAudioContext.destination);
  source.start(0);
}

export function speakBrowserTTS(text: string, onEnd?: () => void): void {
  stopAudio();

  if (!('speechSynthesis' in window)) {
    alert('Leitura em voz alta não suportada neste navegador.');
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'pt-BR';
  utterance.rate = 0.95;
  utterance.pitch = 1.0;

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
}

export function stopAudio(): void {
  if (activeAudioContext) {
    try {
      activeAudioContext.close();
    } catch (e) {
      // ignore
    }
    activeAudioContext = null;
  }

  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
