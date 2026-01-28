/**
 * PLATO Learn - Type Definitions
 * Core interfaces for the modular learning platform
 */

// ============================================
// MODULE SYSTEM
// ============================================

/**
 * Configuration for a learning module
 */
export interface LearningModule {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  questionsPath: string;
  rounds: Round[];
}

/**
 * A round within a module (e.g., "SQL Basics", "Aggregates")
 * Supports branching: multiple rounds can share prerequisites
 * and rounds can require multiple prerequisites to be completed
 */
export interface Round {
  id: string;
  name: string;
  description: string;
  questions: Question[];
  /** IDs of prerequisite rounds that must be completed (60%+) */
  prerequisites?: string[];
  /** Row position in skill tree (0 = top) */
  row?: number;
  /** Column position in skill tree (0 = left, allows multiple per row) */
  col?: number;
}

// ============================================
// QUESTION TYPES
// ============================================

/**
 * Supported question types
 */
export type QuestionType =
  | 'fill-blank'       // Click to select answer (default)
  | 'drag-drop'        // Drag chip into blank
  | 'type-in'          // Type the answer
  | 'freeform-sql'     // Write complete SQL, validated for syntax
  | 'spot-error'       // Identify why the SQL is wrong
  | 'multiple-choice'  // Classic A/B/C/D
  | 'code-ordering'    // Arrange SQL clauses in order
  | 'error-fix'        // Find and fix the bug
  | 'multi-blank'      // Multiple blanks to fill (click)
  | 'word-problem'     // Explain what query does
  | 'multi-drag-drop'; // Drag multiple blanks (required drag)

/**
 * Base question interface
 */
export interface Question {
  id?: string;
  type?: QuestionType;
  ctx: string[];
  goal: string;
  q: string;
  a: string | string[];         // Single answer or array for multi-blank/ordering
  distractors: string[];
  hint: string;
  explanation?: string;
  // For multiple choice
  choices?: string[];
  // For error-fix
  errorCode?: string;           // The broken code
  correctCode?: string;         // The fixed code
  errorLocation?: string;       // What part is wrong
}

/**
 * Schema definitions for a module
 */
export interface ModuleSchema {
  [key: string]: string;
}

/**
 * Full question data loaded from JSON
 */
export interface QuestionData {
  schema: ModuleSchema;
  rounds: Round[];
}

// ============================================
// GAMIFICATION
// ============================================

/**
 * User progress and stats
 */
export interface UserProgress {
  xp: number;
  streak: number;
  lastActiveDate: string;
  moduleProgress: ModuleProgress;
  achievements: string[];
}

/**
 * Score tracking for a round
 */
export interface RoundScore {
  correct: number;     // Number of correct answers
  total: number;       // Total questions attempted
  completed: boolean;  // True if round has been fully completed
  bestScore: number;   // Best percentage score achieved (0-100)
}

/**
 * Progress within each module
 */
export interface ModuleProgress {
  [moduleId: string]: {
    [roundId: string]: RoundScore;
  };
}

/**
 * Achievement definition
 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (progress: UserProgress) => boolean;
}

// ============================================
// COMPONENT PROPS
// ============================================

export interface QuestionComponentProps {
  question: Question;
  onAnswer: (isCorrect: boolean) => void;
  answerState: 'pending' | 'correct' | 'incorrect';
}

export interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export interface CardProps {
  variant?: 'raised' | 'inset' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

export interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  showPercent?: boolean;
}
