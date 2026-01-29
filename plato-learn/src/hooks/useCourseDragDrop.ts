import { useState, useCallback } from 'react';
import type { DraggedItem, Selection } from '../pages/CourseWorkshop/types';
import type { LearningModule, Question } from '../types';

export function useCourseDragDrop(
    course: LearningModule | null,
    setCourse: React.Dispatch<React.SetStateAction<LearningModule | null>>,
    setSelection: React.Dispatch<React.SetStateAction<Selection>>,
    setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>,
    generateId: () => string,
    updateQuestion: (roundId: string, qId: string, updates: Partial<Question>) => void
) {
    const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);
    const [dragOverItem, setDragOverItem] = useState<string | null>(null);

    const handleDragStart = useCallback((e: React.DragEvent, item: DraggedItem) => {
        setDraggedItem(item);
        e.dataTransfer.effectAllowed = item.type === 'template' ? 'copy' : 'move';
        // Fix: Required for drag to work in all browsers
        e.dataTransfer.setData('text/plain', item.id || 'new-template');
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent, id?: string) => {
        e.preventDefault(); // Allow drop
        e.dataTransfer.dropEffect = 'move';
        if (id && id !== dragOverItem) setDragOverItem(id);
    }, [dragOverItem]);

    const handleDrop = useCallback((e: React.DragEvent, target: { type: 'round' | 'question', id: string, parentId?: string }) => {
        e.preventDefault();

        if (!draggedItem || !course) return;

        // Handle Template Drop (Creating New Items)
        if (draggedItem.type === 'template') {
            const templateType = draggedItem.templateType;
            if (!templateType) return;

            const newQuestion: Question = {
                id: generateId(),
                type: templateType,
                goal: templateType === 'info' ? 'New Info Block' : templateType === 'video' ? 'New Video' : 'New Question',
                q: templateType === 'info' ? '## Information\nWrite your content here.' : '',
                a: '',
                distractors: [],
                ctx: [],
                hint: '',
                codeLanguage: 'sql'
            };

            // Drop on Round -> Append to end
            if (target.type === 'round') {
                const roundId = target.id;
                setCourse(prev => prev ? ({
                    ...prev,
                    rounds: prev.rounds.map(r =>
                        r.id === roundId ? { ...r, questions: [...(r.questions || []), newQuestion] } : r
                    )
                }) : null);
                setSelection({ type: 'question', id: newQuestion.id!, parentId: roundId });
                setHasUnsavedChanges(true);
            }

            // Drop on Question -> Insert after target
            if (target.type === 'question') {
                const roundId = target.parentId!;
                setCourse(prev => prev ? ({
                    ...prev,
                    rounds: prev.rounds.map(r => {
                        if (r.id === roundId) {
                            const qs = [...r.questions];
                            const targetIndex = qs.findIndex(q => q.id === target.id);
                            if (targetIndex !== -1) {
                                qs.splice(targetIndex + 1, 0, newQuestion);
                                return { ...r, questions: qs };
                            }
                        }
                        return r;
                    })
                }) : null);
                setSelection({ type: 'question', id: newQuestion.id!, parentId: roundId });
                setHasUnsavedChanges(true);
            }

            setDraggedItem(null);
            return;
        }

        // Reorder Rounds
        if (draggedItem.type === 'round' && target.type === 'round') {
            const rounds = [...course.rounds];
            const fromIndex = rounds.findIndex(r => r.id === draggedItem.id);
            const toIndex = rounds.findIndex(r => r.id === target.id);

            if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
                const [moved] = rounds.splice(fromIndex, 1);
                rounds.splice(toIndex, 0, moved);
                setCourse(prev => prev ? ({ ...prev, rounds }) : null);
                setHasUnsavedChanges(true);
            }
        }

        // Reorder Questions
        if (draggedItem.type === 'question' && target.type === 'question') {
            // Only allow reordering within the same round for simplicity (or handle cross-round)
            if (draggedItem.parentId === target.parentId) {
                const newRounds = course.rounds.map(r => {
                    if (r.id === draggedItem.parentId) {
                        const qs = [...r.questions];
                        const fromIndex = qs.findIndex(q => q.id === draggedItem.id);
                        const toIndex = qs.findIndex(q => q.id === target.id);
                        if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
                            const [moved] = qs.splice(fromIndex, 1);
                            qs.splice(toIndex, 0, moved);
                            return { ...r, questions: qs };
                        }
                    }
                    return r;
                });
                setCourse(prev => prev ? ({ ...prev, rounds: newRounds }) : null);
                setHasUnsavedChanges(true);
            } else if (draggedItem.parentId !== target.parentId) {
                // Cross-round drag logic (simplified)
                const newRounds = [...course.rounds];
                const sourceRound = newRounds.find(r => r.id === draggedItem.parentId);
                const destRound = newRounds.find(r => r.id === target.parentId);

                if (sourceRound && destRound) {
                    const fromIndex = sourceRound.questions.findIndex(q => q.id === draggedItem.id);
                    if (fromIndex !== -1) {
                        const [moved] = sourceRound.questions.splice(fromIndex, 1);
                        // Insert at destination index
                        const toIndex = destRound.questions.findIndex(q => q.id === target.id);
                        destRound.questions.splice(toIndex, 0, moved);

                        setCourse(prev => prev ? ({ ...prev, rounds: newRounds }) : null);
                        setHasUnsavedChanges(true);
                    }
                }
            }
        }

        // Question -> Round (Append to end of target round)
        if (draggedItem.type === 'question' && target.type === 'round') {
            const sourceRoundId = draggedItem.parentId;
            const targetRoundId = target.id;

            if (sourceRoundId && targetRoundId && sourceRoundId !== targetRoundId) {
                const newRounds = [...course.rounds];
                const sourceRound = newRounds.find(r => r.id === sourceRoundId);
                const destRound = newRounds.find(r => r.id === targetRoundId);

                if (sourceRound && destRound) {
                    const fromIndex = sourceRound.questions.findIndex(q => q.id === draggedItem.id);
                    if (fromIndex !== -1) {
                        const [moved] = sourceRound.questions.splice(fromIndex, 1);
                        destRound.questions = [...(destRound.questions || []), moved]; // Append

                        setCourse(prev => prev ? ({ ...prev, rounds: newRounds }) : null);
                        setHasUnsavedChanges(true);
                    }
                }
            }
        }

        setDraggedItem(null);
        setDragOverItem(null);
    }, [draggedItem, course, setCourse, setSelection, setHasUnsavedChanges, generateId]);

    // Image Drop Handler for Inspector
    const handleImageDrop = useCallback((e: React.DragEvent, roundId: string, qId: string) => {
        e.preventDefault();
        e.stopPropagation();

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                const url = URL.createObjectURL(file);
                updateQuestion(roundId, qId, {
                    media: { type: 'image', url: url }
                });
            }
        }
    }, [updateQuestion]);

    return {
        draggedItem,
        setDraggedItem,
        dragOverItem,
        setDragOverItem,
        handleDragStart,
        handleDragOver,
        handleDrop,
        handleImageDrop
    };
}
