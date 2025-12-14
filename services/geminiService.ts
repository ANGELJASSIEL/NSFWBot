import { GoogleGenAI, LiveServerMessage, Modality, GenerateContentParameters } from '@google/genai';
import { audioUtils } from './audioUtils';
import { ChatMessage } from '../types';

let nextStartTime = 0;
let outputAudioContext: AudioContext | null = null;
let outputNode: GainNode | null = null;
const sources = new Set<AudioBufferSourceNode>();

function getAudioContext() {
  if (!outputAudioContext) {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        outputAudioContext = new AudioContextClass({ sampleRate: 24000 });
        outputNode = outputAudioContext.createGain();
        outputNode.connect(outputAudioContext.destination);
      }
    } catch (e) {
      console.error("Failed to initialize AudioContext", e);
    }
  }
  return outputAudioContext;
}

function getOutputNode() {
  getAudioContext(); // Ensure context exists
  return outputNode;
}

interface LiveConnectCallbacks {
  onMessage: (message: LiveServerMessage) => void;
  onError: (error: Error) => void;
  onClose: (event: CloseEvent) => void;
  onOpen: () => void;
}

export const geminiService = {
  connectLiveSession: async (
    callbacks: LiveConnectCallbacks,
    systemInstruction?: string,
    extraConfig?: Partial<GenerateContentParameters['config']>
  ) => {
    if (!process.env.API_KEY) throw new Error("GEMINI_API_KEY missing");

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const ctx = getAudioContext();
    // Ensure audio context is running to prevent autoplay blocks
    if (ctx && ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch (e) {
        console.warn("Could not resume audio context", e);
      }
    }

    return ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks: {
        onopen: () => {
          callbacks.onOpen();
        },
        onmessage: async (message: LiveServerMessage) => {
          callbacks.onMessage(message);

          const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (base64Audio) {
            const ctx = getAudioContext();
            const node = getOutputNode();
            
            if (ctx && node) {
              nextStartTime = Math.max(nextStartTime, ctx.currentTime);
              try {
                const audioBuffer = await audioUtils.decodeAudioData(
                  audioUtils.decode(base64Audio),
                  ctx,
                  24000,
                  1,
                );
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(node);
                source.addEventListener('ended', () => sources.delete(source));
                source.start(nextStartTime);
                nextStartTime += audioBuffer.duration;
                sources.add(source);
              } catch (error) {
                console.error('Audio decode error:', error);
              }
            }
          }

          if (message.serverContent?.interrupted) {
            sources.forEach(s => s.stop());
            sources.clear();
            nextStartTime = 0;
          }
        },
        onerror: (e: ErrorEvent) => {
          callbacks.onError(e.error);
          if (e.error?.message?.includes("Requested entity was not found.") && (window as any).aistudio?.openSelectKey) {
            (window as any).aistudio.openSelectKey();
          }
        },
        onclose: (e: CloseEvent) => {
          callbacks.onClose(e);
          sources.forEach(s => s.stop());
          sources.clear();
          nextStartTime = 0;
        },
      },
      config: {
        responseModalities: [Modality.AUDIO],
        outputAudioTranscription: {},
        inputAudioTranscription: {},
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } },
        },
        ...(systemInstruction?.trim() && { systemInstruction }),
        ...extraConfig,
      },
    });
  },

  sendTextMessage: async (
    text: string,
    history: ChatMessage[],
    systemInstruction?: string
  ): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("GEMINI_API_KEY missing");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const recentHistory = history.slice(-15).map(msg => ({
      role: msg.speaker,
      parts: [{ text: msg.text }]
    }));

    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      history: recentHistory,
      config: { systemInstruction },
    });

    const result = await chat.sendMessage({ message: text });
    return result.text || "";
  },

  sendTextMessageStream: async function* (
    text: string,
    history: ChatMessage[],
    systemInstruction?: string
  ): AsyncGenerator<string> {
    if (!process.env.API_KEY) throw new Error("GEMINI_API_KEY missing");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Optimization: Limit history to last 15 messages
    const recentHistory = history.slice(-15).map(msg => ({
      role: msg.speaker,
      parts: [{ text: msg.text }]
    }));

    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      history: recentHistory,
      config: { systemInstruction },
    });

    const result = await chat.sendMessageStream({ message: text });
    
    // Iterate directly over the result, which is the AsyncIterable
    for await (const chunk of result) {
      const chunkText = chunk.text;
      if (chunkText) {
        yield chunkText;
      }
    }
  },

  generateSpeech: async (text: string): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("GEMINI_API_KEY missing");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } },
        },
      },
    });

    const audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audio) throw new Error('TTS failed');
    return audio;
  },

  pauseLiveAudio: () => {
    sources.forEach(s => s.stop());
    sources.clear();
    nextStartTime = 0;
  },

  hasSelectedApiKey: async (): Promise<boolean> => {
    if ((window as any).aistudio && typeof (window as any).aistudio.hasSelectedApiKey === 'function') {
        return await (window as any).aistudio.hasSelectedApiKey();
    }
    return true; 
  },

  openSelectApiKeyDialog: async (): Promise<void> => {
    if ((window as any).aistudio && typeof (window as any).aistudio.openSelectKey === 'function') {
        await (window as any).aistudio.openSelectKey();
    }
  },
};