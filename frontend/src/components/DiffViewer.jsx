import React from 'react';
import { ArrowRight, Check, X } from 'lucide-react';

const DiffViewer = ({ original = '', improved = '', language = '' }) => {
  const origLines = original ? original.split('\n') : [];
  const impLines = improved ? improved.split('\n') : [];

  return (
    <div className="w-full border border-slate-800 rounded-lg overflow-hidden bg-slate-950 font-mono text-xs flex flex-col md:flex-row">
      {/* Before Column */}
      <div className="flex-1 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col min-w-0">
        <div className="bg-rose-950/30 border-b border-slate-800 px-3 py-2 flex items-center justify-between">
          <span className="text-rose-400 font-semibold flex items-center space-x-1.5 font-display">
            <X className="w-3.5 h-3.5" />
            <span>Before (Original)</span>
          </span>
        </div>
        <div className="p-3 overflow-x-auto max-h-72 overflow-y-auto no-scrollbar">
          {origLines.map((line, idx) => (
            <div key={idx} className="flex hover:bg-slate-900/40 py-0.5">
              <span className="text-slate-600 select-none w-8 text-right pr-2 font-light">{idx + 1}</span>
              <pre className="text-rose-300 whitespace-pre overflow-x-visible pr-2">{line || ' '}</pre>
            </div>
          ))}
          {origLines.length === 0 && (
            <div className="text-slate-500 italic p-2">No original snippet provided</div>
          )}
        </div>
      </div>

      {/* After Column */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-emerald-950/30 border-b border-slate-800 px-3 py-2 flex items-center justify-between">
          <span className="text-emerald-400 font-semibold flex items-center space-x-1.5 font-display">
            <Check className="w-3.5 h-3.5" />
            <span>After (Suggested Fix)</span>
          </span>
        </div>
        <div className="p-3 overflow-x-auto max-h-72 overflow-y-auto no-scrollbar">
          {impLines.map((line, idx) => (
            <div key={idx} className="flex hover:bg-slate-900/40 py-0.5">
              <span className="text-slate-600 select-none w-8 text-right pr-2 font-light">{idx + 1}</span>
              <pre className="text-emerald-300 whitespace-pre overflow-x-visible pr-2">{line || ' '}</pre>
            </div>
          ))}
          {impLines.length === 0 && (
            <div className="text-slate-500 italic p-2">No improved snippet provided</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiffViewer;
