import { KanbanBoard } from "@/components/kanban/kanban-board";

export default function Home() {
  return (
    <div className="flex-1 w-full p-3 md:p-4 overflow-hidden flex flex-col">
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Your Tasks</h1>
        <p className="text-muted-foreground text-sm">Manage your personal tasks efficiently.</p>
      </div>
      <div className="flex-1 overflow-auto">
        <KanbanBoard />
      </div>
    </div>
  );
}
