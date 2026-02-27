import { PageHeader } from '../components/ui/page-header';
import { KanbanBoard } from '../components/kanban/KanbanBoard';

export function KanbanPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Kanban Board"
        description="Task board powered by the MCP coordination layer"
      />
      <KanbanBoard />
    </div>
  );
}

export default KanbanPage;
