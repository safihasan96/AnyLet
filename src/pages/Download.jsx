import { useState, useEffect } from 'react';
import { Download as DownloadIcon, Smartphone, Apple, Chrome, Share2, PlusSquare, CheckCircle, ArrowRight, Globe } from 'lucide-react';

const STEPS_ANDROID = [
  { icon: Chrome, title: "Open in Chrome", desc: "Visit any-let.indevs.in in Chrome browser on your Android device." },
  { icon: Download, title: "Tap the banner", desc: 'A banner at the bottom will say "Install App" — tap it.' },
  { icon: CheckCircle, title: "Confirm Install", desc: "Tap 'Install' in the dialog. The app icon will appear on your home screen!" },
];

const STEPS_IOS = [
  { icon: Globe, title: "Open in Safari", desc: "Visit any-let.indevs.in in Safari on your iPhone or iPad." },
  { icon: Share2, title: "Tap Share", desc: 'Tap the Share icon at the bottom of Safari (the box with an arrow).' },
  { icon: PlusSquare, title: "Add to Home Screen", desc: 'Scroll down and tap "Add to Home Screen". Done!' },
];

export default function Download() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [activeTab, setActiveTab] = useState('android');

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const handleAppInstalled = () => setInstalled(true);

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary/5 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 pb-20">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
        <div className="px-6 pt-16 pb-10 flex flex-col items-center text-center">

          {/* App Icon */}
          <div className="w-24 h-24 rounded-3xl bg-primary shadow-2xl shadow-primary/30 flex items-center justify-center mb-6">
            <Smartphone size={44} className="text-white" />
          </div>

          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-3">
            Get <span className="text-primary">Any-Let</span> App
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base max-w-xs leading-relaxed mb-8">
            Find long-term apartment rentals in Bangladesh, right from your phone.
          </p>

          {/* One-tap install button (Android Chrome) */}
          {deferredPrompt && !installed && (
            <button
              onClick={handleInstall}
              className="flex items-center gap-3 bg-primary text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all active:scale-95 mb-4"
            >
              <DownloadIcon size={22} />
              Install App Now
            </button>
          )}

          {installed && (
            <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-6 py-3 rounded-2xl font-semibold mb-4">
              <CheckCircle size={20} />
              App Installed Successfully!
            </div>
          )}

          {/* Feature highlights */}
          <div className="grid grid-cols-3 gap-4 w-full max-w-xs mt-4">
            {[
              { label: "Free", sub: "No cost" },
              { label: "Fast", sub: "App-like speed" },
              { label: "Offline", sub: "Works offline" },
            ].map((f) => (
              <div key={f.label} className="bg-white dark:bg-slate-800 rounded-2xl p-3 shadow-sm border border-slate-100 dark:border-slate-700 text-center">
                <p className="font-black text-primary text-base">{f.label}</p>
                <p className="text-slate-400 text-[10px] font-medium">{f.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Steps Tabs */}
      <div className="px-4">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
          {/* Tab Header */}
          <div className="flex border-b border-slate-100 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('android')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-colors ${
                activeTab === 'android'
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              <Chrome size={18} />
              Android
            </button>
            <button
              onClick={() => setActiveTab('ios')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-colors ${
                activeTab === 'ios'
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              <Apple size={18} />
              iPhone / iPad
            </button>
          </div>

          {/* Steps */}
          <div className="p-5 flex flex-col gap-5">
            {(activeTab === 'android' ? STEPS_ANDROID : STEPS_IOS).map((step, i, arr) => {
              const Icon = step.icon;
              return (
                <div key={i}>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Icon size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] text-primary font-black uppercase tracking-widest">Step {i + 1}</span>
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-0.5">{step.title}</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="ml-5 mt-3 flex">
                      <ArrowRight size={14} className="text-slate-300 dark:text-slate-600 rotate-90" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Visit link */}
        <div className="mt-6 bg-slate-900 dark:bg-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="bg-white/10 p-2.5 rounded-xl">
            <Globe size={20} className="text-white" />
          </div>
          <div>
            <p className="text-slate-400 text-[11px] font-medium">Visit on your phone</p>
            <p className="text-white font-bold text-sm">any-let.indevs.in</p>
          </div>
        </div>
      </div>
    </div>
  );
}
