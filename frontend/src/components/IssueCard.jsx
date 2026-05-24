import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, AlertTriangle, Info, ChevronDown, ChevronUp, Sparkles, Code } from 'lucide-react';
import DiffViewer from './DiffViewer';

const IssueCard = ({ issue, originalCodeSnippet = '', onApplyFix }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getSeverityConfig = (sev) => {
    const s = sev?.toUpperCase();
    if (s === 'HIGH') {
      return {
        cardStyle: 'border-rose-500/20 bg-rose-500/[0.02] hover:border-rose-500/40',
        badgeStyle: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
      };
    }
    if (s === 'MEDIUM') {
      return {
        cardStyle: 'border-amber-500/20 bg-amber-500/[0.02] hover:border-amber-500/40',
        badgeStyle: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
      };
    }
    return {
      cardStyle: 'border-blue-500/20 bg-blue-500/[0.02] hover:border-blue-500/40',
      badgeStyle: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      icon: <Info className="w-5 h-5 text-blue-400 shrink-0" />
    };
  };

  const { cardStyle, badgeStyle, icon } = getSeverityConfig(issue.severity);

  // Fallback original snippet if no specific line segment is provided
  const targetSnippet = originalCodeSnippet;

  return (
    <div className={`border rounded-lg transition-all duration-200 overflow-hidden mb-3 ${cardStyle}`}>
      {/* Header (Always Visible) */}
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        className="p-4 flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-start space-x-3 min-w-0 mr-4">
          {icon}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border tracking-wide font-mono uppercase ${badgeStyle}`}>
                {issue.severity}
              </span>
              <span className="bg-slate-900 text-slate-400 border border-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase font-mono tracking-wide">
                {issue.category}
              </span>
              {issue.lineStart && (
                <span className="bg-slate-900/60 text-slate-300 border border-slate-800/80 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                  Line {issue.lineStart}{issue.lineEnd && issue.lineEnd !== issue.lineStart ? `-${issue.lineEnd}` : ''}
                </span>
              )}
            </div>
            <h4 className="text-sm font-semibold text-slate-200 truncate">{issue.title}</h4>
          </div>
        </div>
        <div className="text-slate-400 hover:text-slate-200 transition-colors">
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>

      {/* Expandable Details Container */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <div className="px-4 pb-4 border-t border-slate-900 bg-slate-950/20 text-slate-300 text-sm space-y-4">
              {/* Description */}
              <div className="mt-3">
                <span className="text-xs text-slate-400 font-semibold uppercase font-display block mb-1">Issue Description</span>
                <p className="text-slate-300 leading-relaxed">{issue.description}</p>
              </div>

              {/* Technical Explanation */}
              {issue.explanation && (
                <div>
                  <span className="text-xs text-slate-400 font-semibold uppercase font-display block mb-1">Root Cause & Explanation</span>
                  <p className="text-slate-300 leading-relaxed bg-slate-900/40 p-3 rounded-lg border border-slate-900/80 font-sans">
                    {issue.explanation}
                  </p>
                </div>
              )}

              {/* Fix Suggestion */}
              {issue.fixSuggestion && (
                <div>
                  <span className="text-xs text-slate-400 font-semibold uppercase font-display block mb-1">Proposed Fix</span>
                  <p className="text-emerald-300/90 leading-relaxed font-sans">{issue.fixSuggestion}</p>
                </div>
              )}

              {/* Diff Viewer */}
              {issue.improvedCode && (
                <div className="space-y-2">
                  <span className="text-xs text-slate-400 font-semibold uppercase font-display block">Code Comparison</span>
                  <DiffViewer 
                    original={targetSnippet} 
                    improved={issue.improvedCode} 
                    language={issue.category} 
                  />
                  {onApplyFix && (
                    <button
                      onClick={() => onApplyFix(issue)}
                      className="mt-2 w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold py-2 px-4 rounded-lg shadow-lg hover:shadow-emerald-950/20 transition-all font-display group cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 group-hover:animate-pulse" />
                      <span>Apply AI Suggestion to Code Editor</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IssueCard;
