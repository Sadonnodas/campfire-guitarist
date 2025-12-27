import React, { useRef, useState } from 'react';
import { X, GripHorizontal, MoveDiagonal } from 'lucide-react';

const DraggableWindow = ({ config, children, onFocus, onUpdate, onClose }) => {
  const { x, y, w, h, z, title } = config;
  
  // Drag State
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Resize State
  const isResizing = useRef(false);
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

  // --- DRAG HANDLERS ---
  const handleMouseDown = (e) => {
    onFocus(); // Bring to front
    // Only drag if clicking header
    isDragging.current = true;
    dragOffset.current = { x: e.clientX - x, y: e.clientY - y };
    
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragUp);
  };

  const handleDragMove = (e) => {
    if (!isDragging.current) return;
    const newX = e.clientX - dragOffset.current.x;
    const newY = e.clientY - dragOffset.current.y;
    onUpdate({ x: newX, y: newY });
  };

  const handleDragUp = () => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragUp);
  };

  // --- RESIZE HANDLERS ---
  const handleResizeDown = (e) => {
    e.stopPropagation();
    onFocus();
    isResizing.current = true;
    resizeStart.current = { x: e.clientX, y: e.clientY, w, h };
    
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeUp);
  };

  const handleResizeMove = (e) => {
    if (!isResizing.current) return;
    const deltaX = e.clientX - resizeStart.current.x;
    const deltaY = e.clientY - resizeStart.current.y;
    
    onUpdate({ 
        w: Math.max(200, resizeStart.current.w + deltaX), 
        h: Math.max(150, resizeStart.current.h + deltaY) 
    });
  };

  const handleResizeUp = () => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeUp);
  };

  return (
    <div 
      className="absolute bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl flex flex-col overflow-hidden"
      style={{ 
        left: x, top: y, width: w, height: h, zIndex: z,
        boxShadow: '0 0 40px rgba(0,0,0,0.5)'
      }}
      onMouseDown={onFocus}
    >
      {/* Header */}
      <div 
        className="h-9 bg-white/5 border-b border-white/5 flex items-center justify-between px-3 cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2 text-slate-300">
            <GripHorizontal size={14} />
            <span className="text-xs font-bold uppercase tracking-wide">{title}</span>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-slate-500 hover:text-red-400">
            <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-2 relative">
         {children}
      </div>

      {/* Resize Handle */}
      <div 
        className="absolute bottom-0 right-0 w-6 h-6 flex items-center justify-center cursor-nwse-resize text-slate-600 hover:text-orange-500 transition-colors z-20"
        onMouseDown={handleResizeDown}
      >
        <MoveDiagonal size={14} />
      </div>
    </div>
  );
};

export default DraggableWindow;