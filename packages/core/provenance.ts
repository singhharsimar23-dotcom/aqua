/**
 * AquaPulse Provenance and Epistemic Registry
 * Categorizes and traces every number with immutable audit metadata.
 */

import { ProvenanceTag, ProvenanceTrace } from './types.ts';

export const SENTINEL2_REAL_SCENE = {
  sceneId: 'S2A_MSIL2A_20261002T051831_N0500_R019_T43QDA',
  acquisitionDate: '2026-10-02',
  sensor: 'Sentinel-2A MSI (MultiSpectral Instrument) Level-2A Surface Reflectance',
  bands: 'B04 (Red 665nm), B08 (NIR 842nm)',
  resolutionMeters: 10,
  cloudCoveragePercent: 0.8,
  sourceProvider: 'European Space Agency (ESA) Copernicus Open Access Hub',
  epistemicRole: 'Weak Corroboration: Satellite NDVI measures canopy greenness/biomass, not direct aquifer extraction. Corroborates high crop transpiration, but is not proof of pump hours.',
};

export const IMD_REAL_RAINFALL = {
  sourceId: 'IMD_GRIDDED_RAINFALL_0.25DEG',
  sourceName: 'India Meteorological Department (IMD) Daily Gridded 0.25° Dataset',
  station: 'Wardha Agro-Met Station (MH-WRD-04)',
  period: '2026-09-25 to 2026-10-02',
  recordedRainfallMm: 12.4,
  historicalMeanMm: 14.1,
  epistemicRole: 'Ground Truth Environmental Constraint: Infiltration input to the water bucket model.',
};

export const PROVENANCE_REGISTRY: Record<string, ProvenanceTrace> = {
  // Cap and Budget
  'zone.weeklyBudgetM3': {
    tag: 'LIVE',
    sourceId: 'CGWB_WARDHA_2026_DYNAMIC',
    sourceName: 'Central Ground Water Board (CGWB) & Dynamic Hydrology Model',
    timestamp: '2026-10-02T06:00:00Z',
    formula: 'Cap = (Area * Infiltration + Baseflow_Yield) * Discount - ConformalMargin(0.90)',
    description: 'Weekly sustainable yield calibrated via conformal prediction over 18 piezometer wells.',
    methodology: 'Central Ground Water Board GEC-2015 methodology with 14-day rolling water level residual adjustment.',
  },
  'zone.weeklyRainfall': {
    tag: 'LIVE',
    sourceId: IMD_REAL_RAINFALL.sourceId,
    sourceName: IMD_REAL_RAINFALL.sourceName,
    timestamp: '2026-10-02T08:30:00Z',
    formula: 'Spatial interpolation across 0.25° grid over Wardha block',
    description: 'Real IMD rainfall telemetry (12.4 mm recorded over the 7-day accounting window).',
  },
  // Satellite NDVI
  'satellite.ndvi': {
    tag: 'LIVE',
    sourceId: SENTINEL2_REAL_SCENE.sceneId,
    sourceName: 'Sentinel-2A MSI Surface Reflectance',
    timestamp: '2026-10-02T05:18:31Z',
    sceneId: SENTINEL2_REAL_SCENE.sceneId,
    formula: 'NDVI = (B08 - B04) / (B08 + B04)',
    description: 'Mean canopy vegetation index calculated across crop plot boundaries.',
    methodology: SENTINEL2_REAL_SCENE.epistemicRole,
  },
  // Smart meter signals
  'meter.hours': {
    tag: 'LIVE',
    sourceId: 'MSEDCL_AMI_AG_FEEDER_NET',
    sourceName: 'Maharashtra State Electricity Distribution Co. (MSEDCL) Smart Agri-Meter',
    timestamp: '2026-10-05T00:00:00Z',
    description: 'Three-phase agricultural electrical active pump run-time telemetry.',
    methodology: 'Smart meter is a second opinion, not proof. Mechanically flags run-time; does not account for dry-running or shared lines.',
  },
  // Farmer self-reports
  'farmer.reportedHours': {
    tag: 'SYNTH',
    sourceId: 'GRAM_PANCHAYAT_SELF_REPORT_FORM_A',
    sourceName: 'Village Gram Panchayat Self-Report Log',
    timestamp: '2026-10-04T17:00:00Z',
    description: 'Self-reported pump run-time submitted by farmer via SMS/IVR or paper register.',
    methodology: 'Subjective self-report. Prone to recall bias, under-reporting under scarcity, or rounding.',
  },
  // Well discharge rate
  'well.dischargeRateLps': {
    tag: 'SYNTH',
    sourceId: 'GSDA_PUMP_TEST_BENCHMARK',
    sourceName: 'Groundwater Survey & Development Agency (GSDA) Pumping Test',
    timestamp: '2026-05-14T11:00:00Z',
    description: 'Standardized discharge rate (15 L/s = 54 m³/hr) calibrated for 5 HP submersible pump.',
    methodology: 'Synthetic baseline assumption parameterized from regional Deccan Trap basalt pump tests.',
  },
  // Dignity Floor assumption
  'allocation.dignityFloor': {
    tag: 'ASSUMPTION',
    sourceId: 'PANCHAYAT_RESOLUTION_2025_DIGNITY',
    sourceName: 'Gram Panchayat Customary Dignity Floor Policy',
    timestamp: '2025-11-10T00:00:00Z',
    formula: 'Base Domestic Water + Minimal Survival Irrigation (~2.5 to 3.0 hrs/ha critical floor)',
    description: 'Statutory non-negotiable floor: no farmer can receive less than this regardless of verification flags.',
    methodology: 'Policy axiom ensuring subsistence security before competitive water filling begins.',
  },
  // Counterfactual impact baseline
  'impact.counterfactual': {
    tag: 'ASSUMPTION',
    sourceId: 'SYNTHETIC_COUNTERFACTUAL_UNMANAGED_MODEL',
    sourceName: 'Counterfactual Unmanaged Pumping Simulation',
    timestamp: '2026-10-05T00:00:00Z',
    formula: 'Unmanaged = 1.28 * Volume, Head + 4.2m, Daytime Evaporation Penalty',
    description: 'Synthetic baseline assuming uncoordinated concurrent daytime pumping without escrow or caps.',
    methodology: 'Modelled comparison counterfactual. Clearly labelled as non-empirical reference.',
  },
  // Basemap
  'basemap.imagery': {
    tag: 'REPLAY',
    sourceId: 'BASEMAP_MOSAIC_MIXED',
    sourceName: 'Cartographic Basemap (mixed dates)',
    description: 'Decorative satellite and terrain basemap tiles compiled from mixed historical dates.',
    methodology: 'Do not use for scientific vegetation analysis. For spatial orientation only.',
  },
};

export interface EpistemicClassification {
  category: 'AI_LLM' | 'RULES_LOGIC' | 'STATISTICS_CONFORMAL' | 'PHYSICS_THEIS';
  title: string;
  role: string;
  limitations: string;
  isDeterministic: boolean;
}

export const EPISTEMIC_ARCHITECTURE: EpistemicClassification[] = [
  {
    category: 'PHYSICS_THEIS',
    title: 'Theis Groundwater Hydrodynamics',
    role: 'Calculates dynamic cone of depression, transient drawdown, and well-to-well interference.',
    limitations: 'Assumes homogeneous basalt transmissivity; transient fractures create localized preferential pathways.',
    isDeterministic: true,
  },
  {
    category: 'STATISTICS_CONFORMAL',
    title: 'Adaptive Conformal Prediction',
    role: 'Calibrates weekly aquifer sustainable cap with distribution-free 90% coverage guarantee.',
    limitations: 'Quantile calibrated on 14-day rolling piezometer residuals; extreme sudden climate shocks require recalibration.',
    isDeterministic: true,
  },
  {
    category: 'RULES_LOGIC',
    title: 'Max-Min Allocation & Escrow State Machine',
    role: 'Enforces dignity floor, flags discrepancies, and places disputed water in escrow.',
    limitations: 'Never decides culpability. Only a human committee confirmed vote can reallocate escrowed water.',
    isDeterministic: true,
  },
  {
    category: 'AI_LLM',
    title: 'Explanation & Translation Copilot',
    role: 'Translates cryptographic proofs and hydrological metrics into plain English and Hindi for farmers.',
    limitations: 'The LLM ONLY explains; it NEVER decides or allocates water. Grounded badge verifies every claimed number.',
    isDeterministic: false,
  },
];
