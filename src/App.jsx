import React, { useState } from 'react';
import { Flame, PlusCircle, RotateCcw } from 'lucide-react';
import { RhythmProvider } from './context/RhythmContext';

import ChordGenerator from './components/ChordGenerator'; 
import RhythmFooter from './components/RhythmFooter'; 
import RhythmStaff from './components/RhythmStaff';
import StrumPattern from './components/StrumPattern';
import DraggableWindow from './components/DraggableWindow';

export default function App() {
  // --- WINDOW MANAGEMENT STATE ---
  // Layout Logic:
  // 1. Chords: y=40,  h=220 (Taller to fix squashing)
  // 2. Strum:  y=270, h=180 (40 + 220 + 10px gap)
  // 3. Staff:  y=460, h=180 (270 + 180 + 10px gap)
  const [windows, setWindows] = useState({
    chords: { id: 'chords', title: 'Chord Generator', x: 350, y: 40,  w: 600, h: 220, z: 1, visible: true },
    strum:  { id: 'strum',  title: 'Strum Pattern',   x: 350, y: 270, w: 600, h: 180, z: 2, visible: true },
    staff:  { id: 'staff',  title: 'Notation',        x: 350, y: 460, w: 600, h: 180, z: 3, visible: true },
  });
  
  const [topZ, setTopZ] = useState(3); 

  const bringToFront = (id) => {
    setWindows(prev => ({
        ...prev,
        [id]: { ...prev[id], z: topZ + 1 }
    }));
    setTopZ(z => z + 1);
  };

  const updateWindow = (id, newProps) => {
    setWindows(prev => ({
        ...prev,
        [id]: { ...prev[id], ...newProps }
    }));
  };

  const toggleVisibility = (id) => {
    setWindows(prev => ({
        ...prev,
        [id]: { ...prev[id], visible: !prev[id].visible }
    }));
  };

  const resetLayout = () => {
    setWindows({
        chords: { id: 'chords', title: 'Chord Generator', x: 350, y: 40,  w: 600, h: 220, z: topZ + 1, visible: true },
        strum:  { id: 'strum',  title: 'Strum Pattern',   x: 350, y: 270, w: 600, h: 180, z: topZ + 2, visible: true },
        staff:  { id: 'staff',  title: 'Notation',        x: 350, y: 460, w: 600, h: 180, z: topZ + 3, visible: true },
    });
    setTopZ(prev => prev + 3);
  };

  const renderContent = (id) => {
    switch(id) {
        case 'chords': return <ChordGenerator />;
        case 'staff': return <RhythmStaff />;
        case 'strum': return <StrumPattern />;
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

        {/* --- Desktop Area (Windows) --- */}
        <div className="absolute top-16 bottom-24 left-0 right-0 overflow-hidden">
            {Object.values(windows).map(win => (
                win.visible && (
                    <DraggableWindow
                        key={win.id}
                        config={win}
                        onFocus={() => bringToFront(win.id)}
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