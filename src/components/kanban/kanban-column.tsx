import * as React from "react";
import { TaskStatus } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Task } from "@/types";

interface KanbanColumnProps {
    id: TaskStatus;
    title: string;
    tasks: Task[];
    children?: React.ReactNode;
    onAdd?: (status: TaskStatus) => void;
}

// Fix #7 (rerender-memo): Memoize column to skip re-renders when props unchanged
export const KanbanColumn = React.memo(function KanbanColumn({ id, title, tasks, children, onAdd }: KanbanColumnProps) {
    const { setNodeRef } = useDroppable({
        id: id,
    });

    return (
        <div className="flex flex-col w-[280px] md:w-[350px] shrink-0 bg-neutral-100/50 dark:bg-neutral-900/50 rounded-xl h-full border snap-start">
            <div className="p-4 py-3 flex items-center justify-between border-b bg-background/50 rounded-t-xl">
                <h3 className="font-semibold">{title} <span className="text-muted-foreground ml-2 text-sm font-normal">{tasks.length}</span></h3>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => onAdd?.(id)}
                >
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">Add Task</span>
                </Button>
            </div>
            <ScrollArea className="flex-1 w-full rounded-b-xl">
                <div
                    ref={setNodeRef}
                    className="p-3 flex flex-col gap-3 min-h-[150px]"
                >
                    <SortableContext
                        id={id}
                        items={tasks.map(t => t.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {children}
                    </SortableContext>
                </div>
            </ScrollArea>
        </div>
    );
});
