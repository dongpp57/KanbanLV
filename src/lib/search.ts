import { Task } from "@/types";

/**
 * Filter tasks by search query.
 * Priority: title first, then description.
 * Returns tasks where the query matches the title or description (case-insensitive).
 */
export function filterTasksBySearch(tasks: Task[], query: string): Task[] {
    if (!query.trim()) return tasks;

    const normalizedQuery = query.toLowerCase().trim();

    // Separate into title matches and description-only matches
    const titleMatches: Task[] = [];
    const descriptionMatches: Task[] = [];

    for (const task of tasks) {
        const titleMatch = task.title.toLowerCase().includes(normalizedQuery);
        const descMatch = task.description?.toLowerCase().includes(normalizedQuery);

        if (titleMatch) {
            titleMatches.push(task);
        } else if (descMatch) {
            descriptionMatches.push(task);
        }
    }

    // Title matches first, then description matches
    return [...titleMatches, ...descriptionMatches];
}
