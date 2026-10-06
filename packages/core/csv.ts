/**
 * AquaPulse CSV Parser, Validator, and Exporter
 * Zero-upload client-side processing with SHA-256 file fingerprinting.
 */

import { hashString } from './merkle.ts';
import { FarmerRecord } from './types.ts';

export interface CsvValidationResult {
  isValid: boolean;
  fileHash: string;
  rowCount: number;
  errors: string[];
  parsedFarmers?: Partial<FarmerRecord>[];
}

export function parseAndValidateFarmerCsv(csvText: string): CsvValidationResult {
  const fileHash = hashString(csvText);
  const lines = csvText.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length < 2) {
    return {
      isValid: false,
      fileHash,
      rowCount: 0,
      errors: ['CSV file is empty or missing headers.'],
    };
  }

  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const requiredCols = ['id', 'name', 'crop', 'area_ha', 'reported_hours', 'meter_hours'];
  const missing = requiredCols.filter((col) => !header.includes(col));

  if (missing.length > 0) {
    return {
      isValid: false,
      fileHash,
      rowCount: lines.length - 1,
      errors: [`Missing required columns: ${missing.join(', ')}`],
    };
  }

  const idIdx = header.indexOf('id');
  const nameIdx = header.indexOf('name');
  const cropIdx = header.indexOf('crop');
  const areaIdx = header.indexOf('area_ha');
  const reportedIdx = header.indexOf('reported_hours');
  const meterIdx = header.indexOf('meter_hours');

  const parsedFarmers: Partial<FarmerRecord>[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim());
    if (cols.length < requiredCols.length) {
      errors.push(`Row ${i + 1}: Insufficient columns`);
      continue;
    }

    const id = cols[idIdx].toUpperCase() as 'A' | 'B' | 'C' | 'D';
    const name = cols[nameIdx];
    const crop = cols[cropIdx];
    const areaHa = parseFloat(cols[areaIdx]);
    const reportedHours = parseFloat(cols[reportedIdx]);
    const meterRaw = cols[meterIdx];
    const isMeterMissing = meterRaw === '' || meterRaw.toLowerCase() === 'null' || meterRaw.toLowerCase() === 'missing';
    const meterHours = isMeterMissing ? null : parseFloat(meterRaw);

    if (isNaN(areaHa) || areaHa <= 0) {
      errors.push(`Row ${i + 1}: Invalid area_ha "${cols[areaIdx]}"`);
    }
    if (isNaN(reportedHours) || reportedHours < 0) {
      errors.push(`Row ${i + 1}: Invalid reported_hours "${cols[reportedIdx]}"`);
    }

    parsedFarmers.push({
      id,
      name,
      crop,
      areaHa: isNaN(areaHa) ? 3.0 : areaHa,
      reportedHours: isNaN(reportedHours) ? 20 : reportedHours,
      meterHours,
      isMeterMissing,
    });
  }

  return {
    isValid: errors.length === 0,
    fileHash,
    rowCount: parsedFarmers.length,
    errors,
    parsedFarmers: errors.length === 0 ? parsedFarmers : undefined,
  };
}

export function exportAllocationToCsv(farmers: FarmerRecord[]): string {
  const headers = [
    'Farmer_ID',
    'Farmer_Name',
    'Crop',
    'Land_Area_Ha',
    'Reported_Hours',
    'Meter_Hours',
    'Meter_Missing',
    'Discrepancy_Delta_Hours',
    'Sentinel2_NDVI',
    'Dignity_Floor_Hours',
    'Allocated_Hours',
    'Escrow_Hours',
    'Escrow_Status',
    'Discharge_Rate_Lps',
    'Allocated_Volume_M3',
    'Merkle_Leaf_Hash',
  ];

  const rows = farmers.map((f) => [
    f.id,
    `"${f.name}"`,
    f.crop,
    f.areaHa.toFixed(2),
    f.reportedHours.toFixed(1),
    f.meterHours !== null ? f.meterHours.toFixed(1) : 'MISSING',
    f.isMeterMissing ? 'YES' : 'NO',
    f.meterDiscrepancyDelta.toFixed(1),
    f.satelliteNdvi.toFixed(3),
    f.dignityFloorHours.toFixed(1),
    f.allocatedHours.toFixed(1),
    f.escrowHours.toFixed(1),
    f.escrowStatus,
    f.dischargeRateLps,
    Math.round(f.allocatedHours * f.dischargeM3PerHour),
    f.leafHash,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
