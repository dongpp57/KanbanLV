"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TaskStatus } from "@/types";

interface AddTaskDialogProps {
    isOpen: boolean;
    status: TaskStatus | null;
    onClose: () => void;
    onSubmit: (title: string, status: TaskStatus) => void;
}

export function AddTaskDialog({ isOpen, status, onClose, onSubmit }: AddTaskDialogProps) {
    const [title, setTitle] = React.useState("");
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (isOpen) {
            setTitle("");
            // Auto-focus input after dialog opens
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !status) return;
        onSubmit(title.trim(), status);
        setTitle("");
        onClose();
    };

    const statusLabels: Record<TaskStatus, string> = {
        todo: "To Do",
        in_progress: "In Progress",
        done: "Done",
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Thêm công việc mới</DialogTitle>
                    <DialogDescription>
                        Thêm vào cột: <strong>{status ? statusLabels[status] : ""}</strong>
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="py-4">
                        <Input
                            ref={inputRef}
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Nhập tên công việc..."
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
                        <Button type="submit" disabled={!title.trim()}>Tạo</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default AddTaskDialog;
