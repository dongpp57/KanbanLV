import * as React from "react";
import { Task } from "@/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Paperclip, Link as LinkIcon, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

interface TaskCardProps {
    task: Task;
    onClick?: (task: Task) => void;
}

// Fix #5 (rerender-memo-with-default-value): Hoist default non-primitive prop
const NOOP = () => { };

// Fix #2 (rerender-memo): Wrap with React.memo to skip re-renders when props unchanged
export const TaskCard = React.memo(function TaskCard({ task, onClick = NOOP }: TaskCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: task.id,
        data: {
            type: "Task",
            task,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const hasAttachments = task.attachments && task.attachments.length > 0;
    const hasLinks = task.links && task.links.length > 0;
    const hasTags = task.tags && task.tags.length > 0;

    return (
        <Card
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={cn(
                "cursor-grab hover:border-primary/50 transition-colors shadow-sm relative group touch-none",
                isDragging && "opacity-50 border-primary ring-2 ring-primary ring-offset-2 z-50",
            )}
        >
            <div
                className="absolute inset-0 z-10"
                onClick={() => onClick(task)}
                aria-label="View task details"
            />
            <CardHeader className="p-3 pb-0 space-y-1 relative z-0">
                {/* Fix #6 (rendering-conditional-render): Use ternary instead of && */}
                {hasTags ? (
                    <div className="flex flex-wrap gap-1 mb-1">
                        {task.tags!.map((tag) => (
                            <Badge key={tag} variant="secondary" className="px-1.5 py-0 text-[10px] font-medium">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                ) : null}
                <div className="font-medium text-sm leading-snug break-words">
                    {task.title}
                </div>
            </CardHeader>
            <CardContent className="p-3 pt-2 text-xs text-muted-foreground flex flex-col gap-2 relative z-0">
                {task.description ? (
                    <p className="line-clamp-2 text-[13px]">
                        {task.description}
                    </p>
                ) : null}
                <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-3">
                        {hasAttachments ? (
                            <div className="flex items-center gap-1" title={`${task.attachments!.length} attachments`}>
                                <Paperclip className="h-3.5 w-3.5" />
                                <span className="text-[11px]">{task.attachments!.length}</span>
                            </div>
                        ) : null}
                        {hasLinks ? (
                            <div className="flex items-center gap-1" title={`${task.links!.length} links`}>
                                <LinkIcon className="h-3.5 w-3.5" />
                                <span className="text-[11px]">{task.links!.length}</span>
                            </div>
                        ) : null}
                    </div>
                    <div className="flex items-center gap-1" title="Created date">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="text-[11px]">{format(new Date(task.created_at), "MMM d")}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
});
