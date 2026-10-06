import React from 'react';
import { Radio, AlertTriangle, ShieldCheck, Check, HelpCircle, Activity } from 'lucide-react';
import { FarmerRecord, ZoneSummary, ProvenanceTrace, PROVENANCE_REGISTRY } from 'packages/core';
import { ProvenanceBadge } from './ProvenanceBadge.tsx';

interface SignalBoardProps {
  farmers: FarmerRecord[];
  summary: ZoneSummary;
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
  onProveIt: (trace: ProvenanceTrace) => void;
}

export const SignalBoard: React.FC<SignalBoardProps> = ({
  farmers,
  summary,
  selectedObjectId,
  onSelectObject,
  onProveIt,
}) => {
  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-6 text-neutral-100 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-semibold text-white">
              Signal Board: Self-Report vs Meter vs Satellite
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Meter is a second opinion, not proof. Satellite NDVI provides weak environmental corroboration.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs text-neutral-400 font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            <span>Matched (±2h)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
            <span>Discrepant (&gt;5h)</span>
          </span>
        </div>
      </div>

      {/* Signal Comparison Grid */}
      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-neutral-800 text-neutral-400 font-medium">
              <th className="py-2.5 px-3">Farmer / Plot</th>
              <th className="py-2.5 px-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <span>Self-Report</span>
                  <ProvenanceBadge
                    tag="SYNTH"
                    onClick={() => onProveIt(PROVENANCE_REGISTRY['farmer.reportedHours'])}
                  />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <span>Grid Meter</span>
                  <ProvenanceBadge
                    tag="LIVE"
                    onClick={() => onProveIt(PROVENANCE_REGISTRY['meter.hours'])}
                  />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <span>Sentinel-2 NDVI</span>
                  <ProvenanceBadge
                    tag="LIVE"
                    onClick={() => onProveIt(PROVENANCE_REGISTRY['satellite.ndvi'])}
                  />
                </div>
              </th>
              <th className="py-2.5 px-3 text-center">Discrepancy Delta</th>
              <th className="py-2.5 px-3">Verification Assessment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {farmers.map((f) => {
              const isSelected = selectedObjectId === f.id;
              const isFlagged = f.isFlagged;

              return (
                <tr
                  key={f.id}
                  onClick={() => onSelectObject(f.id)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-neutral-800/80 ring-1 ring-cyan-500/40'
                      : isFlagged
                      ? 'bg-red-950/20 hover:bg-red-950/30'
                      : 'hover:bg-neutral-800/40'
                  }`}
                >
                  <td className="py-3 px-3">
                    <div className="font-semibold text-neutral-100 flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-neutral-800 flex items-center justify-center font-bold text-[11px]">
                        {f.id}
                      </span>
                      <span>{f.name}</span>
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      {f.crop} · {f.areaHa} ha · {f.wellId}
                    </div>
                  </td>

                  <td className="py-3 px-3 text-right font-mono text-neutral-200">
                    <span className="text-sm font-semibold">{f.reportedHours.toFixed(1)} hrs</span>
                    <div className="text-[10px] text-neutral-500">{f.reportedVolumeM3} m³</div>
                  </td>

                  <td className="py-3 px-3 text-right font-mono">
                    {f.isMeterMissing || f.meterHours === null ? (
                      <span className="px-2 py-0.5 bg-neutral-800 text-amber-300 font-semibold rounded text-[11px]">
                        MISSING
                      </span>
                    ) : (
                      <div>
                        <span
                          className={`text-sm font-semibold ${
                            isFlagged ? 'text-red-400 font-bold' : 'text-neutral-200'
                          }`}
                        >
                          {f.meterHours.toFixed(1)} hrs
                        </span>
                        <div className="text-[10px] text-neutral-500">{f.verifiedVolumeM3} m³</div>
                      </div>
                    )}
                  </td>

                  <td className="py-3 px-3 text-right font-mono">
                    <div className="text-sm font-semibold text-emerald-300">
                      {f.satelliteNdvi.toFixed(3)}
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      Implied: ~{f.satelliteImpliedHours.toFixed(1)}h
                    </div>
                  </td>

                  <td className="py-3 px-3 text-center font-mono">
                    {f.isMeterMissing ? (
                      <span className="text-neutral-500">—</span>
                    ) : (
                      <span
                        className={`font-semibold px-2 py-0.5 rounded text-xs ${
                          Math.abs(f.meterDiscrepancyDelta) >= 5
                            ? 'bg-red-950 border border-red-800 text-red-300 font-bold'
                            : 'text-neutral-300'
                        }`}
                      >
                        {f.meterDiscrepancyDelta > 0 ? `+${f.meterDiscrepancyDelta}` : f.meterDiscrepancyDelta} hrs
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3">
                    {isFlagged ? (
                      <div className="flex items-start gap-1.5 text-red-300 text-[11px] leading-tight">
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold">Grid Discrepancy (+30h)</div>
                          <div className="text-neutral-400 text-[10px] mt-0.5">
                            Corroborated by high NDVI (0.741). Escrow hold triggered.
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Consistent Signals</span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Epistemic disclaimer note */}
      <div className="mt-4 p-3 bg-neutral-950/70 border border-neutral-800 rounded-lg text-xs text-neutral-400 leading-relaxed flex items-start gap-2">
        <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-neutral-300">Epistemic Limit: </strong>
          The electricity meter measures pump active run-time, but cannot detect pump cavitation, pipe leaks, or shared water connections. Satellite NDVI measures green vegetative vigor, not instantaneous extraction. Therefore, discrepancies trigger an escrow hold and human Gram Panchayat committee review, never an automatic penalty.
        </div>
      </div>
    </div>
  );
};
