import React, { useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface PlaygroundScrubberProps {
  verifyStep: number;
  onSetVerifyStep: (step: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  isLightMode: boolean;
  step1Sentence: string;
  step2Sentence: string;
  step3Sentence: string;
  step4Sentence: string;
  statusPillText: string;
  statusPillColorClass: string;
}

export const PlaygroundScrubber: React.FC<PlaygroundScrubberProps> = ({
  verifyStep,
  onSetVerifyStep,
  isPlaying,
  onTogglePlay,
  isLightMode,
  step1Sentence,
  step2Sentence,
  step3Sentence,
  step4Sentence,
  statusPillText,
  statusPillColorClass,
}) => {
  // Autoplay through steps 1-4 (~35 seconds full cycle, ~8.5s per step)
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      onSetVerifyStep((verifyStep % 4) + 1);
    }, 8500);
    return () => clearInterval(interval);
  }, [isPlaying, verifyStep, onSetVerifyStep]);

  // Keyboard navigation: Space toggles, keys 1-4 jump
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        onTogglePlay();
      } else if (e.key === '1') {
        onSetVerifyStep(1);
      } else if (e.key === '2') {
        onSetVerifyStep(2);
      } else if (e.key === '3') {
        onSetVerifyStep(3);
      } else if (e.key === '4') {
        onSetVerifyStep(4);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTogglePlay, onSetVerifyStep]);

  // Dynamic narrative sentence from state per contradictions 6, 7, 8
  const currentSentence =
    verifyStep === 1
      ? step1Sentence
      : verifyStep === 2
      ? step2Sentence
      : verifyStep === 3
      ? step3Sentence
      : step4Sentence;

  return (
    <div
      className={`absolute bottom-5 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-2xl p-2 rounded-2xl shadow-2xl flex flex-col gap-1.5 text-xs font-sans select-none pointer-events-auto border transition-all ${
        isLightMode
          ? 'bg-white/95 backdrop-blur-xl border-slate-200 text-slate-800 shadow-slate-300/40'
          : 'bg-[#0d1017]/95 backdrop-blur-xl border-white/[0.1] text-slate-100 shadow-black/60'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Play/Pause & Reset Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onTogglePlay}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-xs ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold'
                : 'bg-sky-500 hover:bg-sky-400 text-white font-bold'
            }`}
            title={isPlaying ? 'Pause Sequence (Space)' : 'Play Sequence (Space)'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
          </button>

          <button
            onClick={() => onSetVerifyStep(1)}
            className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
              isLightMode
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/[0.08] text-slate-300'
            }`}
            title="Restart Sequence (Key 1)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Segmented Step Buttons */}
        <div
          className={`flex items-center gap-1 p-1 rounded-xl border flex-1 ${
            isLightMode ? 'bg-slate-100 border-slate-200' : 'bg-black/30 border-white/[0.06]'
          }`}
        >
          {[
            { step: 1, label: '1. Self-Reports', hotkey: '1' },
            { step: 2, label: '2. Signals', hotkey: '2' },
            { step: 3, label: '3. The Flip', hotkey: '3' },
            { step: 4, label: '4. Escrow Lock', hotkey: '4' },
          ].map((s) => (
            <button
              key={s.step}
              onClick={() => onSetVerifyStep(s.step)}
              className={`flex-1 py-1.5 px-2 rounded-lg text-center font-medium text-xs transition-all cursor-pointer ${
                verifyStep === s.step
                  ? s.step === 3
                    ? isLightMode
                      ? 'bg-rose-100 text-rose-800 border border-rose-300 font-bold shadow-xs'
                      : 'bg-rose-950/80 text-rose-300 border border-rose-800 font-bold shadow-xs'
                    : s.step === 4
                    ? isLightMode
                      ? 'bg-amber-100 text-amber-800 border border-amber-300 font-bold shadow-xs'
                      : 'bg-amber-950/80 text-amber-300 border border-amber-800 font-bold shadow-xs'
                    : isLightMode
                    ? 'bg-white text-slate-900 border border-slate-300 font-bold shadow-xs'
                    : 'bg-white/[0.14] text-white border border-white/[0.12] font-bold shadow-xs'
                  : isLightMode
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Narrative Status Pill (Derived from State) */}
        <div className="shrink-0 hidden md:block text-xs font-mono pr-2">
          <span className={statusPillColorClass}>{statusPillText}</span>
        </div>
      </div>

      {/* Dynamic Grounded Explanation Banner per Contradictions 6, 7, 8 */}
      <div
        className={`px-3 py-1.5 rounded-lg border text-[11px] leading-relaxed transition-colors flex items-center justify-between gap-2 ${
          isLightMode
            ? 'bg-slate-50 border-slate-200 text-slate-700'
            : 'bg-white/[0.03] border-white/[0.06] text-slate-300'
        }`}
      >
        <span className="truncate">{currentSentence}</span>
        <span className={`text-[10px] shrink-0 font-mono ${isLightMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Step {verifyStep}/4
        </span>
      </div>
    </div>
  );
};
