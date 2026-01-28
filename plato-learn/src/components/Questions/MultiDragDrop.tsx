import { useState, useEffect } from 'react';
import type { Question } from '../../types';
import styles from './MultiDragDrop.module.css';
import { Button } from '../Button';

interface MultiDragDropProps {
    question: Question;
    onAnswer: (isCorrect: boolean) => void;
    answerState: 'pending' | 'correct' | 'incorrect';
}

/**
 * Multi-Drag-Drop question renderer
 * Strict drag-and-drop to fill multiple blanks from a pool of answers.
 */
export function MultiDragDrop({ question, onAnswer, answerState }: MultiDragDropProps) {
    // Array of answers for each blank index
    const [userAnswers, setUserAnswers] = useState<(string | null)[]>([]);
    const [chips, setChips] = useState<string[]>([]);
    const [draggingChip, setDraggingChip] = useState<string | null>(null);
    const [dragOverBlank, setDragOverBlank] = useState<number | null>(null);

    // Parse correct answers
    const correctAnswers = Array.isArray(question.a) ? question.a : [question.a];
    const blankCount = (question.q.match(/____/g) || []).length;

    // Initialize
    useEffect(() => {
        setUserAnswers(new Array(blankCount).fill(null));

        // Pool: correct answers + distractors
        const allChips = [...correctAnswers, ...question.distractors];
        const shuffled = [...allChips].sort(() => Math.random() - 0.5);
        setChips(shuffled);
    }, [question, blankCount]);

    // Drag Logic
    const handleDragStart = (e: React.DragEvent, chip: string) => {
        if (answerState !== 'pending') {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData('text/plain', chip);
        e.dataTransfer.effectAllowed = 'copy'; // allow reusing chips? or move?
        // If we want reuse, 'copy'. If we want consume, 'move'.
        // MultiBlank consumes usually. Let's assume consume logic (chip disappears from pool once used).
        setDraggingChip(chip);
    };

    const handleDragEnd = () => {
        setDraggingChip(null);
        setDragOverBlank(null);
    };

    const handleDragOver = (e: React.DragEvent, blankIndex: number) => {
        e.preventDefault();
        if (answerState !== 'pending') return;
        setDragOverBlank(blankIndex);
    };

    const handleDrop = (e: React.DragEvent, blankIndex: number) => {
        e.preventDefault();
        setDragOverBlank(null);

        const chip = e.dataTransfer.getData('text/plain');
        if (chip && answerState === 'pending') {
            // Check if chip is already used in another blank? 
            // If we allow unique chips only, we should remove from other blanks if moved?
            // For simplicity: If chip is from pool, fill.

            // Check if this chip is already present in answers (if strict 1-to-1 usage?)
            // Assuming duplicates allowed in pool but not in usage if pool has unique items

            const newAnswers = [...userAnswers];
            newAnswers[blankIndex] = chip;
            setUserAnswers(newAnswers);
        }
        setDraggingChip(null);
    };

    const handleBlankClick = (idx: number) => {
        if (answerState !== 'pending') return;
        // Click to clear
        const newAnswers = [...userAnswers];
        newAnswers[idx] = null;
        setUserAnswers(newAnswers);
    };

    const checkAnswer = () => {
        const allFilled = userAnswers.every(a => a !== null);
        if (!allFilled) return;

        const isCorrect = userAnswers.every((ans, idx) =>
            ans?.toUpperCase() === correctAnswers[idx]?.toUpperCase()
        );
        onAnswer(isCorrect);
    };

    // Syntax Highlight
    const highlightSQL = (text: string): string => {
        // ... standard Highlight logic ...
        const keywords = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'ON', 'AS', 'IN', 'BETWEEN', 'LIKE', 'IS', 'NULL', 'ASC', 'DESC', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'WITH', 'OVER', 'PARTITION BY', 'ROW_NUMBER', 'RANK', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'EXISTS'];
        let result = text;
        keywords.forEach(kw => {
            const regex = new RegExp(`\\b(${kw})\\b(?![^<]*>)`, 'gi');
            result = result.replace(regex, `<span style="color: var(--midnight); font-weight: 600;">$1</span>`);
        });
        result = result.replace(/'([^']+)'/g, `<span style="color: #22A06B;">'$1'</span>`);
        return result;
    };

    // Render Query
    const renderQuery = () => {
        const parts = question.q.split('____');
        const elements: React.ReactNode[] = [];

        parts.forEach((part, idx) => {
            // Static text part
            elements.push(
                <span key={`text-${idx}`} dangerouslySetInnerHTML={{ __html: highlightSQL(part) }} />
            );

            // Blank (if exists for this index)
            if (idx < blankCount) {
                const answer = userAnswers[idx];
                let className = styles.blank;
                if (dragOverBlank === idx) className += ` ${styles.dragOver}`;
                if (answer) className += ` ${styles.filled}`;

                if (answerState !== 'pending') {
                    const isCorrect = answer?.toUpperCase() === correctAnswers[idx]?.toUpperCase();
                    className += isCorrect ? ` ${styles.correct}` : ` ${styles.incorrect}`;
                }

                elements.push(
                    <span
                        key={`blank-${idx}`}
                        className={className}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDrop={(e) => handleDrop(e, idx)}
                        onClick={() => handleBlankClick(idx)}
                    >
                        {answer || ''}
                    </span>
                );
            }
        });
        return elements;
    };

    return (
        <div className={styles.container}>
            <div className={styles.sqlBlock}>
                {renderQuery()}
            </div>

            <div className={styles.instruction}>Drag answers into the blanks</div>

            <div className={styles.pool}>
                {chips.map((chip, idx) => {
                    return (
                        <div
                            key={idx}
                            className={`${styles.chip} ${draggingChip === chip ? styles.dragging : ''}`}
                            draggable={answerState === 'pending'}
                            onDragStart={(e) => handleDragStart(e, chip)}
                            onDragEnd={handleDragEnd}
                        >
                            {chip}
                        </div>
                    );
                })}
            </div>

            {userAnswers.every(a => a !== null) && answerState === 'pending' && (
                <Button onClick={checkAnswer}>Check Answer</Button>
            )}
        </div>
    );
}
