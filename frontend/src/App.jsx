import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Code, 
  GitBranch, 
  Settings, 
  Play, 
  AlertTriangle, 
  FileText, 
  Folder, 
  FolderOpen,
  ChevronRight, 
  Github,
  HelpCircle,
  TrendingUp,
  Bug,
  Shield,
  Zap,
  CheckCircle,
  FileCode,
  ArrowRight
} from 'lucide-react';
import CodeEditor from './components/CodeEditor';
import ScoreMeter from './components/ScoreMeter';
import IssueCard from './components/IssueCard';
import { api } from './utils/api';

// Pre-populated buggy code templates
const TEMPLATES = {
  javascript: `// CodeSage JS Demo Code (SQL Injection, unoptimized loops, global leaks)
function processUserData(userId, userRole) {
  // 1. Security vulnerability: SQL Injection
  const query = "SELECT * FROM users WHERE id = '" + userId + "' AND role = '" + userRole + "'";
  
  db.execute(query, function(err, result) {
    if (err) {
      console.log(err); // 2. Bug: sensitive log disclosure
      return;
    }
    
    // 3. Performance issue: Quadratic nested loops
    for (var i = 0; i < result.length; i++) {
      for (var j = 0; j < result.length; j++) {
        if (result[i].id === result[j].parent_id) {
          console.log("User hierarchy association identified");
        }
      }
    }
    
    // 4. Maintainability: Implicit global variable
    userDataStore = result[0];
  });
}`,
  python: `# CodeSage Python Demo Code (Mutable defaults, path traversals, resource leaks)
import os

def load_user_profile(user_id, cache={}):
    # 1. Bug: Mutable default argument 'cache'
    
    # 2. Security issue: Path injection / traversal vulnerability
    profile_path = "/var/profiles/" + user_id + ".json"
    
    # 3. Maintainability/Resource Leak: file opened without closing/context manager
    f = open(profile_path, "r")
    data = f.read()
    
    # 4. Performance: redundant deserialization inside loop
    for i in range(1000):
        import json
        profile = json.loads(data)
        cache[user_id] = profile
        
    return cache[user_id]`,
  cpp: `// CodeSage C++ Demo Code (Buffer overflows, memory leaks, uninitialized variables)
#include <iostream>
#include <cstring>

void processPayload(char* input) {
    // 1. Security: Buffer Overflow via strcpy
    char buffer[16];
    strcpy(buffer, input);
    
    // 2. Bug: Uninitialized pointer dereference risk
    int* dataPointer;
    if (std::strlen(input) > 5) {
        dataPointer = new int(42);
    }
    
    // Dereferencing pointer which might be uninitialized
    std::cout << "Data: " << *dataPointer << std::endl;
    
    // 3. Performance: memory leak (deleting pointer is forgotten)
    // delete dataPointer;
}`
};

export default function App() {
  const [code, setCode] = useState(TEMPLATES.javascript);
  const [language, setLanguage] = useState('javascript');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  
  // Custom Settings
  const [apiKeyOverride, setApiKeyOverride] = useState(() => localStorage.getItem('codesage_api_key') || '');
  const [geminiModel, setGeminiModel] = useState('gemini-2.5-flash');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Filtering Issues
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // AI Refactoring Button States
  const [refactorPrompt, setRefactorPrompt] = useState('');
  const [isRefactoring, setIsRefactoring] = useState(false);

  // GitHub Import Tab States
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' or 'github'
  const [githubUrl, setGithubUrl] = useState('');
  const [githubPath, setGithubPath] = useState('');
  const [githubItems, setGithubItems] = useState([]);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [githubRepoInfo, setGithubRepoInfo] = useState(null);
  const [githubError, setGithubError] = useState('');

  // Synchronize localStorage
  useEffect(() => {
    localStorage.setItem('codesage_api_key', apiKeyOverride);
  }, [apiKeyOverride]);

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setLanguage(lang);
    if (TEMPLATES[lang]) {
      setCode(TEMPLATES[lang]);
    }
  };

  const handleAnalyze = async () => {
    setIsLoading(true);
    setResults(null);
    console.log('Sending code to review engine for language:', language);
    try {
      const response = await api.analyzeCode(code, language, apiKeyOverride);
      console.log('Review completed successfully. Response:', response);
      setResults(response);
    } catch (err) {
      console.error('Review failed with error:', err);
      alert(`Code Review Failed: ${err.message}`);
      if (err.message.includes('API Key is missing')) {
        setIsSettingsOpen(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefactor = async () => {
    if (!refactorPrompt.trim()) return;
    setIsRefactoring(true);
    try {
      const response = await api.refactorCode(code, language, refactorPrompt, apiKeyOverride);
      if (response && response.refactoredCode) {
        setCode(response.refactoredCode);
        setRefactorPrompt('');
        alert('Code refactored successfully! Applied directly to your editor.');
      }
    } catch (err) {
      alert(`Refactoring Failed: ${err.message}`);
    } finally {
      setIsRefactoring(false);
    }
  };

  // Helper to apply inline fixes from issue cards
  const handleApplyFix = (issue) => {
    if (issue.improvedCode) {
      // To replace code dynamically, we can replace the block, or replace the entire editor content if the issue returns a fully refactored block.
      // In this setup, we replace the entire editor content with the corrected snippet, or we replace the corresponding lines if we write line replacement code.
      // Let's replace the whole file for ease or notify the user.
      setCode(issue.improvedCode);
      alert(`Applied improvement for: "${issue.title}"`);
    }
  };

  // GitHub Explorer Functions
  const fetchGithubDirectory = async (path = '') => {
    setIsGithubLoading(true);
    setGithubError('');
    try {
      const data = await api.getGithubContents(githubUrl, path);
      setGithubItems(data.items);
      setGithubPath(path);
      setGithubRepoInfo({ owner: data.owner, repo: data.repo });
    } catch (err) {
      setGithubError(err.message);
    } finally {
      setIsGithubLoading(false);
    }
  };

  const handleGithubFileClick = async (item) => {
    if (item.type === 'dir') {
      fetchGithubDirectory(item.path);
    } else if (item.type === 'file') {
      setIsGithubLoading(true);
      try {
        const fileData = await api.getGithubFile(item.downloadUrl);
        setCode(fileData.content);
        
        // Auto-detect language by file extension
        const ext = item.name.split('.').pop().toLowerCase();
        const extensionMap = {
          'js': 'javascript',
          'jsx': 'javascript',
          'ts': 'typescript',
          'tsx': 'typescript',
          'py': 'python',
          'cpp': 'cpp',
          'cc': 'cpp',
          'c': 'cpp',
          'h': 'cpp',
          'cs': 'csharp',
          'java': 'java',
          'html': 'html',
          'css': 'css',
          'json': 'json',
          'sh': 'shell'
        };
        setLanguage(extensionMap[ext] || 'javascript');
        
        // Switch to editor tab
        setActiveTab('editor');
        alert(`Loaded file: ${item.path}. Switched to editor.`);
      } catch (err) {
        alert(`Failed to load file: ${err.message}`);
      } finally {
        setIsGithubLoading(false);
      }
    }
  };

  const handleGithubGoBack = () => {
    if (!githubPath) return;
    const parts = githubPath.split('/');
    parts.pop(); // Remove current folder
    const parentPath = parts.join('/');
    fetchGithubDirectory(parentPath);
  };

  // Filter Issues logic
  const filteredIssues = results?.issues?.filter(issue => {
    const matchesSeverity = severityFilter === 'ALL' || issue.severity?.toUpperCase() === severityFilter;
    const matchesCategory = categoryFilter === 'ALL' || issue.category?.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSeverity && matchesCategory;
  }) || [];

  return (
    <div className="flex-1 flex flex-col font-sans">
      {/* Top Banner (Navigation/Header) */}
      <header className="glassmorphism border-b border-slate-800/80 px-6 py-4 sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-600 p-2 rounded-lg glow-indigo">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-display tracking-tight text-white flex items-center">
              CodeSage <span className="text-indigo-400 font-normal ml-1.5 border border-indigo-500/30 px-2 py-0.5 rounded-full text-[10px] uppercase font-mono tracking-wider">AI Reviewer</span>
            </h1>
            <p className="text-[10px] text-slate-400">Intelligent Static & Security Review Engine</p>
          </div>
        </div>

        {/* Top Controls */}
        <div className="flex items-center space-x-3">
          <div className="flex bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs font-medium">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'editor' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Workspace</span>
            </button>
            <button
              onClick={() => setActiveTab('github')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'github' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Github className="w-3.5 h-3.5" />
              <span>Git Import</span>
            </button>
          </div>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 border border-slate-800 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-hidden">
        {/* LEFT COLUMN: Input / Code Workspace (cols: 7) */}
        <section className="lg:col-span-7 flex flex-col space-y-4 h-[calc(100vh-140px)] min-h-[500px]">
          {activeTab === 'editor' ? (
            /* Code Editor Pane */
            <div className="flex-1 glassmorphism rounded-xl p-4 flex flex-col min-h-0 border border-slate-800/60">
              <div className="flex items-center justify-between mb-3 shrink-0">
                <div className="flex items-center space-x-2">
                  <FileCode className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-semibold text-slate-300 font-display">Source Workspace</span>
                </div>
                <div className="flex items-center space-x-3">
                  <select
                    value={language}
                    onChange={handleLanguageChange}
                    className="bg-slate-900 border border-slate-800 rounded-md text-xs px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="cpp">C++</option>
                    <option value="csharp">C#</option>
                    <option value="java">Java</option>
                  </select>

                  <button
                    onClick={handleAnalyze}
                    disabled={isLoading}
                    className={`flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-1.5 rounded-md shadow-lg shadow-indigo-950/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Reviewing...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Run Code Review</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Monaco Editor Container */}
              <div className="flex-1 min-h-0 relative">
                <CodeEditor
                  language={language}
                  value={code}
                  onChange={setCode}
                />
              </div>

              {/* AI Auto-Refactor Toolbar */}
              <div className="mt-4 border-t border-slate-900 pt-4 shrink-0 flex items-center space-x-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Ask CodeSage to refactor (e.g., 'Make it thread-safe', 'Optimize loops', 'Use ES Modules')..."
                    value={refactorPrompt}
                    onChange={(e) => setRefactorPrompt(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-md text-xs px-3 py-2 text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRefactor();
                    }}
                  />
                </div>
                <button
                  onClick={handleRefactor}
                  disabled={isRefactoring || !refactorPrompt.trim()}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs px-4 py-2 rounded-md transition-all cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {isRefactoring ? (
                    <>
                      <div className="w-3 h-3 border border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>Refactoring...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Refactor</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* GitHub Explorer Pane */
            <div className="flex-1 glassmorphism rounded-xl p-6 flex flex-col min-h-0 border border-slate-800/60">
              <div className="shrink-0 mb-4">
                <h3 className="text-sm font-semibold text-slate-300 font-display mb-1 flex items-center">
                  <Github className="w-4 h-4 mr-2 text-slate-400" />
                  GitHub Repository Explorer
                </h3>
                <p className="text-xs text-slate-400 mb-4">Import any public repository to inspect individual codebase file structures and select files for AI code reviews.</p>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Enter owner/repo (e.g., 'facebook/react', or full repo URL)..."
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-md text-xs px-3.5 py-2.5 text-slate-300 focus:outline-none focus:border-indigo-500 font-mono"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') fetchGithubDirectory('');
                    }}
                  />
                  <button
                    onClick={() => fetchGithubDirectory('')}
                    disabled={isGithubLoading || !githubUrl.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2.5 rounded-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGithubLoading ? 'Loading...' : 'Browse Repo'}
                  </button>
                </div>
              </div>

              {/* GitHub File Explorer */}
              <div className="flex-1 border border-slate-800 rounded-lg bg-slate-950/40 min-h-0 flex flex-col">
                {/* Path Breadcrumbs */}
                <div className="bg-slate-900/60 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0 font-mono">
                  <span className="truncate">
                    Repo: {githubRepoInfo ? `${githubRepoInfo.owner}/${githubRepoInfo.repo}` : 'Not connected'} 
                    {githubPath && ` / ${githubPath}`}
                  </span>
                  {githubPath && (
                    <button
                      onClick={handleGithubGoBack}
                      className="text-indigo-400 hover:underline cursor-pointer"
                    >
                      .. Up Directory
                    </button>
                  )}
                </div>

                {/* Directory Item List */}
                <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-900">
                  {isGithubLoading ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 py-8">
                      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs">Fetching items from GitHub...</span>
                    </div>
                  ) : githubError ? (
                    <div className="p-8 text-center text-xs text-rose-400">
                      <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                      <span>{githubError}</span>
                    </div>
                  ) : githubItems.length > 0 ? (
                    githubItems.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => handleGithubFileClick(item)}
                        className="w-full text-left flex items-center justify-between px-3 py-2.5 hover:bg-slate-900/50 transition-colors text-xs font-mono text-slate-300 group cursor-pointer"
                      >
                        <div className="flex items-center space-x-2.5">
                          {item.type === 'dir' ? (
                            <Folder className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                          ) : (
                            <FileText className="w-4 h-4 text-indigo-400" />
                          )}
                          <span className="group-hover:text-white transition-colors">{item.name}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400" />
                      </button>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-500 italic">
                      No files loaded. Enter a public repository to browse.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* RIGHT COLUMN: Review Analysis Panel (cols: 5) */}
        <section className="lg:col-span-5 flex flex-col space-y-4 h-[calc(100vh-140px)] min-h-[500px] overflow-hidden">
          {results ? (
            /* Results Panel */
            <div className="flex-1 flex flex-col min-h-0 space-y-4 overflow-hidden">
              
              {/* Radial quality meter */}
              <div className="shrink-0">
                <ScoreMeter score={results.score} categories={results.categories} />
              </div>

              {/* Filtering Controls */}
              <div className="glassmorphism-card rounded-xl p-4 shrink-0 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <span className="text-xs font-bold font-display text-slate-400 uppercase tracking-wider">Review Findings</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-mono font-bold">
                    {filteredIssues.length} of {results.issues?.length || 0} issues
                  </span>
                </div>

                <div className="flex flex-col space-y-2">
                  {/* Severity Filters */}
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-[10px] text-slate-500 font-semibold w-16 uppercase font-mono">Severity:</span>
                    <div className="flex bg-slate-950/60 p-0.5 rounded border border-slate-900 font-mono">
                      {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
                        <button
                          key={sev}
                          onClick={() => setSeverityFilter(sev)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                            severityFilter === sev 
                              ? 'bg-slate-800 text-white border border-slate-700/50' 
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {sev}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category Filters */}
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-[10px] text-slate-500 font-semibold w-16 uppercase font-mono">Category:</span>
                    <div className="flex flex-wrap gap-1 bg-slate-950/60 p-0.5 rounded border border-slate-900 font-mono">
                      {['ALL', 'BUGS', 'SECURITY', 'PERFORMANCE', 'MAINTAINABILITY'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setCategoryFilter(cat)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                            categoryFilter === cat 
                              ? 'bg-slate-800 text-white border border-slate-700/50' 
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Scrollable Issue Cards */}
              <div className="flex-1 overflow-y-auto pr-1">
                {filteredIssues.length > 0 ? (
                  filteredIssues.map((issue) => (
                    <IssueCard 
                      key={issue.id} 
                      issue={issue} 
                      originalCodeSnippet={code}
                      onApplyFix={handleApplyFix}
                    />
                  ))
                ) : (
                  <div className="glassmorphism-card rounded-xl p-8 text-center text-xs text-slate-500 italic">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <span>No issues found matching the selected filters. Great job!</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Idle Placeholder State */
            <div className="flex-1 glassmorphism rounded-xl border border-slate-800/60 p-8 flex flex-col items-center justify-center text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-xl"></div>
                <div className="relative border border-slate-800/80 bg-slate-950/80 p-5 rounded-2xl glow-indigo">
                  <Sparkles className="w-10 h-10 text-indigo-400 animate-pulse" />
                </div>
              </div>
              
              <div className="max-w-xs space-y-2">
                <h3 className="text-base font-bold font-display text-slate-200">Awaiting Code Submission</h3>
                <p className="text-xs text-slate-400 leading-relaxed">Paste your code in the workspace editor or import a GitHub repository, then click <strong className="text-slate-300">"Run Code Review"</strong> to generate your analysis.</p>
              </div>

              <div className="w-full max-w-xs border border-slate-900 bg-slate-950/20 rounded-xl p-3.5 text-left text-xs text-slate-400 space-y-3 font-sans">
                <div className="flex items-center space-x-2 text-slate-300 font-semibold font-display">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Review metrics covered:</span>
                </div>
                <ul className="space-y-1.5 list-disc pl-4 font-mono text-[10px]">
                  <li>Security vulnerabilities (OWASP Top 10)</li>
                  <li>Runtime exception risks & logical bugs</li>
                  <li>Big-O optimization & performance leaks</li>
                  <li>Maintainability, clean style & code smells</li>
                </ul>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Settings Modal (Overlay) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glassmorphism rounded-xl border border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-extrabold font-display text-white flex items-center space-x-2">
                <Settings className="w-4 h-4 text-indigo-400 animate-spin" style={{ animationDuration: '6s' }} />
                <span>CodeSage Core Settings</span>
              </h3>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer font-sans"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block text-slate-400 font-semibold font-display">Gemini API Key</label>
                <input
                  type="password"
                  placeholder="Paste your key here..."
                  value={apiKeyOverride}
                  onChange={(e) => setApiKeyOverride(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <p className="text-[10px] text-slate-500 leading-normal">
                  Providing an API key here overrides backend defaults and stores it locally in your browser. Alternatively, configure `GEMINI_API_KEY` in the backend `.env` file.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-400 font-semibold font-display">Analysis AI Model</label>
                <select
                  value={geminiModel}
                  onChange={(e) => setGeminiModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-2 text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended - Ultra Fast)</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash (Legacy)</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep Reasoning)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end space-x-2.5">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2 rounded-md transition-all cursor-pointer"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
