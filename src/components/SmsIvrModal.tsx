import React, { useState } from 'react';
import { X, Smartphone, Volume2, PhoneCall, MessageSquare, Play, Pause } from 'lucide-react';
import { FarmerRecord } from 'packages/core';

interface SmsIvrModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmer: FarmerRecord;
}

export const SmsIvrModal: React.FC<SmsIvrModalProps> = ({ isOpen, onClose, farmer }) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [tab, setTab] = useState<'sms' | 'ivr'>('sms');

  if (!isOpen) return null;

  const smsTextEnglish = `AquaPulse Wardha Panchayat:
Farmer ${farmer.id} (${farmer.name}):
Your weekly water allocation is ${farmer.allocatedHours} hrs.
${farmer.escrowHours > 0 ? `Notice: ${farmer.escrowHours} hrs is held in ESCROW pending review. Meeting on Thursday.` : 'All water allocated.'}
Receipt Hash: ${farmer.leafHash.slice(0, 10)}...`;

  const smsTextHindi = `एक्वापल्स वर्धा ग्राम पंचायत:
किसान ${farmer.id} (${farmer.name}):
आपका साप्ताहिक जल आवंटन ${farmer.allocatedHours} घंटे है।
${farmer.escrowHours > 0 ? `सूचना: ${farmer.escrowHours} घंटे एस्क्रो में सुरक्षित रखे गए हैं। ग्राम समिति की बैठक गुरुवार को है।` : 'सभी जल घंटे आवंटित हैं।'}
रसीद कोड: ${farmer.leafHash.slice(0, 10)}...`;

  const handleToggleVoiceSimulation = () => {
    setIsPlayingAudio(!isPlayingAudio);
    // Use Web Speech API if supported
    if (!isPlayingAudio && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        `AquaPulse Wardha Gram Panchayat. Farmer ${farmer.name}. Your weekly water allocation is ${farmer.allocatedHours} hours. ${farmer.escrowHours > 0 ? `${farmer.escrowHours} hours is safely held in escrow.` : ''}`
      );
      utterance.rate = 0.9;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    } else if (isPlayingAudio && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-neutral-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-cyan-400" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">Low-Tech Farmer Notification</h3>
                <span className="font-mono text-[10px] font-bold text-amber-400 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800">
                  [MOCK]
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Inclusive offline dispatch for feature-phone users without internet.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-md hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-neutral-800 bg-neutral-950 text-xs">
          <button
            onClick={() => setTab('sms')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
              tab === 'sms' ? 'text-white border-b-2 border-cyan-400 bg-neutral-900/60 font-semibold' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>SMS Notification (GSM)</span>
          </button>
          <button
            onClick={() => setTab('ivr')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
              tab === 'ivr' ? 'text-white border-b-2 border-cyan-400 bg-neutral-900/60 font-semibold' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Interactive Voice IVR</span>
          </button>
        </div>

        {/* Mock Phone Body */}
        <div className="p-6 bg-neutral-950/70 flex justify-center">
          <div className="w-full max-w-xs bg-neutral-950 border-2 border-neutral-700 rounded-3xl p-4 shadow-xl">
            {/* Phone Screen Top bar */}
            <div className="flex justify-between items-center text-[10px] text-neutral-500 font-mono pb-2 border-b border-neutral-800 mb-3">
              <span>BSNL 2G · Wardha</span>
              <span>12:45 PM</span>
            </div>

            {tab === 'sms' ? (
              <div className="space-y-3">
                <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-xs font-mono text-neutral-200 leading-relaxed whitespace-pre-line">
                  {smsTextHindi}
                </div>
                <div className="p-2.5 bg-neutral-900/50 rounded-lg text-[11px] text-neutral-400 whitespace-pre-line font-mono">
                  {smsTextEnglish}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-cyan-950 border border-cyan-700 flex items-center justify-center">
                  <Volume2 className={`w-8 h-8 text-cyan-400 ${isPlayingAudio ? 'animate-bounce' : ''}`} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">AquaPulse Wardha IVR</div>
                  <div className="text-xs text-neutral-400 font-mono mt-0.5">Calling: {farmer.phone}</div>
                </div>

                <button
                  onClick={handleToggleVoiceSimulation}
                  className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-neutral-900 font-semibold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2 mx-auto cursor-pointer"
                >
                  {isPlayingAudio ? (
                    <>
                      <Pause className="w-4 h-4 fill-current" />
                      <span>Stop Voice Simulation</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Play Synthesized Audio Call</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
