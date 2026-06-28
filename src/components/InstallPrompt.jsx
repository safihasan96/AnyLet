import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import logger from '../utils/logger';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI to notify the user they can add to home screen
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Hide the prompt UI
    setShowPrompt(false);
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    logger.info('PWA install prompt outcome', outcome);
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
  };

  const handleClose = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-4 right-4 z-50 md:bottom-24 md:left-auto md:right-8 md:w-96 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 p-4 transition-all duration-300 transform translate-y-0 opacity-100">
      <div className="flex items-start">
        <div className="bg-primary/10 p-3 rounded-full mr-4 text-primary dark:text-indigo-400 shrink-0">
          <Download className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Install Any-Let App</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Add to your home screen for a faster, app-like experience.
          </p>
          <div className="flex space-x-2">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary-dark transition-colors"
            >
              Install App
            </button>
            <button
              onClick={handleClose}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              Not Now
            </button>
          </div>
        </div>
        <button 
          onClick={handleClose}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;
