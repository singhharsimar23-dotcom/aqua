import React, { useState, useRef, useEffect } from 'react';
import {
  Layers,
  Eye,
  EyeOff,
  Radio,
  Play,
  Pause,
  RotateCcw,
  Upload,
  Info,
  ChevronRight,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Shield,
  Lock,
  AlertTriangle,
  Compass,
  CheckCircle2,
} from 'lucide-react';
import {
  FarmerRecord,
  ZoneBudgetConfig,
  ZoneSummary,
  SENTINEL2_REAL_SCENE,
  ProvenanceTrace,
  PROVENANCE_REGISTRY,
  WellDrawdownResult,
  parseAndValidateFarmerCsv,
} from 'packages/core';
import { ProvenanceBadge } from './ProvenanceBadge.tsx';

interface MapStageProps {
  farmers: FarmerRecord[];
  config: ZoneBudgetConfig;
  summary: ZoneSummary;
  drawdownResults: Record<string, WellDrawdownResult>;
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
  onProveIt: (trace: ProvenanceTrace) => void;
  onUploadCsv: (csvText: string) => void;
  verifyStep: number; // 1 to 4
  onSetVerifyStep: (step: number) => void;
  isPlayingVerify: boolean;
  onTogglePlayVerify: () => void;
  isLiteMode: boolean;
  onToggleLiteMode: () => void;
}

export const MapStage: React.FC<MapStageProps> = ({
  farmers,
  config,
  summary,
  drawdownResults,
  selectedObjectId,
  onSelectObject,
  onProveIt,
  onUploadCsv,
  verifyStep,
  onSetVerifyStep,
  isPlayingVerify,
  onTogglePlayVerify,
  isLiteMode,
  onToggleLiteMode,
}) => {
  // Map layers state
  const [basemap, setBasemap] = useState<'carto' | 'satellite' | 'hydrology'>('carto');
  const [showDrawdownCones, setShowDrawdownCones] = useState(true);
  const [showNdviOverlay, setShowNdviOverlay] = useState(true);
  const [showFeederGrid, setShowFeederGrid] = useState(true);
  const [showPiezometers, setShowPiezometers] = useState(true);

  // Camera zoom levels: 0: India, 1: Maharashtra, 2: Wardha, 3: Zone-A (Pipri Khurd)
  const [cameraLevel, setCameraLevel] = useState<0 | 1 | 2 | 3>(3);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto step timer during playback
  useEffect(() => {
    if (!isPlayingVerify) return;
    const timer = setInterval(() => {
      onSetVerifyStep((verifyStep % 4) + 1);
    }, 3800);
    return () => clearInterval(timer);
  }, [isPlayingVerify, verifyStep, onSetVerifyStep]);

  // Handle Drag & Drop CSV
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) onUploadCsv(text);
      };
      reader.readAsText(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) onUploadCsv(text);
      };
      reader.readAsText(file);
    }
  };

  // Farmer plot coordinates mapped into SVG viewport [0, 0, 1000, 700]
  // Zone-A Centroid ~20.7453, 78.6022
  const mapPlots = [
    {
      id: 'A',
      farmer: farmers.find((f) => f.id === 'A')!,
      // Top-Left plot
      points: '140,80 460,70 480,310 160,320',
      center: { x: 300, y: 190 },
      well: { x: 340, y: 220, id: 'W-01' },
      color: '#38bdf8', // sky
    },
    {
      id: 'B',
      farmer: farmers.find((f) => f.id === 'B')!,
      // Bottom-Left plot
      points: '160,320 480,310 490,570 170,580',
      center: { x: 320, y: 440 },
      well: { x: 360, y: 460, id: 'W-02' },
      color: '#34d399', // emerald
    },
    {
      id: 'C',
      farmer: farmers.find((f) => f.id === 'C')!,
      // Top-Right plot (Anomalous)
      points: '480,70 820,90 840,330 480,310',
      center: { x: 650, y: 200 },
      well: { x: 620, y: 230, id: 'W-03' },
      color: '#f87171', // red/amber
    },
    {
      id: 'D',
      farmer: farmers.find((f) => f.id === 'D')!,
      // Bottom-Right plot
      points: '480,310 840,330 830,560 490,570',
      center: { x: 660, y: 440 },
      well: { x: 640, y: 430, id: 'W-04' },
      color: '#fbbf24', // amber
    },
  ];

  // Feeder lines
  const feederLines = [
    { id: 'F-01', path: 'M 50,220 L 340,220 L 360,460', label: '11kV Feeder F-01' },
    { id: 'F-02', path: 'M 950,230 L 620,230 L 640,430', label: '11kV Feeder F-02' },
  ];

  const farmerC = farmers.find((f) => f.id === 'C');

  return (
    <div
      className={`relative w-full h-full min-h-[640px] bg-neutral-950 overflow-hidden flex flex-col select-none ${
        isDragOver ? 'ring-4 ring-cyan-400 ring-inset' : ''
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept=".csv"
        className="hidden"
      />

      {/* Top Floating GIS Controls Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left: Breadcrumbs & Geo Navigation */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-lg text-xs pointer-events-auto shadow-lg">
          <button
            onClick={() => setCameraLevel(0)}
            className={`hover:text-white transition-colors cursor-pointer ${
              cameraLevel === 0 ? 'text-cyan-400 font-semibold' : 'text-neutral-400'
            }`}
          >
            India
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
          <button
            onClick={() => setCameraLevel(1)}
            className={`hover:text-white transition-colors cursor-pointer ${
              cameraLevel === 1 ? 'text-cyan-400 font-semibold' : 'text-neutral-400'
            }`}
          >
            Maharashtra
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
          <button
            onClick={() => setCameraLevel(2)}
            className={`hover:text-white transition-colors cursor-pointer ${
              cameraLevel === 2 ? 'text-cyan-400 font-semibold' : 'text-neutral-400'
            }`}
          >
            Wardha
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
          <button
            onClick={() => setCameraLevel(3)}
            className={`hover:text-white transition-colors cursor-pointer ${
              cameraLevel === 3 ? 'text-cyan-400 font-semibold' : 'text-neutral-400'
            }`}
          >
            Zone-A (Pipri Khurd)
          </button>
        </div>

        {/* Right: Basemap Switcher & Layer Toggles */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Basemap Segmented Toggle */}
          <div className="flex items-center p-1 bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-lg text-xs shadow-lg">
            <button
              onClick={() => setBasemap('carto')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                basemap === 'carto'
                  ? 'bg-neutral-800 text-white font-medium shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Dark GIS
            </button>
            <button
              onClick={() => setBasemap('satellite')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                basemap === 'satellite'
                  ? 'bg-neutral-800 text-white font-medium shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="Cartographic satellite basemap (mixed dates)"
            >
              <span>Satellite</span>
              <span className="text-[9px] text-neutral-500">[mixed]</span>
            </button>
            <button
              onClick={() => setBasemap('hydrology')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                basemap === 'hydrology'
                  ? 'bg-neutral-800 text-white font-medium shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Hydrology
            </button>
          </div>

          {/* Layer toggles dropdown button */}
          <div className="flex items-center gap-1 bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-lg p-1 text-xs shadow-lg">
            <button
              onClick={() => setShowDrawdownCones(!showDrawdownCones)}
              className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                showDrawdownCones
                  ? 'text-cyan-300 bg-cyan-950/60 border border-cyan-800/60'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
              title="Toggle Theis Cone of Depression"
            >
              Theis Cones
            </button>
            <button
              onClick={() => setShowNdviOverlay(!showNdviOverlay)}
              className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                showNdviOverlay
                  ? 'text-emerald-300 bg-emerald-950/60 border border-emerald-800/60'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
              title="Toggle Real Sentinel-2 NDVI Overlay"
            >
              NDVI Mesh
            </button>
            <button
              onClick={() => setShowFeederGrid(!showFeederGrid)}
              className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                showFeederGrid
                  ? 'text-amber-300 bg-amber-950/60 border border-amber-800/60'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
              title="Toggle 11kV Agricultural Power Feeders"
            >
              Feeders
            </button>
          </div>

          {/* Upload CSV button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-900/90 hover:bg-neutral-800 backdrop-blur-md border border-neutral-800 rounded-lg shadow-lg cursor-pointer transition-colors"
            title="Drop custom farmer CSV onto map to test in-browser"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Drop CSV</span>
          </button>

          {/* Lite mode toggle */}
          <button
            onClick={onToggleLiteMode}
            className={`px-2.5 py-1.5 text-[11px] font-mono rounded-lg border backdrop-blur-md cursor-pointer transition-colors ${
              isLiteMode
                ? 'bg-amber-950/40 border-amber-800 text-amber-300'
                : 'bg-neutral-900/90 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
            title="Lite Mode: Disables blur/shader overlays for low-spec GPUs"
          >
            {isLiteMode ? 'LITE: ON' : 'LITE: OFF'}
          </button>
        </div>
      </div>

      {/* Main SVG Vector Stage */}
      <div className="relative flex-1 w-full h-full">
        {/* Real Sentinel-2 Metadata Banner (when NDVI overlay active) */}
        {showNdviOverlay && cameraLevel === 3 && (
          <div className="absolute top-16 left-4 z-10 max-w-md p-2.5 bg-neutral-950/85 backdrop-blur-md border border-neutral-800 rounded-lg text-[11px] text-neutral-300 shadow-xl pointer-events-auto">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                Real Sentinel-2 L2A Scene
              </span>
              <ProvenanceBadge
                tag="LIVE"
                onClick={() => onProveIt(PROVENANCE_REGISTRY['satellite.ndvi'])}
              />
            </div>
            <div className="mt-1 font-mono text-[10px] text-neutral-400 truncate">
              ID: {SENTINEL2_REAL_SCENE.sceneId}
            </div>
            <div className="text-[10px] text-neutral-500 mt-0.5">
              Acquired: {SENTINEL2_REAL_SCENE.acquisitionDate} · Bands B08/B04 · 10m Ground Resolution
            </div>
          </div>
        )}

        {/* Floating Zone Stress Indicator (Hero Moment) */}
        <div className="absolute top-16 right-4 z-10 p-3 bg-neutral-950/90 backdrop-blur-md border border-neutral-800 rounded-xl shadow-xl pointer-events-auto min-w-[220px]">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span>Aquifer Stress Status</span>
            <ProvenanceBadge
              tag="LIVE"
              onClick={() => onProveIt(PROVENANCE_REGISTRY['zone.weeklyBudgetM3'])}
            />
          </div>

          {verifyStep < 3 ? (
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono text-amber-400">
                  {(summary.reportedStressRatio * 100).toFixed(1)}%
                </span>
                <span className="text-xs font-semibold text-amber-300">
                  {summary.reportedTier}
                </span>
              </div>
              <div className="text-[11px] text-neutral-400 mt-1">
                Based on unverified self-reports ({summary.reportedTotalHours}h)
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in duration-300">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono text-red-400">
                  {(summary.verifiedStressRatio * 100).toFixed(1)}%
                </span>
                <span className="text-xs font-semibold text-red-300 animate-pulse">
                  {summary.verifiedTier}!
                </span>
              </div>
              <div className="text-[11px] text-red-300/90 font-medium mt-1">
                Flipped by Smart-Meter (+30h on Plot C)
              </div>
            </div>
          )}

          {/* Mini progress bar */}
          <div className="mt-2 h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
            <div
              style={{
                width: `${Math.min(
                  100,
                  (verifyStep < 3 ? summary.reportedStressRatio : summary.verifiedStressRatio) * 100
                )}%`,
              }}
              className={`h-full transition-all duration-700 ${
                verifyStep < 3 ? 'bg-amber-400' : 'bg-red-500'
              }`}
            />
          </div>
        </div>

        {/* The SVG GIS Canvas */}
        <svg
          viewBox="0 0 1000 680"
          className="w-full h-full object-cover"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="rgba(255, 255, 255, 0.03)"
                strokeWidth="1"
              />
            </pattern>

            {/* Topographic Contour Texture */}
            <pattern id="topo" width="80" height="80" patternUnits="userSpaceOnUse">
              <circle
                cx="40"
                cy="40"
                r="30"
                fill="none"
                stroke="rgba(56, 189, 248, 0.04)"
                strokeWidth="1"
              />
              <circle
                cx="40"
                cy="40"
                r="15"
                fill="none"
                stroke="rgba(56, 189, 248, 0.06)"
                strokeWidth="1"
              />
            </pattern>

            {/* Theis Drawdown Cone Radial Gradients */}
            {mapPlots.map((plot) => (
              <radialGradient
                key={`grad-${plot.id}`}
                id={`drawdown-grad-${plot.id}`}
                cx="50%"
                cy="50%"
                r="50%"
              >
                <stop
                  offset="0%"
                  stopColor={plot.id === 'C' && verifyStep >= 3 ? '#ef4444' : '#38bdf8'}
                  stopOpacity="0.45"
                />
                <stop
                  offset="50%"
                  stopColor={plot.id === 'C' && verifyStep >= 3 ? '#f97316' : '#0284c7'}
                  stopOpacity="0.2"
                />
                <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
              </radialGradient>
            ))}

            {/* Satellite NDVI Simulated Thermal Colormap */}
            <linearGradient id="ndvi-c" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#15803d" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0.5" />
            </linearGradient>
            <linearGradient id="ndvi-d" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#a16207" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#ca8a04" stopOpacity="0.35" />
            </linearGradient>
          </defs>

          {/* Background Canvas */}
          <rect
            width="1000"
            height="680"
            fill={basemap === 'satellite' ? '#0d151c' : '#090a0f'}
          />
          <rect width="1000" height="680" fill="url(#grid)" />
          {basemap === 'hydrology' && (
            <rect width="1000" height="680" fill="url(#topo)" />
          )}

          {/* Camera Level Visualizer when zoomed out */}
          {cameraLevel < 3 && (
            <g className="transition-all duration-500">
              <circle
                cx="500"
                cy="340"
                r={cameraLevel === 0 ? 120 : cameraLevel === 1 ? 220 : 320}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="6 4"
                className="animate-pulse"
              />
              <text
                x="500"
                y="310"
                textAnchor="middle"
                fill="#f1f5f9"
                fontSize="16"
                fontWeight="600"
                fontFamily="sans-serif"
              >
                {cameraLevel === 0
                  ? 'National Grid / Central Ground Water Board'
                  : cameraLevel === 1
                  ? 'Maharashtra State Aquifer Boundary'
                  : 'Wardha District · Seloo Block Hydrological Basin'}
              </text>
              <text
                x="500"
                y="335"
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="12"
                fontFamily="sans-serif"
              >
                Click 'Zone-A (Pipri Khurd)' above to enter operational parcel view
              </text>
            </g>
          )}

          {/* Zone-A Plots & Cones (rendered when cameraLevel === 3) */}
          {cameraLevel === 3 && (
            <g>
              {/* Feeder Power Lines */}
              {showFeederGrid && (
                <g opacity="0.6">
                  {feederLines.map((feeder) => (
                    <g key={feeder.id}>
                      <path
                        d={feeder.path}
                        fill="none"
                        stroke="#eab308"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={feeder.id === 'F-01' ? 70 : 830}
                        y={210}
                        fill="#facc15"
                        fontSize="10"
                        fontFamily="monospace"
                      >
                        {feeder.label}
                      </text>
                    </g>
                  ))}
                </g>
              )}

              {/* Theis Cones of Depression (Drawdown Circles) */}
              {showDrawdownCones && (
                <g>
                  {mapPlots.map((plot) => {
                    const isPlotC = plot.id === 'C';
                    const radius =
                      isPlotC && verifyStep >= 3
                        ? 210 // expanded cone under 50h pumping
                        : 140; // baseline cone

                    return (
                      <g key={`cone-${plot.id}`}>
                        <circle
                          cx={plot.well.x}
                          cy={plot.well.y}
                          r={radius}
                          fill={`url(#drawdown-grad-${plot.id})`}
                          className={isPlotC && verifyStep >= 3 ? 'animate-pulse' : ''}
                        />
                        {/* Iso-drawdown boundary contour */}
                        <circle
                          cx={plot.well.x}
                          cy={plot.well.y}
                          r={radius}
                          fill="none"
                          stroke={isPlotC && verifyStep >= 3 ? '#ef4444' : '#38bdf8'}
                          strokeWidth="1"
                          strokeDasharray="3 3"
                          opacity="0.4"
                        />
                      </g>
                    );
                  })}

                  {/* Interference Overlap Callout between Well W-03 and Well W-02/W-01 */}
                  {verifyStep >= 3 && (
                    <g opacity="0.85">
                      <path
                        d="M 520,230 L 460,250"
                        stroke="#ef4444"
                        strokeWidth="1.5"
                        strokeDasharray="2 2"
                      />
                      <rect
                        x="430"
                        y="260"
                        width="180"
                        height="36"
                        rx="4"
                        fill="#090a0f"
                        stroke="#ef4444"
                        strokeWidth="1"
                      />
                      <text
                        x="440"
                        y="275"
                        fill="#fca5a5"
                        fontSize="10"
                        fontFamily="sans-serif"
                        fontWeight="600"
                      >
                        Well Interference Zone
                      </text>
                      <text
                        x="440"
                        y="288"
                        fill="#e2e8f0"
                        fontSize="9"
                        fontFamily="monospace"
                      >
                        Head Loss: -1.8m (+14% energy)
                      </text>
                    </g>
                  )}
                </g>
              )}

              {/* Farmer Plots Polygons */}
              {mapPlots.map((plot) => {
                const isSelected = selectedObjectId === plot.id;
                const isPlotC = plot.id === 'C';
                const hasEscrow = plot.farmer.escrowHours > 0;

                // Fill styling based on NDVI or standard GIS
                let fillColor = 'rgba(15, 23, 42, 0.7)';
                if (showNdviOverlay) {
                  if (plot.id === 'C') fillColor = 'url(#ndvi-c)';
                  else if (plot.id === 'D') fillColor = 'url(#ndvi-d)';
                  else fillColor = 'rgba(34, 197, 94, 0.25)';
                }

                return (
                  <g
                    key={plot.id}
                    className="cursor-pointer transition-all duration-200"
                    onClick={() => onSelectObject(plot.id)}
                  >
                    {/* Plot Polygon */}
                    <polygon
                      points={plot.points}
                      fill={fillColor}
                      stroke={
                        isSelected
                          ? '#38bdf8'
                          : isPlotC && verifyStep >= 3
                          ? '#ef4444'
                          : '#334155'
                      }
                      strokeWidth={isSelected ? 3 : isPlotC && verifyStep >= 3 ? 2.5 : 1.5}
                      strokeDasharray={isPlotC && verifyStep >= 3 ? 'none' : 'none'}
                    />

                    {/* Plot Center Label */}
                    <g transform={`translate(${plot.center.x}, ${plot.center.y})`}>
                      <rect
                        x="-70"
                        y="-35"
                        width="140"
                        height="55"
                        rx="6"
                        fill="#090a0f"
                        stroke={isSelected ? '#38bdf8' : '#1e293b'}
                        strokeWidth="1"
                        opacity="0.92"
                      />
                      <text
                        x="0"
                        y="-16"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="12"
                        fontWeight="600"
                        fontFamily="sans-serif"
                      >
                        Farmer {plot.id}: {plot.farmer.name.split(' ')[0]}
                      </text>
                      <text
                        x="0"
                        y="-2"
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize="10"
                        fontFamily="sans-serif"
                      >
                        {plot.farmer.crop} · {plot.farmer.areaHa} ha
                      </text>

                      {/* Dynamic Metric display depending on verify step */}
                      {verifyStep === 1 && (
                        <text
                          x="0"
                          y="12"
                          textAnchor="middle"
                          fill="#38bdf8"
                          fontSize="10"
                          fontFamily="monospace"
                        >
                          Reported: {plot.farmer.reportedHours} hrs
                        </text>
                      )}

                      {verifyStep === 2 && (
                        <text
                          x="0"
                          y="12"
                          textAnchor="middle"
                          fill={isPlotC ? '#ef4444' : '#34d399'}
                          fontSize="10"
                          fontFamily="monospace"
                        >
                          Meter: {plot.farmer.meterHours}h (NDVI {plot.farmer.satelliteNdvi})
                        </text>
                      )}

                      {verifyStep >= 3 && (
                        <text
                          x="0"
                          y="12"
                          textAnchor="middle"
                          fill={isPlotC ? '#f87171' : '#34d399'}
                          fontSize="10"
                          fontFamily="monospace"
                          fontWeight="600"
                        >
                          {isPlotC
                            ? `Alloc: ${plot.farmer.allocatedHours}h + ${plot.farmer.escrowHours}h [ESCROW]`
                            : `Allocated: ${plot.farmer.allocatedHours} hrs`}
                        </text>
                      )}
                    </g>

                    {/* Borewell Node Marker */}
                    <g
                      transform={`translate(${plot.well.x}, ${plot.well.y})`}
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectObject(plot.well.id);
                      }}
                    >
                      <circle
                        cx="0"
                        cy="0"
                        r="9"
                        fill="#0284c7"
                        stroke="#ffffff"
                        strokeWidth="2"
                        className={isPlotC && verifyStep >= 3 ? 'animate-bounce' : ''}
                      />
                      <circle
                        cx="0"
                        cy="0"
                        r="3"
                        fill="#ffffff"
                      />
                      <text
                        x="14"
                        y="4"
                        fill="#38bdf8"
                        fontSize="10"
                        fontWeight="600"
                        fontFamily="monospace"
                      >
                        {plot.well.id} (15 L/s)
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Piezometer Monitoring Well (CGWB Station) */}
              {showPiezometers && (
                <g
                  transform="translate(485, 315)"
                  className="cursor-pointer"
                  onClick={() => onSelectObject('PIEZOMETER')}
                >
                  <rect
                    x="-10"
                    y="-10"
                    width="20"
                    height="20"
                    fill="#4f46e5"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    transform="rotate(45)"
                  />
                  <text
                    x="18"
                    y="4"
                    fill="#818cf8"
                    fontSize="9"
                    fontWeight="600"
                    fontFamily="monospace"
                  >
                    Piezometer MH-WRD-04 (18.5m DTW)
                  </text>
                </g>
              )}
            </g>
          )}
        </svg>

        {/* Bottom Hero Scrubbable Verification Controller */}
        <div className="absolute bottom-4 left-4 right-4 z-20 p-3.5 bg-neutral-950/95 backdrop-blur-md border border-neutral-800 rounded-xl shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Play/Pause & Step Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={onTogglePlayVerify}
                className="p-2 text-neutral-900 bg-cyan-400 hover:bg-cyan-300 rounded-lg cursor-pointer transition-colors shadow-sm"
                title={isPlayingVerify ? 'Pause simulation walkthrough' : 'Play automated walkthrough'}
              >
                {isPlayingVerify ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
              </button>

              <button
                onClick={() => onSetVerifyStep(1)}
                className="p-2 text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 rounded-lg cursor-pointer transition-colors"
                title="Reset to Step 1"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <div className="h-6 w-px bg-neutral-800 mx-1 hidden sm:block" />

              {/* 4 Discrete Step Segmented Buttons */}
              <div className="flex items-center gap-1">
                {[
                  { step: 1, label: '1. Self-Reports', sub: 'Zone: 89.2% Semi-critical' },
                  { step: 2, label: '2. Signals Ingested', sub: 'Meter & Sentinel-2' },
                  { step: 3, label: '3. Verification Flip', sub: '103.0% Over-exploited!' },
                  { step: 4, label: '4. Escrow Lock', sub: '14.1h Held for Committee' },
                ].map((s) => (
                  <button
                    key={s.step}
                    onClick={() => onSetVerifyStep(s.step)}
                    className={`px-3 py-1.5 rounded-lg text-xs text-left transition-all cursor-pointer ${
                      verifyStep === s.step
                        ? s.step === 3
                          ? 'bg-red-950/80 border border-red-700 text-red-200 font-semibold'
                          : s.step === 4
                          ? 'bg-amber-950/80 border border-amber-700 text-amber-200 font-semibold'
                          : 'bg-neutral-800 border border-neutral-700 text-white font-semibold'
                        : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                    }`}
                  >
                    <div>{s.label}</div>
                    <div className="text-[10px] opacity-70 hidden lg:block">{s.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step Narration Text */}
            <div className="text-xs text-neutral-300 max-w-md hidden xl:block">
              {verifyStep === 1 && (
                <p>
                  <span className="text-cyan-400 font-semibold">Stage 1: </span>
                  Farmers self-report 95h total. Aquifer extraction sits at 89.2% of safe cap (Semi-critical tier).
                </p>
              )}
              {verifyStep === 2 && (
                <p>
                  <span className="text-emerald-400 font-semibold">Stage 2: </span>
                  MSEDCL smart meters and Sentinel-2 NDVI telemetry ingested. Discrepancy detected on Plot C.
                </p>
              )}
              {verifyStep === 3 && (
                <p className="text-red-300">
                  <span className="font-semibold text-red-400">Stage 3 Flip: </span>
                  Meter records 50h on Farmer C (+30h). Zone extraction leaps to 103.0% (Over-exploited)!
                </p>
              )}
              {verifyStep === 4 && (
                <p className="text-amber-300">
                  <span className="font-semibold text-amber-400">Stage 4 Governance: </span>
                  No auto-cuts! Farmer C gets 20.0h guaranteed base, 14.1h is held in escrow. Merkle root signed.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
