import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

interface SidePanelState {
  isOpen: boolean;
  content: ReactNode | null;
  width: number;
  title?: string;
}

interface SidePanelContextValue {
  openSidePanel: (content: ReactNode, options?: { width?: number; title?: string }) => void;
  closeSidePanel: () => void;
  isOpen: boolean;
  content: ReactNode | null;
  width: number;
  title?: string;
  setWidth: (width: number) => void;
}

const SidePanelContext = createContext<SidePanelContextValue | null>(null);

const DEFAULT_WIDTH = 480;

export function SidePanelProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SidePanelState>({
    isOpen: false,
    content: null,
    width: DEFAULT_WIDTH,
    title: undefined,
  });

  const openSidePanel = useCallback((content: ReactNode, options?: { width?: number; title?: string }) => {
    setState({
      isOpen: true,
      content,
      width: options?.width ?? DEFAULT_WIDTH,
      title: options?.title,
    });
  }, []);

  const closeSidePanel = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false, content: null, title: undefined }));
  }, []);

  const setWidth = useCallback((width: number) => {
    setState(prev => ({ ...prev, width }));
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && state.isOpen) {
        closeSidePanel();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [state.isOpen, closeSidePanel]);

  return (
    <SidePanelContext.Provider value={{
      openSidePanel,
      closeSidePanel,
      isOpen: state.isOpen,
      content: state.content,
      width: state.width,
      title: state.title,
      setWidth,
    }}>
      {children}
    </SidePanelContext.Provider>
  );
}

export function useSidePanel() {
  const ctx = useContext(SidePanelContext);
  if (!ctx) throw new Error("useSidePanel must be used within SidePanelProvider");
  return ctx;
}
