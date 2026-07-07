import React, { useState } from 'react';
import { Search, Globe, Shield, BookOpen, GraduationCap, CheckCircle2, AlertTriangle, Cpu, Plus, Sparkles } from 'lucide-react';
import { ZeroRatedSite } from '../types';

interface PortalHomeProps {
  onLaunchSite: (url: string) => void;
  customSites: ZeroRatedSite[];
  onAddCustomSite: (name: string, domain: string) => void;
}

const PRESET_SITES: ZeroRatedSite[] = [
  {
    id: 'siyavula-math',
    name: 'Siyavula Mathematics',
    domain: 'https://learn.siyavula.com/maths',
    category: 'math',
    description: 'High-school aligned, rich interactive mathematics practice, explanations, and dynamic exercises.',
    logo: '📐',
    isPopular: true
  },
  {
    id: 'siyavula-science',
    name: 'Siyavula Science',
    domain: 'https://learn.siyavula.com/science',
    category: 'science',
    description: 'Interactive high-school physics and chemistry lessons, aligned to national curricula.',
    logo: '🧪',
    isPopular: true
  },
  {
    id: 'wikipedia',
    name: 'Wikipedia',
    domain: 'https://www.wikipedia.org',
    category: 'general',
    description: 'The free encyclopedia. Access millions of educational articles completely data-free.',
    logo: '🌐',
    isPopular: true
  },
  {
    id: 'khan-academy',
    name: 'Khan Academy',
    domain: 'https://www.khanacademy.org',
    category: 'math',
    description: 'Free, world-class education for anyone, anywhere, spanning mathematics, science, and history.',
    logo: '🏫',
    isPopular: true
  },
  {
    id: 'phet-sims',
    name: 'PhET Interactive Simulations',
    domain: 'https://phet.colorado.edu',
    category: 'science',
    description: 'Interactive science and math simulations from the University of Colorado Boulder.',
    logo: '🌀',
    isPopular: false
  },
  {
    id: 'wikibooks',
    name: 'Wikibooks',
    domain: 'https://www.wikibooks.org',
    category: 'resource',
    description: 'An open-content textbooks collection that anyone can edit, ideal for self-directed students.',
    logo: '📚',
    isPopular: false
  },
  {
    id: 'openstax',
    name: 'OpenStax Textbooks',
    domain: 'https://openstax.org',
    category: 'resource',
    description: 'Peer-reviewed, openly licensed college and high school textbooks, 100% free.',
    logo: '📖',
    isPopular: false
  },
  {
    id: 'gutenberg',
    name: 'Project Gutenberg',
    domain: 'https://www.gutenberg.org',
    category: 'resource',
    description: 'A library of over 70,000 free eBooks, specializing in classic literature and historic educational materials.',
    logo: '🏛️',
    isPopular: false
  }
];

export default function PortalHome({ onLaunchSite, customSites, onAddCustomSite }: PortalHomeProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'math' | 'science' | 'general' | 'resource'>('all');
  
  // Custom site additions
  const [customName, setCustomName] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [checkingDomain, setCheckingDomain] = useState(false);
  const [domainStatus, setDomainStatus] = useState<{ isZeroRated: boolean; domain?: string; error?: string } | null>(null);

  // Filter sites
  const allSites = [...PRESET_SITES, ...customSites];
  const filteredSites = allSites.filter(site => {
    const matchesSearch = site.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          site.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          site.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || site.category === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleDomainCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDomain) return;
    
    setCheckingDomain(true);
    setDomainStatus(null);

    try {
      const res = await fetch(`/api/check-domain?url=${encodeURIComponent(customDomain)}`);
      const data = await res.json();
      
      if (data.error) {
        setDomainStatus({ isZeroRated: false, error: data.error });
      } else {
        setDomainStatus({ isZeroRated: data.isZeroRated, domain: data.domain });
      }
    } catch {
      setDomainStatus({ isZeroRated: false, error: 'Could not connect to domain verification API' });
    } finally {
      setCheckingDomain(false);
    }
  };

  const handleAddSite = () => {
    if (!customName || !customDomain || !domainStatus?.domain) return;
    onAddCustomSite(customName, customDomain);
    
    // Reset
    setCustomName('');
    setCustomDomain('');
    setDomainStatus(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-12 animate-fade-in relative z-10" id="portal-home">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-5">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border border-emerald-500/20">
          <GraduationCap className="w-4 h-4" />
          <span>Zero-Rated Educational Hub</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Learn Free. <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-400">No Mobile Data Required.</span>
        </h1>
        <p className="text-base text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
          Access high-school aligned Mathematics, Science, and reference textbooks. Browse Siyavula and Wikipedia completely data-free.
        </p>
      </div>

      {/* Wildcard Counter Badge */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-white/5 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="space-y-3 text-center md:text-left relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-semibold">
            <Cpu className="w-3.5 h-3.5" />
            <span>Intelligent Pattern Engine</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">1,000,000+ Zero-Rated Educational Sites Enabled</h2>
          <p className="text-slate-400 max-w-xl text-xs leading-relaxed font-light">
            Our intelligent proxy server dynamically parses and whitelists subdomains ending in <code className="bg-white/5 text-emerald-300 border border-white/10 px-1.5 py-0.5 rounded font-mono">.edu</code>, <code className="bg-white/5 text-emerald-300 border border-white/10 px-1.5 py-0.5 rounded font-mono">.gov.za</code>, and regional academic portals. Browse academic institutions globally completely free.
          </p>
        </div>
        <div className="flex gap-4 shrink-0 font-mono relative z-10">
          <div className="bg-white/5 border border-white/5 backdrop-blur px-5 py-3.5 rounded-xl text-center">
            <div className="text-xl font-bold text-white">100%</div>
            <div className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">DATA SECURE</div>
          </div>
          <div className="bg-white/5 border border-white/5 backdrop-blur px-5 py-3.5 rounded-xl text-center">
            <div className="text-xl font-bold text-emerald-400">ACTIVE</div>
            <div className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">PROXY ENGINE</div>
          </div>
        </div>
      </div>

      {/* Main Search & Catalog Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900/40 border border-white/5 p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-widest text-slate-500">Resource Filters</h3>
            <div className="flex flex-col gap-1.5">
              {[
                { id: 'all', label: 'All Resources', count: allSites.length },
                { id: 'math', label: 'Mathematics', count: allSites.filter(s => s.category === 'math').length },
                { id: 'science', label: 'Physical Sciences', count: allSites.filter(s => s.category === 'science').length },
                { id: 'general', label: 'General Knowledge', count: allSites.filter(s => s.category === 'general').length },
                { id: 'resource', label: 'Reference & Books', count: allSites.filter(s => s.category === 'resource').length }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-xs rounded-xl transition-all font-semibold border ${
                    activeTab === tab.id
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.05)]'
                      : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-white/5'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${activeTab === tab.id ? 'bg-emerald-400/20 text-emerald-300' : 'bg-white/5 text-slate-500'}`}>{tab.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Domain Testing */}
          <div className="bg-slate-900/40 border border-white/5 p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center gap-1.5 text-white">
              <Globe className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-xs uppercase tracking-widest text-slate-300">Check Your Network</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-light">
              Enter any academic learning portal link to test if it matches our zero-rated protocol.
            </p>
            
            <form onSubmit={handleDomainCheck} className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="e.g. siyavula.co.za"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  className="w-full text-xs bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500/50 text-slate-200 placeholder-slate-600 outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={checkingDomain || !customDomain}
                className="w-full text-xs bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-2.5 px-3 rounded-xl transition-all shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 disabled:opacity-40 cursor-pointer"
              >
                {checkingDomain ? 'Verifying Node...' : 'Test Domain Whitelist'}
              </button>
            </form>

            {domainStatus && (
              <div className="p-3.5 rounded-xl text-xs leading-relaxed space-y-2 border">
                {domainStatus.isZeroRated ? (
                  <div className="text-emerald-300 bg-emerald-500/10 border-emerald-500/20">
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Zero-Rated Whitelisted</span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-light leading-relaxed">
                      <strong>{domainStatus.domain}</strong> matches regional zero-rated educational protocols. You can safely add it to your shortcuts.
                    </p>
                    
                    <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
                      <input
                        type="text"
                        placeholder="Shortcut Name (e.g. My School)"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        className="w-full bg-black/40 text-xs border border-white/10 rounded-lg px-2.5 py-1.5 outline-none text-slate-200 focus:border-emerald-500/30"
                      />
                      <button
                        onClick={handleAddSite}
                        disabled={!customName}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-extrabold py-1.5 rounded-lg transition-all disabled:opacity-40"
                      >
                        Add to Shortcuts
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                      <span>Non-Whitelisted URL</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-light leading-relaxed">
                      {domainStatus.error || "This domain does not match zero-rated regulations. General web access is restricted to preserve your mobile data."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Catalog Main View */}
        <div className="lg:col-span-3 space-y-6">
          {/* Top Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search Siyavula maths, Wikipedia pages, books, or simulation portals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-900/40 border border-white/10 rounded-xl shadow-inner focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500/50 outline-none text-base text-slate-200 placeholder-slate-500"
            />
          </div>

          {/* Site Cards Grid */}
          {filteredSites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredSites.map((site) => (
                <div
                  key={site.id}
                  className="group bg-gradient-to-br from-slate-900 to-slate-950 p-6 rounded-2xl border border-white/5 hover:border-emerald-500/30 hover:shadow-[0_0_25px_rgba(16,185,129,0.03)] transition-all flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-2xl bg-white/5 group-hover:bg-emerald-500/10 group-hover:text-emerald-400 w-12 h-12 rounded-xl flex items-center justify-center transition-colors border border-white/5">
                        {site.logo}
                      </div>
                      <span className={`text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full border ${
                        site.category === 'math' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                        site.category === 'science' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                        site.category === 'general' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' :
                        'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      }`}>
                        {site.category === 'math' ? 'Mathematics' :
                         site.category === 'science' ? 'Science' :
                         site.category === 'general' ? 'Reference' : 'Resource'}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="font-bold text-white group-hover:text-emerald-400 transition-colors text-lg flex items-center gap-1.5">
                        {site.name}
                        {site.isPopular && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                            <Sparkles className="w-2.5 h-2.5" /> Core
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] font-mono text-slate-500 select-all">{site.domain}</p>
                    </div>

                    <p className="text-sm text-slate-400 leading-relaxed font-light">
                      {site.description}
                    </p>
                  </div>

                  <button
                    onClick={() => onLaunchSite(site.domain)}
                    className="w-full flex items-center justify-center gap-1.5 bg-white/5 hover:bg-emerald-500 text-slate-300 hover:text-black text-xs font-bold py-3 px-4 rounded-xl transition-all border border-white/10 hover:border-emerald-500 shadow-md cursor-pointer"
                  >
                    <span>Launch Portal</span>
                    <Globe className="w-4 h-4 shrink-0" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-900/40 rounded-2xl border border-white/5 p-12 text-center space-y-4 shadow-sm">
              <Globe className="w-10 h-10 text-slate-700 mx-auto" />
              <h3 className="font-bold text-slate-400 text-lg">No zero-rated portals match your filters</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto font-light">
                Try searching for simple names like "Siyavula" or adjust your filter categories above.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
