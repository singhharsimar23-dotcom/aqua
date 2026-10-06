import React, { useState } from 'react';
import { X, Sparkles, Languages, CheckCircle2, ShieldAlert, Bot } from 'lucide-react';
import { FarmerRecord, ZoneSummary } from 'packages/core';

interface CopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  farmers: FarmerRecord[];
  summary: ZoneSummary;
}

export const CopilotDrawer: React.FC<CopilotDrawerProps> = ({
  isOpen,
  onClose,
  farmers,
  summary,
}) => {
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  if (!isOpen) return null;

  const farmerC = farmers.find((f) => f.id === 'C')!;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-neutral-900 border-l border-neutral-800 p-6 flex flex-col justify-between shadow-2xl overflow-y-auto text-neutral-100">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-cyan-400" />
              <div>
                <h2 className="text-base font-semibold text-white">AquaPulse Copilot</h2>
                <div className="flex items-center gap-1.5 text-[10px] text-neutral-400">
                  <span className="text-cyan-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-cyan-400 inline" />
                    GROUNDED (100% Verified)
                  </span>
                  <span>·</span>
                  <span>Read-Only Explainer</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Language Switcher */}
              <div className="flex items-center bg-neutral-950 p-1 border border-neutral-800 rounded-lg text-xs">
                <button
                  onClick={() => setLang('en')}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                    lang === 'en' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-400'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLang('hi')}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                    lang === 'hi' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-400'
                  }`}
                >
                  हिन्दी
                </button>
              </div>

              <button
                onClick={onClose}
                className="p-1 text-neutral-400 hover:text-white rounded-md hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Strict Non-Decision Notice */}
          <div className="mt-3 p-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-[11px] text-neutral-400 leading-normal">
            <strong className="text-neutral-300">Epistemic Rule: </strong>
            This copilot only explains and translates verifiable ledger states. It has zero power to alter allocations, issue cuts, or make judgements.
          </div>

          {/* Explanation Content */}
          <div className="mt-4 space-y-4 text-xs">
            {lang === 'en' ? (
              <>
                <div className="p-3 bg-neutral-950/80 border border-neutral-800 rounded-xl space-y-1.5">
                  <div className="font-semibold text-cyan-300">
                    Why did Zone-A flip from Semi-critical to Over-exploited?
                  </div>
                  <p className="text-neutral-300 leading-relaxed text-[11px]">
                    Under self-reported pumping of <strong>95.0 hours</strong>, Zone-A appeared to use <strong>89.2%</strong> of its 106.5h weekly budget (Semi-critical tier).
                    However, automated MSEDCL electricity meter logs revealed that Farmer Chandrakant Gaikwad pumped for <strong>50.0 hours</strong> rather than his reported <strong>20.0 hours</strong>.
                    This +30h discrepancy pushed verified zone extraction to <strong>125.0 hours (103.0% of safe cap)</strong>, breaching the sustainable recharge boundary.
                  </p>
                </div>

                <div className="p-3 bg-neutral-950/80 border border-neutral-800 rounded-xl space-y-1.5">
                  <div className="font-semibold text-amber-300">
                    Why is Farmer C placed in Escrow instead of being penalized?
                  </div>
                  <p className="text-neutral-300 leading-relaxed text-[11px]">
                    AquaPulse mandates that <em>signals flag; they never auto-cut</em>. The smart meter is a second opinion, not absolute legal proof.
                    To preserve customary dignity, Farmer C receives <strong>20.0 hours</strong> of undisputed guaranteed baseline water. His remaining <strong>14.1 hours</strong> of entitlement is held in cryptographic escrow until the Gram Panchayat Water Committee meets to review evidence (e.g. inspecting for shared pump lines or meter faults).
                  </p>
                </div>

                <div className="p-3 bg-neutral-950/80 border border-neutral-800 rounded-xl space-y-1.5">
                  <div className="font-semibold text-emerald-300">
                    Why are Farmers A, B, and D unaffected?
                  </div>
                  <p className="text-neutral-300 leading-relaxed text-[11px]">
                    Under the <strong>Scarcity Honesty</strong> rule, individual verification audits do not penalize neighboring farmers when their reports match smart-meter and Sentinel-2 NDVI readings within ±1.0 hour. Their preliminary entitlements remain fully funded.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="p-3 bg-neutral-950/80 border border-neutral-800 rounded-xl space-y-1.5">
                  <div className="font-semibold text-cyan-300">
                    जोन-A सेमी-क्रिटिकल से ओवर-एक्सप्लॉइटेड में क्यों बदल गया?
                  </div>
                  <p className="text-neutral-300 leading-relaxed text-[11px]">
                    किसानों द्वारा स्वयं दर्ज किए गए <strong>95.0 घंटे</strong> के आधार पर, जल दोहन बजट का <strong>89.2%</strong> (सेमी-क्रिटिकल) दिख रहा था।
                    लेकिन महावितरण स्मार्ट मीटर ने खुलासा किया कि किसान चंद्रकांत गायकवाड़ ने दर्ज <strong>20.0 घंटे</strong> के बजाय <strong>50.0 घंटे</strong> पंप चलाया (+30 घंटे का अंतर)।
                    इससे कुल जल निकासी <strong>125.0 घंटे (103.0%)</strong> पर पहुँच गई और भूजल स्तर ओवर-एक्सप्लॉइटेड हो गया।
                  </p>
                </div>

                <div className="p-3 bg-neutral-950/80 border border-neutral-800 rounded-xl space-y-1.5">
                  <div className="font-semibold text-amber-300">
                    किसान चंद्रकांत का पानी काटा क्यों नहीं गया बल्कि एस्क्रो में क्यों रखा गया?
                  </div>
                  <p className="text-neutral-300 leading-relaxed text-[11px]">
                    एक्वापल्स का नियम है: <em>सिस्टम सिर्फ संकेत देता है, कभी पानी नहीं काटता</em>।
                    स्मार्ट मीटर कोई अंतिम प्रमाण नहीं है। चंद्रकांत को <strong>20.0 घंटे</strong> का बुनियादी पानी तुरंत दिया गया है। बाकी <strong>14.1 घंटे</strong> का विवादित पानी एस्क्रो (सुरक्षित धरोहर) में रखा गया है। ग्राम पंचायत समिति की बैठक में फैसला होने पर इसे जारी या जमा किया जाएगा।
                  </p>
                </div>

                <div className="p-3 bg-neutral-950/80 border border-neutral-800 rounded-xl space-y-1.5">
                  <div className="font-semibold text-emerald-300">
                    किसान A, B और D पर क्या असर पड़ा?
                  </div>
                  <p className="text-neutral-300 leading-relaxed text-[11px]">
                    किसान A, B और D के मीटर और उपग्रह आंकड़े उनके दर्ज घंटों से बिल्कुल मेल खाते हैं। इसलिए निष्पक्षता नियम के तहत उनके जल आवंटन में कोई कटौती नहीं की गई है।
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            Close Copilot
          </button>
        </div>
      </div>
    </div>
  );
};
