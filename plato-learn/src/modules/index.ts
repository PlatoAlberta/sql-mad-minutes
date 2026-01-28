import type { LearningModule } from '../types';
import { sqlModule } from './sql';

/**
 * Registry of all available learning modules
 * Add new modules here to make them available in the app
 */
export const modules: LearningModule[] = [
    sqlModule,
    // Add more modules here:
    // testingModule,
    // gitModule,
    // etc.
];

/**
 * Get a module by its ID
 */
export function getModuleById(id: string): LearningModule | undefined {
    return modules.find(m => m.id === id);
}

/**
 * Get all available modules
 */
export function getAllModules(): LearningModule[] {
    return modules;
}
