import React, { useState, useRef } from 'react';
import { Flame, PlusCircle, RotateCcw } from 'lucide-react';
import { RhythmProvider } from './context/RhythmContext';

import ChordGenerator from './components/ChordGenerator'; 
import RhythmFooter from './components/RhythmFooter'; 
import RhythmStaff from './components/RhythmStaff';
import StrumPattern from './components/StrumPattern';
import RhythmCount from './components/RhythmCount';
import PatternBrowser from './components/PatternBrowser'; // Import New Component
import DraggableWindow from './components/DraggableWindow';

// --- 1. MASTER LAYOUT CONFIGURATION ---
const DEFAULT_WINDOW_CONFIG = {
  chords:  { id: 'chords',  title: 'Chord Generator', x: 150, y: 40,  w: 600, h: 220, visible: true },
  browser: { id: 'browser', title: 'Pattern Library', x: 150, y: 280, w: 600, h: 300, visible: true }, // New Window
  count:   { id: 'count',   title: 'Rhythm Count',    x: 770, y: 40,  w: 600, h: 180, visible: true },
  strum:   { id: 'strum',   title: 'Strum Pattern',   x: 770, y: 220, w: 600, h: 180, visible: true },
  staff:   { id: 'staff',   title: 'Notation',        x: 770, y: 400, w: 600, h: 180, visible: true },
};

// --- SNAPPING ENGINE (No changes needed here) ---
const calculateSnap = (activeId, currentRect, partialUpdate, allWindows) => {
    const SNAP = 15; 
    let { x, y, w, h } = { ...currentRect, ...partialUpdate };
    
    const isMoving = partialUpdate.x !== undefined || partialUpdate.y !== undefined;
    const isResizing = partialUpdate.w !== undefined || partialUpdate.h !== undefined;

    const others = Object.values(allWindows).filter(win => win.id !== activeId && win.visible);

    if (isMoving) {
        for (const other of others) {
            if (Math.abs(x - (other.x + other.w)) < SNAP) x = other.x + other.w;
            if (Math.abs((x + w) - other.x) < SNAP) x = other.x - w;
            if (Math.abs(x - other.x) < SNAP) x = other.x;
            if (Math.abs((x + w) - (other.x + other.w)) < SNAP) x = (other.x + other.w) - w;

            if (Math.abs(y - (other.y + other.h)) < SNAP) y = other.y + other.h;
            if (Math.abs((y + h) - other.y) < SNAP) y = other.y - h;
            if (Math.abs(y - other.y) < SNAP) y = other.y;
            if (Math.abs((y + h) - (other.y + other.h)) < SNAP) y = (other.y + other.h) - h;
        }
    }

    if (isResizing) {
        if (partialUpdate.w !== undefined) {
             for (const other of others) {
                 if (Math.abs((x + w) - other.x) < SNAP) w = other.x - x;
                 if (Math.abs((x + w) - (other.x + other.w)) < SNAP) w = (other.x + other.w) - x;
                 if (Math.abs(w - other.w) < SNAP) w = other.w;
             }
        }
        
        if (partialUpdate.h !== undefined) {
             for (const other of others) {
                 if (Math.abs((y + h) - other.y) < SNAP) h = other.y - y;
                 if (Math.abs((y + h) - (other.y + other.h)) < SNAP) h = (other.y + other.h) - y;
                 if (Math.abs(h - other.h) < SNAP) h = other.h;
             }
        }
    }

    const result = {};
    if (partialUpdate.x !== undefined) result.x = x;
    if (partialUpdate.y !== undefined) result.y = y;
    if (partialUpdate.w !== undefined) result.w = w;
    if (partialUpdate.h !== undefined) result.h = h;
    
    return result;
};

export default function App() {
  const [windows, setWindows] = useState(() => {
    const initialstate = {};
    let z = 1;
    Object.keys(DEFAULT_WINDOW_CONFIG).forEach(key => {
        initialstate[key] = { ...DEFAULT_WINDOW_CONFIG[key], z: z++ };
    });
    return initialstate;
  });
  
  const [topZ, setTopZ] = useState(10); 
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectionBox, setSelectionBox] = useState(null);

  const dragStartPos = useRef(null);

  // --- SELECTION LOGIC (Unchanged) ---
  const handleBgMouseDown = (e) => {
    if (e.target !== e.currentTarget) return;
    if (!e.shiftKey) setSelectedIds([]);
    
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    setSelectionBox({ x: e.clientX, y: e.clientY, w: 0, h: 0 });
  };

  const handleBgMouseMove = (e) => {
    if (!dragStartPos.current) return;
    const currentX = e.clientX;
    const currentY = e.clientY;
    
    const x = Math.min(currentX, dragStartPos.current.x);
    const y = Math.min(currentY, dragStartPos.current.y);
    const w = Math.abs(currentX - dragStartPos.current.x);
    const h = Math.abs(currentY - dragStartPos.current.y);
    
    setSelectionBox({ x, y, w, h });
  };

  const handleBgMouseUp = () => {
    if (!dragStartPos.current || !selectionBox) {
        dragStartPos.current = null;
        return;
    }

    const newSelected = [];
    Object.values(windows).forEach(win => {
        if (!win.visible) return;
        const winRight = win.x + win.w;
        const winBottom = win.y + win.h;
        const boxRight = selectionBox.x + selectionBox.w;
        const boxBottom = selectionBox.y + selectionBox.h;

        const isOverlapping = !(win.x > boxRight || winRight < selectionBox.x || win.y > boxBottom || winBottom < selectionBox.y);
        
        if (isOverlapping) newSelected.push(win.id);
    });

    setSelectedIds(prev => [...new Set([...prev, ...newSelected])]);
    setSelectionBox(null);
    dragStartPos.current = null;
  };

  const bringToFront = (id) => {
    setWindows(prev => ({ ...prev, [id]: { ...prev[id], z: topZ + 1 } }));
    setTopZ(z => z + 1);
  };

  const handleWindowClick = (id, e) => {
    if (!selectedIds.includes(id)) {
        if (e.shiftKey) setSelectedIds(prev => [...prev, id]);
        else setSelectedIds([id]);
    }
    bringToFront(id);
  };

  const updateWindow = (id, rawProps) => {
    setWindows(prev => {
        const targetWin = prev[id];
        const snappedProps = calculateSnap(id, targetWin, rawProps, prev);

        const newWindows = { ...prev };
        const dx = snappedProps.x !== undefined ? snappedProps.x - targetWin.x : 0;
        const dy = snappedProps.y !== undefined ? snappedProps.y - targetWin.y : 0;
        const dw = snappedProps.w !== undefined ? snappedProps.w - targetWin.w : 0;
        const dh = snappedProps.h !== undefined ? snappedProps.h - targetWin.h : 0;

        if (selectedIds.includes(id)) {
            selectedIds.forEach(selId => {
                if (newWindows[selId]) {
                    newWindows[selId] = {
                        ...newWindows[selId],
                        x: newWindows[selId].x + dx,
                        y: newWindows[selId].y + dy,
                        w: Math.max(200, newWindows[selId].w + dw),
                        h: Math.max(120, newWindows[selId].h + dh)
                    };
                }
            });
        } else {
            newWindows[id] = { ...newWindows[id], ...snappedProps };
        }
        return newWindows;
    });
  };

  const toggleVisibility = (id) => {
    setWindows(prev => ({ ...prev, [id]: { ...prev[id], visible: !prev[id].visible } }));
  };

  const resetLayout = () => {
    let currentZ = topZ;
    const resetState = {};
    Object.keys(DEFAULT_WINDOW_CONFIG).forEach(key => {
        currentZ++;
        resetState[key] = { ...DEFAULT_WINDOW_CONFIG[key], z: currentZ };
    });
    setWindows(resetState);
    setTopZ(currentZ);
    setSelectedIds([]);
  };

  const renderContent = (id) => {
    switch(id) {
        case 'chords':  return <ChordGenerator />;
        case 'staff':   return <RhythmStaff />;
        case 'strum':   return <StrumPattern />;
        case 'count':   return <RhythmCount />; 
        case 'browser': return <PatternBrowser />; // Render new component
        default: return null;
    }
  };

  return (
    <RhythmProvider>
      <div className="h-screen w-screen bg-slate-950 overflow-hidden relative selection:bg-none">
        
        {/* --- Top Bar --- */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-slate-900/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-6 z-50">
           <div className="flex items-center gap-3 select-none">
              <Flame className="text-orange-500 animate-pulse-slow" size={24} fill="currentColor"/>
              <h1 className="text-xl font-black italic text-white tracking-tight">
                Campfire <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-600">Guitarist</span>
              </h1>
           </div>
           
           <div className="flex items-center gap-2">
              {Object.values(windows).map(win => (
                !win.visible && (
                    <button key={win.id} onClick={() => toggleVisibility(win.id)}
                        className="flex items-center gap-1 px-3 py-1 text-xs font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded transition-colors">
                        <PlusCircle size={12} /> {win.title}
                    </button>
                )
              ))}
              <button onClick={resetLayout} className="p-2 text-slate-500 hover:text-white transition-colors" title="Reset Layout">
                <RotateCcw size={16}/>
              </button>
           </div>
        </div>

        {/* --- Desktop Area --- */}
        <div 
            className="absolute top-16 bottom-24 left-0 right-0 overflow-hidden"
            onMouseDown={handleBgMouseDown}
            onMouseMove={handleBgMouseMove}
            onMouseUp={handleBgMouseUp}
        >
            {selectionBox && (
                <div 
                    className="absolute bg-orange-500/20 border border-orange-500/50 z-[9999] pointer-events-none"
                    style={{
                        left: selectionBox.x,
                        top: selectionBox.y,
                        width: selectionBox.w,
                        height: selectionBox.h
                    }}
                />
            )}

            {Object.values(windows).map(win => (
                win.visible && (
                    <DraggableWindow
                        key={win.id}
                        config={win}
                        isSelected={selectedIds.includes(win.id)}
                        onMouseDown={(e) => handleWindowClick(win.id, e)}
                        onUpdate={(props) => updateWindow(win.id, props)}
                        onClose={() => toggleVisibility(win.id)}
                    >
                        {renderContent(win.id)}
                    </DraggableWindow>
                )
            ))}
        </div>

        {/* --- Footer --- */}
        <RhythmFooter />

      </div>
    </RhythmProvider>
  );
}