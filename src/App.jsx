import React, { useState, useRef, useEffect } from 'react';
import { Flame, PlusCircle, RotateCcw } from 'lucide-react';
import { RhythmProvider } from './context/RhythmContext';

import ChordGenerator from './components/ChordGenerator'; 
import RhythmFooter from './components/RhythmFooter'; 
import RhythmStaff from './components/RhythmStaff';
import StrumPattern from './components/StrumPattern';
import RhythmCount from './components/RhythmCount';
import DraggableWindow from './components/DraggableWindow';

export default function App() {
  // --- WINDOW STATE ---
  const [windows, setWindows] = useState({
    chords: { id: 'chords', title: 'Chord Generator', x: 350, y: 40,  w: 600, h: 220, z: 1, visible: true },
    strum:  { id: 'strum',  title: 'Strum Pattern',   x: 350, y: 270, w: 600, h: 180, z: 2, visible: true },
    staff:  { id: 'staff',  title: 'Notation',        x: 350, y: 460, w: 600, h: 180, z: 3, visible: true },
    count:  { id: 'count',  title: 'Rhythm Count',    x: 970, y: 40,  w: 400, h: 120, z: 4, visible: true }, 
  });
  
  const [topZ, setTopZ] = useState(4); 
  const [selectedIds, setSelectedIds] = useState([]); // Array of currently selected window IDs
  const [selectionBox, setSelectionBox] = useState(null); // { x, y, w, h } or null

  const dragStartPos = useRef(null);

  // --- SELECTION LOGIC ---
  
  const handleBgMouseDown = (e) => {
    // Only start selection if clicking directly on background
    if (e.target !== e.currentTarget) return;
    
    // Clear selection if not holding Shift (standard behavior)
    if (!e.shiftKey) setSelectedIds([]);
    
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    setSelectionBox({ x: e.clientX, y: e.clientY, w: 0, h: 0 });
  };

  const handleBgMouseMove = (e) => {
    if (!dragStartPos.current) return;
    
    const currentX = e.clientX;
    const currentY = e.clientY;
    
    // Calculate box geometry (handles dragging in any direction)
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

    // Calculate intersections
    const newSelected = [];
    Object.values(windows).forEach(win => {
        if (!win.visible) return;
        // Check overlap
        const winRight = win.x + win.w;
        const winBottom = win.y + win.h;
        const boxRight = selectionBox.x + selectionBox.w;
        const boxBottom = selectionBox.y + selectionBox.h;

        const isOverlapping = !(win.x > boxRight || winRight < selectionBox.x || win.y > boxBottom || winBottom < selectionBox.y);
        
        if (isOverlapping) newSelected.push(win.id);
    });

    // Merge with existing if shift held, otherwise replace
    setSelectedIds(prev => [...new Set([...prev, ...newSelected])]);
    
    setSelectionBox(null);
    dragStartPos.current = null;
  };

  // --- WINDOW MANIPULATION ---

  const bringToFront = (id) => {
    setWindows(prev => ({ ...prev, [id]: { ...prev[id], z: topZ + 1 } }));
    setTopZ(z => z + 1);
  };

  const handleWindowClick = (id, e) => {
    // If clicking a window that isn't selected, select it (and deselect others unless shift)
    if (!selectedIds.includes(id)) {
        if (e.shiftKey) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds([id]);
        }
    }
    bringToFront(id);
  };

  const updateWindow = (id, newProps) => {
    setWindows(prev => {
        const targetWin = prev[id];
        const newWindows = { ...prev };

        // Calculate Delta (Difference from old state)
        // We only care about X/Y/W/H deltas
        const dx = newProps.x !== undefined ? newProps.x - targetWin.x : 0;
        const dy = newProps.y !== undefined ? newProps.y - targetWin.y : 0;
        const dw = newProps.w !== undefined ? newProps.w - targetWin.w : 0;
        const dh = newProps.h !== undefined ? newProps.h - targetWin.h : 0;

        // If the window being moved/resized is part of the selection group, apply to ALL selected
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
            // Just update single window
            newWindows[id] = { ...newWindows[id], ...newProps };
        }
        return newWindows;
    });
  };

  const toggleVisibility = (id) => {
    setWindows(prev => ({ ...prev, [id]: { ...prev[id], visible: !prev[id].visible } }));
  };

  const resetLayout = () => {
    setWindows({
        chords: { id: 'chords', title: 'Chord Generator', x: 350, y: 40,  w: 600, h: 220, z: topZ + 1, visible: true },
        strum:  { id: 'strum',  title: 'Strum Pattern',   x: 350, y: 270, w: 600, h: 180, z: topZ + 2, visible: true },
        staff:  { id: 'staff',  title: 'Notation',        x: 350, y: 460, w: 600, h: 180, z: topZ + 3, visible: true },
        count:  { id: 'count',  title: 'Rhythm Count',    x: 970, y: 40,  w: 400, h: 120, z: topZ + 4, visible: true },
    });
    setTopZ(prev => prev + 4);
    setSelectedIds([]);
  };

  const renderContent = (id) => {
    switch(id) {
        case 'chords': return <ChordGenerator />;
        case 'staff': return <RhythmStaff />;
        case 'strum': return <StrumPattern />;
        case 'count': return <RhythmCount />; 
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
                Campfire <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-600">OS</span>
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

        {/* --- Desktop Area (Selection Zone) --- */}
        <div 
            className="absolute top-16 bottom-24 left-0 right-0 overflow-hidden"
            onMouseDown={handleBgMouseDown}
            onMouseMove={handleBgMouseMove}
            onMouseUp={handleBgMouseUp}
        >
            {/* Selection Box Visual */}
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