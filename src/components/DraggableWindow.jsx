import React, { useRef } from 'react';
import { X, GripHorizontal, MoveDiagonal } from 'lucide-react';

const DraggableWindow = ({ config, children, onMouseDown, onUpdate, onClose, isSelected }) => {
  const { x, y, w, h, z, title } = config;
  
  // Drag State
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Resize State
  const isResizing = useRef(false);
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

  // --- DRAG HANDLERS ---
  const handleMouseDown = (e) => {
    // Notify Parent (Selects window)
    onMouseDown(e); 
    
    isDragging.current = true;
    dragOffset.current = { x: e.clientX - x, y: e.clientY - y };
    
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragUp);
  };

  const handleDragMove = (e) => {
    if (!isDragging.current) return;
    // Calculate new raw position
    const newX = e.clientX - dragOffset.current.x;
    const newY = e.clientY - dragOffset.current.y;
    
    // Send to parent. Parent handles "Delta" calculation for groups.
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
    onMouseDown(e); // Select window on resize start
    
    isResizing.current = true;
    resizeStart.current = { x: e.clientX, y: e.clientY, w, h };
    
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeUp);
  };

  const handleResizeMove = (e) => {
    if (!isResizing.current) return;
    const deltaX = e.clientX - resizeStart.current.x;
    const deltaY = e.clientY - resizeStart.current.y;
    
    // Parent handles group scaling
    onUpdate({ 
        w: Math.max(200, resizeStart.current.w + deltaX), 
        h: Math.max(120, resizeStart.current.h + deltaY) 
    });
  };

  const handleResizeUp = () => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeUp);
  };

  return (
    <div 
      className={`absolute bg-slate-900/90 backdrop-blur-xl border rounded-lg shadow-2xl flex flex-col overflow-hidden transition-colors duration-200
        ${isSelected ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'border-white/10'}
      `}
      style={{ 
        left: x, top: y, width: w, height: h, zIndex: z,
      }}
      onMouseDown={onMouseDown} // Clicking body also selects
    >
      {/* Header */}
      <div 
        className={`h-9 border-b flex items-center justify-between px-3 cursor-grab active:cursor-grabbing select-none
            ${isSelected ? 'bg-blue-500/20 border-blue-500/30' : 'bg-white/5 border-white/5'}
        `}
        onMouseDown={handleMouseDown}
      >
        <div className={`flex items-center gap-2 ${isSelected ? 'text-blue-200' : 'text-slate-300'}`}>
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
        className={`absolute bottom-0 right-0 w-6 h-6 flex items-center justify-center cursor-nwse-resize transition-colors z-20 
            ${isSelected ? 'text-blue-500 hover:text-white' : 'text-slate-600 hover:text-orange-500'}
        `}
        onMouseDown={handleResizeDown}
      >
        <MoveDiagonal size={14} />
      </div>
    </div>
  );
};

export default DraggableWindow;