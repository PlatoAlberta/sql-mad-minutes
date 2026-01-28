import type { QuestionData } from '../types';

/**
 * Cache for loaded module data
 */
const moduleCache = new Map<string, QuestionData>();

/**
 * Load questions for a module from its JSON file
 * @param modulePath - Path to the questions.json file (relative to public/)
 */
export async function loadModuleQuestions(modulePath: string): Promise<QuestionData> {
    // Check cache first
    if (moduleCache.has(modulePath)) {
        return moduleCache.get(modulePath)!;
    }

    try {
        const response = await fetch(modulePath);
        if (!response.ok) {
            throw new Error(`Failed to load module: ${response.statusText}`);
        }
        const data: QuestionData = await response.json();

        // Cache the result
        moduleCache.set(modulePath, data);

        return data;
    } catch (error) {
        console.error(`Failed to load module from ${modulePath}:`, error);
        throw error;
    }
}

/**
 * Clear the module cache (useful for development)
 */
export function clearModuleCache(): void {
    moduleCache.clear();
}
