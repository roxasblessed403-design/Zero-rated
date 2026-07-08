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
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-t-bg" id="browser-view">
      
      {/* Top Browser Toolbar */}
      <div className="bg-t-surface text-t-text p-4 border-b border-t-border flex flex-col md:flex-row items-center gap-4 shrink-0 select-none transition-colors duration-200">
        
        {/* Navigation Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onGoHome}
            title="Back to Portal Home"
            className="w-9 h-9 rounded-full bg-t-muted border border-t-border/50 flex items-center justify-center cursor-pointer hover:bg-t-muted/80 text-t-text hover:text-t-dark-text transition-all"
          >
            <Home className="w-4 h-4" />
          </button>
          
          <div className="h-5 w-[1px] bg-t-border mx-1" />

          <button
            onClick={handleBack}
            title="Back"
            className="w-9 h-9 rounded-full bg-t-muted border border-t-border/50 flex items-center justify-center cursor-pointer hover:bg-t-muted/80 text-t-text hover:text-t-dark-text transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleForward}
            title="Forward"
            className="w-9 h-9 rounded-full bg-t-muted border border-t-border/50 flex items-center justify-center cursor-pointer hover:bg-t-muted/80 text-t-text hover:text-t-dark-text transition-all"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleRefresh}
            title="Reload page"
            className="w-9 h-9 rounded-full bg-t-muted border border-t-border/50 flex items-center justify-center cursor-pointer hover:bg-t-muted/80 text-t-text hover:text-t-dark-text transition-all"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Address Input Bar */}
        <form onSubmit={handleAddressSubmit} className="flex-1 w-full relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[10px] text-t-text font-bold uppercase tracking-widest bg-t-muted px-2.5 py-1 rounded-full border border-t-border">
            <span className="w-1.5 h-1.5 bg-t-text rounded-full animate-pulse" />
            <span>Zeroed</span>
          </div>
          <input
            type="text"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            className="w-full bg-t-muted border border-t-border hover:border-t-text/30 focus:border-t-text rounded-full py-2.5 pl-24 pr-10 outline-none text-xs text-t-text placeholder-t-muted-text/70 font-mono transition-all"
            placeholder="Enter learning link..."
          />
          <button
            type="submit"
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-t-muted-text hover:text-t-text transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>
        </form>

        {/* Companion Integration Shortcuts */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleClipPage}
            title="Clip notes from this educational page"
            className="text-xs bg-t-muted hover:bg-t-muted/80 border border-t-border text-t-text px-4 py-2.5 rounded-xl flex items-center gap-2 font-semibold transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span className="hidden lg:inline">Clip Page</span>
          </button>

          <div className="h-6 w-[1px] bg-t-border mx-1" />

          {/* Sidebar Tab Triggers */}
          <button
            onClick={() => setSidebarTab(sidebarTab === 'tutor' ? null : 'tutor')}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
              sidebarTab === 'tutor' 
                ? 'bg-t-accent text-t-surface border-t-border font-bold' 
                : 'bg-t-muted hover:bg-t-muted/80 text-t-text border-t-border'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>AI Tutor</span>
          </button>
          <button
            onClick={() => setSidebarTab(sidebarTab === 'notes' ? null : 'notes')}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
              sidebarTab === 'notes' 
                ? 'bg-t-accent text-t-surface border-t-border font-bold' 
                : 'bg-t-muted hover:bg-t-muted/80 text-t-text border-t-border'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Study Notes</span>
          </button>
          <button
            onClick={() => setSidebarTab(sidebarTab === 'drive' ? null : 'drive')}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
              sidebarTab === 'drive' 
                ? 'bg-t-accent text-t-surface border-t-border font-bold' 
                : 'bg-t-muted hover:bg-t-muted/80 text-t-text border-t-border'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Drive Backup</span>
          </button>
        </div>
      </div>

      {/* Main Sandbox Frame & Companion Sidebar */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Sandbox Content Area */}
        <div className="flex-1 h-full bg-t-bg relative flex flex-col">
          
          {/* Subtle Banner Showing current Page Title */}
          <div className="bg-t-muted border-b border-t-border px-4 py-2.5 text-xs text-t-text font-medium flex items-center justify-between select-none shrink-0 transition-colors">
            <span className="truncate">Browsing educational portal: <strong className="text-t-dark-text">{pageTitle}</strong></span>
            <span className="font-mono text-[10px] text-t-muted-text truncate max-w-[200px]">{currentUrl}</span>
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
              className="w-full sm:w-[380px] h-full shadow-lg z-10 shrink-0 relative flex flex-col bg-t-surface border-l border-t-border transition-colors duration-200"
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
                <div className="flex flex-col h-full bg-t-surface text-t-text">
                  {/* Notes Panel Header */}
                  <div className="p-4 border-b border-t-border flex items-center justify-between shadow-xs shrink-0 bg-t-muted transition-colors">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-5 h-5 text-t-text" />
                      <h3 className="font-bold text-t-dark-text text-sm tracking-wide">Study Workbook</h3>
                    </div>
                    <button
                      onClick={() => setSidebarTab(null)}
                      className="text-t-muted-text hover:text-t-text p-1.5 rounded-lg hover:bg-t-muted transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Note Creator Form */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-t-surface transition-colors">
                    
                    <div className="space-y-3 bg-t-muted p-4 rounded-2xl border border-t-border transition-colors">
                      <h4 className="font-bold text-t-text text-[10px] uppercase tracking-widest">New Workbook Entry</h4>
                      
                      <input
                        type="text"
                        placeholder="Study Topic Title..."
                        value={noteTitle}
                        onChange={(e) => setNoteTitle(e.target.value)}
                        className="w-full text-xs border border-t-border bg-t-surface rounded-xl px-3.5 py-2.5 text-t-text placeholder-t-muted-text outline-none focus:border-t-text transition-colors"
                      />
                      <textarea
                        placeholder="Write study summaries, formulas or notes here..."
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        rows={6}
                        className="w-full text-xs border border-t-border bg-t-surface rounded-xl px-3.5 py-2.5 text-t-text placeholder-t-muted-text outline-none focus:border-t-text font-sans transition-colors"
                      />
                      
                      <button
                        onClick={handleSaveLocalNote}
                        disabled={!noteTitle || !noteContent || savingStatus === 'saving'}
                        className="w-full bg-t-accent hover:bg-t-hover text-t-surface text-xs font-semibold py-2.5 px-3 rounded-xl transition-all shadow-xs disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {savingStatus === 'saving' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        <span>Save & Backup Note</span>
                      </button>

                      {savingStatus === 'saved' && (
                        <div className="bg-t-muted border border-t-border text-t-text p-3 rounded-xl text-[11px] flex items-center gap-1.5 leading-relaxed transition-colors">
                          <CheckCircle2 className="w-4 h-4 text-t-text shrink-0" />
                          <span>Saved locally and backed up to Google Drive!</span>
                        </div>
                      )}
                    </div>

                    {/* Local Saved Notes History */}
                    <div className="space-y-3.5">
                      <h4 className="font-bold text-xs uppercase tracking-widest text-t-muted-text transition-colors">My Study Entries ({savedNotes.length})</h4>
                      {savedNotes.length > 0 ? (
                        <div className="space-y-3">
                          {savedNotes.map((note) => (
                            <div key={note.id} className="p-4 bg-t-muted rounded-xl border border-t-border space-y-2.5 text-xs transition-colors">
                              <div className="flex items-center justify-between">
                                <h5 className="font-bold text-t-dark-text tracking-wide">{note.title}</h5>
                                <button
                                  onClick={() => onDeleteNote(note.id)}
                                  className="text-t-muted-text hover:text-rose-600 p-1.5 hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
                                  title="Delete Note"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <p className="text-t-text line-clamp-3 leading-relaxed font-light transition-colors">{note.content}</p>
                              <div className="flex items-center justify-between text-[10px] text-t-muted-text font-mono transition-colors">
                                <span>{note.createdAt}</span>
                                {note.urlContext && (
                                  <span className="text-t-text truncate max-w-[150px] bg-t-muted border border-t-border px-2 py-0.5 rounded-full transition-colors">Context active</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-t-muted-text text-xs font-light transition-colors">
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
