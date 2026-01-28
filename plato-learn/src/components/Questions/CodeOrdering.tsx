import { useState, useEffect } from 'react';
import type { Question } from '../../types';
import styles from './CodeOrdering.module.css';
import { Button } from '../Button';

interface CodeOrderingProps {
    question: Question;
    onAnswer: (isCorrect: boolean, answer?: string) => void;
    answerState: 'pending' | 'correct' | 'incorrect';
}

/**
 * Code ordering question renderer
 * User drags SQL clauses into correct order
 */
export function CodeOrdering({ question, onAnswer, answerState }: CodeOrderingProps) {
    const [items, setItems] = useState<string[]>([]);
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

    // Get correct order from answer (array)
    const correctOrder = Array.isArray(question.a) ? question.a : [question.a];

    // Shuffle on mount
    useEffect(() => {
        const shuffled = [...correctOrder].sort(() => Math.random() - 0.5);
        setItems(shuffled);
    }, [question]);

    const handleDragStart = (idx: number) => {
        setDraggedIdx(idx);
    };

    const handleDragOver = (e: React.DragEvent, idx: number) => {
        e.preventDefault();
        if (draggedIdx === null || draggedIdx === idx) return;

        // Reorder
        const newItems = [...items];
        const draggedItem = newItems[draggedIdx];
        newItems.splice(draggedIdx, 1);
        newItems.splice(idx, 0, draggedItem);
        setItems(newItems);
        setDraggedIdx(idx);
    };

    const handleDragEnd = () => {
        setDraggedIdx(null);
    };

    const checkAnswer = () => {
        const isCorrect = items.every((item, idx) =>
            item.toUpperCase() === correctOrder[idx].toUpperCase()
        );
        // Pass the user's order as a string for display
        onAnswer(isCorrect, items.join('\n'));
    };

    const getItemClass = (item: string, idx: number) => {
        const classes = [styles.item];

        if (draggedIdx === idx) {
            classes.push(styles.dragging);
        }

        if (answerState !== 'pending') {
            if (item.toUpperCase() === correctOrder[idx].toUpperCase()) {
                classes.push(styles.correct);
            } else {
                classes.push(styles.incorrect);
            }
        }

        return classes.join(' ');
    };

    return (
        <div className={styles.container}>
            <div className={styles.hint}>Drag to reorder the SQL clauses</div>
            {items.map((item, idx) => (
                <div
                    key={item} // Stable key based on content
                    className={getItemClass(item, idx)}
                    draggable={answerState === 'pending'}
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                >
                    <div className={styles.handle}>
                        <span /><span /><span />
                    </div>
                    <span className={styles.number}>{idx + 1}</span>
                    <span className={styles.text}>{item}</span>
                </div>
            ))}
            {answerState === 'pending' && (
                <Button onClick={checkAnswer} size="sm">Check Order</Button>
            )}
        </div>
    );
}
