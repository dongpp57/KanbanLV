"use client";

import * as React from "react";
import { KanbanColumn } from "./kanban-column";
import { TaskCard } from "./task-card";
import { Task, TaskStatus, Attachment } from "@/types";
import { fetchTasks, createTask, updateTaskDetails, deleteTask, updateTaskStatus } from "@/lib/supabase/tasks";
import { Loader2 } from "lucide-react";
import { SearchBar } from "@/components/ui/search-bar";
import { filterTasksBySearch } from "@/lib/search";

import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { createPortal } from "react-dom";

// Fix #4 (bundle-dynamic-imports): Lazy load heavy dialog components
import dynamic from "next/dynamic";
const TaskDetailModal = dynamic(() => import("./task-detail-modal"), { ssr: false });
const AddTaskDialog = dynamic(() => import("./add-task-dialog"), { ssr: false });

export function KanbanBoard() {
    const [tasks, setTasks] = React.useState<Task[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
    const [activeTask, setActiveTask] = React.useState<Task | null>(null);
    const [mounted, setMounted] = React.useState(false);
    const [addTaskStatus, setAddTaskStatus] = React.useState<TaskStatus | null>(null);
    const [searchQuery, setSearchQuery] = React.useState("");

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    React.useEffect(() => {
        async function loadTasks() {
            try {
                const data = await fetchTasks();
                setTasks(data || []);
            } catch (error: any) {
                console.error("Failed to load tasks:", error.message || error);
            } finally {
                setLoading(false);
            }
        }
        loadTasks();
    }, []);

    // Fix #1 (rerender-functional-setstate): All callbacks use functional setState
    // and are wrapped in useCallback for stable references

    const handleTaskClick = React.useCallback((task: Task) => {
        setSelectedTask(task);
    }, []);

    const handleCloseModal = React.useCallback(() => {
        setSelectedTask(null);
    }, []);

    const openAddDialog = React.useCallback((status: TaskStatus) => {
        setAddTaskStatus(status);
    }, []);

    const closeAddDialog = React.useCallback(() => {
        setAddTaskStatus(null);
    }, []);

    const submitAddTask = React.useCallback(async (title: string, status: TaskStatus) => {
        try {
            // Read current tasks via functional update to get position
            let newPos = 0;
            setTasks(prev => {
                const columnTasks = prev.filter(t => t.status === status);
                newPos = columnTasks.length > 0 ? Math.max(...columnTasks.map(t => t.position)) + 1 : 0;
                return prev; // No change yet, just reading
            });
            const newTask = await createTask(title, status, newPos);
            setTasks(prev => [...prev, newTask]);
        } catch (error: any) {
            console.error("Failed to create task", error);
            alert(`Lỗi tạo tác vụ: ${error.message || JSON.stringify(error)}`);
        }
    }, []);

    const handleUpdateTask = React.useCallback(async (taskId: string, updates: { title?: string; description?: string; tags?: string[]; links?: string[] }) => {
        try {
            const updated = await updateTaskDetails(taskId, updates);
            // Fix #1: functional setState avoids stale closure
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updated } : t));
        } catch (error) {
            console.error("Failed to update task", error);
            alert("Lỗi lưu tác vụ!");
        }
    }, []);

    const handleDeleteTask = React.useCallback(async (taskId: string) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa tác vụ này?")) return;
        try {
            await deleteTask(taskId);
            setTasks(prev => prev.filter(t => t.id !== taskId));
            setSelectedTask(null);
        } catch (error) {
            console.error("Failed to delete task", error);
            alert("Lỗi xóa tác vụ!");
        }
    }, []);

    // Fix #1: stable callback for attachment changes
    const handleAttachmentChange = React.useCallback((taskId: string, attachments: Attachment[]) => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, attachments } : t));
    }, []);

    const onDragStart = React.useCallback((event: DragStartEvent) => {
        const { active } = event;
        setTasks(prev => {
            const task = prev.find(t => t.id === active.id);
            if (task) setActiveTask(task);
            return prev;
        });
    }, []);

    const onDragOver = React.useCallback((event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const isActiveTask = active.data.current?.type === "Task";
        const isOverTask = over.data.current?.type === "Task";

        if (!isActiveTask) return;

        if (isActiveTask && isOverTask) {
            setTasks((prev) => {
                const activeIndex = prev.findIndex((t) => t.id === activeId);
                const overIndex = prev.findIndex((t) => t.id === overId);

                if (prev[activeIndex].status !== prev[overIndex].status) {
                    const newTasks = [...prev];
                    newTasks[activeIndex] = {
                        ...newTasks[activeIndex],
                        status: newTasks[overIndex].status,
                    };
                    return arrayMove(newTasks, activeIndex, overIndex);
                }

                return arrayMove(prev, activeIndex, overIndex);
            });
        }

        const isOverColumn = over.data.current?.type === "Column" || ["todo", "in_progress", "done"].includes(over.id as string);

        if (isActiveTask && isOverColumn) {
            setTasks((prev) => {
                const activeIndex = prev.findIndex((t) => t.id === activeId);
                const newTasks = [...prev];
                newTasks[activeIndex] = {
                    ...newTasks[activeIndex],
                    status: overId as TaskStatus,
                };
                return arrayMove(newTasks, activeIndex, activeIndex);
            });
        }
    }, []);

    const onDragEnd = React.useCallback(async (event: DragEndEvent) => {
        setActiveTask(null);
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;

        // Use functional read to avoid stale closure
        setTasks(prev => {
            const activeTaskObj = prev.find(t => t.id === activeId);
            if (activeTaskObj) {
                const activeColumnTasks = prev.filter(t => t.status === activeTaskObj.status);
                const newPosition = activeColumnTasks.findIndex(t => t.id === activeId);
                // Fire-and-forget API call
                updateTaskStatus(activeId as string, activeTaskObj.status, newPosition).catch(error => {
                    console.error("Failed to update task sequence", error);
                    alert("Lỗi lưu vị trí tác vụ lên máy chủ!");
                });
            }
            return prev; // No state change needed
        });
    }, []);

    // Fix #3 (js-combine-iterations): Single loop instead of 4 .filter() calls
    // MUST be before early return to comply with Rules of Hooks
    const { todoTasks, progressTasks, doneTasks, totalFiltered } = React.useMemo(() => {
        const filtered = filterTasksBySearch(tasks, searchQuery);
        const todo: Task[] = [];
        const progress: Task[] = [];
        const done: Task[] = [];

        for (const t of filtered) {
            if (t.status === "todo") todo.push(t);
            else if (t.status === "in_progress") progress.push(t);
            else done.push(t);
        }

        return { todoTasks: todo, progressTasks: progress, doneTasks: done, totalFiltered: filtered.length };
    }, [tasks, searchQuery]);

    if (loading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 md:gap-4 h-full">
            <div className="flex items-center gap-2 md:gap-4">
                <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Tìm kiếm task..."
                />
                {searchQuery ? (
                    <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">
                        {totalFiltered} kết quả
                    </span>
                ) : null}
            </div>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
            >
                <div className="flex h-full items-start gap-3 md:gap-6 overflow-x-auto pb-4 snap-x snap-mandatory md:snap-none">
                    <KanbanColumn id="todo" title="To Do" tasks={todoTasks} onAdd={openAddDialog}>
                        {todoTasks.map(task => (
                            <TaskCard key={task.id} task={task} onClick={handleTaskClick} />
                        ))}
                    </KanbanColumn>

                    <KanbanColumn id="in_progress" title="In Progress" tasks={progressTasks} onAdd={openAddDialog}>
                        {progressTasks.map(task => (
                            <TaskCard key={task.id} task={task} onClick={handleTaskClick} />
                        ))}
                    </KanbanColumn>

                    <KanbanColumn id="done" title="Done" tasks={doneTasks} onAdd={openAddDialog}>
                        {doneTasks.map(task => (
                            <TaskCard key={task.id} task={task} onClick={handleTaskClick} />
                        ))}
                    </KanbanColumn>
                </div>

                {mounted ? createPortal(
                    <DragOverlay>
                        {activeTask ? (
                            <TaskCard task={activeTask} />
                        ) : null}
                    </DragOverlay>,
                    document.body
                ) : null}

                <AddTaskDialog
                    isOpen={!!addTaskStatus}
                    status={addTaskStatus}
                    onClose={closeAddDialog}
                    onSubmit={submitAddTask}
                />

                <TaskDetailModal
                    task={selectedTask}
                    isOpen={!!selectedTask}
                    onClose={handleCloseModal}
                    onSave={handleUpdateTask}
                    onDelete={handleDeleteTask}
                    onAttachmentChange={handleAttachmentChange}
                />
            </DndContext>
        </div>
    );
}
