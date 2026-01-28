import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { UserProgress, ModuleProgress, RoundScore } from '../types';

/**
 * Default round score
 */
const defaultRoundScore: RoundScore = {
    correct: 0,
    total: 0,
    completed: false,
    bestScore: 0,
};

/**
 * Default user progress state
 */
const defaultProgress: UserProgress = {
    xp: 0,
    streak: 0,
    lastActiveDate: new Date().toISOString().split('T')[0],
    moduleProgress: {},
    achievements: [],
};

/**
 * Storage key for localStorage
 */
const STORAGE_KEY = 'plato-learn-progress';

/**
 * Unlock threshold (60%)
 */
const UNLOCK_THRESHOLD = 60;

/**
 * Gamification context type
 */
interface GamificationContextType {
    progress: UserProgress;
    addXP: (amount: number) => void;
    incrementStreak: () => void;
    resetStreak: () => void;
    recordAnswer: (moduleId: string, roundId: string, isCorrect: boolean) => void;
    completeRound: (moduleId: string, roundId: string, totalQuestions: number) => void;
    getRoundScore: (moduleId: string, roundId: string) => RoundScore;
    isRoundUnlocked: (moduleId: string, prerequisites?: string[]) => boolean;
    unlockAchievement: (achievementId: string) => void;
    resetRoundProgress: (moduleId: string, roundId: string) => void;
}

const GamificationContext = createContext<GamificationContextType | null>(null);

/**
 * Load progress from localStorage
 */
function loadProgress(): UserProgress {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.warn('Failed to load progress from localStorage:', e);
    }
    return defaultProgress;
}

/**
 * Save progress to localStorage
 */
function saveProgress(progress: UserProgress): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
        console.warn('Failed to save progress to localStorage:', e);
    }
}

/**
 * Check and update streak based on last active date
 */
function checkStreak(progress: UserProgress): UserProgress {
    const today = new Date().toISOString().split('T')[0];
    const lastActive = progress.lastActiveDate;

    if (lastActive === today) {
        return progress;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastActive === yesterdayStr) {
        return { ...progress, lastActiveDate: today };
    } else {
        return { ...progress, streak: 0, lastActiveDate: today };
    }
}

/**
 * Gamification provider component
 */
export function GamificationProvider({ children }: { children: ReactNode }) {
    const [progress, setProgress] = useState<UserProgress>(() => {
        const loaded = loadProgress();
        return checkStreak(loaded);
    });

    // Save to localStorage whenever progress changes
    useEffect(() => {
        saveProgress(progress);
    }, [progress]);

    const addXP = (amount: number) => {
        setProgress(prev => ({
            ...prev,
            xp: prev.xp + amount,
        }));
    };

    const incrementStreak = () => {
        setProgress(prev => ({
            ...prev,
            streak: prev.streak + 1,
            lastActiveDate: new Date().toISOString().split('T')[0],
        }));
    };

    const resetStreak = () => {
        setProgress(prev => ({
            ...prev,
            streak: 0,
        }));
    };

    /**
     * Record an answer (correct or incorrect) for a round
     */
    const recordAnswer = (moduleId: string, roundId: string, isCorrect: boolean) => {
        setProgress(prev => {
            const moduleProgress: ModuleProgress = { ...prev.moduleProgress };
            if (!moduleProgress[moduleId]) {
                moduleProgress[moduleId] = {};
            }
            const current = moduleProgress[moduleId][roundId] || { ...defaultRoundScore };
            moduleProgress[moduleId][roundId] = {
                ...current,
                correct: current.correct + (isCorrect ? 1 : 0),
                total: current.total + 1,
            };
            return { ...prev, moduleProgress };
        });
    };

    /**
     * Complete a round and calculate best score
     */
    const completeRound = (moduleId: string, roundId: string, totalQuestions: number) => {
        setProgress(prev => {
            const moduleProgress: ModuleProgress = { ...prev.moduleProgress };
            if (!moduleProgress[moduleId]) {
                moduleProgress[moduleId] = {};
            }
            const current = moduleProgress[moduleId][roundId] || { ...defaultRoundScore };
            const score = totalQuestions > 0 ? Math.round((current.correct / totalQuestions) * 100) : 0;
            moduleProgress[moduleId][roundId] = {
                ...current,
                completed: true,
                bestScore: Math.max(current.bestScore, score),
            };
            return { ...prev, moduleProgress };
        });
    };

    /**
     * Get the score for a specific round
     */
    const getRoundScore = (moduleId: string, roundId: string): RoundScore => {
        return progress.moduleProgress[moduleId]?.[roundId] || { ...defaultRoundScore };
    };

    /**
     * Check if a round is unlocked based on prerequisites
     * A round is unlocked if ALL prerequisite rounds are completed with 60%+
     * If no prerequisites, the round is unlocked (root node)
     */
    const isRoundUnlocked = (moduleId: string, prerequisites?: string[]): boolean => {
        // No prerequisites = always unlocked (root node)
        if (!prerequisites || prerequisites.length === 0) return true;

        // Check ALL prerequisites are completed with 60%+
        for (const prereqId of prerequisites) {
            const prereqScore = progress.moduleProgress[moduleId]?.[prereqId];
            if (!prereqScore || !prereqScore.completed || prereqScore.bestScore < UNLOCK_THRESHOLD) {
                return false;
            }
        }
        return true;
    };

    /**
     * Reset a round's progress (for retrying)
     */
    const resetRoundProgress = (moduleId: string, roundId: string) => {
        setProgress(prev => {
            const moduleProgress: ModuleProgress = { ...prev.moduleProgress };
            if (moduleProgress[moduleId]?.[roundId]) {
                const best = moduleProgress[moduleId][roundId].bestScore;
                moduleProgress[moduleId][roundId] = {
                    ...defaultRoundScore,
                    bestScore: best, // Keep best score
                };
            }
            return { ...prev, moduleProgress };
        });
    };

    const unlockAchievement = (achievementId: string) => {
        setProgress(prev => {
            if (prev.achievements.includes(achievementId)) {
                return prev;
            }
            return {
                ...prev,
                achievements: [...prev.achievements, achievementId],
            };
        });
    };

    return (
        <GamificationContext.Provider
            value={{
                progress,
                addXP,
                incrementStreak,
                resetStreak,
                recordAnswer,
                completeRound,
                getRoundScore,
                isRoundUnlocked,
                unlockAchievement,
                resetRoundProgress,
            }}
        >
            {children}
        </GamificationContext.Provider>
    );
}

/**
 * Hook to access gamification context
 */
export function useGamification() {
    const context = useContext(GamificationContext);
    if (!context) {
        throw new Error('useGamification must be used within a GamificationProvider');
    }
    return context;
}
