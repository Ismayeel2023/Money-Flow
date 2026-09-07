import React, { useState, useEffect } from 'react';

interface AndroidApkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidApkModal: React.FC<AndroidApkModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert(
        'To install directly on Android:\n1. Open this app in Google Chrome\n2. Tap the 3 dots (⋮) in the top right\n3. Tap "Install App" or "Add to Home Screen"'
      );
    }
  };

  const currentUrl = window.location.origin;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#1A1A1A] border border-[#2B2B2B] rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#3DDC84]/15 text-[#3DDC84] border border-[#3DDC84]/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">android</span>
            </div>
            <div>
              <h2 className="font-display text-[18px] font-bold text-[#FFFFFF]">Android App & APK</h2>
              <p className="font-body text-[12px] text-[#888888]">Install or compile for Android</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#262626] text-[#888888] hover:text-[#FFFFFF] flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Method 1: Instant WebAPK Install (No PC needed) */}
        <div className="bg-[#222222] border border-[#303030] rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[18px]">install_mobile</span>
            </div>
            <div className="flex-1">
              <h3 className="font-body text-[14px] font-bold text-[#FFFFFF]">
                Method 1: Direct Android Install (WebAPK)
              </h3>
              <p className="font-body text-[12px] text-[#AAAAAA] mt-0.5">
                Recommended! Installs directly to your Android home screen & app drawer with full-screen mode, gold icon, and offline support. No computer needed.
              </p>
            </div>
          </div>

          <button
            onClick={handleInstallClick}
            className="w-full bg-[#3DDC84] hover:bg-[#34C779] text-[#0F0F0F] rounded-xl py-3 px-4 font-bold text-[14px] flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[20px]">get_app</span>
            <span>{isInstalled ? 'App Already Installed' : 'Install on Android Device'}</span>
          </button>
        </div>

        {/* Method 2: 1-Click APK via PWABuilder */}
        <div className="bg-[#222222] border border-[#303030] rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#3B82F6]/20 text-[#60A5FA] flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[18px]">build</span>
            </div>
            <div className="flex-1">
              <h3 className="font-body text-[14px] font-bold text-[#FFFFFF]">
                Method 2: Generate Signed APK (Free Online)
              </h3>
              <p className="font-body text-[12px] text-[#AAAAAA] mt-0.5">
                Use Microsoft PWABuilder to generate a ready-to-install Android APK package in under 2 minutes:
              </p>
            </div>
          </div>

          <div className="bg-[#151515] rounded-xl p-3 border border-[#2B2B2B] flex items-center justify-between gap-2">
            <span className="font-mono text-[11px] text-[#CCCCCC] truncate">{currentUrl}</span>
            <button
              onClick={handleCopyUrl}
              className="shrink-0 bg-[#2A2A2A] hover:bg-[#333333] text-[#D4AF37] px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors"
            >
              {copiedUrl ? 'Copied!' : 'Copy URL'}
            </button>
          </div>

          <a
            href={`https://www.pwabuilder.com?url=${encodeURIComponent(currentUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#2A2A2A] hover:bg-[#333333] text-[#E0E0E0] border border-[#3B3B3B] rounded-xl py-2.5 px-4 font-semibold text-[13px] flex items-center justify-center gap-2 transition-colors"
          >
            <span>Open PWABuilder to Download APK</span>
            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
          </a>
        </div>

        {/* Method 3: Local Android Studio Build (Capacitor) */}
        <div className="bg-[#222222] border border-[#303030] rounded-2xl p-4 flex flex-col gap-2.5">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#A855F7]/20 text-[#C084FC] flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[18px]">terminal</span>
            </div>
            <div className="flex-1">
              <h3 className="font-body text-[14px] font-bold text-[#FFFFFF]">
                Method 3: Native Android Studio Build
              </h3>
              <p className="font-body text-[12px] text-[#AAAAAA] mt-0.5">
                The codebase includes a pre-configured native Android Capacitor project in the <code className="text-[#D4AF37]">/android</code> folder.
              </p>
            </div>
          </div>

          <div className="bg-[#121212] rounded-xl p-3 border border-[#262626] font-mono text-[11px] text-[#A0A0A0] flex flex-col gap-1.5">
            <div className="text-[#666666]"># 1. Export ZIP / clone project</div>
            <div className="text-[#D4AF37]">npx cap sync android</div>
            <div className="text-[#666666]"># 2. Open in Android Studio</div>
            <div className="text-[#D4AF37]">npx cap open android</div>
            <div className="text-[#666666]"># 3. Click Build &gt; Build APK(s)</div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full bg-[#262626] hover:bg-[#303030] text-[#E0E0E0] rounded-xl py-3 font-semibold text-[14px] transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};
