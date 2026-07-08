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
        <div className="inline-flex items-center gap-2 bg-t-muted text-t-text px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border border-t-border transition-colors">
          <GraduationCap className="w-4 h-4" />
          <span>Zero-Rated Educational Hub</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-t-dark-text tracking-tight leading-tight transition-colors">
          Learn Free. <span className="text-t-muted-text">No Mobile Data Required.</span>
        </h1>
        <p className="text-base text-t-text max-w-2xl mx-auto font-light leading-relaxed transition-colors">
          Access high-school aligned Mathematics, Science, and reference textbooks. Browse Siyavula and Wikipedia completely data-free.
        </p>
      </div>

      {/* Wildcard Counter Badge */}
      <div className="bg-t-surface border border-t-border rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs relative overflow-hidden transition-colors">
        <div className="space-y-3 text-center md:text-left relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-t-muted text-t-text border border-t-border px-3 py-1 rounded-full text-xs font-semibold transition-colors">
            <Cpu className="w-3.5 h-3.5" />
            <span>Intelligent Pattern Engine</span>
          </div>
          <h2 className="text-2xl font-bold text-t-dark-text tracking-tight transition-colors">Over 1,000,000 Academic Resources Whitelisted</h2>
          <p className="text-t-text max-w-xl text-xs leading-relaxed font-light transition-colors">
            Our intelligent proxy server dynamically parses and whitelists subdomains ending in <code className="bg-t-muted text-t-dark-text border border-t-border px-1.5 py-0.5 rounded font-mono transition-colors">.edu</code>, <code className="bg-t-muted text-t-dark-text border border-t-border px-1.5 py-0.5 rounded font-mono transition-colors">.gov.za</code>, and regional academic portals. Browse academic institutions globally completely free.
          </p>
        </div>
        <div className="flex gap-4 shrink-0 font-mono relative z-10">
          <div className="bg-t-muted border border-t-border px-5 py-3.5 rounded-xl text-center transition-colors">
            <div className="text-xl font-bold text-t-dark-text">100%</div>
            <div className="text-[9px] text-t-muted-text uppercase tracking-wider mt-0.5">DATA SECURE</div>
          </div>
          <div className="bg-t-muted border border-t-border px-5 py-3.5 rounded-xl text-center transition-colors">
            <div className="text-xl font-bold text-t-text">ACTIVE</div>
            <div className="text-[9px] text-t-muted-text uppercase tracking-wider mt-0.5">PROXY ENGINE</div>
          </div>
        </div>
      </div>

      {/* Main Search & Catalog Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-t-surface border border-t-border p-5 rounded-2xl shadow-xs space-y-4 transition-colors">
            <h3 className="font-bold text-xs uppercase tracking-widest text-t-muted-text transition-colors">Resource Filters</h3>
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
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-xs rounded-xl transition-all font-semibold border cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-t-accent text-t-surface border-t-border shadow-xs'
                      : 'text-t-muted-text hover:text-t-dark-text border-transparent hover:bg-t-muted/50'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono transition-colors ${activeTab === tab.id ? 'bg-t-surface text-t-dark-text' : 'bg-t-muted text-t-muted-text'}`}>{tab.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Domain Testing */}
          <div className="bg-t-surface border border-t-border p-5 rounded-2xl shadow-xs space-y-4 transition-colors">
            <div className="flex items-center gap-1.5 text-t-dark-text transition-colors">
              <Globe className="w-4 h-4 text-t-text" />
              <h3 className="font-bold text-xs uppercase tracking-widest text-t-muted-text">Check Your Network</h3>
            </div>
            <p className="text-xs text-t-text leading-relaxed font-light transition-colors">
              Enter any academic learning portal link to test if it matches our zero-rated protocol.
            </p>
            
            <form onSubmit={handleDomainCheck} className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="e.g. siyavula.co.za"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  className="w-full text-xs bg-t-muted border border-t-border rounded-xl px-3.5 py-2.5 focus:border-t-text text-t-text placeholder-t-muted-text/70 outline-none transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={checkingDomain || !customDomain}
                className="w-full text-xs bg-t-accent hover:bg-t-hover text-t-surface font-semibold py-2.5 px-3 rounded-xl transition-all shadow-xs disabled:opacity-40 cursor-pointer"
              >
                {checkingDomain ? 'Verifying Node...' : 'Test Domain Whitelist'}
              </button>
            </form>

            {domainStatus && (
              <div className="p-3.5 rounded-xl text-xs leading-relaxed space-y-2 border border-t-border transition-colors">
                {domainStatus.isZeroRated ? (
                  <div className="text-t-text bg-t-muted/30 p-1">
                    <div className="flex items-center gap-1.5 font-bold mb-1 text-t-dark-text">
                      <CheckCircle2 className="w-4 h-4 text-t-text" />
                      <span>Zero-Rated Whitelisted</span>
                    </div>
                    <p className="text-[11px] text-t-muted-text font-light leading-relaxed">
                      <strong>{domainStatus.domain}</strong> matches regional zero-rated educational protocols. You can safely add it to your shortcuts.
                    </p>
                    
                    <div className="mt-3 pt-3 border-t border-t-border space-y-2">
                      <input
                        type="text"
                        placeholder="Shortcut Name (e.g. My School)"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        className="w-full bg-t-muted text-xs border border-t-border rounded-lg px-2.5 py-1.5 outline-none text-t-text placeholder-t-muted-text focus:border-t-text transition-colors"
                      />
                      <button
                        onClick={handleAddSite}
                        disabled={!customName}
                        className="w-full bg-t-accent hover:bg-t-hover text-t-surface text-[11px] font-semibold py-1.5 rounded-lg transition-all disabled:opacity-40 cursor-pointer"
                      >
                        Add to Shortcuts
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-t-text bg-t-muted/30 p-3 rounded-xl border border-t-border">
                    <div className="flex items-center gap-1.5 font-bold mb-1 text-t-dark-text">
                      <AlertTriangle className="w-4 h-4 text-t-text" />
                      <span>Non-Whitelisted URL</span>
                    </div>
                    <p className="text-[11px] text-t-muted-text font-light leading-relaxed">
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
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-t-muted-text" />
            <input
              type="text"
              placeholder="Search Siyavula maths, Wikipedia pages, books, or simulation portals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-t-surface border border-t-border rounded-xl shadow-xs focus:border-t-text outline-none text-base text-t-text placeholder-t-muted-text transition-colors"
            />
          </div>

          {/* Site Cards Grid */}
          {filteredSites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredSites.map((site) => (
                <div
                  key={site.id}
                  className="group bg-t-surface p-6 rounded-2xl border border-t-border hover:border-t-text/30 hover:shadow-xs transition-all flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-t-text bg-t-muted group-hover:bg-t-muted/80 w-12 h-12 rounded-xl flex items-center justify-center transition-colors border border-t-border">
                        {renderSiteIcon(site.logo)}
                      </div>
                      <span className="text-[10px] uppercase tracking-widest font-semibold px-2.5 py-1 rounded-full border bg-t-muted text-t-text border-t-border transition-colors">
                        {site.category === 'math' ? 'Mathematics' :
                         site.category === 'science' ? 'Science' :
                         site.category === 'general' ? 'Reference' : 'Resource'}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="font-bold text-t-dark-text group-hover:text-t-dark-text transition-colors text-lg flex items-center gap-1.5">
                        {site.name}
                        {site.isPopular && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] bg-t-muted text-t-text border border-t-border font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider transition-colors">
                            Core
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] font-mono text-t-muted-text select-all transition-colors">{site.domain}</p>
                    </div>

                    <p className="text-sm text-t-text leading-relaxed font-light transition-colors">
                      {site.description}
                    </p>
                  </div>

                  <button
                    onClick={() => onLaunchSite(site.domain)}
                    className="w-full flex items-center justify-center gap-1.5 bg-t-muted hover:bg-t-accent text-t-text hover:text-t-surface text-xs font-semibold py-3 px-4 rounded-xl transition-all border border-t-border hover:border-transparent shadow-xs cursor-pointer"
                  >
                    <span>Launch Portal</span>
                    <Globe className="w-4 h-4 shrink-0" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-t-surface rounded-2xl border border-t-border p-12 text-center space-y-4 shadow-xs transition-colors">
              <Globe className="w-10 h-10 text-t-muted-text mx-auto" />
              <h3 className="font-bold text-t-text text-lg transition-colors">No zero-rated portals match your filters</h3>
              <p className="text-sm text-t-muted-text max-w-md mx-auto font-light transition-colors">
                Try searching for simple names like "Siyavula" or adjust your filter categories above.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
