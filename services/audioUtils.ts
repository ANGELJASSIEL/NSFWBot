import { Blob as GenAIBlob } from '@google/genai';
import { AudioUtils } from '../types';

export const audioUtils: AudioUtils & { createWavBlob: (samples: Uint8Array, sampleRate: number) => Blob } = {
  /**
   * Decodes a base64 string into a Uint8Array.
   */
  decode: (base64: string): Uint8Array => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  },

  /**
   * Encodes a Uint8Array into a base64 string.
   */
  encode: (bytes: Uint8Array): string => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  },

  /**
   * Decodes raw PCM audio data into an AudioBuffer.
   */
  decodeAudioData: async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  },

  /**
   * Creates a Blob object for Gemini API audio input.
   */
  createBlob: (data: Float32Array, sampleRate: number): GenAIBlob => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = Math.max(-1, Math.min(1, data[i])) * 32767;
    }
    return {
      data: audioUtils.encode(new Uint8Array(int16.buffer)),
      mimeType: `audio/pcm;rate=${sampleRate}`,
    };
  },

  /**
   * Creates a standard WAV Blob from PCM data for playback/download.
   */
  createWavBlob: (samples: Uint8Array, sampleRate: number): Blob => {
    const buffer = new ArrayBuffer(44 + samples.length);
    const view = new DataView(buffer);
    
    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, samples.length, true);
    
    new Uint8Array(buffer, 44).set(samples);
    return new globalThis.Blob([buffer], { type: 'audio/wav' });
  }
};