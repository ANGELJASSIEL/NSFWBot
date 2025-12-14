import type { Blob } from '@google/genai';

/**
 * Represents a single message in the chat history.
 */
export interface ChatMessage {
  id: string;
  text: string;
  speaker: 'user' | 'model';
  timestamp: Date;
  audioData?: string; // Base64 encoded audio data
}

/**
 * Utility functions for audio encoding and decoding.
 */
export interface AudioUtils {
  decode: (base64: string) => Uint8Array;
  encode: (bytes: Uint8Array) => string;
  decodeAudioData: (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ) => Promise<AudioBuffer>;
  createBlob: (data: Float32Array, sampleRate: number) => Blob;
}