import type { LearningModule } from '../types';
import { sqlModule } from './sql';

const CUSTOM_MODULES_KEY = 'plato-learn-custom-modules';

/**
 * Registry of all available built-in learning modules
 * Add new modules here to make them available in the app
 */
export const builtInModules: LearningModule[] = [
    sqlModule,
    // Add more modules here:
    // testingModule,
    // gitModule,
    // etc.
];

/**
 * Get custom modules from localStorage
 */
export function getCustomModules(): LearningModule[] {
    try {
        const stored = localStorage.getItem(CUSTOM_MODULES_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (err) {
        console.error('Failed to load custom modules:', err);
    }
    return [];
}

/**
 * Save a custom module to localStorage
 */
export function saveCustomModule(module: LearningModule): void {
    const customModules = getCustomModules();
    const existingIndex = customModules.findIndex(m => m.id === module.id);

    if (existingIndex >= 0) {
        customModules[existingIndex] = module;
    } else {
        customModules.push(module);
    }

    localStorage.setItem(CUSTOM_MODULES_KEY, JSON.stringify(customModules));
}

/**
 * Delete a custom module from localStorage
 */
export function deleteCustomModule(moduleId: string): void {
    const customModules = getCustomModules().filter(m => m.id !== moduleId);
    localStorage.setItem(CUSTOM_MODULES_KEY, JSON.stringify(customModules));
}

/**
 * Get a module by its ID (searches both built-in and custom)
 */
export function getModuleById(id: string): LearningModule | undefined {
    return builtInModules.find(m => m.id === id) ||
        getCustomModules().find(m => m.id === id);
}

/**
 * Get all available modules (built-in + custom)
 */
export function getAllModules(): LearningModule[] {
    return [...builtInModules, ...getCustomModules()];
}

// Legacy export for backwards compatibility
export const modules = builtInModules;
