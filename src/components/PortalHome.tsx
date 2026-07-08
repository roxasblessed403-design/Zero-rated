import React, { useState } from 'react';
import { Search, Globe, Shield, BookOpen, GraduationCap, CheckCircle2, AlertTriangle, Cpu, Plus, Sparkles, Compass, FlaskConical, Activity, Bookmark, Library } from 'lucide-react';
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
    logo: 'compass',
    isPopular: true
  },
  {
    id: 'siyavula-science',
    name: 'Siyavula Science',
    domain: 'https://learn.siyavula.com/science',
    category: 'science',
    description: 'Interactive high-school physics and chemistry lessons, aligned to national curricula.',
    logo: 'flask',
    isPopular: true
  },
  {
    id: 'wikipedia',
    name: 'Wikipedia',
    domain: 'https://www.wikipedia.org',
    category: 'general',
    description: 'The free encyclopedia. Access millions of educational articles completely data-free.',
    logo: 'globe',
    isPopular: true
  },
  {
    id: 'khan-academy',
    name: 'Khan Academy',
    domain: 'https://www.khanacademy.org',
    category: 'math',
    description: 'Free, world-class education for anyone, anywhere, spanning mathematics, science, and history.',
    logo: 'graduation-cap',
    isPopular: true
  },
  {
    id: 'phet-sims',
    name: 'PhET Interactive Simulations',
    domain: 'https://phet.colorado.edu',
    category: 'science',
    description: 'Interactive science and math simulations from the University of Colorado Boulder.',
    logo: 'activity',
    isPopular: false
  },
  {
    id: 'wikibooks',
    name: 'Wikibooks',
    domain: 'https://www.wikibooks.org',
    category: 'resource',
    description: 'An open-content textbooks collection that anyone can edit, ideal for self-directed students.',
    logo: 'book-open',
    isPopular: false
  },
  {
    id: 'openstax',
    name: 'OpenStax Textbooks',
    domain: 'https://openstax.org',
    category: 'resource',
    description: 'Peer-reviewed, openly licensed college and high school textbooks, 100% free.',
    logo: 'bookmark',
    isPopular: false
  },
  {
    id: 'gutenberg',
    name: 'Project Gutenberg',
    domain: 'https://www.gutenberg.org',
    category: 'resource',
    description: 'A library of over 70,000 free eBooks, specializing in classic literature and historic educational materials.',
    logo: 'library',
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

  const renderSiteIcon = (logoName: string) => {
    switch (logoName) {
      case 'compass': return <Compass className="w-5 h-5" />;
      case 'flask': return <FlaskConical className="w-5 h-5" />;
      case 'globe': return <Globe className="w-5 h-5" />;
      case 'graduation-cap': return <GraduationCap className="w-5 h-5" />;
      case 'activity': return <Activity className="w-5 h-5" />;
      case 'book-open': return <BookOpen className="w-5 h-5" />;
      case 'bookmark': return <Bookmark className="w-5 h-5" />;
      case 'library': return <Library className="w-5 h-5" />;
      default: return <Globe className="w-5 h-5" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-12 animate-fade-in relative z-10" id="portal-home">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-5">
        <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border border-slate-200">
          <GraduationCap className="w-4 h-4" />
          <span>Zero-Rated Educational Hub</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Learn Free. <span className="text-slate-500">No Mobile Data Required.</span>
        </h1>
        <p className="text-base text-slate-500 max-w-2xl mx-auto font-light leading-relaxed">
          Access high-school aligned Mathematics, Science, and reference textbooks. Browse Siyavula and Wikipedia completely data-free.
        </p>
      </div>

      {/* Wildcard Counter Badge */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm relative overflow-hidden">
        <div className="space-y-3 text-center md:text-left relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-full text-xs font-semibold">
            <Cpu className="w-3.5 h-3.5" />
            <span>Intelligent Pattern Engine</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Over 1,000,000 Academic Resources Whitelisted</h2>
          <p className="text-slate-500 max-w-xl text-xs leading-relaxed font-light">
            Our intelligent proxy server dynamically parses and whitelists subdomains ending in <code className="bg-slate-50 text-slate-800 border border-slate-200 px-1.5 py-0.5 rounded font-mono">.edu</code>, <code className="bg-slate-50 text-slate-800 border border-slate-200 px-1.5 py-0.5 rounded font-mono">.gov.za</code>, and regional academic portals. Browse academic institutions globally completely free.
          </p>
        </div>
        <div className="flex gap-4 shrink-0 font-mono relative z-10">
          <div className="bg-slate-50 border border-slate-200 px-5 py-3.5 rounded-xl text-center">
            <div className="text-xl font-bold text-slate-900">100%</div>
            <div className="text-[9px] text-slate-400 uppercase tracking-wider mt-0.5">DATA SECURE</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 px-5 py-3.5 rounded-xl text-center">
            <div className="text-xl font-bold text-slate-700">ACTIVE</div>
            <div className="text-[9px] text-slate-400 uppercase tracking-wider mt-0.5">PROXY ENGINE</div>
          </div>
        </div>
      </div>

      {/* Main Search & Catalog Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400">Resource Filters</h3>
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
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 border-transparent hover:bg-slate-50'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${activeTab === tab.id ? 'bg-slate-800 text-slate-100' : 'bg-slate-100 text-slate-500'}`}>{tab.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Domain Testing */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center gap-1.5 text-slate-800">
              <Globe className="w-4 h-4 text-slate-600" />
              <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400">Check Your Network</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-light">
              Enter any academic learning portal link to test if it matches our zero-rated protocol.
            </p>
            
            <form onSubmit={handleDomainCheck} className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="e.g. siyavula.co.za"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-slate-500/5 focus:border-slate-400 text-slate-800 placeholder-slate-400 outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={checkingDomain || !customDomain}
                className="w-full text-xs bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-2.5 px-3 rounded-xl transition-all shadow-sm disabled:opacity-40 cursor-pointer"
              >
                {checkingDomain ? 'Verifying Node...' : 'Test Domain Whitelist'}
              </button>
            </form>

            {domainStatus && (
              <div className="p-3.5 rounded-xl text-xs leading-relaxed space-y-2 border">
                {domainStatus.isZeroRated ? (
                  <div className="text-slate-800 bg-slate-50 border-slate-200 p-1">
                    <div className="flex items-center gap-1.5 font-bold mb-1 text-slate-900">
                      <CheckCircle2 className="w-4 h-4 text-slate-700" />
                      <span>Zero-Rated Whitelisted</span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-light leading-relaxed">
                      <strong>{domainStatus.domain}</strong> matches regional zero-rated educational protocols. You can safely add it to your shortcuts.
                    </p>
                    
                    <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                      <input
                        type="text"
                        placeholder="Shortcut Name (e.g. My School)"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        className="w-full bg-slate-50 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none text-slate-800 placeholder-slate-400 focus:border-slate-400"
                      />
                      <button
                        onClick={handleAddSite}
                        disabled={!customName}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-extrabold py-1.5 rounded-lg transition-all disabled:opacity-40"
                      >
                        Add to Shortcuts
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-800 bg-slate-50 border border-slate-200 p-3 rounded-xl">
                    <div className="flex items-center gap-1.5 font-bold mb-1 text-slate-900">
                      <AlertTriangle className="w-4 h-4 text-slate-600" />
                      <span>Non-Whitelisted URL</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-light leading-relaxed">
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
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search Siyavula maths, Wikipedia pages, books, or simulation portals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl shadow-xs focus:ring-2 focus:ring-slate-500/5 focus:border-slate-400 outline-none text-base text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Site Cards Grid */}
          {filteredSites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredSites.map((site) => (
                <div
                  key={site.id}
                  className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-slate-350 hover:shadow-md hover:shadow-slate-100 transition-all flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-slate-600 bg-slate-100 group-hover:bg-slate-200 group-hover:text-slate-800 w-12 h-12 rounded-xl flex items-center justify-center transition-colors border border-slate-200">
                        {renderSiteIcon(site.logo)}
                      </div>
                      <span className="text-[10px] uppercase tracking-widest font-semibold px-2.5 py-1 rounded-full border bg-slate-50 text-slate-600 border-slate-200">
                        {site.category === 'math' ? 'Mathematics' :
                         site.category === 'science' ? 'Science' :
                         site.category === 'general' ? 'Reference' : 'Resource'}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="font-bold text-slate-900 group-hover:text-slate-950 transition-colors text-lg flex items-center gap-1.5">
                        {site.name}
                        {site.isPopular && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] bg-slate-100 text-slate-600 border border-slate-200 font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                            Core
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] font-mono text-slate-400 select-all">{site.domain}</p>
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed font-light">
                      {site.description}
                    </p>
                  </div>

                  <button
                    onClick={() => onLaunchSite(site.domain)}
                    className="w-full flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-900 text-slate-700 hover:text-white text-xs font-bold py-3 px-4 rounded-xl transition-all border border-slate-200 hover:border-slate-900 shadow-sm cursor-pointer"
                  >
                    <span>Launch Portal</span>
                    <Globe className="w-4 h-4 shrink-0" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
              <Globe className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-600 text-lg">No zero-rated portals match your filters</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto font-light">
                Try searching for simple names like "Siyavula" or adjust your filter categories above.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
