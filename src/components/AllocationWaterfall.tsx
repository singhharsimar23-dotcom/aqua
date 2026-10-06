import React from 'react';
import { Shield, Droplets, Lock, AlertTriangle, ArrowDown, HelpCircle, Layers } from 'lucide-react';
import { FarmerRecord, ZoneBudgetConfig, ZoneSummary, ProvenanceTrace, PROVENANCE_REGISTRY } from 'packages/core';
import { ProvenanceBadge } from './ProvenanceBadge.tsx';

interface AllocationWaterfallProps {
  farmers: FarmerRecord[];
  config: ZoneBudgetConfig;
  summary: ZoneSummary;
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
  onProveIt: (trace: ProvenanceTrace) => void;
}

export const AllocationWaterfall: React.FC<AllocationWaterfallProps> = ({
  farmers,
  config,
  summary,
  selectedObjectId,
  onSelectObject,
  onProveIt,
}) => {
  const totalFloor = farmers.reduce((acc, f) => acc + f.dignityFloorHours, 0); // 37.0h
  const discretionaryPool = Math.max(0, config.weeklyBudgetHoursEq - totalFloor); // 69.5h
  const farmerC = farmers.find((f) => f.id === 'C');

  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-6 text-neutral-100 shadow-xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-semibold tracking-tight text-white">
              Allocation Waterfall: Demand → Cap → Floor → Escrow
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Traceable step-by-step max-min water filling. Discrepancies are held in escrow, never auto-cut.
          </p>
        </div>

        {/* Zone Stress Delta Pills */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs">
            <span className="text-neutral-400">Reported Stress: </span>
            <span className="font-mono font-semibold text-amber-400">
              {(summary.reportedStressRatio * 100).toFixed(1)}% ({summary.reportedTier})
            </span>
          </div>
          <div className="text-neutral-600">→</div>
          <div className="px-3 py-1.5 bg-neutral-950 border border-red-900/50 rounded-lg text-xs">
            <span className="text-neutral-400">Verified Stress: </span>
            <span className="font-mono font-semibold text-red-400">
              {(summary.verifiedStressRatio * 100).toFixed(1)}% ({summary.verifiedTier})
            </span>
          </div>
        </div>
      </div>

      {/* Waterfall Flow */}
      <div className="mt-6 space-y-6">
        {/* Step 1: Raw Demand vs Weekly Cap */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Verified Total Demand */}
          <div className="p-4 bg-neutral-950/70 border border-neutral-800 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-400">Step 1. Gross Measured Demand</span>
              <ProvenanceBadge
                tag="LIVE"
                onClick={() => onProveIt(PROVENANCE_REGISTRY['meter.hours'])}
              />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-red-400">
                {summary.verifiedTotalHours.toFixed(1)} hrs
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                ({summary.verifiedTotalM3.toLocaleString()} m³)
              </span>
            </div>
            <div className="mt-1 text-xs text-neutral-400">
              Self-reported: <span className="font-mono text-neutral-300">{summary.reportedTotalHours.toFixed(1)} hrs</span>
              {' · '}
              Discrepancy: <span className="font-mono text-red-400 font-semibold">+{summary.flipDeltaHours.toFixed(1)} hrs</span>
            </div>
          </div>

          {/* Card 2: Calibrated Weekly Cap */}
          <div className="p-4 bg-neutral-950/70 border border-cyan-900/40 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-cyan-400">Step 2. Statistically Calibrated Cap</span>
              <ProvenanceBadge
                tag="LIVE"
                onClick={() => onProveIt(PROVENANCE_REGISTRY['zone.weeklyBudgetM3'])}
              />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-cyan-300">
                {config.weeklyBudgetHoursEq.toFixed(1)} hrs
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                ({config.weeklyBudgetM3.toLocaleString()} m³)
              </span>
            </div>
            <div className="mt-1 text-xs text-neutral-400">
              Aquifer Bucket: 120 ha recharge area · 90% conformal coverage
            </div>
          </div>
        </div>

        {/* Step 3: Dignity Floor Reservation */}
        <div className="p-4 bg-purple-950/20 border border-purple-900/40 rounded-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-semibold text-purple-200">
                  Step 3. Guaranteed Dignity Floor (Non-Negotiable Subsistence)
                </span>
                <ProvenanceBadge
                  tag="ASSUMPTION"
                  onClick={() => onProveIt(PROVENANCE_REGISTRY['allocation.dignityFloor'])}
                />
              </div>
              <p className="text-xs text-purple-300/80 mt-1">
                Subtracted first from total budget. Guarantees base domestic and minimal crop survival regardless of audit flags.
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-lg font-bold font-mono text-purple-300">
                {totalFloor.toFixed(1)} hrs
              </span>
              <div className="text-[11px] text-neutral-400 font-mono">
                Pool Left: {discretionaryPool.toFixed(1)} hrs
              </div>
            </div>
          </div>

          {/* Farmer Floor Distribution */}
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-purple-900/30 text-xs">
            {farmers.map((f) => (
              <div
                key={f.id}
                onClick={() => onSelectObject(f.id)}
                className={`p-2 rounded bg-neutral-950/60 border cursor-pointer transition-colors ${
                  selectedObjectId === f.id ? 'border-cyan-400 bg-neutral-900' : 'border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="text-neutral-400 flex items-center justify-between">
                  <span>Farmer {f.id}</span>
                  <span className="font-mono text-[11px]">{f.areaHa} ha</span>
                </div>
                <div className="font-mono font-semibold text-purple-300 mt-0.5">
                  {f.dignityFloorHours.toFixed(1)} hrs
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step 4: Discretionary Weighted Water-Filling */}
        <div className="p-4 bg-neutral-950/70 border border-neutral-800 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-neutral-300">
              Step 4. Discretionary Max-Min Land Allocation + Escrow Holding
            </span>
            <span className="text-xs font-mono text-neutral-400">
              Discretionary Pool: {discretionaryPool.toFixed(1)} hrs
            </span>
          </div>

          <div className="space-y-3">
            {farmers.map((f) => {
              const isSelected = selectedObjectId === f.id;
              const hasEscrow = f.escrowHours > 0;

              return (
                <div
                  key={f.id}
                  onClick={() => onSelectObject(f.id)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-cyan-400 bg-neutral-900/90 ring-1 ring-cyan-500/30'
                      : hasEscrow
                      ? 'border-amber-900/60 bg-amber-950/10 hover:border-amber-700'
                      : 'border-neutral-800 bg-neutral-950/50 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-neutral-800 flex items-center justify-center font-bold text-xs text-neutral-200">
                        {f.id}
                      </span>
                      <div>
                        <div className="text-xs font-semibold text-neutral-100 flex items-center gap-2">
                          <span>{f.name}</span>
                          <span className="text-[11px] text-neutral-400 font-normal">({f.crop})</span>
                          {f.isFlagged && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-red-950/80 border border-red-800 text-red-300 rounded">
                              Flagged (+{f.meterDiscrepancyDelta}h)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-neutral-400 font-mono">
                          Land Share: {(f.landShareRatio * 100).toFixed(1)}% · Entitlement: {f.preliminaryEntitlementHours.toFixed(1)}h
                        </div>
                      </div>
                    </div>

                    {/* Breakdown Numbers */}
                    <div className="flex items-center gap-3 self-end sm:self-auto text-xs">
                      <div className="text-right">
                        <div className="text-[10px] text-neutral-400">Allocated</div>
                        <div className="font-mono font-bold text-emerald-400">
                          {f.allocatedHours.toFixed(1)} hrs
                        </div>
                      </div>

                      {hasEscrow ? (
                        <div className="text-right pl-3 border-l border-amber-900/40">
                          <div className="text-[10px] text-amber-400 flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            <span>Escrow Held</span>
                          </div>
                          <div className="font-mono font-bold text-amber-400">
                            {f.escrowHours.toFixed(1)} hrs
                          </div>
                        </div>
                      ) : (
                        <div className="text-right pl-3 border-l border-neutral-800 text-neutral-500 font-mono text-[11px]">
                          0.0h Escrow
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Visual Bar Breakdown */}
                  <div className="mt-2.5">
                    <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden flex">
                      {/* Floor portion */}
                      <div
                        style={{ width: `${(f.dignityFloorHours / (f.preliminaryEntitlementHours || 1)) * 100}%` }}
                        className="bg-purple-500/80 h-full"
                        title={`Dignity Floor: ${f.dignityFloorHours}h`}
                      />
                      {/* Discretionary allocated portion */}
                      <div
                        style={{
                          width: `${
                            ((f.allocatedHours - f.dignityFloorHours) /
                              (f.preliminaryEntitlementHours || 1)) *
                            100
                          }%`,
                        }}
                        className="bg-emerald-500/80 h-full"
                        title={`Discretionary Allocated: ${(f.allocatedHours - f.dignityFloorHours).toFixed(1)}h`}
                      />
                      {/* Escrow portion */}
                      {hasEscrow && (
                        <div
                          style={{
                            width: `${(f.escrowHours / (f.preliminaryEntitlementHours || 1)) * 100}%`,
                          }}
                          className="bg-amber-500 h-full animate-pulse"
                          title={`Escrow Disputed Portion: ${f.escrowHours}h`}
                        />
                      )}
                    </div>
                    <div className="flex justify-between text-[10px] text-neutral-500 font-mono mt-1">
                      <span>Floor: {f.dignityFloorHours}h</span>
                      {hasEscrow && <span className="text-amber-400">Escrow: {f.escrowHours}h (Disputed)</span>}
                      <span>Total Entitlement: {f.preliminaryEntitlementHours}h</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scarcity Honesty Rule Banner */}
        <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl text-xs flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-neutral-200">
              Scarcity Honesty Principle
            </div>
            <p className="text-neutral-400 leading-relaxed">
              When water is scarce, land share decides and verification does not move water between farmers.
              Because the zone flipped to Over-exploited (103.0%), Farmer C’s excess water ({farmerC?.escrowHours || 14.1}h of {farmerC?.preliminaryEntitlementHours || 34.1}h)
              is held in escrow rather than redistributed to other farmers or auto-cut. Only an explicit human committee decision can release or reallocate it.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
