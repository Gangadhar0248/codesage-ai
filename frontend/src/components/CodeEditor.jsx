import React from 'react';
import Editor from '@monaco-editor/react';

const CodeEditor = ({ language, value, onChange, theme = 'vs-dark' }) => {
  const handleEditorChange = (val) => {
    if (onChange) {
      onChange(val);
    }
  };

  const mapMonacoLanguage = (lang) => {
    if (!lang) return 'javascript';
    const l = lang.toLowerCase();
    if (l === 'js') return 'javascript';
    if (l === 'ts') return 'typescript';
    if (l === 'py') return 'python';
    if (l === 'c++' || l === 'cpp') return 'cpp';
    if (l === 'cs') return 'csharp';
    return l;
  };

  const monacoOptions = {
    fontSize: 14,
    fontFamily: '"Fira Code", "Courier New", monospace',
    fontLigatures: true,
    minimap: { enabled: false },
    lineHeight: 22,
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    padding: { top: 12, bottom: 12 },
    scrollbar: {
      vertical: 'visible',
      horizontal: 'visible',
      verticalScrollbarSize: 8,
      horizontalScrollbarSize: 8,
    },
    roundedSelection: true,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    wordWrap: 'on',
  };

  return (
    <div className="w-full h-full relative border border-slate-800 rounded-lg overflow-hidden bg-[#1e1e1e]">
      <Editor
        height="100%"
        language={mapMonacoLanguage(language)}
        value={value}
        onChange={handleEditorChange}
        theme={theme}
        options={monacoOptions}
        loading={
          <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-mono">Initializing CodeSage Monaco Engine...</span>
          </div>
        }
      />
    </div>
  );
};

export default CodeEditor;
