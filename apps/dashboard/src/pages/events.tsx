import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Info,
  Filter,
} from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { EmptyState } from "../components/ui/empty-state";
import { PageHeader } from "../components/ui/page-header";
import { StatCard } from "../components/ui/stat-card";
import { useEvents } from "../hooks/use-events";
import { useState, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

function getSeverityIcon(severity: string) {
  switch (severity.toUpperCase()) {
    case "ERROR":
    case "CRITICAL":
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case "WARNING":
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case "INFO":
      return <Info className="h-4 w-4 text-blue-500" />;
    case "SUCCESS":
      return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    default:
      return <Activity className="h-4 w-4 text-muted-foreground" />;
  }
}

function getSeverityVariant(severity: string) {
  switch (severity.toUpperCase()) {
    case "ERROR":
    case "CRITICAL":
      return "destructive";
    case "WARNING":
      return "warning";
    case "INFO":
      return "info";
    case "SUCCESS":
      return "success";
    default:
      return "secondary";
  }
}

function formatTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function EventVirtualList({ filteredEvents }: { filteredEvents: ReturnType<typeof useEvents>["events"] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: filteredEvents.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
    measureElement: (element) => element.getBoundingClientRect().height,
  });

  if (filteredEvents.length === 0) {
    return (
      <EmptyState
        variant="events"
        title="No events recorded"
        description="Events appear as agents work. Start a simulation or assign tasks to generate activity."
        compact
      />
    );
  }

  return (
    <div ref={parentRef} className="h-[calc(100vh-400px)] overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}>
        <AnimatePresence mode="popLayout">
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const event = filteredEvents[virtualRow.index];
            return (
              <motion.div
                key={event.id}
                ref={virtualizer.measureElement}
                data-index={virtualRow.index}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10, height: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                  delay: virtualRow.index < 10 ? virtualRow.index * 0.02 : 0,
                }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className="flex items-start gap-4 p-4 hover:bg-accent/50 transition-colors border-b border-border"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", delay: 0.1 }}
                  className="mt-0.5"
                >
                  {getSeverityIcon(event.severity)}
                </motion.div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={getSeverityVariant(event.severity)}>
                      {event.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(event.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm">
                    <span className="font-medium">{event.actor?.name || "System"}</span>
                    {" "}
                    <span className="text-muted-foreground">
                      {event.entityType} → {event.entityId.slice(0, 8)}...
                    </span>
                  </p>
                  {event.reasoning && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      "{event.reasoning}"
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function EventsPage() {
  const { events, loading, error } = useEvents();
  const [filter, setFilter] = useState<string>("all");

  // Normalize filter for comparison (GraphQL uses uppercase)
  const normalizedFilter = filter.toUpperCase();
  const filteredEvents =
    filter === "all" ? events : events.filter((e) => e.severity === normalizedFilter);

  const severityCounts = {
    critical: events.filter((e) => e.severity === "ERROR").length,
    warning: events.filter((e) => e.severity === "WARNING").length,
    info: events.filter((e) => e.severity === "INFO").length,
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading events...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-destructive">Error loading events</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <PageHeader
        title="Events"
        description="System events and audit log"
        actions={
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total Events" value={events.length} icon={Activity} />
        <StatCard title="Critical" value={severityCounts.critical} icon={AlertCircle} />
        <StatCard title="Warnings" value={severityCounts.warning} icon={AlertTriangle} />
        <StatCard title="Info" value={severityCounts.info} icon={Info} />
      </div>

      {/* Events list */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="error" className="text-red-500">
            Critical
          </TabsTrigger>
          <TabsTrigger value="warning" className="text-amber-500">
            Warnings
          </TabsTrigger>
          <TabsTrigger value="info" className="text-blue-500">
            Info
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-4">
          <Card>
            <EventVirtualList filteredEvents={filteredEvents} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
