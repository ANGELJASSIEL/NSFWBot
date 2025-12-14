import React, { useState } from 'react';
import { geminiService } from '../services/geminiService';
import AudioPlayer from './AudioPlayer';

/**
 * TextToSpeech component allows users to input text and generate speech from it.
 */
const TextToSpeech: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [generatedAudioBase64, setGeneratedAudioBase64] = useState<string | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  /**
   * Handles the text-to-speech generation process.
   */
  const handleGenerateSpeech = async () => {
    if (inputText.trim() === '') {
      setErrorMessage('Por favor, introduce texto para generar voz.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage('');
    setGeneratedAudioBase64(undefined);

    try {
      const audioData = await geminiService.generateSpeech(inputText);
      setGeneratedAudioBase64(audioData);
    } catch (error: any) {
      console.error('Error generating speech:', error);
      setErrorMessage(`Error al generar voz: ${error.message || 'Error desconocido.'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-center p-6 bg-gray-900 rounded-lg shadow-2xl h-full max-w-2xl mx-auto">
      <h2 className="text-3xl font-extrabold text-gradient-text mb-6 text-center">
        Generar Voz (TTS)
      </h2>

      <div className="w-full mb-6">
        <label htmlFor="tts-input" className="block text-gray-400 text-sm font-bold mb-2">
          Introduce tu texto:
        </label>
        <textarea
          id="tts-input"
          rows={6}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Escribe algo aquí para que la IA lo diga..."
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
          disabled={isGenerating}
        />
      </div>

      <button
        onClick={handleGenerateSpeech}
        disabled={isGenerating || inputText.trim() === ''}
        className="flex items-center px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-full shadow-lg transform transition-all duration-300 ease-in-out hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generando Voz...
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 mr-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9l1.414-1.414a2 2 0 012.828 0V4.5a2 2 0 01-2 2h-1.414M6.464 15.536a5 5 0 010-7.072m-2.828 9.9L2.222 20.707a2 2 0 01-2.828 0V19.5a2 2 0 012-2h1.414M12 21a9 9 0 100-18 9 9 0 000 18z"
              />
            </svg>
            Generar Voz
          </>
        )}
      </button>

      {errorMessage && (
        <div className="p-3 bg-red-800 text-red-100 rounded-md mb-4 text-center text-sm font-medium w-full">
          {errorMessage}
        </div>
      )}

      {generatedAudioBase64 && (
        <div className="w-full mt-4">
          <AudioPlayer base64Audio={generatedAudioBase64} />
        </div>
      )}
    </div>
  );
};

export default TextToSpeech;
