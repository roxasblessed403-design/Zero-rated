import React, { useState, useEffect } from 'react';
import PortalHome from './components/PortalHome';
import BrowserView from './components/BrowserView';
import { ZeroRatedSite, SavedNote } from './types';
import { GraduationCap, ShieldCheck, FileText, ChevronRight, BookOpen, Sun, Moon, Palette, Contrast } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [view, setView] = useState<'home' | 'browser'>('home');
  const [activeUrl, setActiveUrl] = useState('https://learn.siyavula.com');
  const [customSites, setCustomSites] = useState<ZeroRatedSite[]>([]);
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);
  const [theme, setTheme] = useState<'white' | 'sepia' | 'blackwhite' | 'dark'>(() => {
    return (localStorage.getItem('zerorated_theme') as any) || 'white';
  });

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

  useEffect(() => {
    localStorage.setItem('zerorated_theme', theme);
  }, [theme]);

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
      logo: 'globe'
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
    <div className="min-h-screen bg-t-bg text-t-text font-sans flex flex-col relative overflow-x-hidden transition-colors duration-200" id="app-root" data-theme={theme}>
      
      {/* Combined Header */}
      <header className="bg-t-surface border-b border-t-border h-16 shrink-0 flex items-center justify-between px-6 select-none z-10 transition-colors duration-200" id="app-header">
        <div className="flex items-center gap-3">
          <div className="bg-t-muted p-2 rounded-xl text-t-dark-text border border-t-border transition-colors">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-t-dark-text text-sm tracking-widest flex items-center gap-1 uppercase transition-colors">
              EduLink <span className="text-t-muted-text font-black transition-colors">Portal</span>
            </h1>
            <p className="text-[9px] text-t-muted-text tracking-wider font-mono uppercase transition-colors">Zero-Rated Protocol Active</p>
          </div>
        </div>

        {/* Global Connection & Navigation Controls & Theme Selector */}
        <div className="flex items-center gap-3 md:gap-5">
          {view === 'browser' && (
            <button
              onClick={() => setView('home')}
              className="text-xs text-t-text hover:text-t-dark-text font-bold flex items-center gap-1 px-3 py-1.5 bg-t-muted hover:bg-t-muted/80 rounded-xl border border-t-border transition-all cursor-pointer"
            >
              <span>Back to Portal Home</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Elegant Segmented Color Theme Switcher */}
          <div className="flex items-center gap-1 bg-t-muted p-1 rounded-xl border border-t-border select-none transition-colors">
            {[
              { id: 'white', label: 'White', icon: Sun },
              { id: 'sepia', label: 'Sepia', icon: Palette },
              { id: 'blackwhite', label: 'B&W', icon: Contrast },
              { id: 'dark', label: 'Dark', icon: Moon }
            ].map((t) => {
              const IconComponent = t.icon;
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  id={`theme-btn-${t.id}`}
                  onClick={() => setTheme(t.id as any)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all duration-150 cursor-pointer ${
                    isSelected 
                      ? 'bg-t-accent text-t-surface shadow-xs font-bold' 
                      : 'text-t-muted-text hover:text-t-dark-text hover:bg-t-muted/50'
                  }`}
                  title={`${t.label} Mode`}
                >
                  <IconComponent className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{t.label}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-t-muted border border-t-border px-3.5 py-1.5 rounded-full text-[10px] text-t-text font-semibold uppercase tracking-wider transition-colors">
            <div className="w-1.5 h-1.5 rounded-full bg-t-text animate-pulse" />
            <span>Data-Free</span>
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

      {/* Modern Professional Footer Info Bar */}
      {view === 'home' && (
        <footer className="h-12 bg-t-surface border-t border-t-border flex items-center justify-between px-6 select-none shrink-0 font-mono z-10 transition-colors" id="app-footer">
          <div className="flex items-center gap-4 text-[10px] text-t-muted-text uppercase tracking-widest transition-colors">
            <span className="text-t-text font-bold">Secure Access Node</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">1,024,582 Zero-Rated Endpoints Loaded</span>
            <span>•</span>
            <span className="text-t-muted-text">Latency: 14ms</span>
          </div>
          <div className="flex items-center gap-4 font-mono transition-colors">
            <div className="hidden md:flex items-center gap-2">
              <span className="text-[10px] text-t-muted-text uppercase tracking-widest">Data Saved: 142.8 MB</span>
              <div className="h-1.5 w-20 bg-t-muted rounded-full overflow-hidden transition-colors">
                <div className="h-full w-2/3 bg-t-accent transition-colors"></div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-t-text uppercase tracking-wider transition-colors">67% Optimized</span>
          </div>
        </footer>
      )}
    </div>
  );
}
