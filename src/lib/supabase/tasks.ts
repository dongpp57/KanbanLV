import { supabase } from "./client";
import { Task, TaskStatus } from "@/types";

export async function fetchTasks(): Promise<Task[]> {
    const { data, error } = await supabase
        .from("tasks")
        .select("*, attachments(*)")
        .order("position", { ascending: true });

    if (error) throw error;
    return data as Task[];
}

export async function createTask(title: string, column: TaskStatus = "todo", position: number = 0): Promise<Task> {
    const { data, error } = await supabase
        .from("tasks")
        .insert([{ title, status: column, position }])
        .select("*, attachments(*)")
        .single();

    if (error) throw error;
    return data as Task;
}

export async function updateTaskStatus(id: string, status: TaskStatus, newPosition: number) {
    const { data, error } = await supabase
        .from("tasks")
        .update({ status, position: newPosition })
        .eq("id", id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteTask(id: string) {
    const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id);

    if (error) throw error;
    return true;
}

export async function updateTaskDetails(
    id: string,
    updates: { title?: string; description?: string; tags?: string[]; links?: string[] }
) {
    const { data, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    if (error) throw error;
    return data as Task;
}

export async function uploadTaskAttachment(taskId: string, file: File) {
    const fileExt = file.name.split('.').pop() || '';
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const fileName = `${taskId}/${Date.now()}_${safeName}`;

    // 1. Upload to Storage
    const { error: uploadError } = await supabase.storage
        .from('task_attachments')
        .upload(fileName, file);

    if (uploadError) throw uploadError;

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
        .from('task_attachments')
        .getPublicUrl(fileName);

    // 3. Insert Database Record
    const { data, error: dbError } = await supabase.from('attachments').insert({
        task_id: taskId,
        file_name: file.name,
        file_url: publicUrl,
        file_type: fileExt,
        file_size: file.size
    }).select().single();

    if (dbError) throw dbError;
    return data;
}

export async function deleteTaskAttachment(attachmentId: string, fileUrl: string) {
    // extract fileName from URL
    const urlParts = fileUrl.split('/task_attachments/');
    if (urlParts.length > 1) {
        const path = urlParts[1];
        await supabase.storage.from('task_attachments').remove([path]);
    }

    const { error } = await supabase.from('attachments').delete().eq('id', attachmentId);
    if (error) throw error;
    return true;
}

