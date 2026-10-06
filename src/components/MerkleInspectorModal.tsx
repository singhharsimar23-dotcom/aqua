import React, { useState } from 'react';
import { X, GitCommit, ShieldCheck, AlertTriangle, Check, Bug, RefreshCw, Key } from 'lucide-react';
import {
  FarmerRecord,
  ZoneSummary,
  buildMerkleTree,
  generateMerkleProof,
  simulateTamperLeaf,
  MerkleNode,
} from 'packages/core';

interface MerkleInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmers: FarmerRecord[];
  summary: ZoneSummary;
}

export const MerkleInspectorModal: React.FC<MerkleInspectorModalProps> = ({
  isOpen,
  onClose,
  farmers,
  summary,
}) => {
  if (!isOpen) return null;

  // Build Merkle leaves from current state
  const leafItems = [
    {
      id: 'leaf_cap',
      label: 'Zone-A Calibrated Cap (106.5h / 5,751m³)',
      payload: `ZONE:ZONE-A|CAP_HOURS:106.5|CAP_M3:5751|CONFORMAL_ALPHA:0.10|RECHARGE_MM:12.4`,
    },
    ...farmers.map((f) => ({
      id: `leaf_${f.id}`,
      label: `Farmer ${f.id} (${f.name}) Claim & Meter`,
      payload: `FARMER:${f.id}|REP:${f.reportedHours}|MTR:${f.meterHours}|ALLOC:${f.allocatedHours}|ESCROW:${f.escrowHours}|STATUS:${f.escrowStatus}`,
    })),
    {
      id: 'leaf_committee',
      label: 'Panchayat Committee Escrow Verdict State',
      payload: `COMMITTEE_STATE:${farmers.find((f) => f.id === 'C')?.escrowStatus || 'HELD'}|TIMESTAMP:${summary.timestamp}`,
    },
  ];

  const { root: activeTree, leaves } = buildMerkleTree(leafItems);
  const [selectedLeafId, setSelectedLeafId] = useState<string>('leaf_C');
  const [isTampering, setIsTampering] = useState<boolean>(false);

  // Generate inclusion proof for selected leaf
  const proof = generateMerkleProof(activeTree, selectedLeafId);

  // Tamper simulation on Farmer C: pretend meter was reported as 20h instead of 50h
  const tamperedResult = simulateTamperLeaf(
    leafItems,
    'leaf_C',
    `FARMER:C|REP:20.0|MTR:20.0|ALLOC:34.1|ESCROW:0.0|STATUS:UNAUDITED_TAMPERED`
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitCommit className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-semibold text-white">
                Cryptographic Merkle Receipt & Ledger Inspector
              </h2>
              <p className="text-xs text-neutral-400">
                Tamper-evident verification tree. Every farmer allocation and committee decision is an immutable leaf.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Merkle Root Banner */}
          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="text-xs font-medium text-neutral-400">Current Zone-A Merkle Root</div>
                <div className="font-mono text-sm sm:text-base font-bold text-cyan-300 break-all select-all mt-1">
                  {isTampering ? tamperedResult.tamperedRoot : activeTree.hash}
                </div>
              </div>

              {/* Tamper Simulation Toggle */}
              <div className="shrink-0 flex items-center gap-2">
                <button
                  onClick={() => setIsTampering(!isTampering)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    isTampering
                      ? 'bg-red-950 border-red-700 text-red-300'
                      : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
                  }`}
                >
                  <Bug className="w-3.5 h-3.5" />
                  <span>{isTampering ? 'Revert Tamper' : 'Simulate Byte Tamper'}</span>
                </button>
              </div>
            </div>

            {/* Tamper Alert if active */}
            {isTampering && (
              <div className="mt-3 p-3 bg-red-950/40 border border-red-800/80 rounded-lg text-xs text-red-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-red-200">TAMPER DETECTED: Root Avalanche Discrepancy</div>
                  <div className="mt-0.5 text-red-300/80 font-mono text-[11px]">
                    Farmer C payload altered (50.0h → 20.0h). Leaf hash mutated, invalidating all cryptographic inclusion proofs!
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Leaf Selector */}
          <div>
            <div className="text-xs font-semibold text-neutral-300 mb-2">
              Select Merkle Leaf to Inspect Proof Path
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {leaves.map((leaf) => (
                <button
                  key={leaf.id}
                  onClick={() => setSelectedLeafId(leaf.id)}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    selectedLeafId === leaf.id
                      ? 'border-cyan-400 bg-neutral-800 ring-1 ring-cyan-500/30'
                      : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                  }`}
                >
                  <div className="text-xs font-semibold text-white truncate">{leaf.label}</div>
                  <div className="font-mono text-[10px] text-neutral-400 truncate mt-1">
                    Hash: {leaf.hash.slice(0, 16)}...
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Inclusion Proof Path Inspector */}
          {proof && (
            <div className="p-4 bg-neutral-950/80 border border-neutral-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-cyan-400" />
                  <span>Cryptographic Inclusion Proof (Sibling Path)</span>
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                    proof.isValid && !isTampering
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-red-950 text-red-300 border border-red-800'
                  }`}
                >
                  {proof.isValid && !isTampering ? 'PROOF: VALID' : 'PROOF: INVALID (ROOT MISMATCH)'}
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="p-2.5 bg-neutral-900 rounded border border-neutral-800">
                  <div className="text-neutral-500 text-[10px]">Leaf Hash (Target)</div>
                  <div className="text-neutral-200 break-all select-all">{proof.leafHash}</div>
                </div>

                {proof.steps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2 pl-4 border-l-2 border-cyan-800/40">
                    <span className="text-cyan-400 text-[11px] shrink-0">Step {idx + 1} ({step.position})</span>
                    <div className="p-2 bg-neutral-900 rounded border border-neutral-800 flex-1 truncate text-neutral-300 text-[11px]">
                      + {step.hash}
                    </div>
                  </div>
                ))}

                <div className="p-2.5 bg-cyan-950/20 rounded border border-cyan-900/40">
                  <div className="text-cyan-400 text-[10px]">Recomputed Root Hash (In-Browser SHA-256)</div>
                  <div className="text-cyan-200 break-all select-all font-semibold">
                    {proof.rootHash}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
