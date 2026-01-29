import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getModuleById, saveCustomModule } from '../modules';
import type { LearningModule, Round, Question } from '../types';
import type { Selection } from '../pages/CourseWorkshop/types';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#14b8a6', '#6366f1'];

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export function useCourseEditor(courseId?: string) {
    const navigate = useNavigate();

    // --- State ---
    const [course, setCourse] = useState<LearningModule | null>(null);
    const [selection, setSelection] = useState<Selection>({ type: 'course', id: 'root' });
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Tutorial State
    const [tutorialStep, setTutorialStep] = useState<number | null>(null);

    // Load existing course or create new
    useEffect(() => {
        if (courseId) {
            const existing = getModuleById(courseId);
            if (existing) {
                setCourse(JSON.parse(JSON.stringify(existing))); // Deep copy
            } else {
                // If ID provided but not found, maybe redirect or show error?
                // For now, let's just initialize empty if we want, or finding nothing might technically be a bug if coming from URL.
                // But the original code didn't handle "not found" explicitly other than maybe staying null.
                // If creating new, courseId is undefined.
            }
        } else {
            setCourse({
                id: `custom-${generateId()}`,
                name: 'Untitled Course',
                description: '',
                icon: '📊',
                color: COLORS[0],
                questionsPath: '',
                category: 'engineering',
                rounds: [],
            });
        }

        // Check if tutorial seen
        const seen = localStorage.getItem('plato_studio_tutorial_seen');
        if (!seen) {
            setTutorialStep(0);
        }
    }, [courseId]);

    // --- Actions ---

    const handleSave = useCallback(() => {
        if (!course) return;
        saveCustomModule(course);
        setHasUnsavedChanges(false);
        navigate('/courses');
    }, [course, navigate]);

    const updateCourse = useCallback((updates: Partial<LearningModule>) => {
        setCourse(prev => prev ? ({ ...prev, ...updates }) : null);
        setHasUnsavedChanges(true);
    }, []);

    const addRound = useCallback(() => {
        if (!course) return;
        const newRound: Round = {
            id: generateId(),
            name: 'New Round',
            description: '',
            questions: [],
            row: course.rounds.length,
            col: 0
        };
        setCourse(prev => prev ? ({ ...prev, rounds: [...prev.rounds, newRound] }) : null);
        setSelection({ type: 'round', id: newRound.id });
        setHasUnsavedChanges(true);
    }, [course]);

    const updateRound = useCallback((roundId: string, updates: Partial<Round>) => {
        setCourse(prev => prev ? ({
            ...prev,
            rounds: prev.rounds.map(r => r.id === roundId ? { ...r, ...updates } : r)
        }) : null);
        setHasUnsavedChanges(true);
    }, []);

    const deleteRound = useCallback((roundId: string) => {
        if (confirm('Delete this round and all contents?')) {
            setCourse(prev => prev ? ({
                ...prev,
                rounds: prev.rounds.filter(r => r.id !== roundId)
            }) : null);
            setSelection({ type: 'course', id: 'root' });
            setHasUnsavedChanges(true);
        }
    }, []);

    const addQuestion = useCallback((roundId: string) => {
        const newQuestion: Question = {
            id: generateId(),
            type: 'fill-blank',
            goal: 'New Question',
            q: '',
            a: '',
            distractors: [],
            ctx: [],
            hint: '',
            codeLanguage: 'sql'
        };
        setCourse(prev => prev ? ({
            ...prev,
            rounds: prev.rounds.map(r => {
                if (r.id === roundId) {
                    return { ...r, questions: [...(r.questions || []), newQuestion] };
                }
                return r;
            })
        }) : null);
        setSelection({ type: 'question', id: newQuestion.id!, parentId: roundId });
        setHasUnsavedChanges(true);
    }, []);

    const updateQuestion = useCallback((roundId: string, qId: string, updates: Partial<Question>) => {
        setCourse(prev => prev ? ({
            ...prev,
            rounds: prev.rounds.map(r => {
                if (r.id === roundId) {
                    return {
                        ...r,
                        questions: r.questions.map(q => q.id === qId ? { ...q, ...updates } : q)
                    };
                }
                return r;
            })
        }) : null);
        setHasUnsavedChanges(true);
    }, []);

    const deleteQuestion = useCallback((roundId: string, qId: string) => {
        setCourse(prev => prev ? ({
            ...prev,
            rounds: prev.rounds.map(r => {
                if (r.id === roundId) {
                    return {
                        ...r,
                        questions: r.questions.filter(q => q.id !== qId)
                    };
                }
                return r;
            })
        }) : null);
        setSelection({ type: 'round', id: roundId });
        setHasUnsavedChanges(true);
    }, []);

    // Tutorial Helpers
    const startTutorial = () => setTutorialStep(1);
    const nextTutorialStep = () => setTutorialStep(prev => (prev !== null && prev < 3 ? prev + 1 : null));
    const skipTutorial = () => {
        setTutorialStep(null);
        localStorage.setItem('plato_studio_tutorial_seen', 'true');
    };

    return {
        course,
        setCourse,
        selection,
        setSelection,
        hasUnsavedChanges,
        setHasUnsavedChanges,
        tutorialStep,
        actions: {
            handleSave,
            updateCourse,
            addRound,
            updateRound,
            deleteRound,
            addQuestion,
            updateQuestion,
            deleteQuestion,
            startTutorial,
            nextTutorialStep,
            skipTutorial,
            generateId
        }
    };
}
