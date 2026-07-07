import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  RotateCw, 
  Home, 
  Search, 
  Sparkles, 
  Cloud, 
  ChevronRight, 
  ChevronLeft,
  GraduationCap,
  FileText,
  Save,
  CheckCircle2,
  Trash2,
  X,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import MathTutor from './MathTutor';
import DriveIntegration from './DriveIntegration';
import { SavedNote } from '../types';
import { saveNoteToDrive, getAccessToken } from '../lib/drive';

interface BrowserViewProps {
  initialUrl: string;
  onGoHome: () => void;
  savedNotes: SavedNote[];
  onAddNote: (note: SavedNote) => void;
  onDeleteNote: (id: string) => void;
  onImportNote: (note: SavedNote) => void;
}

export default function BrowserView({ 
  initialUrl, 
  onGoHome, 
  savedNotes, 
  onAddNote, 
  onDeleteNote,
  onImportNote 
}: BrowserViewProps) {
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [addressInput, setAddressInput] = useState(initialUrl);
  const [pageTitle, setPageTitle] = useState('Loading Zero-Rated Resource...');
  const [sidebarTab, setSidebarTab] = useState<'tutor' | 'notes' | 'drive' | null>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Note-taker state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [refreshDriveFlag, setRefreshDriveFlag] = useState(false);

  // Sync iframe navigation back to address bar
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'PROXY_NAVIGATE') {
        const proxiedUrl = event.data.url;
        // The proxiedUrl might look like http://localhost:3000/api/proxy?url=https%3A%2F%2Flearn.siyavula.com
        // We want to extract the actual target URL to display in the address bar
        try {
          const urlObj = new URL(proxiedUrl);
          const targetUrl = urlObj.searchParams.get('url');
          if (targetUrl) {
            setCurrentUrl(targetUrl);
            setAddressInput(targetUrl);
          }
        } catch {
          // Fallback
          setCurrentUrl(proxiedUrl);
          setAddressInput(proxiedUrl);
        }

        if (event.data.title) {
          setPageTitle(event.data.title);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let target = addressInput.trim();
    if (!target) return;

    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = 'https://' + target;
    }

    setCurrentUrl(target);
    setIframeKey(prev => prev + 1);
  };

  const handleRefresh = () => {
    setIframeKey(prev => prev + 1);
  };

  const handleBack = () => {
    if (iframeRef.current) {
      try {
        iframeRef.current.contentWindow?.history.back();
      } catch {
        // Fallback or ignore CORS issue
      }
    }
  };

  const handleForward = () => {
    if (iframeRef.current) {
      try {
        iframeRef.current.contentWindow?.history.forward();
      } catch {
        // Fallback or ignore CORS issue
      }
    }
  };

  // Quick page clipping
  const handleClipPage = () => {
    setNoteTitle(`Study Notes: ${pageTitle}`);
    setNoteContent(`### ${pageTitle}\n\n- **Resource:** [View Website](${currentUrl})\n- **Date Saved:** ${new Date().toLocaleDateString()}\n\nWrite your maths notes or summarize explanations from this page here!`);
    setSidebarTab('notes');
  };

  // Save study note locally and to Google Drive if connected
  const handleSaveLocalNote = async () => {
    if (!noteTitle || !noteContent) return;
    
    setSavingStatus('saving');
    const newNote: SavedNote = {
      id: Date.now().toString(),
      title: noteTitle,
      content: noteContent,
      urlContext: currentUrl,
      createdAt: new Date().toLocaleDateString()
    };

    try {
      // 1. Add to local notes list
      onAddNote(newNote);

      // 2. Attempt to save to Google Drive if authenticated
      const token = await getAccessToken();
      if (token) {
        const driveId = await saveNoteToDrive(noteTitle, noteContent, token);
        newNote.driveFileId = driveId;
        setRefreshDriveFlag(prev => !prev); // trigger Drive lists update
      }

      setSavingStatus('saved');
      setNoteTitle('');
      setNoteContent('');
      setTimeout(() => setSavingStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      setSavingStatus('error');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-950" id="browser-view">
      
      {/* Top Browser Toolbar */}
      <div className="bg-slate-900/80 backdrop-blur text-white p-4 border-b border-white/5 flex flex-col md:flex-row items-center gap-4 shrink-0 select-none">
        
        {/* Navigation Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onGoHome}
            title="Back to Portal Home"
            className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center cursor-pointer hover:bg-white/10 text-slate-300 hover:text-white transition-all"
          >
            <Home className="w-4 h-4" />
          </button>
          
          <div className="h-5 w-[1px] bg-white/10 mx-1" />

          <button
            onClick={handleBack}
            title="Back"
            className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center cursor-pointer hover:bg-white/10 text-slate-300 hover:text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleForward}
            title="Forward"
            className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center cursor-pointer hover:bg-white/10 text-slate-300 hover:text-white transition-all"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleRefresh}
            title="Reload page"
            className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center cursor-pointer hover:bg-white/10 text-slate-300 hover:text-white transition-all"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Address Input Bar */}
        <form onSubmit={handleAddressSubmit} className="flex-1 w-full relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold uppercase tracking-widest bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/30">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span>Zeroed</span>
          </div>
          <input
            type="text"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            className="w-full bg-black/40 border border-white/10 hover:border-white/15 focus:border-emerald-500/50 rounded-full py-2.5 pl-24 pr-10 outline-none text-xs text-slate-200 placeholder-slate-600 font-mono shadow-inner transition-all"
            placeholder="Enter learning link..."
          />
          <button
            type="submit"
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>
        </form>

        {/* Companion Integration Shortcuts */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleClipPage}
            title="Clip notes from this educational page"
            className="text-xs bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span className="hidden lg:inline">Clip Page</span>
          </button>

          <div className="h-6 w-[1px] bg-white/10 mx-1" />

          {/* Sidebar Tab Triggers */}
          <button
            onClick={() => setSidebarTab(sidebarTab === 'tutor' ? null : 'tutor')}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
              sidebarTab === 'tutor' 
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 font-bold shadow-[0_0_12px_rgba(245,158,11,0.1)]' 
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-amber-400" />
            <span>AI Tutor</span>
          </button>
          <button
            onClick={() => setSidebarTab(sidebarTab === 'notes' ? null : 'notes')}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
              sidebarTab === 'notes' 
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-bold shadow-[0_0_12px_rgba(16,185,129,0.1)]' 
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5'
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Study Notes</span>
          </button>
          <button
            onClick={() => setSidebarTab(sidebarTab === 'drive' ? null : 'drive')}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
              sidebarTab === 'drive' 
                ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30 font-bold shadow-[0_0_12px_rgba(99,102,241,0.1)]' 
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5'
            }`}
          >
            <Cloud className="w-4 h-4 text-indigo-400" />
            <span>Drive Backup</span>
          </button>
        </div>
      </div>

      {/* Main Sandbox Frame & Companion Sidebar */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Sandbox Content Area */}
        <div className="flex-1 h-full bg-slate-950 relative flex flex-col">
          
          {/* Subtle Banner Showing current Page Title */}
          <div className="bg-slate-900 border-b border-white/5 px-4 py-2.5 text-xs text-slate-400 font-medium flex items-center justify-between select-none shrink-0">
            <span className="truncate">Browsing educational portal: <strong className="text-emerald-400">{pageTitle}</strong></span>
            <span className="font-mono text-[10px] text-slate-500 truncate max-w-[200px]">{currentUrl}</span>
          </div>

          {/* Secure Node/Express Educational Proxy Iframe */}
          <iframe
            key={iframeKey}
            ref={iframeRef}
            src={`/api/proxy?url=${encodeURIComponent(currentUrl)}`}
            className="w-full h-[calc(100%-29px)] border-none"
            title="Zero-Rated Educational Content View"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          />
        </div>

        {/* Dynamic Slide-out Sidebar for Integrations */}
        <AnimatePresence>
          {sidebarTab && (
            <motion.div
              initial={{ x: 380, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 380, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full sm:w-[380px] h-full shadow-2xl z-10 shrink-0 relative flex flex-col bg-slate-900 border-l border-white/5"
            >
              {/* Active panel content */}
              {sidebarTab === 'tutor' && (
                <MathTutor 
                  currentUrl={currentUrl} 
                  currentTitle={pageTitle} 
                  onSaveAsNote={(note) => {
                    onAddNote(note);
                    setSidebarTab('notes');
                  }}
                />
              )}

              {sidebarTab === 'drive' && (
                <DriveIntegration 
                  notesList={savedNotes} 
                  onImportNote={(note) => {
                    onImportNote(note);
                    setSidebarTab('notes');
                  }}
                  onRefreshDriveFlag={refreshDriveFlag}
                />
              )}

              {sidebarTab === 'notes' && (
                <div className="flex flex-col h-full bg-slate-900 text-slate-200">
                  {/* Notes Panel Header */}
                  <div className="p-4 border-b border-white/5 flex items-center justify-between shadow-xs shrink-0 bg-slate-950">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-5 h-5 text-emerald-400" />
                      <h3 className="font-bold text-white text-sm tracking-wide">Study Workbook</h3>
                    </div>
                    <button
                      onClick={() => setSidebarTab(null)}
                      className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Note Creator Form */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-5">
                    
                    <div className="space-y-3 bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10">
                      <h4 className="font-bold text-emerald-400 text-[10px] uppercase tracking-widest">New Workbook Entry</h4>
                      
                      <input
                        type="text"
                        placeholder="Study Topic Title..."
                        value={noteTitle}
                        onChange={(e) => setNoteTitle(e.target.value)}
                        className="w-full text-xs border border-white/10 bg-black/40 rounded-xl px-3.5 py-2.5 text-slate-200 placeholder-slate-600 outline-none focus:border-emerald-500/40"
                      />
                      <textarea
                        placeholder="Write study summaries, formulas or notes here..."
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        rows={6}
                        className="w-full text-xs border border-white/10 bg-black/40 rounded-xl px-3.5 py-2.5 text-slate-200 placeholder-slate-600 outline-none focus:border-emerald-500/40 font-sans"
                      />
                      
                      <button
                        onClick={handleSaveLocalNote}
                        disabled={!noteTitle || !noteContent || savingStatus === 'saving'}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold py-2.5 px-3 rounded-xl transition-all shadow-lg shadow-emerald-500/10 disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {savingStatus === 'saving' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        <span>Save & Backup Note</span>
                      </button>

                      {savingStatus === 'saved' && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-3 rounded-xl text-[11px] flex items-center gap-1.5 leading-relaxed">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Saved locally and backed up to Google Drive!</span>
                        </div>
                      )}
                    </div>

                    {/* Local Saved Notes History */}
                    <div className="space-y-3.5">
                      <h4 className="font-bold text-xs uppercase tracking-widest text-slate-500">My Study Entries ({savedNotes.length})</h4>
                      {savedNotes.length > 0 ? (
                        <div className="space-y-3">
                          {savedNotes.map((note) => (
                            <div key={note.id} className="p-4 bg-slate-950/60 rounded-xl border border-white/5 space-y-2.5 text-xs">
                              <div className="flex items-center justify-between">
                                <h5 className="font-bold text-white tracking-wide">{note.title}</h5>
                                <button
                                  onClick={() => onDeleteNote(note.id)}
                                  className="text-slate-500 hover:text-rose-400 p-1.5 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                  title="Delete Note"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <p className="text-slate-400 line-clamp-3 leading-relaxed font-light">{note.content}</p>
                              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                                <span>{note.createdAt}</span>
                                {note.urlContext && (
                                  <span className="text-slate-400 truncate max-w-[150px] bg-white/5 border border-white/5 px-2 py-0.5 rounded-full">Context active</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-slate-500 text-xs font-light">
                          Your workbook is currently empty. Start taking study notes above!
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
