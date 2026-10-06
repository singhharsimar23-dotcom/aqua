import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Layers,
  Upload,
  Download,
  ZoomIn,
  ZoomOut,
  Compass,
  Square,
  Waves,
  Activity,
  Trees,
  Maximize2,
  FileSpreadsheet,
} from 'lucide-react';
import {
  FarmerRecord,
  ZoneBudgetConfig,
  ZoneSummary,
  ProvenanceTrace,
  WellDrawdownResult,
  haversineDistanceMeters,
  exportAllocationToCsv,
} from 'packages/core';
import { SceneProvenance } from '../store/useGroundwaterStore.ts';

interface PlaygroundMapProps {
  farmers: FarmerRecord[];
  config: ZoneBudgetConfig;
  summary: ZoneSummary;
  drawdownResults: Record<string, WellDrawdownResult>;
  verifyStep: number;
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
  onProveIt: (trace: ProvenanceTrace) => void;
  onUploadCsv: (csvText: string) => void;
  isLightMode: boolean;
  activeTab: 'all' | 'meter' | 'ndvi' | 'drawdown';
  onChangeTab: (tab: 'all' | 'meter' | 'ndvi' | 'drawdown') => void;
  sceneProvenance: SceneProvenance | null;
  sceneLoaded: boolean;
  onOpenProveDrawer?: () => void;
}

export const PlaygroundMap: React.FC<PlaygroundMapProps> = ({
  farmers,
  config,
  summary,
  drawdownResults,
  verifyStep,
  selectedObjectId,
  onSelectObject,
  onProveIt,
  onUploadCsv,
  isLightMode,
  activeTab,
  onChangeTab,
  sceneProvenance,
  sceneLoaded,
  onOpenProveDrawer,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [basemapType, setBasemapType] = useState<'satellite' | 'dark' | 'positron' | 'osm'>('satellite');
  const [showFeeders, setShowFeeders] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [20.782, 78.558],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    });

    mapInstanceRef.current = map;
    layersGroupRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Basemap Tiles
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    let tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    let maxZoom = 19;

    if (basemapType === 'dark') {
      tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      maxZoom = 20;
    } else if (basemapType === 'positron') {
      tileUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
      maxZoom = 20;
    } else if (basemapType === 'osm') {
      tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      maxZoom = 19;
    }

    L.tileLayer(tileUrl, {
      maxZoom,
      subdomains: 'abcd',
    }).addTo(map);
  }, [basemapType]);

  // Sync light mode to basemap
  useEffect(() => {
    if (isLightMode && basemapType === 'dark') {
      setBasemapType('positron');
    } else if (!isLightMode && basemapType === 'positron') {
      setBasemapType('satellite');
    }
  }, [isLightMode]);

  // Tab-Aware Vector & Overlay Rendering (Contradiction 10 & 11)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = layersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    // 1. Render Farm Plots with area proportional to land (7.0, 7.5, 5.0, 9.5 ac)
    farmers.forEach((farmer) => {
      const isSelected = selectedObjectId === farmer.id;
      const isPlotC = farmer.id === 'C';

      let strokeColor = isLightMode ? '#475569' : '#94a3b8';
      let fillColor = isLightMode ? '#0284c7' : '#0369a1';
      let fillOpacity = 0.12;

      // Color coding per activeTab
      if (activeTab === 'ndvi') {
        // Sentinel-2 NDVI canopy gradient
        const ndvi = farmer.satelliteNdvi;
        if (ndvi > 0.70) {
          fillColor = '#10b981'; // lush canopy (Farmer C 0.741)
          strokeColor = '#059669';
          fillOpacity = 0.35;
        } else if (ndvi > 0.50) {
          fillColor = '#84cc16'; // moderate canopy
          strokeColor = '#65a30d';
          fillOpacity = 0.28;
        } else {
          fillColor = '#eab308'; // low/dry canopy
          strokeColor = '#ca8a04';
          fillOpacity = 0.25;
        }
      } else if (activeTab === 'meter') {
        // Meter telemetry mode
        if (isPlotC && farmer.meterDiscrepancyDelta > 10) {
          fillColor = '#f59e0b'; // amber discrepancy
          strokeColor = '#d97706';
          fillOpacity = 0.25;
        } else {
          fillColor = '#3b82f6';
          strokeColor = '#2563eb';
          fillOpacity = 0.12;
        }
      } else if (isSelected) {
        strokeColor = '#0284c7';
        fillColor = '#0284c7';
        fillOpacity = 0.25;
      } else if (isPlotC && verifyStep >= 3) {
        strokeColor = '#e11d48';
        fillColor = '#be123c';
        fillOpacity = 0.22;
      }

      const polygon = L.polygon(farmer.polygon, {
        color: strokeColor,
        weight: isSelected ? 2.5 : isPlotC && verifyStep >= 3 ? 2 : 1.5,
        fillColor,
        fillOpacity,
        smoothFactor: 1,
      });

      polygon.on('click', () => {
        onSelectObject(farmer.id);
      });

      polygon.bindTooltip(
        `<div style="font-family: var(--font-sans); line-height: 1.4; padding: 2px;">
          <div style="font-weight: 700; font-size: 13px;">Farmer ${farmer.id}: ${farmer.name}</div>
          <div style="color: ${isLightMode ? '#475569' : '#cbd5e1'}; font-size: 12px;">${farmer.crop} · ${(farmer as any).landAcres ?? 7} ac (${farmer.areaHa} ha) [SYNTH]</div>
          ${
            activeTab === 'ndvi'
              ? `<div style="color: #10b981; font-weight: 600; font-size: 12px; margin-top: 2px;">NDVI: ${farmer.satelliteNdvi.toFixed(3)} (Canopy Index)</div>`
              : activeTab === 'meter'
              ? `<div style="color: #f59e0b; font-weight: 600; font-size: 12px; margin-top: 2px;">Report: ${farmer.reportedHours}h | Meter: ${farmer.meterHours ?? 'Offline'}h</div>`
              : `<div style="color: ${isPlotC && verifyStep >= 3 ? (isLightMode ? '#be123c' : '#fb7185') : (isLightMode ? '#0284c7' : '#38bdf8')}; font-size: 12px; font-weight: 600; margin-top: 2px;">
                  ${isPlotC && verifyStep >= 3 ? 'Meter: 50.0h (+30.0h) · 14.1h Escrow' : `Allocated: ${farmer.allocatedHours.toFixed(1)} hrs`}
                </div>`
          }
        </div>`,
        { direction: 'center', permanent: false }
      );

      group.addLayer(polygon);

      // 2. Tab Specific Overlays
      if (activeTab === 'meter') {
        // Concentric R vs E circles around well
        const R_radius = (farmer.reportedHours / 60) * 120 + 20;
        const rCircle = L.circle(farmer.wellCoord, {
          radius: R_radius,
          color: '#10b981',
          fillColor: '#10b981',
          fillOpacity: 0.15,
          weight: 1.5,
          dashArray: '2, 3',
        });
        group.addLayer(rCircle);

        if (farmer.meterHours !== null) {
          const E_radius = (farmer.meterHours / 60) * 120 + 20;
          const eCircle = L.circle(farmer.wellCoord, {
            radius: E_radius,
            color: farmer.meterHours > farmer.reportedHours ? '#f59e0b' : '#38bdf8',
            fillColor: farmer.meterHours > farmer.reportedHours ? '#f59e0b' : '#38bdf8',
            fillOpacity: 0.1,
            weight: 2,
          });
          group.addLayer(eCircle);
        }
      } else if (activeTab === 'drawdown') {
        // Dynamic Theis Cone calculated from core theis drawdown
        const wellResult = drawdownResults[farmer.wellId];
        const drawdownMeters = wellResult?.totalDrawdownM || 3.8;
        const radiusMeters = Math.max(100, Math.min(380, drawdownMeters * 35));

        const drawdownCircle = L.circle(farmer.wellCoord, {
          radius: radiusMeters,
          fillColor: isPlotC ? '#e11d48' : '#0284c7',
          fillOpacity: 0.12,
          color: isPlotC ? '#f43f5e' : '#38bdf8',
          weight: 1.5,
          dashArray: '4, 4',
        });
        group.addLayer(drawdownCircle);
      }

      // 3. Borewell Pins
      const wellPin = L.circleMarker(farmer.wellCoord, {
        radius: 6,
        fillColor: isPlotC && verifyStep >= 3 ? '#e11d48' : '#0284c7',
        fillOpacity: 1,
        color: '#ffffff',
        weight: 2,
      });

      wellPin.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectObject(farmer.wellId);
      });

      wellPin.bindTooltip(
        `<div style="font-family: var(--font-mono); font-size: 12px; line-height: 1.4;">
          <strong>Borewell ${farmer.wellId}</strong> · ${farmer.dischargeRateLps} L/s (54 m³/h)<br/>
          Pumping: ${farmer.allocatedHours.toFixed(1)} hrs · Head: ${drawdownResults[farmer.wellId]?.dynamicHeadM || 22}m
        </div>`,
        { direction: 'top' }
      );

      group.addLayer(wellPin);
    });

    // 4. Well Interference Arcs in Drawdown tab
    if (activeTab === 'drawdown') {
      const wellPairs = [
        ['W-01', 'W-02'],
        ['W-03', 'W-04'],
        ['W-01', 'W-03'],
      ];

      wellPairs.forEach(([w1Id, w2Id]) => {
        const f1 = farmers.find((f) => f.wellId === w1Id);
        const f2 = farmers.find((f) => f.wellId === w2Id);
        if (f1 && f2) {
          const arc = L.polyline([f1.wellCoord, f2.wellCoord], {
            color: '#06b6d4',
            weight: 1.5,
            dashArray: '3, 6',
            opacity: 0.65,
          });
          const dist = Math.round(haversineDistanceMeters(f1.lat, f1.lng, f2.lat, f2.lng));
          arc.bindTooltip(`Interference: ${dist}m`, { sticky: true });
          group.addLayer(arc);
        }
      });
    }

    // 5. Agricultural Feeders
    if (showFeeders && (activeTab === 'all' || activeTab === 'meter')) {
      const feeder1 = L.polyline(
        [
          [20.7865, 78.552],
          [20.7835, 78.5562],
          [20.7802, 78.5566],
        ],
        { color: '#d97706', weight: 1.5, dashArray: '4, 4', opacity: 0.7 }
      );
      group.addLayer(feeder1);

      const feeder2 = L.polyline(
        [
          [20.7865, 78.565],
          [20.784, 78.561],
          [20.7808, 78.5612],
        ],
        { color: '#d97706', weight: 1.5, dashArray: '4, 4', opacity: 0.7 }
      );
      group.addLayer(feeder2);
    }
  }, [farmers, verifyStep, activeTab, showFeeders, selectedObjectId, drawdownResults, isLightMode]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) onUploadCsv(text);
      };
      reader.readAsText(e.dataTransfer.files[0]);
    }
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([20.782, 78.558], 15, { duration: 0.8 });
    }
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  const handleDownloadWorkedCsv = () => {
    const csv = exportAllocationToCsv(farmers);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ZoneA_Worked_Allocation_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div
      className="w-full h-full relative"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0 bg-slate-950" />

      {/* Hidden File Input for CSV */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const text = event.target?.result as string;
              if (text) onUploadCsv(text);
            };
            reader.readAsText(file);
          }
        }}
      />

      {/* Drag & Drop Visual Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 bg-sky-950/70 backdrop-blur-sm border-2 border-dashed border-sky-400 flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-100">
          <Upload className="w-12 h-12 text-sky-400 animate-bounce mb-2" />
          <div className="font-semibold text-base text-white">Drop CSV file to load farmer claims</div>
          <div className="text-xs text-sky-300 font-mono mt-1">Requires id, reported_hours, meter_hours</div>
        </div>
      )}

      {/* Top Left: Dynamic Sentinel-2 Provenance Chip per Contradiction 9 */}
      <div className="absolute top-4 left-4 z-20 pointer-events-auto">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono shadow-sm border backdrop-blur-md ${
            isLightMode
              ? 'bg-white/95 border-slate-200 text-slate-700'
              : 'bg-[#10131b]/90 border-white/[0.1] text-slate-300'
          }`}
        >
          {sceneLoaded && sceneProvenance ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-semibold">Sentinel-2A</span>
              <span className={isLightMode ? 'text-slate-300' : 'text-slate-600'}>·</span>
              <span>{sceneProvenance.acquisitionDate.slice(0, 10)}</span>
              <span className="text-[11px] text-slate-400">({sceneProvenance.cloudCoveragePercent}% cloud)</span>
              <button
                onClick={() => {
                  if (onOpenProveDrawer) {
                    onOpenProveDrawer();
                  } else {
                    onProveIt({
                      tag: 'LIVE',
                      sourceId: sceneProvenance.sceneId,
                      sourceName: sceneProvenance.sensor,
                      timestamp: sceneProvenance.acquisitionDate,
                      sceneId: sceneProvenance.sceneId,
                      formula: sceneProvenance.ndviFormula,
                      hash: sceneProvenance.artifactSha256,
                      description: sceneProvenance.description,
                      methodology: `STAC item: ${sceneProvenance.stacItemUrl} | Code path: ${sceneProvenance.codePath}`,
                    });
                  }
                }}
                className={`font-semibold hover:underline pl-1 cursor-pointer ${
                  isLightMode ? 'text-sky-700' : 'text-sky-400'
                }`}
              >
                Prove
              </button>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-amber-400 font-medium">REPLAY, no scene loaded</span>
            </>
          )}
        </div>
      </div>

      {/* Top Center: Map Layer Tabs (All, Meter, Ndvi, Drawdown) per Contradiction 11 */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
        <div
          className={`flex items-center gap-1 p-1 rounded-xl shadow-md border backdrop-blur-md text-xs font-medium ${
            isLightMode ? 'bg-white/95 border-slate-200 text-slate-700' : 'bg-[#10131b]/90 border-white/[0.1] text-slate-300'
          }`}
        >
          {[
            { id: 'all', label: 'All', icon: Maximize2 },
            { id: 'meter', label: 'Meter', icon: Activity },
            { id: 'ndvi', label: 'NDVI', icon: Trees },
            { id: 'drawdown', label: 'Drawdown', icon: Waves },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? isLightMode
                      ? 'bg-sky-100 text-sky-800 font-semibold border border-sky-300 shadow-xs'
                      : 'bg-white/[0.14] text-white font-semibold border border-white/[0.1] shadow-xs'
                    : isLightMode
                    ? 'hover:bg-slate-100 text-slate-600'
                    : 'hover:bg-white/[0.06] text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating Right Map Controls */}
      <div className="absolute top-14 right-4 z-20 flex flex-col gap-1.5 pointer-events-auto">
        {/* Recenter / Frame Zone */}
        <button
          onClick={handleRecenter}
          title="Frame / Recenter Zone-A"
          className={`w-9 h-9 rounded-xl backdrop-blur-md border flex items-center justify-center shadow-sm transition-all cursor-pointer ${
            isLightMode
              ? 'bg-white/95 hover:bg-slate-100 border-slate-200 text-slate-700'
              : 'bg-[#10131b]/90 hover:bg-white/[0.08] border-white/[0.1] text-slate-200'
          }`}
        >
          <Square className="w-4 h-4 text-sky-500" />
        </button>

        {/* Upload Custom CSV */}
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Import CSV (zone_a_week10.csv)"
          className={`w-9 h-9 rounded-xl backdrop-blur-md border flex items-center justify-center shadow-sm transition-all cursor-pointer ${
            isLightMode
              ? 'bg-white/95 hover:bg-slate-100 border-slate-200 text-slate-700'
              : 'bg-[#10131b]/90 hover:bg-white/[0.08] border-white/[0.1] text-slate-200'
          }`}
        >
          <Upload className="w-4 h-4 text-emerald-500" />
        </button>

        {/* Export CSV of Worked Table */}
        <button
          onClick={handleDownloadWorkedCsv}
          title="Export CSV of Worked Allocation Table"
          className={`w-9 h-9 rounded-xl backdrop-blur-md border flex items-center justify-center shadow-sm transition-all cursor-pointer ${
            isLightMode
              ? 'bg-white/95 hover:bg-slate-100 border-slate-200 text-slate-700'
              : 'bg-[#10131b]/90 hover:bg-white/[0.08] border-white/[0.1] text-slate-200'
          }`}
        >
          <Download className="w-4 h-4 text-cyan-400" />
        </button>

        {/* Basemap Switcher */}
        <div className="relative group">
          <button
            title="Basemap Layer"
            className={`w-9 h-9 rounded-xl backdrop-blur-md border flex items-center justify-center shadow-sm transition-all cursor-pointer ${
              isLightMode
                ? 'bg-white/95 hover:bg-slate-100 border-slate-200 text-slate-700'
                : 'bg-[#10131b]/90 hover:bg-white/[0.08] border-white/[0.1] text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4 text-purple-400" />
          </button>
          <div
            className={`absolute right-10 top-0 hidden group-hover:flex flex-col gap-1 p-1.5 border rounded-xl shadow-xl text-xs font-mono w-32 ${
              isLightMode ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#10131b] border-white/[0.1] text-slate-200'
            }`}
          >
            <button
              onClick={() => setBasemapType('satellite')}
              className={`p-2 rounded-lg text-left cursor-pointer transition-colors ${
                basemapType === 'satellite'
                  ? isLightMode ? 'bg-slate-100 font-semibold text-slate-900' : 'bg-white/[0.14] font-semibold text-white'
                  : 'hover:bg-slate-100/50'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setBasemapType('positron')}
              className={`p-2 rounded-lg text-left cursor-pointer transition-colors ${
                basemapType === 'positron'
                  ? isLightMode ? 'bg-slate-100 font-semibold text-slate-900' : 'bg-white/[0.14] font-semibold text-white'
                  : 'hover:bg-slate-100/50'
              }`}
            >
              Light Carto
            </button>
            <button
              onClick={() => setBasemapType('dark')}
              className={`p-2 rounded-lg text-left cursor-pointer transition-colors ${
                basemapType === 'dark'
                  ? isLightMode ? 'bg-slate-100 font-semibold text-slate-900' : 'bg-white/[0.14] font-semibold text-white'
                  : 'hover:bg-slate-100/50'
              }`}
            >
              Dark GIS
            </button>
            <button
              onClick={() => setBasemapType('osm')}
              className={`p-2 rounded-lg text-left cursor-pointer transition-colors ${
                basemapType === 'osm'
                  ? isLightMode ? 'bg-slate-100 font-semibold text-slate-900' : 'bg-white/[0.14] font-semibold text-white'
                  : 'hover:bg-slate-100/50'
              }`}
            >
              Street Map
            </button>
          </div>
        </div>

        {/* Drawdown Toggle */}
        <button
          onClick={() => onChangeTab(activeTab === 'drawdown' ? 'all' : 'drawdown')}
          title="Toggle Theis Drawdown Cones"
          className={`w-9 h-9 rounded-xl backdrop-blur-md border flex items-center justify-center shadow-sm transition-all cursor-pointer ${
            activeTab === 'drawdown'
              ? isLightMode
                ? 'bg-sky-100 border-sky-300 text-sky-700 font-semibold'
                : 'bg-sky-950/70 border-sky-600/50 text-sky-400'
              : isLightMode
              ? 'bg-white/95 border-slate-200 text-slate-500'
              : 'bg-[#10131b]/90 border-white/[0.1] text-slate-400'
          }`}
        >
          <Waves className="w-4 h-4" />
        </button>

        {/* Zoom In & Out */}
        <div
          className={`flex flex-col backdrop-blur-md border rounded-xl overflow-hidden shadow-sm ${
            isLightMode ? 'bg-white/95 border-slate-200' : 'bg-[#10131b]/90 border-white/[0.1]'
          }`}
        >
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className={`w-9 h-8 flex items-center justify-center transition-colors cursor-pointer ${
              isLightMode ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-white/[0.08] text-slate-200'
            }`}
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className={`w-full h-px ${isLightMode ? 'bg-slate-200' : 'bg-white/[0.08]'}`} />
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className={`w-9 h-8 flex items-center justify-center transition-colors cursor-pointer ${
              isLightMode ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-white/[0.08] text-slate-200'
            }`}
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        {/* Compass Reset-North */}
        <button
          onClick={handleRecenter}
          title="Reset North / Recenter"
          className={`w-9 h-9 rounded-xl backdrop-blur-md border flex items-center justify-center shadow-sm transition-all cursor-pointer ${
            isLightMode
              ? 'bg-white/95 hover:bg-slate-100 border-slate-200 text-slate-700'
              : 'bg-[#10131b]/90 hover:bg-white/[0.08] border-white/[0.1] text-slate-200'
          }`}
        >
          <Compass className="w-4 h-4" />
        </button>
      </div>

      {/* Footer Attribution per Contradiction 5 */}
      <div
        className={`absolute bottom-2 right-3 z-10 text-[11px] font-mono px-2 py-0.5 rounded shadow-sm pointer-events-none ${
          isLightMode ? 'bg-white/80 text-slate-500 border border-slate-200' : 'bg-black/60 text-slate-400'
        }`}
      >
        basemap (mixed dates)
      </div>
    </div>
  );
};
