import { useCallback, useRef, useEffect } from 'react';
import { useSplitViewStore } from '@/store/splitViewStore';
import { useBrowserStore } from '@/store/browserStore';
import { cn } from '@/lib/utils';
import { X, ArrowLeftRight, Maximize2 } from 'lucide-react';

export function SplitView() {
  const {
    enabled,
    orientation,
    leftTabId,
    rightTabId,
    dividerPosition,
    isDragging,
    swapPanes,
    setDividerPosition,
    setDragging,
  } = useSplitViewStore();
  
  const { tabs, setActiveTab } = useBrowserStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const leftTab = tabs.find(t => t.id === leftTabId);
  const rightTab = tabs.find(t => t.id === rightTabId);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current || !isDragging) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    let percentage: number;
    
    if (orientation === 'horizontal') {
      percentage = ((e.clientX - rect.left) / rect.width) * 100;
    } else {
      percentage = ((e.clientY - rect.top) / rect.height) * 100;
    }
    
    setDividerPosition(percentage);
  }, [isDragging, orientation, setDividerPosition]);

  const handleMouseUp = useCallback(() => {
    setDragging(false);
  }, [setDragging]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = orientation === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp, orientation]);

  const handleDividerMouseDown = () => {
    setDragging(true);
  };

  if (!enabled) return null;

  const isHorizontal = orientation === 'horizontal';

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex w-full h-full',
        isHorizontal ? 'flex-row' : 'flex-col'
      )}
    >
      {/* Left/Top Pane */}
      <div
        className="relative flex flex-col bg-[#0d1017] overflow-hidden"
        style={{
          [isHorizontal ? 'width' : 'height']: `${dividerPosition}%`,
        }}
      >
        {leftTab && (
          <>
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#161922] border-b border-white/[0.06]">
              <span className="text-[11px] text-white/60 truncate flex-1">
                {leftTab.title || leftTab.url}
              </span>
              <button
                onClick={() => {
                  setActiveTab(leftTab.id);
                }}
                className="p-1 hover:bg-white/[0.08] rounded text-white/40 hover:text-white/60 transition-colors"
              >
                <Maximize2 size={10} />
              </button>
            </div>
            <div className="flex-1" data-split-pane="left" data-tab-id={leftTab.id} />
          </>
        )}
      </div>

      {/* Divider */}
      <div
        onMouseDown={handleDividerMouseDown}
        className={cn(
          'flex items-center justify-center bg-[#0d1017] transition-colors',
          isHorizontal ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize',
          isDragging ? 'bg-cyan-500/50' : 'hover:bg-cyan-500/30'
        )}
      >
        <div
          className={cn(
            'rounded-full bg-white/20',
            isHorizontal ? 'w-1 h-8' : 'h-1 w-8'
          )}
        />
      </div>

      {/* Right/Bottom Pane */}
      <div
        className="relative flex flex-col bg-[#0d1017] overflow-hidden"
        style={{
          [isHorizontal ? 'width' : 'height']: `${100 - dividerPosition}%`,
        }}
      >
        {rightTab ? (
          <>
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#161922] border-b border-white/[0.06]">
              <span className="text-[11px] text-white/60 truncate flex-1">
                {rightTab.title || rightTab.url}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={swapPanes}
                  className="p-1 hover:bg-white/[0.08] rounded text-white/40 hover:text-white/60 transition-colors"
                  title="Swap panes"
                >
                  <ArrowLeftRight size={10} />
                </button>
                <button
                  onClick={() => {
                    setActiveTab(rightTab.id);
                  }}
                  className="p-1 hover:bg-white/[0.08] rounded text-white/40 hover:text-white/60 transition-colors"
                >
                  <Maximize2 size={10} />
                </button>
              </div>
            </div>
            <div className="flex-1" data-split-pane="right" data-tab-id={rightTab.id} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[12px] text-white/30">No tab selected</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function SplitViewControls() {
  const { enabled, orientation, disable, setOrientation, swapPanes } = useSplitViewStore();

  if (!enabled) return null;

  return (
    <div className="absolute top-2 right-2 z-30 flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg border border-white/10">
      <button
        onClick={() => setOrientation(orientation === 'horizontal' ? 'vertical' : 'horizontal')}
        className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white transition-colors"
        title={orientation === 'horizontal' ? 'Switch to vertical' : 'Switch to horizontal'}
      >
        <ArrowLeftRight size={12} />
      </button>
      <button
        onClick={swapPanes}
        className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white transition-colors"
        title="Swap panes"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      </button>
      <div className="w-px h-4 bg-white/20 mx-1" />
      <button
        onClick={disable}
        className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white transition-colors"
        title="Exit split view"
      >
        <X size={12} />
      </button>
    </div>
  );
}
