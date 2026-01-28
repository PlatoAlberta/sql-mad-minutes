import type { LearningModule } from '../../types';

/**
 * SQL Module Configuration
 * Teaches SQL fundamentals through interactive exercises
 * 
 * Skill tree structure:
 *               [R1 Basics]
 *                    |
 *          +---------+---------+
 *          |                   |
 *     [R2 Aggregates]    [R3 JOINs]
 *          |                   |
 *          +---------+---------+
 *                    |
 *             [R4 Subqueries]  (requires both R2 AND R3)
 *                    |
 *          +---------+---------+
 *          |                   |
 *   [R5 Window Fns]     [R6 CTEs]
 *          |                   |
 *          +---------+---------+
 *                    |
 *              [R7 Mastery]   (requires R5 AND R6)
 */
export const sqlModule: LearningModule = {
    id: 'sql',
    name: 'SQL Fundamentals',
    description: 'Master database queries from SELECT to advanced CTEs',
    icon: 'SQL',
    color: '#0059E8',
    questionsPath: '/modules/sql/questions.json',
    rounds: [
        // Row 0: Root node
        {
            id: 'r1',
            name: 'SQL Basics',
            description: 'Core SELECT, WHERE, and ORDER BY fundamentals',
            questions: [],
            prerequisites: [], // No prereqs = root node
            row: 0,
            col: 0,
        },
        // Row 1: Branch into two paths
        {
            id: 'r2',
            name: 'Aggregates & Grouping',
            description: 'COUNT, SUM, AVG, GROUP BY, and HAVING',
            questions: [],
            prerequisites: ['r1'],
            row: 1,
            col: 0,
        },
        {
            id: 'r3',
            name: 'JOINs',
            description: 'Combining data from multiple tables',
            questions: [],
            prerequisites: ['r1'],
            row: 1,
            col: 1,
        },
        // Row 2: Converge - requires BOTH branches
        {
            id: 'r4',
            name: 'Subqueries',
            description: 'Nested SELECT statements and correlated subqueries',
            questions: [],
            prerequisites: ['r2', 'r3'], // Must complete BOTH to unlock
            row: 2,
            col: 0,
        },
        // Row 3: Branch again
        {
            id: 'r5',
            name: 'Window Functions',
            description: 'ROW_NUMBER, RANK, LEAD, LAG, and PARTITION BY',
            questions: [],
            prerequisites: ['r4'],
            row: 3,
            col: 0,
        },
        {
            id: 'r6',
            name: 'CTEs & Advanced',
            description: 'WITH clauses, CASE statements, COALESCE',
            questions: [],
            prerequisites: ['r4'],
            row: 3,
            col: 1,
        },
        // Row 4: Final mastery - requires both advanced paths
        {
            id: 'r7',
            name: 'SQL Mastery',
            description: 'Complex queries combining all techniques',
            questions: [],
            prerequisites: ['r5', 'r6'], // Must complete BOTH advanced paths
            row: 4,
            col: 0,
        },
    ],
};
