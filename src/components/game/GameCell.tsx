
import React from "react";

interface GameCellProps {
  letter: string;
  rowIndex: number;
  colIndex: number;
  isSelected: boolean;
  isHintHighlighted: boolean;
  isPermanentlyMarked: boolean;
  wordColor?: string;
  cellSize: number;
  onCellStart: (row: number, col: number) => void;
  onCellMove: (row: number, col: number) => void;
  onCellEnd: () => void;
  isDragging: boolean;
  isMobile?: boolean;
}

const GameCell = ({
  letter,
  rowIndex,
  colIndex,
  isSelected,
  isHintHighlighted,
  isPermanentlyMarked,
  wordColor,
  cellSize,
  onCellStart,
  onCellMove,
  onCellEnd,
  isDragging,
  isMobile = false,
}: GameCellProps) => {
  // ✅ PROTEÇÃO ANTI-ZOOM ESPECÍFICA PARA CÉLULAS
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // ✅ EDGE DETECTION INTELIGENTE - Coordenadas relativas da célula
    const touch = e.touches[0];
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const relativeX = touch.clientX - rect.left;
    const relativeY = touch.clientY - rect.top;
    
    // Bloquear se o toque estiver nas extremidades da célula (primeiros/últimos 20% da célula)
    const edgeThreshold = cellSize * 0.2;
    if (relativeX < edgeThreshold || relativeX > cellSize - edgeThreshold ||
        relativeY < edgeThreshold || relativeY > cellSize - edgeThreshold) {
      console.log('🚫 Touch bloqueado na extremidade da célula');
      return;
    }
    
    // ✅ EDGE DETECTION GLOBAL - Coordenadas da tela
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const globalEdgeThreshold = 30; // 30px das bordas da tela
    
    if (touch.clientX < globalEdgeThreshold || 
        touch.clientX > screenWidth - globalEdgeThreshold ||
        touch.clientY < globalEdgeThreshold || 
        touch.clientY > screenHeight - globalEdgeThreshold) {
      console.log('🚫 Touch bloqueado na extremidade global');
      return;
    }
    
    onCellStart(rowIndex, colIndex);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const touch = e.touches[0];
    if (!touch) return;
    
    // ✅ EDGE DETECTION NO MOVIMENTO
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const globalEdgeThreshold = 30;
    
    if (touch.clientX < globalEdgeThreshold || 
        touch.clientX > screenWidth - globalEdgeThreshold ||
        touch.clientY < globalEdgeThreshold || 
        touch.clientY > screenHeight - globalEdgeThreshold) {
      console.log('🚫 Touch move bloqueado na extremidade');
      return;
    }
    
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!element) return;
    
    const cellAttr = element.closest("[data-cell]");
    if (cellAttr) {
      const row = parseInt(cellAttr.getAttribute("data-row") || "0");
      const col = parseInt(cellAttr.getAttribute("data-col") || "0");
      onCellMove(row, col);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onCellEnd();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    onCellStart(rowIndex, colIndex);
  };

  const handleMouseEnter = () => {
    if (isDragging) {
      onCellMove(rowIndex, colIndex);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();
    onCellEnd();
  };

  // ✅ HIERARQUIA VISUAL GAMIFICADA SEM SCALE - USANDO EFEITOS ALTERNATIVOS
  const getCellClasses = () => {
    const baseClasses = "flex items-center justify-center font-bold relative transition-all duration-300 select-none cursor-pointer safe-interactive no-tap-highlight game-cell";
    
    if (isHintHighlighted) {
      return `${baseClasses} bg-gradient-to-br from-purple-400 to-purple-600 text-white shadow-lg shadow-purple-500/50 animate-pulse hover-glow`;
    }
    
    if (isPermanentlyMarked && wordColor) {
      return `${baseClasses} ${wordColor} text-white shadow-lg animate-bounce-in hover-glow`;
    }
    
    if (isSelected) {
      return `${baseClasses} bg-gradient-to-br from-yellow-300 to-yellow-400 text-gray-800 shadow-lg shadow-yellow-500/50 animate-pulse hover-glow`;
    }
    
    // Estado normal com efeitos alternativos
    return `${baseClasses} bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800 hover:from-gray-100 hover:to-gray-200 shadow-md hover-shadow active-dim`;
  };

  const fontSize = isMobile
    ? Math.max(cellSize * 0.65, 17)
    : Math.max(cellSize * 0.75, 19);

  const borderRadius = isMobile ? "8px" : "10px";

  // Efeito de partículas para célula encontrada
  const showParticleEffect = isPermanentlyMarked && wordColor;

  return (
    <div
      className={getCellClasses()}
      style={{
        width: `${cellSize}px`,
        height: `${cellSize}px`,
        fontSize: `${fontSize}px`,
        borderRadius,
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
        touchAction: "manipulation", // ✅ BLOQUEIO ANTI-ZOOM ESPECÍFICO
        WebkitTextSizeAdjust: "none", // ✅ PREVENÇÃO DE ZOOM ADICIONAL
        padding: 0,
        margin: 0,
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      data-cell="true"
      data-row={rowIndex}
      data-col={colIndex}
    >
      {/* Letra principal */}
      <span className="relative z-10 font-bold tracking-tight">
        {letter}
      </span>
      
      {/* Efeito de brilho para dica */}
      {isHintHighlighted && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-300/50 to-transparent rounded-lg animate-pulse" />
      )}
      
      {/* Efeito de celebração para palavra encontrada */}
      {showParticleEffect && (
        <>
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping" />
          <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent rounded-lg" />
        </>
      )}
      
      {/* Borda brilhante para seleção */}
      {isSelected && (
        <div className="absolute inset-0 rounded-lg shadow-lg shadow-yellow-400/30 animate-pulse" />
      )}
    </div>
  );
};

export default GameCell;
