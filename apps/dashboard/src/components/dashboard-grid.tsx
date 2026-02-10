import { useState, useCallback, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import { GripVertical, LayoutGrid, RotateCcw, Eye, EyeOff, ChevronDown } from "lucide-react";

// --- Types ---

export interface WidgetConfig {
  id: string;
  label: string;
  visible: boolean;
}

export interface DashboardLayout {
  widgets: WidgetConfig[];
}

const STORAGE_KEY = "bb-dashboard-layout";

export const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "stats-overview", label: "Stats Overview", visible: true },
  { id: "credit-flow-chart", label: "Credit Flow Chart", visible: true },
  { id: "tasks-by-status", label: "Tasks by Status", visible: true },
  { id: "available-agents", label: "Available Agents", visible: true },
  { id: "recent-activity", label: "Recent Activity", visible: true },
];

const PRESETS: Record<string, { label: string; description: string; widgets: string[] }> = {
  overview: {
    label: "Overview",
    description: "All widgets visible",
    widgets: ["stats-overview", "credit-flow-chart", "tasks-by-status", "available-agents", "recent-activity"],
  },
  operations: {
    label: "Operations",
    description: "Agents + Tasks focus",
    widgets: ["stats-overview", "tasks-by-status", "available-agents"],
  },
  finance: {
    label: "Finance",
    description: "Credits + Charts focus",
    widgets: ["stats-overview", "credit-flow-chart"],
  },
};

// --- Persistence ---

function loadLayout(): WidgetConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved: WidgetConfig[] = JSON.parse(raw);
      // Merge with defaults in case new widgets were added
      const savedIds = new Set(saved.map((w) => w.id));
      const merged = [
        ...saved,
        ...DEFAULT_WIDGETS.filter((w) => !savedIds.has(w.id)),
      ];
      return merged;
    }
  } catch {
    // ignore
  }
  return DEFAULT_WIDGETS.map((w) => ({ ...w }));
}

function saveLayout(widgets: WidgetConfig[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
}

// --- Hook ---

export function useDashboardLayout() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(loadLayout);
  const [editMode, setEditMode] = useState(false);

  const updateWidgets = useCallback((next: WidgetConfig[]) => {
    setWidgets(next);
    saveLayout(next);
  }, []);

  const toggleVisibility = useCallback(
    (id: string) => {
      updateWidgets(
        widgets.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w))
      );
    },
    [widgets, updateWidgets]
  );

  const reorder = useCallback(
    (activeId: string, overId: string) => {
      const oldIndex = widgets.findIndex((w) => w.id === activeId);
      const newIndex = widgets.findIndex((w) => w.id === overId);
      if (oldIndex !== -1 && newIndex !== -1) {
        updateWidgets(arrayMove(widgets, oldIndex, newIndex));
      }
    },
    [widgets, updateWidgets]
  );

  const applyPreset = useCallback(
    (presetKey: string) => {
      const preset = PRESETS[presetKey];
      if (!preset) return;
      const ordered = preset.widgets.map(
        (id) =>
          widgets.find((w) => w.id === id) || { id, label: id, visible: true }
      );
      const rest = widgets
        .filter((w) => !preset.widgets.includes(w.id))
        .map((w) => ({ ...w, visible: false }));
      updateWidgets([
        ...ordered.map((w) => ({ ...w, visible: true })),
        ...rest,
      ]);
    },
    [widgets, updateWidgets]
  );

  const resetLayout = useCallback(() => {
    updateWidgets(DEFAULT_WIDGETS.map((w) => ({ ...w })));
  }, [updateWidgets]);

  return {
    widgets,
    editMode,
    setEditMode,
    toggleVisibility,
    reorder,
    applyPreset,
    resetLayout,
    visibleWidgets: widgets.filter((w) => w.visible),
  };
}

// --- Sortable Widget Wrapper ---

function SortableWidget({
  id,
  editMode,
  children,
}: {
  id: string;
  editMode: boolean;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !editMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${
        isDragging ? "z-50 opacity-50" : ""
      } ${
        editMode
          ? "border-2 border-dashed border-cyan-500/30 rounded-xl p-1"
          : ""
      }`}
    >
      {editMode && (
        <button
          className="absolute top-3 right-3 z-10 p-1 rounded-md bg-card/80 backdrop-blur border border-border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}
      {children}
    </div>
  );
}

// --- Toolbar ---

export function DashboardToolbar({
  editMode,
  setEditMode,
  widgets,
  toggleVisibility,
  applyPreset,
  resetLayout,
}: {
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  widgets: WidgetConfig[];
  toggleVisibility: (id: string) => void;
  applyPreset: (key: string) => void;
  resetLayout: () => void;
}) {
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Edit mode toggle */}
      <button
        onClick={() => setEditMode(!editMode)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
          editMode
            ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400"
            : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"
        }`}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        {editMode ? "Done" : "Edit layout"}
      </button>

      {/* Widget picker */}
      <div className="relative">
        <button
          onClick={() => {
            setShowWidgetPicker(!showWidgetPicker);
            setShowPresets(false);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <Eye className="h-3.5 w-3.5" />
          Widgets
          <ChevronDown className="h-3 w-3" />
        </button>
        {showWidgetPicker && (
          <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-lg border border-border bg-card shadow-lg p-1">
            {widgets.map((w) => (
              <button
                key={w.id}
                onClick={() => toggleVisibility(w.id)}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
              >
                {w.visible ? (
                  <Eye className="h-3.5 w-3.5 text-cyan-500" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span className={w.visible ? "text-foreground" : "text-muted-foreground"}>
                  {w.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Preset picker */}
      <div className="relative">
        <button
          onClick={() => {
            setShowPresets(!showPresets);
            setShowWidgetPicker(false);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          Presets
          <ChevronDown className="h-3 w-3" />
        </button>
        {showPresets && (
          <div className="absolute right-0 top-full mt-1 z-50 w-52 rounded-lg border border-border bg-card shadow-lg p-1">
            {Object.entries(PRESETS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => {
                  applyPreset(key);
                  setShowPresets(false);
                }}
                className="flex flex-col items-start w-full px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
              >
                <span className="font-medium">{preset.label}</span>
                <span className="text-xs text-muted-foreground">{preset.description}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Reset */}
      <button
        onClick={resetLayout}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Reset
      </button>
    </div>
  );
}

// --- Grid Container ---

export function DashboardGrid({
  widgets,
  editMode,
  reorder,
  renderWidget,
}: {
  widgets: WidgetConfig[];
  editMode: boolean;
  reorder: (activeId: string, overId: string) => void;
  renderWidget: (id: string) => React.ReactNode;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const visibleWidgets = useMemo(
    () => widgets.filter((w) => w.visible),
    [widgets]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      if (over && active.id !== over.id) {
        reorder(String(active.id), String(over.id));
      }
    },
    [reorder]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={visibleWidgets.map((w) => w.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {visibleWidgets.map((widget) => (
              <motion.div
                key={widget.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <SortableWidget id={widget.id} editMode={editMode}>
                  {renderWidget(widget.id)}
                </SortableWidget>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </SortableContext>

      <DragOverlay>
        {activeId ? (
          <div className="opacity-90 shadow-2xl rounded-xl">
            {renderWidget(activeId)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
