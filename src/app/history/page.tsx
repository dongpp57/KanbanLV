"use client";

import * as React from "react";
import { Task } from "@/types";
import { fetchTasks } from "@/lib/supabase/tasks";
import { filterTasksBySearch } from "@/lib/search";
import { SearchBar } from "@/components/ui/search-bar";
import { TaskDetailModal } from "@/components/kanban/task-detail-modal";
import { updateTaskDetails, deleteTask } from "@/lib/supabase/tasks";
import { Loader2, CheckCircle2, Calendar, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function getWeekLabel(date: Date): string {
    // Get Monday of the week
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const fmt = (d: Date) =>
        `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;

    return `${fmt(monday)} – ${fmt(sunday)}/${sunday.getFullYear()}`;
}

function getWeekKey(date: Date): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split("T")[0];
}

interface WeekGroup {
    key: string;
    label: string;
    tasks: Task[];
}

function groupTasksByWeek(tasks: Task[]): WeekGroup[] {
    const groups: Record<string, WeekGroup> = {};

    for (const task of tasks) {
        const date = new Date(task.created_at);
        const key = getWeekKey(date);
        if (!groups[key]) {
            groups[key] = {
                key,
                label: getWeekLabel(date),
                tasks: [],
            };
        }
        groups[key].tasks.push(task);
    }

    // Sort by week descending (newest first)
    return Object.values(groups).sort((a, b) => b.key.localeCompare(a.key));
}

export default function HistoryPage() {
    const [tasks, setTasks] = React.useState<Task[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);

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

    const doneTasks = tasks.filter(t => t.status === "done");
    const filteredTasks = filterTasksBySearch(doneTasks, searchQuery);
    const weekGroups = groupTasksByWeek(filteredTasks);

    const handleUpdateTask = async (taskId: string, updates: { title?: string; description?: string; tags?: string[]; links?: string[] }) => {
        try {
            const updated = await updateTaskDetails(taskId, updates);
            setTasks(tasks.map(t => t.id === taskId ? { ...t, ...updated } : t));
        } catch (error) {
            console.error("Failed to update task", error);
            alert("Lỗi lưu tác vụ!");
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa tác vụ này?")) return;
        try {
            await deleteTask(taskId);
            setTasks(tasks.filter(t => t.id !== taskId));
            setSelectedTask(null);
        } catch (error) {
            console.error("Failed to delete task", error);
            alert("Lỗi xóa tác vụ!");
        }
    };

    if (loading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex-1 w-full p-4 md:p-6 overflow-auto">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <Link href="/">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                            Lịch sử công việc
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Các task đã hoàn thành, nhóm theo tuần.
                        </p>
                    </div>
                </div>

                {/* Search */}
                <div className="flex items-center gap-4 mb-6">
                    <SearchBar
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Tìm kiếm trong lịch sử..."
                    />
                    {searchQuery && (
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                            {filteredTasks.length} kết quả
                        </span>
                    )}
                </div>

                {/* Content */}
                {doneTasks.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-medium">Chưa có task nào hoàn thành</p>
                        <p className="text-sm mt-1">Kéo task vào cột &quot;Done&quot; trên bảng Kanban để bắt đầu.</p>
                    </div>
                ) : filteredTasks.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                        <p className="text-lg font-medium">Không tìm thấy kết quả</p>
                        <p className="text-sm mt-1">Thử từ khóa khác.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {weekGroups.map(group => (
                            <div key={group.key}>
                                <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                        Tuần {group.label}
                                    </h2>
                                    <Badge variant="secondary" className="ml-auto text-xs">
                                        {group.tasks.length} task
                                    </Badge>
                                </div>
                                <div className="space-y-2">
                                    {group.tasks.map(task => (
                                        <button
                                            key={task.id}
                                            onClick={() => setSelectedTask(task)}
                                            className="w-full text-left p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">{task.title}</p>
                                                    {task.description && (
                                                        <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                                                            {task.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <span className="text-xs text-muted-foreground whitespace-nowrap mt-0.5">
                                                    {new Date(task.created_at).toLocaleDateString("vi-VN")}
                                                </span>
                                            </div>
                                            {task.tags && task.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {task.tags.map(tag => (
                                                        <Badge key={tag} variant="outline" className="text-xs">
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <TaskDetailModal
                task={selectedTask}
                isOpen={!!selectedTask}
                onClose={() => setSelectedTask(null)}
                onSave={handleUpdateTask}
                onDelete={handleDeleteTask}
                onAttachmentChange={(taskId, attachments) => {
                    setTasks(tasks.map(t => t.id === taskId ? { ...t, attachments } : t));
                }}
            />
        </div>
    );
}
