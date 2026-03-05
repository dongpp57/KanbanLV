export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Attachment {
    id: string;
    task_id: string;
    file_name: string;
    file_url: string;
    file_type: string;
    file_size: number;
    created_at: string;
}

export interface Task {
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    position: number;
    tags: string[] | null;
    links: string[] | null;
    created_at: string;
    attachments?: Attachment[];
}
