import React, { useState, useEffect, useCallback } from 'react';
import { geminiService } from '../services/geminiService';

interface ApiKeyPromptProps {
  onApiKeySelected: () => void;
  isLoading: boolean;
  message?: string;
}

const ApiKeyPrompt: React.FC<ApiKeyPromptProps> = ({ onApiKeySelected, isLoading, message }) => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  const checkApiKey = useCallback(async () => {
    const selected = await geminiService.hasSelectedApiKey();
    setHasKey(selected);
    if (selected) {
      onApiKeySelected();
    }
  }, [onApiKeySelected]);

  useEffect(() => {
    checkApiKey();
  }, []); 

  const handleSelectKey = async () => {
    try {
      await geminiService.openSelectApiKeyDialog();
      onApiKeySelected();
    } catch (error) {
      console.error('Error opening API key selection dialog:', error);
      setHasKey(false);
    }
  };

  if (hasKey === null && !isLoading) {
    return (
      <div className="flex justify-center items-center">
        <div className="text-xs text-red-500 uppercase tracking-widest animate-pulse">Verificando credenciales...</div>
      </div>
    );
  }

  if (hasKey && !message) {
    return null; 
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-black border border-red-600 max-w-sm mx-auto my-8">
      <h2 className="text-sm font-bold text-red-600 tracking-[0.2em] uppercase mb-4 text-center">Acceso Restringido</h2>
      <p className="text-gray-400 text-xs text-center mb-6 leading-relaxed">
        {message || "Para operar esta terminal, se requiere una llave de acceso verificada (GCP API Key)."}
      </p>
      <button
        onClick={handleSelectKey}
        disabled={isLoading}
        className="px-6 py-2 border border-red-600 text-red-600 hover:bg-red-600 hover:text-black uppercase text-xs tracking-widest font-bold transition-all duration-300 disabled:opacity-50"
      >
        {isLoading ? "Seleccionando..." : "Seleccionar Llave"}
      </button>
      <div className="mt-6 text-[10px] text-gray-600 text-center uppercase">
        <a
          href="https://ai.google.dev/gemini-api/docs/billing"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-red-500 transition-colors"
        >
          [ Documentación de Facturación ]
        </a>
      </div>
    </div>
  );
};

export default ApiKeyPrompt;