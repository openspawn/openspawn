import { useRef, useCallback, type ReactNode } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "./button";
import { ScrollArea } from "./scroll-area";

interface SidePanelShellProps {
  children: ReactNode;
  title?: string;
  onClose: () => void;
  width: number;
  onWidthChange: (width: number) => void;
}

const MIN_WIDTH = 320;
const MAX_WIDTH = 800;

export function SidePanelShell({ children, title, onClose, width, onWidthChange }: SidePanelShellProps) {
  const isDragging = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      // Dragging left edge: moving left increases width
      const delta = startX - e.clientX;
      const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidth + delta));
      onWidthChange(newWidth);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, [width, onWidthChange]);

  return (
    <div className="h-full flex flex-col bg-background relative">
      {/* Drag handle on left edge */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/30 transition-colors z-10 group hidden md:block"
      >
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-muted-foreground" />
          ))}
        </div>
      </div>

      {/* Header */}
      {title && (
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold truncate">{title}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Content */}
      <ScrollArea className="flex-1">
        {children}
      </ScrollArea>
    </div>
  );
}
