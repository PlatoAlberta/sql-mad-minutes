import type { QuestionType } from '../../types';

export const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#14b8a6', '#6366f1'];

export const ICONS = ['📊', '💻', '🔧', '📈', '🎯', '⚡', '🚀', '📚', '🧪', '🔐', '🌐', '🎮'];

export const CATEGORIES = [
    { value: 'engineering', label: 'Engineering' },
    { value: 'qa', label: 'QA & Testing' },
    { value: 'data', label: 'Data Science' },
    { value: 'design', label: 'Design' },
    { value: 'compliance', label: 'Compliance' },
    { value: 'other', label: 'Other' }
];

export const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
    { value: 'fill-blank', label: 'Fill in the Blank' },
    { value: 'multiple-choice', label: 'Multiple Choice' },
    { value: 'code-ordering', label: 'Code Ordering' },
    { value: 'drag-drop', label: 'Drag & Drop' },
    { value: 'type-in', label: 'Type Answer' },
    { value: 'playground', label: 'Playground (Sandbox)' },
    { value: 'info', label: 'Info Block' },
    { value: 'video', label: 'Video Clip' },
    { value: 'freeform-sql', label: 'Freeform SQL' },
    { value: 'spot-error', label: 'Spot Type Error' },
    { value: 'error-fix', label: 'Bug Fix Challenge' },
    { value: 'word-problem', label: 'Word Problem' }
];

interface Template {
    type: 'question' | 'round'; // What kind of object this creates
    templateType?: QuestionType; // Only for questions
    label: string;
    icon: string;
    description: string;
    // Defaults for the new object
    defaultGoal?: string;
    defaultQ?: string;
    defaultRoundType?: 'lesson' | 'test'; // Only for rounds
}

export const TEMPLATES: Template[] = [
    // --- LESSON ELEMENTS ---
    { type: 'question', templateType: 'info', label: 'Text Block', icon: '📝', description: 'Markdown text for explanations', defaultGoal: 'Concept Explanation', defaultQ: '## Key Concept\n\nExplain the topic here.' },
    { type: 'question', templateType: 'video', label: 'Video Clip', icon: '📹', description: 'Embed a video lecture', defaultGoal: 'Video Lecture' },
    { type: 'question', templateType: 'playground', label: 'Sandbox', icon: '🛠️', description: 'Interactive code environment', defaultGoal: 'Practice Sandbox' },

    // --- QUIZ ELEMENTS (Basic) ---
    { type: 'question', templateType: 'multiple-choice', label: 'Multiple Choice', icon: '❓', description: 'Classic A/B/C/D question', defaultGoal: 'Quiz Question' },
    { type: 'question', templateType: 'fill-blank', label: 'Fill Blanks', icon: '🖊️', description: 'Cloze test code snippet', defaultGoal: 'Complete the Query' },
    { type: 'question', templateType: 'type-in', label: 'Type Answer', icon: '⌨️', description: 'Exact string match answer', defaultGoal: 'Type the Keyword' },

    // --- CODING CHALLENGES (Advanced) ---
    { type: 'question', templateType: 'code-ordering', label: 'Parsons Problem', icon: '🧩', description: 'Rearrange mixed up lines of code', defaultGoal: 'Reorder the Logic' },
    { type: 'question', templateType: 'freeform-sql', label: 'Write SQL', icon: '💾', description: 'Write a full query from scratch', defaultGoal: 'Write Query' },
    { type: 'question', templateType: 'spot-error', label: 'Spot Error', icon: '❌', description: 'Identify why code is broken', defaultGoal: 'Find the Bug' },
    { type: 'question', templateType: 'error-fix', label: 'Fix Bug', icon: '🔧', description: 'Correct the broken code', defaultGoal: 'Fix the Query' },

    // --- ROUND TEMPLATES ---
    { type: 'round', defaultRoundType: 'lesson', label: 'New Lesson', icon: '📖', description: 'A round focused on learning content' },
    { type: 'round', defaultRoundType: 'test', label: 'New Test', icon: '📝', description: 'A round focused on assessment' }
];

export const LANGUAGES = [
    { value: 'sql', label: 'SQL' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'text', label: 'Plain Text' }
];
