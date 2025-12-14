import React, { useEffect, useState } from 'react';
import { audioUtils } from '../services/audioUtils';

interface AudioPlayerProps {
  base64Audio?: string;
  audioUrl?: string; 
}

const AudioPlayer: React.FC<AudioPlayerProps> = React.memo(({ base64Audio, audioUrl }) => {
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (audioUrl) {
      setCurrentAudioUrl(audioUrl);
      return;
    } 
    
    if (base64Audio) {
      try {
        const wavBlob = audioUtils.createWavBlob(audioUtils.decode(base64Audio), 24000); 
        const objectUrl = URL.createObjectURL(wavBlob);
        setCurrentAudioUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
      } catch (error) {
        console.error('Audio processing error:', error);
      }
    }
  }, [base64Audio, audioUrl]);

  if (!currentAudioUrl) return null;

  return (
    <div className="w-full flex items-center justify-between gap-2 bg-black border border-red-900/60 p-1 hover:border-red-600 transition-colors group">
      <audio 
        controls 
        src={currentAudioUrl} 
        className="flex-grow h-6 opacity-60 hover:opacity-100 transition-opacity invert hue-rotate-180 mix-blend-screen" 
      />
      <a 
        href={currentAudioUrl} 
        download={`morboso-log-${Date.now()}.wav`}
        className="flex items-center gap-2 px-3 h-6 border-l border-red-900/30 text-red-800 hover:text-red-500 hover:bg-red-900/10 transition-all text-[9px] font-mono tracking-wider uppercase font-bold"
        title="Descargar Archivo de Audio"
      >
        <span>Descargar</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </a>
    </div>
  );
});

export default AudioPlayer;