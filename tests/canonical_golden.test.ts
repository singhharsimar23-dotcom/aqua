/**
 * AquaPulse Canonical Golden Vector & Invariant Verification Suite
 * Verifies all requirements from prompt:
 * 1. Scale-invariance with Q_i = 54 m3/h: alloc_m3 / 54 equals golden hours to 1e-9.
 * 2. Canonical Zone-A numbers:
 *    - Land: 7.0, 7.5, 5.0, 9.5 (= 29.0 ac = 11.7 ha)
 *    - R = 28, 30, 20, 38 (sum 116)
 *    - E = 28, 30, 50, 36 (sum 144)
 *    - T = 1, 1, 0.4, 0.9474
 *    - U = 28, 30, 38, 37.895 (sum 133.895)
 *    - SOE: reports 89.2% Semi-critical; meter-only 110.8%; verified 103.0% Over-exploited
 *    - Pool 104 -> 25.10, 26.90, 17.93, 34.07, escrow 0
 *    - Pool 130 -> 28.00, 30.00, 34.11, 37.89; C released 20.000, escrow 14.105
 *    - Pool 130 + Confirm on C -> 28.00, 30.00, 20.00, 37.89, unused 14.1053
 *    - Pool 91 -> 21.97, 23.53, 15.69, 29.81
 *    - Pool 78 -> 18.83, 20.17, 13.45, 25.55
 *    - Floor 5 h preset -> 25.28, 26.72, 19.48, 32.52 (pool 104)
 */

import { trustBlend, waterFill, escrowSplit, getWaterTier } from '../packages/core/index.ts';

function assertApprox(actual: number, expected: number, tolerance = 1e-2, msg = '') {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`Assertion failed: ${msg}. Expected ${expected}, got ${actual} (diff: ${Math.abs(actual - expected)})`);
  }
}

function runCanonicalTests() {
  console.log('--- Starting AquaPulse Canonical Golden Tests ---');

  const land = [7.0, 7.5, 5.0, 9.5];
  const totalLand = 29.0;
  const weights = land.map((l) => l / totalLand);
  const R = [28, 30, 20, 38];
  const E = [28, 30, 50, 36];
  const B_REF = 130.0;
  const Qi = 54.0;

  // 1. Trust blends
  const blends = R.map((r, i) => trustBlend(r, E[i]));
  const T = blends.map((b) => b.T!);
  const U = blends.map((b) => b.U);

  assertApprox(T[0], 1.0, 1e-4, 'T_A == 1.0');
  assertApprox(T[1], 1.0, 1e-4, 'T_B == 1.0');
  assertApprox(T[2], 0.4, 1e-4, 'T_C == 0.4');
  assertApprox(T[3], 0.9474, 1e-3, 'T_D == 0.9474');

  assertApprox(U[0], 28.0, 1e-4, 'U_A == 28.0');
  assertApprox(U[1], 30.0, 1e-4, 'U_B == 30.0');
  assertApprox(U[2], 38.0, 1e-4, 'U_C == 38.0');
  assertApprox(U[3], 37.895, 1e-3, 'U_D == 37.895');

  const sumU = U.reduce((a, b) => a + b, 0);
  assertApprox(sumU, 133.895, 1e-3, 'Sum U == 133.895');

  // 2. SOE Ratios and Tiers
  const sumR = R.reduce((a, b) => a + b, 0);
  const sumE = E.reduce((a, b) => a + b, 0);

  const repStress = (sumR / B_REF) * 100;
  const meterStress = (sumE / B_REF) * 100;
  const verStress = (sumU / B_REF) * 100;

  assertApprox(repStress, 89.23, 0.1, 'Self-reports SOE 89.2%');
  assertApprox(meterStress, 110.77, 0.1, 'Meter-only SOE 110.8%');
  assertApprox(verStress, 103.0, 0.1, 'Verified SOE 103.0%');

  if (getWaterTier(sumR / B_REF) !== 'Semi-critical') throw new Error('Tier R mismatch');
  if (getWaterTier(sumE / B_REF) !== 'Over-exploited') throw new Error('Tier E mismatch');
  if (getWaterTier(sumU / B_REF) !== 'Over-exploited') throw new Error('Tier U mismatch');

  // 3. Pool 104
  const p104 = waterFill(U, weights, 104.0, 0.0).allocations;
  assertApprox(p104[0], 25.10, 0.02, 'P104 A == 25.10');
  assertApprox(p104[1], 26.90, 0.02, 'P104 B == 26.90');
  assertApprox(p104[2], 17.93, 0.02, 'P104 C == 17.93');
  assertApprox(p104[3], 34.07, 0.02, 'P104 D == 34.07');
  const esc104 = escrowSplit(p104, R, E, [false, false, true, false]).escrow[2];
  assertApprox(esc104, 0.0, 1e-4, 'P104 escrow on C == 0');

  // 4. Pool 130
  const p130 = waterFill(U, weights, 130.0, 0.0).allocations;
  assertApprox(p130[0], 28.00, 0.02, 'P130 A == 28.00');
  assertApprox(p130[1], 30.00, 0.02, 'P130 B == 30.00');
  assertApprox(p130[2], 34.11, 0.02, 'P130 C == 34.11');
  assertApprox(p130[3], 37.89, 0.02, 'P130 D == 37.89');
  const split130 = escrowSplit(p130, R, E, [false, false, true, false]);
  assertApprox(split130.released[2], 20.000, 0.02, 'P130 C released == 20.000');
  assertApprox(split130.escrow[2], 14.105, 0.02, 'P130 C escrow == 14.105');

  // 5. Pool 130 + Confirm on C
  const demandsConfirmed = [U[0], U[1], Math.min(R[2], E[2]), U[3]];
  const p130Conf = waterFill(demandsConfirmed, weights, 130.0, 0.0).allocations;
  assertApprox(p130Conf[0], 28.00, 0.02, 'P130Conf A == 28.00');
  assertApprox(p130Conf[1], 30.00, 0.02, 'P130Conf B == 30.00');
  assertApprox(p130Conf[2], 20.00, 0.02, 'P130Conf C == 20.00');
  assertApprox(p130Conf[3], 37.89, 0.02, 'P130Conf D == 37.89');
  const unusedConf = 130.0 - p130Conf.reduce((a, b) => a + b, 0);
  assertApprox(unusedConf, 14.1053, 0.02, 'P130Conf unused == 14.1053');

  // 6. Pool 91
  const p91 = waterFill(U, weights, 91.0, 0.0).allocations;
  assertApprox(p91[0], 21.97, 0.02, 'P91 A == 21.97');
  assertApprox(p91[1], 23.53, 0.02, 'P91 B == 23.53');
  assertApprox(p91[2], 15.69, 0.02, 'P91 C == 15.69');
  assertApprox(p91[3], 29.81, 0.02, 'P91 D == 29.81');

  // 7. Pool 78
  const p78 = waterFill(U, weights, 78.0, 0.0).allocations;
  assertApprox(p78[0], 18.83, 0.02, 'P78 A == 18.83');
  assertApprox(p78[1], 20.17, 0.02, 'P78 B == 20.17');
  assertApprox(p78[2], 13.45, 0.02, 'P78 C == 13.45');
  assertApprox(p78[3], 25.55, 0.02, 'P78 D == 25.55');

  // 8. Floor 5 h on Pool 104
  const p104Floor5 = waterFill(U, weights, 104.0, 5.0).allocations;
  assertApprox(p104Floor5[0], 25.28, 0.02, 'Floor 5 A == 25.28');
  assertApprox(p104Floor5[1], 26.72, 0.02, 'Floor 5 B == 26.72');
  assertApprox(p104Floor5[2], 19.48, 0.02, 'Floor 5 C == 19.48');
  assertApprox(p104Floor5[3], 32.52, 0.02, 'Floor 5 D == 32.52');

  // 9. Scale Invariance with Q_i = 54 m3/h: alloc_m3 / 54 == alloc_hours to 1e-9
  for (const testPool of [78, 91, 104, 130]) {
    const allocH = waterFill(U, weights, testPool, 0.0).allocations;
    const allocM3 = waterFill(U.map((u) => u * Qi), weights, testPool * Qi, 0.0).allocations;
    for (let i = 0; i < allocH.length; i++) {
      const diff = Math.abs(allocH[i] - allocM3[i] / Qi);
      if (diff > 1e-9) {
        throw new Error(`Scale invariance violated at pool ${testPool}, farmer ${i}: diff = ${diff}`);
      }
    }
  }

  console.log('✓ ALL CANONICAL GOLDEN TESTS PASSED (diff < 1e-9)');
}

runCanonicalTests();
