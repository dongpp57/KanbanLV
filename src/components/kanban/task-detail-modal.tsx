import * as React from "react";
import { Task, Attachment } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, X, Plus, Paperclip, Download, Upload } from "lucide-react";
import { uploadTaskAttachment, deleteTaskAttachment } from "@/lib/supabase/tasks";

interface TaskDetailModalProps {
    task: Task | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (taskId: string, updates: { title?: string; description?: string; tags?: string[]; links?: string[] }) => Promise<void>;
    onDelete: (taskId: string) => Promise<void>;
    onAttachmentChange?: (taskId: string, attachments: Attachment[]) => void;
}

export function TaskDetailModal({ task, isOpen, onClose, onSave, onDelete, onAttachmentChange }: TaskDetailModalProps) {
    const [title, setTitle] = React.useState("");
    const [description, setDescription] = React.useState("");
    const [tags, setTags] = React.useState<string[]>([]);
    const [links, setLinks] = React.useState<string[]>([]);
    const [attachments, setAttachments] = React.useState<Attachment[]>([]);

    const [newTag, setNewTag] = React.useState("");
    const [newLink, setNewLink] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [uploading, setUploading] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDescription(task.description || "");
            setTags(task.tags || []);
            setLinks(task.links || []);
            setAttachments(task.attachments || []);
        }
    }, [task]);

    if (!task) return null;

    const handleSave = async () => {
        setLoading(true);
        await onSave(task.id, { title, description, tags, links });
        setLoading(false);
        onClose();
    };

    const handleDelete = async () => {
        setLoading(true);
        await onDelete(task.id);
        setLoading(false);
        onClose();
    };

    const handleAddTag = () => {
        if (newTag.trim() && !tags.includes(newTag.trim())) {
            setTags([...tags, newTag.trim()]);
            setNewTag("");
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const handleAddLink = () => {
        if (newLink.trim() && !links.includes(newLink.trim())) {
            setLinks([...links, newLink.trim()]);
            setNewLink("");
        }
    };

    const handleRemoveLink = (linkToRemove: string) => {
        setLinks(links.filter(l => l !== linkToRemove));
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validation
        if (file.size > 5 * 1024 * 1024) {
            alert("File quá lớn! Kích thước tối đa là 5MB.");
            return;
        }

        const validExtensions = ['pdf', 'doc', 'docx', 'md'];
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        if (!fileExt || !validExtensions.includes(fileExt)) {
            alert(`Đuôi file không hỗ trợ. Hãy chọn file .${validExtensions.join(', .')}`);
            return;
        }

        try {
            setUploading(true);
            const newAttachment = await uploadTaskAttachment(task.id, file);
            const updatedAttachments = [...attachments, newAttachment];
            setAttachments(updatedAttachments);
            onAttachmentChange?.(task.id, updatedAttachments);
        } catch (error) {
            console.error("Lỗi upload file", error);
            alert("Không thể upload file do Supabase đang lỗi cấu hình bảo mật hoặc bucket. Hãy thử lại sau.");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleRemoveAttachment = async (attachment: Attachment) => {
        if (!window.confirm(`Xoá file ${attachment.file_name}?`)) return;
        try {
            setUploading(true);
            await deleteTaskAttachment(attachment.id, attachment.file_url);
            const updatedAttachments = attachments.filter(a => a.id !== attachment.id);
            setAttachments(updatedAttachments);
            onAttachmentChange?.(task.id, updatedAttachments);
        } catch (error) {
            console.error("Lỗi xoá file", error);
            alert("Gặp lỗi khi xóa file trên Supabase.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Task</DialogTitle>
                    <DialogDescription>
                        Cập nhật thông tin chi tiết công việc.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium leading-none">Title</h4>
                        <Input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Enter task title"
                            disabled={loading || uploading}
                        />
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium leading-none">Description</h4>
                        <Textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Add more details about this task..."
                            className="resize-none"
                            rows={3}
                            disabled={loading || uploading}
                        />
                    </div>

                    {/* Attachments Section */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium leading-none flex items-center gap-1">
                                <Paperclip className="h-4 w-4" /> Attachments
                            </h4>
                            <input
                                type="file"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept=".pdf,.doc,.docx,.md"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={loading || uploading}
                                className="h-7 text-xs"
                            >
                                {uploading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
                                Upload File
                            </Button>
                        </div>
                        {attachments.length > 0 && (
                            <div className="space-y-1 mt-2">
                                {attachments.map(att => (
                                    <div key={att.id} className="flex items-center justify-between p-2 rounded border bg-card text-sm">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <span className="font-medium truncate">{att.file_name}</span>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">({Math.round(att.file_size / 1024)} KB)</span>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <a href={att.file_url} target="_blank" rel="noopener noreferrer">
                                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6">
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </a>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-destructive hover:text-destructive/90"
                                                onClick={() => handleRemoveAttachment(att)}
                                                disabled={uploading}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {attachments.length === 0 && (
                            <p className="text-xs text-muted-foreground italic">Chưa có file nào đính kèm.</p>
                        )}
                    </div>

                    {/* Tags Section */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium leading-none">Tags</h4>
                        <div className="flex items-center gap-2">
                            <Input
                                value={newTag}
                                onChange={e => setNewTag(e.target.value)}
                                placeholder="Add a tag..."
                                disabled={loading || uploading}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddTag();
                                    }
                                }}
                            />
                            <Button type="button" size="icon" variant="secondary" onClick={handleAddTag} disabled={loading || uploading || !newTag.trim()}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {tags.map(tag => (
                                    <Badge key={tag} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1">
                                        {tag}
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-4 w-4 rounded-full hover:bg-muted"
                                            onClick={() => handleRemoveTag(tag)}
                                            disabled={loading || uploading}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Links Section */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium leading-none">Links</h4>
                        <div className="flex items-center gap-2">
                            <Input
                                value={newLink}
                                onChange={e => setNewLink(e.target.value)}
                                placeholder="Add a URL link..."
                                disabled={loading || uploading}
                                type="url"
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddLink();
                                    }
                                }}
                            />
                            <Button type="button" size="icon" variant="secondary" onClick={handleAddLink} disabled={loading || uploading || !newLink.trim()}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        {links.length > 0 && (
                            <ul className="mt-2 space-y-1">
                                {links.map(link => (
                                    <li key={link} className="flex items-center justify-between text-sm bg-muted/50 px-2 py-1.5 rounded-md">
                                        <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate max-w-[450px]">
                                            {link}
                                        </a>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 rounded-md hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() => handleRemoveLink(link)}
                                            disabled={loading || uploading}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                </div>
                <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
                    <Button variant="destructive" size="icon" onClick={handleDelete} disabled={loading || uploading} title="Delete Task">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose} disabled={loading || uploading}>Cancel</Button>
                        <Button onClick={handleSave} disabled={loading || uploading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default TaskDetailModal;
