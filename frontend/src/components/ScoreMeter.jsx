import React, { useEffect, useState } from 'react';
import { ShieldCheck, Bug, Zap, Activity } from 'lucide-react';
import confetti from 'canvas-confetti';

const ScoreMeter = ({ score = 0, categories = { bugs: 0, security: 0, performance: 0, maintainability: 0 } }) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const strokeDasharray = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = strokeDasharray - (animatedScore / 100) * strokeDasharray;

  useEffect(() => {
    setAnimatedScore(0);
    const duration = 1200; // ms
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      // Ease out quad
      const easedProgress = progress * (2 - progress);
      setAnimatedScore(Math.round(easedProgress * score));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Trigger confetti for excellent scores
        if (score >= 90) {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#6366f1', '#10b981', '#0ea5e9']
          });
        }
      }
    };

    requestAnimationFrame(animate);
  }, [score]);

  // Determine colors based on score
  const getScoreColor = (val) => {
    if (val >= 80) return 'text-emerald-400 stroke-emerald-500';
    if (val >= 60) return 'text-amber-400 stroke-amber-500';
    return 'text-rose-500 stroke-rose-500';
  };

  const getScoreBgColorClass = (val) => {
    if (val >= 80) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (val >= 60) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  };

  // Determine Letter Grade
  const getLetterGrade = (val) => {
    if (val >= 95) return 'A+';
    if (val >= 90) return 'A';
    if (val >= 80) return 'B';
    if (val >= 70) return 'C';
    if (val >= 60) return 'D';
    return 'F';
  };

  // Category Icon Resolver
  const getCategoryIcon = (key) => {
    switch (key) {
      case 'bugs':
        return <Bug className="w-4 h-4 text-rose-400" />;
      case 'security':
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 'performance':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'maintainability':
        return <Activity className="w-4 h-4 text-indigo-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="glassmorphism-card rounded-xl p-6 flex flex-col items-center">
      <h3 className="text-sm font-semibold text-slate-400 font-display mb-4 self-start tracking-wider uppercase">Code Quality Index</h3>
      
      {/* Circular Gauge */}
      <div className="relative w-40 h-40 flex items-center justify-center mb-6">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            className="stroke-slate-800 fill-none"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            className={`fill-none transition-all duration-300 ${getScoreColor(score)}`}
            strokeWidth="8"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        {/* Centered Score */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold text-white font-display tracking-tight">
            {animatedScore}
          </span>
          <span className={`text-xs px-2.5 py-0.5 rounded-full border mt-1 font-bold ${getScoreBgColorClass(score)}`}>
            Grade {getLetterGrade(score)}
          </span>
        </div>
      </div>

      {/* Sub Category Scores */}
      <div className="w-full grid grid-cols-2 gap-3 mt-2">
        {Object.entries(categories).map(([key, val]) => (
          <div key={key} className="bg-slate-900/50 border border-slate-800/80 rounded-lg p-3 flex flex-col">
            <div className="flex items-center space-x-1.5 mb-1">
              {getCategoryIcon(key)}
              <span className="text-xs text-slate-400 capitalize">{key}</span>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-lg font-bold text-slate-200 font-display">{val}%</span>
              <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden mb-1.5">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    val >= 80 ? 'bg-emerald-500' : val >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${val}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScoreMeter;
