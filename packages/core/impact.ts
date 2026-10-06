/**
 * AquaPulse Impact Meter Engine
 * Energy (kWh) and Carbon (kg CO2) per m3 extracted,
 * comparing Managed AquaPulse vs Unmanaged Counterfactual (clearly labelled synthetic baseline).
 * Conforms to spec §6.7 (CEA v22.0 Factors & Wire-to-Water Hydraulic Model).
 */

import { FarmerRecord, ImpactMetrics } from './types.ts';

// Central Electricity Authority (CEA) CO2 Baseline Factors (kg CO2/kWh = tCO2/MWh)
export const CEA_FACTORS = {
  average_footprint: 0.675, // Grid weighted average
  avoided_cm: 0.705,        // Combined Margin (DEFAULT for avoided emissions)
  upper_bound_om: 0.963,    // Operating Margin (sensitivity upper bound)
  build_margin_bm: 0.446,   // Build Margin
};

// Wire-to-water pump efficiency (default 0.30 per spec §6.7)
export const DEFAULT_PUMP_EFFICIENCY = 0.30;
export const PUMP_EFFICIENCY = DEFAULT_PUMP_EFFICIENCY;
export const CO2_GRID_FACTOR_KG_PER_KWH = CEA_FACTORS.avoided_cm;

/**
 * Computes energy consumption (kWh) per m3 for a given dynamic head (m) and wire-to-water efficiency
 * Formula: kWh/m3 = (rho * g * H) / (3.6e6 * eta)
 * with rho = 1000, g = 9.81
 * Reference (H=20m, eta=0.30): 0.18167 kWh/m3
 */
export function kwhPerM3(headM: number, eta: number = DEFAULT_PUMP_EFFICIENCY): number {
  return (1000.0 * 9.81 * headM) / (3.6e6 * eta);
}

/**
 * Computes energy and carbon metrics for current allocation vs unmanaged baseline
 */
export function computeImpactMetrics(
  farmers: FarmerRecord[],
  totalDrawdownInterferenceHeadM: number = 1.8,
  eta: number = DEFAULT_PUMP_EFFICIENCY,
  co2Factor: number = CEA_FACTORS.avoided_cm
): ImpactMetrics {
  const baseWaterTableM = 18.5;
  const managedHeadM = baseWaterTableM + totalDrawdownInterferenceHeadM; // ~20.3 m

  // Total allocated volume in m3
  const totalAllocatedM3 = farmers.reduce(
    (acc, f) => acc + f.allocatedHours * f.dischargeM3PerHour,
    0
  );

  const unitKwhManaged = kwhPerM3(managedHeadM, eta);
  const totalEnergyKwh = Math.round(unitKwhManaged * totalAllocatedM3);
  const totalCo2Kg = Math.round(totalEnergyKwh * co2Factor);

  const energyPerM3 = totalAllocatedM3 > 0 ? Number(unitKwhManaged.toFixed(3)) : 0;
  const co2PerM3 = totalAllocatedM3 > 0 ? Number((unitKwhManaged * co2Factor).toFixed(3)) : 0;

  // Unmanaged counterfactual (SYNTHETIC COUNTERFACTUAL):
  // Simultaneous daytime pumping; well interference increases head by +4.2m;
  // Unmetered over-extraction averages +28% volume.
  const counterfactualVolumeM3 = totalAllocatedM3 * 1.28;
  const counterfactualHeadM = baseWaterTableM + 4.2; // 22.7 m
  const unitKwhUnmanaged = kwhPerM3(counterfactualHeadM, eta);
  const counterfactualUnmanagedEnergyKwh = Math.round(unitKwhUnmanaged * counterfactualVolumeM3);
  const counterfactualUnmanagedCo2Kg = Math.round(counterfactualUnmanagedEnergyKwh * co2Factor);

  const energySavedKwh = Math.max(0, counterfactualUnmanagedEnergyKwh - totalEnergyKwh);
  const co2AvoidedKg = Math.max(0, counterfactualUnmanagedCo2Kg - totalCo2Kg);

  return {
    totalEnergyKwh,
    totalCo2Kg,
    energyPerM3,
    co2PerM3,
    counterfactualUnmanagedEnergyKwh,
    counterfactualUnmanagedCo2Kg,
    energySavedKwh,
    co2AvoidedKg,
    interferenceHeadLossM: Number(totalDrawdownInterferenceHeadM.toFixed(2)),
  };
}
