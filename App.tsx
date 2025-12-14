import React, { useState, useEffect, useCallback } from 'react';
import LiveChat from './components/LiveChat';
import ApiKeyPrompt from './components/ApiKeyPrompt';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  const [apiKeyRequired, setApiKeyRequired] = useState(false);
  const [isLoadingApiKey, setIsLoadingApiKey] = useState(true);

  const checkAndSetApiKeyStatus = useCallback(async () => {
    setIsLoadingApiKey(true);
    try {
      const hasKey = await geminiService.hasSelectedApiKey();
      if (!hasKey) {
        setApiKeyRequired(true);
      } else {
        setApiKeyRequired(false);
      }
    } catch (error) {
      console.error('Error checking API key status:', error);
      setApiKeyRequired(true); // Assume key is needed if check fails
    } finally {
      setIsLoadingApiKey(false);
    }
  }, []);

  useEffect(() => {
    checkAndSetApiKeyStatus();
  }, [checkAndSetApiKeyStatus]);

  const handleApiKeySelected = useCallback(() => {
    setApiKeyRequired(false);
    setIsLoadingApiKey(false);
  }, []);

  const renderContent = () => {
    if (isLoadingApiKey) {
      return (
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600"></div>
          <p className="ml-4 text-xs tracking-widest text-red-500 uppercase">Iniciando Sistema...</p>
        </div>
      );
    }

    if (apiKeyRequired) {
      return (
        <div className="flex-grow flex items-center justify-center p-4">
          <ApiKeyPrompt onApiKeySelected={handleApiKeySelected} isLoading={isLoadingApiKey} />
        </div>
      );
    }

    return <LiveChat />;
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-gray-300 font-light selection:bg-red-900 selection:text-white">
      {/* Header */}
      <header className="border-b border-red-900/30 bg-black p-4 sticky top-0 z-20 backdrop-blur-sm bg-opacity-90">
        <div className="container mx-auto flex justify-center items-center">
          <h1 className="text-sm font-bold tracking-[0.3em] text-red-600 uppercase text-center glow-text">
            Agencia Artificial Autónoma
          </h1>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow container mx-auto p-4 flex flex-col justify-center items-center h-full max-w-4xl">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="border-t border-red-900/30 bg-black p-4 text-center text-red-900/60 text-[10px] uppercase tracking-widest mt-4">
        © {new Date().getFullYear()} Morboso Malvado // Protocolo V1.2
      </footer>
    </div>
  );
};

export default App;