/**
 * AquaPulse Core Data Types
 * Provenance-grounded schema for hydrological budgeting,
 * multi-signal verification, max-min allocation, and Merkle ledger.
 */

export type ProvenanceTag = 'LIVE' | 'REPLAY' | 'SYNTH' | 'ASSUMPTION' | 'USER';

export interface ProvenanceTrace {
  tag: ProvenanceTag;
  sourceId: string;
  sourceName: string;
  timestamp?: string;
  sceneId?: string;
  formula?: string;
  hash?: string;
  description: string;
  methodology?: string;
}

export interface ProvenanceValue<T> {
  value: T;
  trace: ProvenanceTrace;
}

export type WaterTier = 'Safe' | 'Semi-critical' | 'Critical' | 'Over-exploited';

export type EscrowStatus = 'NONE' | 'HELD' | 'CONFIRMED' | 'DISMISSED' | 'TIMEOUT_RELEASED';

export interface FarmerRecord {
  id: 'A' | 'B' | 'C' | 'D';
  name: string;
  phone: string;
  crop: string;
  areaHa: number;
  wellId: string;
  feederId: string;
  lat: number;
  lng: number;
  polygon: [number, number][]; // lat, lng vertices
  wellCoord: [number, number];

  // Self-report
  reportedHours: number;
  
  // Independent grid & satellite signals
  meterHours: number | null; // null if missing
  isMeterMissing: boolean;
  meterDiscrepancyDelta: number; // meter - reported
  satelliteNdvi: number; // Real Sentinel-2 NDVI
  satelliteImpliedHours: number;

  // Hydrological pump physics
  dischargeRateLps: number; // Liters per second (e.g. 15 lps = 54 m3/hr)
  dischargeM3PerHour: number;

  // Computed volumes (m3)
  reportedVolumeM3: number;
  verifiedVolumeM3: number;

  // Verification & trust flags
  trustScore: number; // 0 to 1
  isFlagged: boolean;
  flagReason: string | null;

  // Allocation & Escrow
  dignityFloorHours: number;
  landShareRatio: number;
  preliminaryEntitlementHours: number;
  allocatedHours: number;
  escrowHours: number;
  escrowStatus: EscrowStatus;
  committeeDecisionTimestamp?: string;
  committeeVerdict?: 'CONFIRMED' | 'DISMISSED' | 'TIMEOUT';

  // Drawdown influence
  drawdownDepthMeters: number;
  interferenceOverheadKwh: number;
  leafHash: string;
}

export interface ZoneBudgetConfig {
  zoneId: string;
  zoneName: string;
  district: string;
  state: string;
  centroid: [number, number];
  weeklyBudgetM3: number;
  weeklyBudgetHoursEq: number; // at standard 54 m3/h reference
  aquiferTransmissivityM2Day: number; // T
  aquiferStorativity: number; // S
  baseWaterTableDepthM: number;
  currentRechargeRateMm: number;
  conformalAlpha: number; // 0.10 for 90% coverage
  overdrawCorrectionFactor: number;
}

export interface ZoneSummary {
  reportedTotalHours: number;
  reportedTotalM3: number;
  reportedStressRatio: number; // 0.892 (89.2%)
  reportedTier: WaterTier;

  verifiedTotalHours: number;
  verifiedTotalM3: number;
  verifiedStressRatio: number; // 1.030 (103.0%)
  verifiedTier: WaterTier;

  totalAllocatedHours: number;
  totalEscrowHours: number;
  totalAllocatedM3: number;
  totalEscrowM3: number;

  isFlipped: boolean; // true when verified > 1.0 or tier shifts
  flipDeltaHours: number; // +30 hrs
  flipDeltaM3: number;

  merkleRoot: string;
  timestamp: string;
}

export interface MerkleNode {
  id: string;
  hash: string;
  left?: MerkleNode;
  right?: MerkleNode;
  leafData?: string;
  label: string;
  isTampered?: boolean;
}

export interface MerkleProofStep {
  position: 'left' | 'right';
  hash: string;
}

export interface MerkleProof {
  leafId: string;
  leafHash: string;
  rootHash: string;
  steps: MerkleProofStep[];
  isValid: boolean;
}

export interface ImpactMetrics {
  totalEnergyKwh: number;
  totalCo2Kg: number;
  energyPerM3: number;
  co2PerM3: number;
  counterfactualUnmanagedEnergyKwh: number;
  counterfactualUnmanagedCo2Kg: number;
  energySavedKwh: number;
  co2AvoidedKg: number;
  interferenceHeadLossM: number;
}

export interface SimulationState {
  farmers: FarmerRecord[];
  zoneConfig: ZoneBudgetConfig;
  zoneSummary: ZoneSummary;
  impact: ImpactMetrics;
  merkleTree: MerkleNode;
  merkleLeaves: { id: string; label: string; hash: string; rawPayload: string }[];
  scarcityHonestyRuleApplied: boolean;
  explanationNote: string;
}
