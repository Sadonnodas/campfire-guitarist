import React, { useState, useRef } from 'react';
import { GripHorizontal, ChevronDown, ChevronUp, X, MoveDiagonal, MoveVertical } from 'lucide-react';

const DraggableWidget = ({ 
  title, children, onDragStart, onDragOver, onDrop, 
  isHidden, onClose, colSpan, rowSpan, onUpdateSize 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const widgetRef = useRef(null);
  
  // Refs for drag calculations
  const startPosRef = useRef({ x: 0, y: 0 });
  const startSizeRef = useRef({ col: 1, row: 1 });

  if (isHidden) return null;

  // -- Resize Logic (Generic) --
  const handleResizeStart = (e, mode) => {
    e.preventDefault();
    e.stopPropagation();
    
    startPosRef.current = { x: e.clientX, y: e.clientY };
    startSizeRef.current = { col: colSpan || 1, row: rowSpan || 1 };

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startPosRef.current.x;
      const deltaY = moveEvent.clientY - startPosRef.current.y;
      
      const thresholdX = 150; // Pixels to trigger column jump
      const thresholdY = 100; // Pixels to trigger row jump

      let newCol = startSizeRef.current.col;
      let newRow = startSizeRef.current.row;

      if (mode === 'both' || mode === 'width') {
        if (deltaX > thresholdX) newCol = Math.min(3, startSizeRef.current.col + 1);
        else if (deltaX < -thresholdX) newCol = Math.max(1, startSizeRef.current.col - 1);
      }

      if (mode === 'both' || mode === 'height') {
        if (deltaY > thresholdY) newRow = Math.min(3, startSizeRef.current.row + 1);
        else if (deltaY < -thresholdY) newRow = Math.max(1, startSizeRef.current.row - 1);
      }

      if (newCol !== colSpan || newRow !== rowSpan) {
         onUpdateSize({ col: newCol, row: newRow });
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // -- Grid Classes --
  // We use inline styles for grid-row/col span to be more dynamic if needed, 
  // but Tailwind classes work if we stick to strict 1-3 range.
  const colClass = colSpan === 2 ? 'md:col-span-2' : colSpan === 3 ? 'md:col-span-3' : 'md:col-span-1';
  const rowClass = rowSpan === 2 ? 'row-span-2' : rowSpan === 3 ? 'row-span-3' : 'row-span-1';

  return (
    <div 
      ref={widgetRef}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`${colClass} ${rowClass} relative bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-xl shadow-xl overflow-hidden flex flex-col transition-all duration-200 hover:border-white/20 group h-full`}
    >
      {/* Widget Header */}
      <div className="bg-white/5 p-3 flex items-center justify-between border-b border-white/5 cursor-move active:cursor-grabbing">
        <div className="flex items-center gap-3">
          <GripHorizontal className="text-slate-600 group-hover:text-slate-400 transition-colors" size={18} />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors">
            {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
          {onClose && (
            <button onClick={onClose} className="p-1 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400 transition-colors">
                <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Widget Content */}
      {!isCollapsed && (
        <div className="p-4 flex-1 overflow-auto">
          {children}
        </div>
      )}

      {/* Resize Handle: Bottom (Height) */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize hover:bg-white/5 flex items-center justify-center transition-colors z-20 group/vresize"
        onMouseDown={(e) => handleResizeStart(e, 'height')}
      >
        <MoveVertical size={10} className="text-transparent group-hover/vresize:text-orange-400" />
      </div>

      {/* Resize Handle: Corner (Both/Width) */}
      <div 
        className="absolute bottom-0 right-0 p-1 cursor-nwse-resize hover:bg-white/10 rounded-tl-lg transition-colors z-30 group/resize"
        onMouseDown={(e) => handleResizeStart(e, 'width')}
      >
        <MoveDiagonal size={14} className="text-slate-600 group-hover/resize:text-orange-400" />
      </div>
    </div>
  );
};

export default DraggableWidget;