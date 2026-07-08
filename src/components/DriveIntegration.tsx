import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  Cloud, 
  CloudOff, 
  Loader2, 
  FileText, 
  Trash2, 
  Download, 
  Save, 
  LogIn, 
  LogOut, 
  CheckCircle2, 
  AlertCircle,
  FileCode,
  PenTool
} from 'lucide-react';
import { 
  initAuth, 
  googleSignIn, 
  logout, 
  listDriveNotes, 
  deleteDriveNote, 
  saveNoteToDrive, 
  getDriveNoteContent,
  DriveFile 
} from '../lib/drive';
import { SavedNote } from '../types';

interface DriveIntegrationProps {
  notesList: SavedNote[];
  onImportNote: (note: SavedNote) => void;
  onRefreshDriveFlag: boolean;
}

export default function DriveIntegration({ notesList, onImportNote, onRefreshDriveFlag }: DriveIntegrationProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [activeFileContent, setActiveFileContent] = useState<string | null>(null);
  const [viewingFileName, setViewingFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Local scratchpad
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        setNeedsAuth(false);
        fetchDriveFiles(accessToken);
      },
      () => {
        setUser(null);
        setToken(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  // Sync files if external action (like clipping a note) triggers a refresh request
  useEffect(() => {
    if (token) {
      fetchDriveFiles(token);
    }
  }, [onRefreshDriveFlag]);

  const fetchDriveFiles = async (accessToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const files = await listDriveNotes(accessToken);
      setDriveFiles(files);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load files from your Google Drive.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setToken(result.accessToken);
        setUser(result.user);
        setNeedsAuth(false);
        fetchDriveFiles(result.accessToken);
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err.message || 'Authentication with Google failed.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out of Google Drive?')) {
      await logout();
      setUser(null);
      setToken(null);
      setNeedsAuth(true);
      setDriveFiles([]);
      setActiveFileContent(null);
    }
  };

  // Google Drive creation
  const handleCreateNoteOnDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !noteTitle || !noteBody) return;
    
    setSavingNote(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const markdownContent = `## ${noteTitle}\n\n${noteBody}\n\n*Created in Zero-Rated Maths Portal on ${new Date().toLocaleDateString()}*`;
      await saveNoteToDrive(noteTitle, markdownContent, token);
      
      setSaveSuccess(true);
      setNoteTitle('');
      setNoteBody('');
      
      // Refresh list
      fetchDriveFiles(token);
      
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error(err);
      setError('Failed to save study note to Google Drive.');
    } finally {
      setSavingNote(false);
    }
  };

  // Destructive delete: REQUIRES confirmation dialog!
  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (!token) return;

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${fileName}" from your Google Drive? This action cannot be undone.`
    );
    if (!confirmed) return;

    setLoading(true);
    setError(null);
    try {
      await deleteDriveNote(fileId, token);
      if (viewingFileName === fileName) {
        setActiveFileContent(null);
        setViewingFileName(null);
      }
      // Refresh
      fetchDriveFiles(token);
    } catch (err: any) {
      console.error(err);
      setError('Failed to delete file from Google Drive.');
    } finally {
      setLoading(false);
    }
  };

  // Read note from Drive
  const handleViewFileContent = async (fileId: string, fileName: string) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const content = await getDriveNoteContent(fileId, token);
      setActiveFileContent(content);
      setViewingFileName(fileName);
    } catch (err: any) {
      console.error(err);
      setError('Failed to download note contents.');
    } finally {
      setLoading(false);
    }
  };

  const handleImportToLocal = () => {
    if (!viewingFileName || !activeFileContent) return;
    onImportNote({
      id: Date.now().toString(),
      title: viewingFileName.replace('.md', ''),
      content: activeFileContent,
      createdAt: new Date().toLocaleDateString()
    });
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200" id="google-drive-companion">
      {/* Auth Banner & Info */}
      <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-2 rounded-lg border border-slate-200">
            <Cloud className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm tracking-wide">Cloud Workspace</h3>
            <p className="text-[10px] text-slate-500 truncate max-w-[150px]">
              {user ? user.email : 'Access your worksheets'}
            </p>
          </div>
        </div>

        {user ? (
          <button
            onClick={handleLogout}
            className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        ) : (
          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-extrabold flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            {isLoggingIn ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LogIn className="w-3.5 h-3.5" />
            )}
            <span>Connect</span>
          </button>
        )}
      </div>

      {/* Main Container Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white text-slate-700">
        
        {/* Error Messages */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex gap-2 items-start animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-800">Workspace Connection Error</p>
              <p className="text-[11px] mt-0.5 text-rose-500">{error}</p>
            </div>
          </div>
        )}

        {needsAuth ? (
          <div className="text-center py-8 px-4 space-y-4 bg-slate-50 rounded-2xl border border-slate-200">
            <CloudOff className="w-10 h-10 text-slate-400 mx-auto" />
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900">Secure Student Cloud</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Log in to link your Google Drive. This allows you to securely backup and organize study notes, formulas, and AI math explanations offline.
              </p>
            </div>
            
            {/* Standard compliant Google Sign In styled button */}
            <button 
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold py-2.5 px-4 rounded-xl shadow-xs transition-all w-full max-w-xs cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              <span>Connect Google Account</span>
            </button>
          </div>
        ) : (
          <>
            {/* Create Study Note Form */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3.5">
              <div className="flex items-center gap-1.5 text-slate-700">
                <PenTool className="w-4 h-4 text-slate-600" />
                <h4 className="font-bold text-[10px] uppercase tracking-widest text-slate-500">Quick Formula Note</h4>
              </div>

              <form onSubmit={handleCreateNoteOnDrive} className="space-y-3">
                <input
                  type="text"
                  placeholder="Note Title (e.g., Quadratic Formula)"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  required
                  className="w-full text-xs border border-slate-200 bg-white rounded-xl px-3.5 py-2.5 text-slate-800 placeholder-slate-400 outline-none focus:border-slate-400"
                />
                <textarea
                  placeholder="Write formulas, proofs, or theorems..."
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  required
                  rows={4}
                  className="w-full text-xs border border-slate-200 bg-white rounded-xl px-3.5 py-2.5 text-slate-800 placeholder-slate-400 outline-none focus:border-slate-400 font-mono resize-none"
                />
                <button
                  type="submit"
                  disabled={savingNote || !noteTitle || !noteBody}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2.5 px-3 rounded-xl transition-all shadow-xs disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {savingNote ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Save to Google Drive</span>
                </button>
              </form>

              {saveSuccess && (
                <div className="bg-slate-50 border border-slate-200 text-slate-700 p-3 rounded-xl text-xs flex items-center gap-1.5 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-slate-600 shrink-0" />
                  <span>Note saved directly to Google Drive!</span>
                </div>
              )}
            </div>

            {/* List Google Drive Files */}
            <div className="space-y-2.5">
              <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400">Cloud Worksheets</h4>
              
              {loading && driveFiles.length === 0 ? (
                <div className="flex justify-center items-center py-6 gap-2 text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-xl">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                  <span>Loading files...</span>
                </div>
              ) : driveFiles.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {driveFiles.map((file) => (
                    <div
                      key={file.id}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-all ${
                        viewingFileName === file.name
                          ? 'bg-slate-100 border-slate-300'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <button
                        onClick={() => handleViewFileContent(file.id, file.name)}
                        className="flex items-center gap-2.5 flex-1 text-left cursor-pointer"
                      >
                        <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                        <div className="truncate">
                          <p className="font-bold text-slate-900 truncate">{file.name}</p>
                          <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                            {file.createdTime ? new Date(file.createdTime).toLocaleDateString() : 'Unknown Date'}
                          </p>
                        </div>
                      </button>

                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => handleDeleteFile(file.id, file.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <FileCode className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="font-bold text-slate-600 text-xs">No Cloud Notes Saved Yet</p>
                  <p className="text-[10px] text-slate-500 max-w-[200px] mx-auto leading-normal">
                    Clip tutor explanations or write formula sheets above to save them directly to Drive.
                  </p>
                </div>
              )}
            </div>

            {/* View File Drawer / Reader */}
            {activeFileContent && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm space-y-3.5 animate-fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h4 className="font-bold text-slate-900 text-xs truncate max-w-[180px]">{viewingFileName}</h4>
                  <button
                    onClick={handleImportToLocal}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold py-1.5 px-2.5 rounded-lg flex items-center gap-1 transition-all border border-slate-200 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Open Locally</span>
                  </button>
                </div>
                <div className="text-xs text-slate-600 max-h-40 overflow-y-auto whitespace-pre-wrap font-mono leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                  {activeFileContent}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
