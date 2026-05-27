import React, { useState, useEffect, useRef } from 'react';
import { RadiographData } from '../types';
import { ZoomIn, ZoomOut, RotateCcw, Image as ImageIcon, RotateCw, FlipHorizontal, FlipVertical } from 'lucide-react';

interface ViewerProps {
  data: RadiographData;
  baseUrl: string;
}

export default function ViewerSystem({ data, baseUrl }: ViewerProps) {
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>(
    Object.keys(data)[0] || ''
  );
  const [selectedView, setSelectedView] = useState<string>('');

  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [invert, setInvert] = useState(0);
  const [sharpness, setSharpness] = useState(0);
  const [kvp, setKvp] = useState(80);
  const [mas, setMas] = useState(20);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (selectedBodyPart && data[selectedBodyPart]) {
      const views = Object.keys(data[selectedBodyPart]);
      setSelectedView(views[0] || '');
    }
  }, [selectedBodyPart, data]);

  // Reset filters when image changes
  useEffect(() => {
    setBrightness(100);
    setContrast(100);
    setInvert(0);
    setSharpness(0);
    setKvp(80);
    setMas(20);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
  }, [selectedBodyPart, selectedView]);

  const bodyParts = Object.keys(data);
  const views = selectedBodyPart ? Object.keys(data[selectedBodyPart] || {}) : [];

  const currentImages =
    selectedBodyPart && selectedView
      ? data[selectedBodyPart][selectedView]
      : null;

  const resolveUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${baseUrl}${url}`;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const kvpMultiplier = Math.max(0.2, 80 / kvp); // Prevents extreme values
  const masMultiplier = Math.max(0.2, mas / 20); 
  const effectiveContrast = contrast * kvpMultiplier;
  const effectiveBrightness = brightness * masMultiplier;

  const filterStyle = `brightness(${effectiveBrightness}%) contrast(${effectiveContrast}%) invert(${invert}%) ${sharpness > 0 ? 'url(#sharpness-filter)' : ''}`;

  return (
    <div className="flex flex-col h-full bg-[#0A0B0D] text-gray-200">
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <filter id="sharpness-filter">
          <feConvolveMatrix 
            order="3 3" 
            preserveAlpha="true" 
            kernelMatrix={`0 ${-sharpness/100} 0 ${-sharpness/100} ${1 + 4*(sharpness/100)} ${-sharpness/100} 0 ${-sharpness/100} 0`}
          />
        </filter>
      </svg>
      <div className="flex items-center p-4 bg-[#111317] border-b border-[#2D3139] gap-6 flex-wrap">
        <div className="flex flex-col">
          <label className="text-[9px] uppercase text-gray-500 font-bold mb-1">Anatomy</label>
          <select
            className="bg-[#1A1C1E] border border-[#2D3139] rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
            value={selectedBodyPart}
            onChange={(e) => setSelectedBodyPart(e.target.value)}
          >
            {bodyParts.map((bp) => (
              <option key={bp} value={bp}>
                {bp.replace(/_/g, ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-[9px] uppercase text-gray-500 font-bold mb-1">View</label>
          <select
            className="bg-[#1A1C1E] border border-[#2D3139] rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
            value={selectedView}
            onChange={(e) => setSelectedView(e.target.value)}
          >
            {views.map((v) => (
              <option key={v} value={v}>
                {v.replace(/_/g, ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="h-8 w-px bg-[#2D3139] mx-2 hidden sm:block"></div>

        {/* Tools */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex flex-col">
            <label className="text-[9px] uppercase text-gray-500 font-bold mb-1">Preset</label>
            <select
                className="bg-[#1A1C1E] border border-[#2D3139] rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                onChange={(e) => {
                    const preset = e.target.value;
                    if (preset === 'normal') {
                        setBrightness(100); setContrast(100); setKvp(80); setMas(20); setSharpness(0);
                    } else if (preset === 'bone') {
                        setBrightness(90); setContrast(140); setKvp(60); setMas(40); setSharpness(15);
                    } else if (preset === 'soft') {
                        setBrightness(110); setContrast(85); setKvp(110); setMas(10); setSharpness(0);
                    }
                }}
            >
                <option value="normal">Normal</option>
                <option value="bone">Bone</option>
                <option value="soft">Soft Tissue</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-[9px] uppercase text-gray-500 font-bold mb-1">Bright</label>
            <input
              type="range"
              min="0"
              max="200"
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-20 accent-blue-600 h-1 bg-gray-800 rounded outline-none appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #2563eb 0%, #2563eb ${brightness/2}%, #1f2937 ${brightness/2}%, #1f2937 100%)`
              }}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-[9px] uppercase text-gray-500 font-bold mb-1">Contrast</label>
            <input
              type="range"
              min="0"
              max="200"
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
              className="w-20 accent-blue-600 h-1 bg-gray-800 rounded outline-none appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #2563eb 0%, #2563eb ${contrast/2}%, #1f2937 ${contrast/2}%, #1f2937 100%)`
              }}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-[9px] uppercase text-gray-500 font-bold mb-1">Sharpness</label>
            <input
              type="range"
              min="0"
              max="100"
              value={sharpness}
              onChange={(e) => setSharpness(Number(e.target.value))}
              className="w-20 accent-blue-600 h-1 bg-gray-800 rounded outline-none appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #2563eb 0%, #2563eb ${sharpness}%, #1f2937 ${sharpness}%, #1f2937 100%)`
              }}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-[9px] uppercase text-gray-500 font-bold mb-1">kVp</label>
            <input
              type="range"
              min="40"
              max="150"
              value={kvp}
              onChange={(e) => setKvp(Number(e.target.value))}
              className="w-20 accent-blue-600 h-1 bg-gray-800 rounded outline-none appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #2563eb 0%, #2563eb ${(kvp-40)/(150-40)*100}%, #1f2937 ${(kvp-40)/(150-40)*100}%, #1f2937 100%)`
              }}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-[9px] uppercase text-gray-500 font-bold mb-1">mAs</label>
            <input
              type="range"
              min="1"
              max="100"
              value={mas}
              onChange={(e) => setMas(Number(e.target.value))}
              className="w-20 accent-blue-600 h-1 bg-gray-800 rounded outline-none appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #2563eb 0%, #2563eb ${mas}%, #1f2937 ${mas}%, #1f2937 100%)`
              }}
            />
          </div>
          
          <div className="flex items-center gap-2 mt-3">
          <Tooltip text="Invert Colors">
            <button
                onClick={() => setInvert(invert === 0 ? 100 : 0)}
                className={`p-2 rounded border transition ${invert ? 'bg-blue-600 border-blue-500 hover:bg-blue-500' : 'bg-[#1A1C1E] border-[#2D3139] hover:bg-[#2D3139]'}`}
            >
                <ImageIcon size={16} />
            </button>
          </Tooltip>

          <Tooltip text="Rotate 90°">
            <button
                onClick={() => setRotation(r => r + 90)}
                className="p-2 rounded border bg-[#1A1C1E] border-[#2D3139] hover:bg-[#2D3139] transition text-gray-300"
            >
                <RotateCw size={16} />
            </button>
          </Tooltip>
          <Tooltip text="Flip Horizontal">
            <button
                onClick={() => setFlipH(f => !f)}
                className={`p-2 rounded border transition ${flipH ? 'bg-blue-900 border-blue-700 text-blue-300 hover:bg-blue-800' : 'bg-[#1A1C1E] border-[#2D3139] hover:bg-[#2D3139] text-gray-300'}`}
            >
                <FlipHorizontal size={16} />
            </button>
          </Tooltip>
          <Tooltip text="Flip Vertical">
            <button
                onClick={() => setFlipV(f => !f)}
                className={`p-2 rounded border transition ${flipV ? 'bg-blue-900 border-blue-700 text-blue-300 hover:bg-blue-800' : 'bg-[#1A1C1E] border-[#2D3139] hover:bg-[#2D3139] text-gray-300'}`}
            >
                <FlipVertical size={16} />
            </button>
          </Tooltip>

          <Tooltip text="Zoom Out">
            <button
                onClick={() => setZoom(Math.max(0.1, zoom - 0.2))}
                className="p-2 rounded border bg-[#1A1C1E] border-[#2D3139] hover:bg-[#2D3139] transition"
            >
                <ZoomOut size={16} />
            </button>
          </Tooltip>
          <Tooltip text="Zoom In">
            <button
                onClick={() => setZoom(Math.min(5, zoom + 0.2))}
                className="p-2 rounded border bg-[#1A1C1E] border-[#2D3139] hover:bg-[#2D3139] transition"
            >
                <ZoomIn size={16} />
            </button>
          </Tooltip>
          <Tooltip text="Reset Settings">
            <button
                onClick={() => {
                setBrightness(100);
                setContrast(100);
                setInvert(0);
                setSharpness(0);
                setKvp(80);
                setMas(20);
                setZoom(1);
                setPan({ x: 0, y: 0 });
                setRotation(0);
                setFlipH(false);
                setFlipV(false);
                }}
                className="p-2 rounded border bg-[#1A1C1E] border-[#2D3139] hover:bg-[#2D3139] transition text-gray-400"
            >
                <RotateCcw size={16} />
            </button>
          </Tooltip>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-black p-4 gap-4">
        {/* Left Panel: Reference */}
        <div className="flex-1 border border-[#2D3139] rounded-lg relative flex items-center justify-center p-4 bg-[#111317] overflow-hidden">
          <div className="absolute top-4 left-4 flex justify-between items-center w-[calc(100%-2rem)] z-10">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 drop-shadow-md">Reference Atlas</h2>
            <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded shadow-md">MODALITY: ANATOMICAL</span>
          </div>
          {currentImages?.reference ? (
            <img
              src={resolveUrl(currentImages.reference)}
              alt="Reference"
              className="max-h-full max-w-full object-contain pointer-events-none mt-8"
            />
          ) : (
            <div className="text-gray-600 flex flex-col items-center">
              <ImageIcon size={48} className="mb-2 opacity-20" />
              <p className="text-xs tracking-widest uppercase">No reference image</p>
            </div>
          )}
        </div>

        {/* Right Panel: X-Ray */}
        <div className="flex-1 border border-white/10 rounded-lg shadow-inner relative flex items-center justify-center p-4 bg-black overflow-hidden">
          <div className="absolute top-4 left-4 flex justify-between items-center w-[calc(100%-2rem)] z-10 pointer-events-none">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 drop-shadow-md">X-Ray Radiograph</h2>
            <div className="flex gap-2 items-center">
              <span className="text-[10px] text-gray-500 italic drop-shadow-md">Zoom: {Math.round(zoom * 100)}%</span>
              <span className="text-[10px] bg-blue-900/40 text-blue-400 px-2 py-0.5 rounded border border-blue-800/50 shadow-md">DICOM PREVIEW</span>
            </div>
          </div>
          {currentImages?.xray ? (
            <div
              className="w-full h-full flex items-center justify-center cursor-move mt-8"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <img
                src={resolveUrl(currentImages.xray)}
                alt="X-Ray"
                draggable={false}
                style={{
                  filter: filterStyle,
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                }}
                className="max-h-full max-w-full object-contain select-none"
              />
            </div>
          ) : (
            <div className="text-gray-600 flex flex-col items-center">
              <ImageIcon size={48} className="mb-2 opacity-20" />
              <p className="text-xs tracking-widest uppercase">No radiograph available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Tooltip({ children, text }: { children: React.ReactNode; text: string }) {
    return (
        <div className="group relative flex items-center">
            {children}
            <span className="absolute top-full lg:top-auto lg:bottom-full left-1/2 -translate-x-1/2 lg:-translate-y-2 translate-y-2 
                           px-2 py-1 bg-[#1A1C1E] border border-[#2D3139] text-[10px] uppercase font-bold tracking-widest text-gray-300 rounded opacity-0 group-hover:opacity-100 transition-opacity 
                           pointer-events-none whitespace-nowrap z-50 shadow-lg">
                {text}
            </span>
        </div>
    )
}
