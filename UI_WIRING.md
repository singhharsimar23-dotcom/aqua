# AquaPulse UI Wiring & Rail Mapping Specification

## 1. Left Rail (11 Icons) to Specification Widget Mapping

| # | Icon Identifier | UI Tool ID | Spec Widget Ref | Name & Functionality |
|---|-----------------|------------|-----------------|----------------------|
| 1 | `Sparkles` | `verify` | Hero / Flow | **Verification Sequence & Live Accounting Hero**: 4-step playback scrubber (Self-reports -> Signals -> Flip -> Escrow) + live farmer demand/meter sliders with dignified floor & pool controller. |
| 2 | `Layers` | `layers` | GIS Layers | **GIS Layers & Basemaps**: Imagery (ArcGIS), Positron (Light Carto), Dark GIS, OpenStreetMap + Plot overlays & NDVI layer. |
| 3 | `Activity` | `signals` | W2 | **Signal Board**: Dual-signal matrix (Self-Reports $R$, Simulated MSEDCL Smart-Meter Telemetry $E$, Sentinel-2 NDVI canopy index $S$), trust score $T$, weight $\lambda$, effective demand $U$. |
| 4 | `Waves` | `theis` | Drawdown | **Aquifer Drawdown & Theis Interference**: Dynamic analytical $s(r,t) = \frac{Q}{4\pi T} W(u)$ cones of depression and mutual well interference arcs calculated from active pumping hours. |
| 5 | `Network` | `graph` | W6 | **Object Graph**: Interactive hydrological topology canvas connecting Aquifer Zone, 11kV Grid Feeders, Pumping Borewells, and Farmer Field Plots. |
| 6 | `Zap` | `impact` | W7 / W8 | **Feeder Energy & Carbon Impact Meter**: Wire-to-water hydraulic model ($\eta = 0.30$, dynamic head $H$) with CEA v22.0 emission factors comparing AquaPulse vs unmanaged counterfactual baseline. |
| 7 | `FileSpreadsheet` | `table` | W1 | **Worked Allocation Table & Invariant Verifier**: Complete farmer accounting ledger with client-side zero-diff recomputation button and CSV export. |
| 8 | `GitCommit` | `ledger` | W9 | **Receipts & Canonical Merkle Tree**: Immutable audit ledger with odd-node promotion, leaf inspection, proof paths, and tamper simulation. |
| 9 | `Smartphone` | `sms` | W13 (MOCK) | **Farmer SMS & IVR Dispatch**: Multi-lingual offline advisory messages (Marathi / English) delivering transparent allocation receipts and dispute instructions, clearly labelled MOCK. |
| 10 | `Sliders` | `sandbox` | Simulator | **Telemetry Simulator**: Stress scenario runner (Canonical Benchmark, Dead Meter on C, Severe Drought, Collusion Gaming, Honest Collaboration). |
| 11 | `Scale` | `waterfall` | W5 / W3 | **Fairness Allocation Waterfall & Zone Stress Gauge**: Stepwise water filling from Dignity Floor through Land-Share entitlements, Escrow Quarantine, and Final Allocations. |

---

## 2. Store Architecture: Single Zustand Store
- **File**: `src/store/useGroundwaterStore.ts`
- **Single Source of Truth**:
  - `farmers`: `[{ id, name, land, R, E, metersOffline, ... }]`
  - `pool`: 78.0 to 130.0 hours (default 130.0)
  - `step`: 1 to 4
  - `mode`: `'STEP'` (narrative progression) or `'LIVE'` (active simulation)
  - `committeeDecisions`: Gram Panchayat decisions (`HELD`, `CONFIRMED`, `DISMISSED`, `TIMEOUT_RELEASED`)
  - `receipts`: cryptographically signed Merkle receipts
- **Core Math Derivations**: All displayed metrics (SOE, tiers, allocations, escrow, drawdown, Merkle digests) are computed on-the-fly using pure functions from `packages/core` (`trustBlend`, `waterFill`, `escrowSplit`, `applyCommitteeDecision`, `computeAquiferDrawdown`, `buildMerkleTree`).
- **Zero Hardcoded Sentences**: All step explanations and banner notifications are derived dynamically from state.
