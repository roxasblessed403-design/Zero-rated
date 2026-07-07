import React, { useState, useEffect } from 'react';
import PortalHome from './components/PortalHome';
import BrowserView from './components/BrowserView';
import { ZeroRatedSite, SavedNote } from './types';
import { GraduationCap, ShieldCheck, FileText, ChevronRight, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [view, setView] = useState<'home' | 'browser'>('home');
  const [activeUrl, setActiveUrl] = useState('https://learn.siyavula.com');
  const [customSites, setCustomSites] = useState<ZeroRatedSite[]>([]);
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);

  // Load custom shortcuts and saved workbooks from localStorage on mount
  useEffect(() => {
    const cachedSites = localStorage.getItem('zerorated_custom_sites');
    if (cachedSites) {
      try { setCustomSites(JSON.parse(cachedSites)); } catch (e) { console.error(e); }
    }

    const cachedNotes = localStorage.getItem('zerorated_saved_notes');
    if (cachedNotes) {
      try { setSavedNotes(JSON.parse(cachedNotes)); } catch (e) { console.error(e); }
    }
  }, []);

  const handleLaunchSite = (url: string) => {
    setActiveUrl(url);
    setView('browser');
  };

  const handleAddCustomSite = (name: string, domain: string) => {
    const newSite: ZeroRatedSite = {
      id: `custom-${Date.now()}`,
      name,
      domain: domain.includes('://') ? domain : `https://${domain}`,
      category: 'resource',
      description: 'Custom portal added via your local network zero-rated rules.',
      logo: '🎓'
    };

    const updated = [newSite, ...customSites];
    setCustomSites(updated);
    localStorage.setItem('zerorated_custom_sites', JSON.stringify(updated));
  };

  const handleAddNote = (note: SavedNote) => {
    const updated = [note, ...savedNotes];
    setSavedNotes(updated);
    localStorage.setItem('zerorated_saved_notes', JSON.stringify(updated));
  };

  const handleDeleteNote = (id: string) => {
    if (window.confirm("Delete this study note? This will remove it from your local view.")) {
      const updated = savedNotes.filter(n => n.id !== id);
      setSavedNotes(updated);
      localStorage.setItem('zerorated_saved_notes', JSON.stringify(updated));
    }
  };

  const handleImportNote = (note: SavedNote) => {
    // Prevent importing duplicate IDs or titles
    if (savedNotes.some(n => n.title === note.title)) {
      alert("A study note with this title is already open in your local workbook.");
      return;
    }
    handleAddNote(note);
    alert(`"${note.title}" imported successfully from Google Drive!`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col relative overflow-x-hidden" id="app-root">
      {/* Immersive Background Glow Elements */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
      
      {/* Status Bar / Combined Dual-Tier Header */}
      <header className="bg-slate-900/50 backdrop-blur border-b border-white/5 h-16 shrink-0 flex items-center justify-between px-6 select-none z-10" id="app-header">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-white text-sm tracking-widest flex items-center gap-1 uppercase">
              EduLink <span className="text-emerald-400 font-black">Portal</span>
            </h1>
            <p className="text-[9px] text-slate-400 tracking-wider font-mono uppercase">Zero-Rated Protocol Active</p>
          </div>
        </div>

        {/* Global Connection & Navigation Controls */}
        <div className="flex items-center gap-4">
          {view === 'browser' && (
            <button
              onClick={() => setView('home')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/15 rounded-xl border border-emerald-500/20 transition-all cursor-pointer"
            >
              <span>Back to Portal Home</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
            <span>Data-Free Whitelisted</span>
          </div>
        </div>
      </header>

      {/* Main Dynamic Viewport with Micro-Transitions */}
      <main className="flex-1 z-10 relative">
        <AnimatePresence mode="wait">
          {view === 'home' ? (
            <motion.div
              key="home-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <PortalHome
                onLaunchSite={handleLaunchSite}
                customSites={customSites}
                onAddCustomSite={handleAddCustomSite}
              />
            </motion.div>
          ) : (
            <motion.div
              key="browser-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <BrowserView
                initialUrl={activeUrl}
                onGoHome={() => setView('home')}
                savedNotes={savedNotes}
                onAddNote={handleAddNote}
                onDeleteNote={handleDeleteNote}
                onImportNote={handleImportNote}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* High-Tech Immersive Footer Info Bar */}
      {view === 'home' && (
        <footer className="h-12 bg-slate-900 border-t border-white/5 flex items-center justify-between px-6 select-none shrink-0 font-mono z-10" id="app-footer">
          <div className="flex items-center gap-4 text-[10px] text-slate-500 uppercase tracking-widest">
            <span className="text-emerald-400 font-bold">Secure Access Node</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">1,024,582 Zero-Rated Endpoints Loaded</span>
            <span>•</span>
            <span className="text-slate-400">Latency: 14ms</span>
          </div>
          <div className="flex items-center gap-4 font-mono">
            <div className="hidden md:flex items-center gap-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest">Data Saved: 142.8 MB</span>
              <div className="h-1.5 w-20 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-emerald-500"></div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">67% Optimized</span>
          </div>
        </footer>
      )}
    </div>
  );
}
