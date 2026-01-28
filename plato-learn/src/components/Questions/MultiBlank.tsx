import { useState, useEffect } from 'react';
import type { Question } from '../../types';
import styles from './MultiBlank.module.css';
import { Button } from '../Button';

interface MultiBlankProps {
    question: Question;
    onAnswer: (isCorrect: boolean) => void;
    answerState: 'pending' | 'correct' | 'incorrect';
}

/**
 * Multi-blank question renderer
 * Multiple blanks to fill from a pool of answers
 */
export function MultiBlank({ question, onAnswer, answerState }: MultiBlankProps) {
    const [answers, setAnswers] = useState<(string | null)[]>([]);
    const [activeBlank, setActiveBlank] = useState<number>(0);
    const [chips, setChips] = useState<string[]>([]);
    const [usedChips, setUsedChips] = useState<Set<string>>(new Set());

    // Get correct answers array
    const correctAnswers = Array.isArray(question.a) ? question.a : [question.a];
    const blankCount = (question.q.match(/____/g) || []).length;

    // Initialize
    useEffect(() => {
        setAnswers(new Array(blankCount).fill(null));
        setActiveBlank(0);
        setUsedChips(new Set());

        // Create chip pool from correct answers + distractors
        const allChips = [...correctAnswers, ...question.distractors];
        const shuffled = [...allChips].sort(() => Math.random() - 0.5);
        setChips(shuffled);
    }, [question, blankCount]);

    const handleChipClick = (chip: string) => {
        if (answerState !== 'pending' || usedChips.has(chip)) return;

        const newAnswers = [...answers];
        newAnswers[activeBlank] = chip;
        setAnswers(newAnswers);
        setUsedChips(new Set([...usedChips, chip]));

        // Move to next blank
        if (activeBlank < blankCount - 1) {
            setActiveBlank(activeBlank + 1);
        }
    };

    const handleBlankClick = (idx: number) => {
        if (answerState !== 'pending') return;

        // If blank has answer, remove it
        if (answers[idx]) {
            const removedChip = answers[idx];
            const newAnswers = [...answers];
            newAnswers[idx] = null;
            setAnswers(newAnswers);

            const newUsed = new Set(usedChips);
            if (removedChip) newUsed.delete(removedChip);
            setUsedChips(newUsed);
        }

        setActiveBlank(idx);
    };

    const checkAnswer = () => {
        const allFilled = answers.every(a => a !== null);
        if (!allFilled) return;

        const isCorrect = answers.every((answer, idx) =>
            answer?.toUpperCase() === correctAnswers[idx]?.toUpperCase()
        );
        onAnswer(isCorrect);
    };

    // Render code with blanks
    const renderCode = () => {
        const parts = question.q.split('____');
        const elements: React.ReactNode[] = [];

        parts.forEach((part, idx) => {
            elements.push(<span key={`part-${idx}`}>{part}</span>);

            if (idx < blankCount) {
                const answer = answers[idx];
                let blankClass = styles.blank;

                if (idx === activeBlank && answerState === 'pending') {
                    blankClass += ` ${styles.active}`;
                }
                if (answer) {
                    blankClass += ` ${styles.filled}`;
                }
                if (answerState !== 'pending') {
                    if (answer?.toUpperCase() === correctAnswers[idx]?.toUpperCase()) {
                        blankClass += ` ${styles.correct}`;
                    } else {
                        blankClass += ` ${styles.incorrect}`;
                    }
                }

                elements.push(
                    <span
                        key={`blank-${idx}`}
                        className={blankClass}
                        onClick={() => handleBlankClick(idx)}
                    >
                        {answer || `#${idx + 1}`}
                    </span>
                );
            }
        });

        return elements;
    };

    const allFilled = answers.every(a => a !== null);

    return (
        <div className={styles.container}>
            <div className={styles.codeBlock}>
                {renderCode()}
            </div>

            <div className={styles.label}>Select answers for each blank</div>
            <div className={styles.chipPool}>
                {chips.map((chip, idx) => (
                    <button
                        key={idx}
                        className={`${styles.chip} ${usedChips.has(chip) ? styles.used : ''}`}
                        onClick={() => handleChipClick(chip)}
                        disabled={answerState !== 'pending'}
                    >
                        {chip}
                    </button>
                ))}
            </div>

            {answerState === 'pending' && allFilled && (
                <Button onClick={checkAnswer}>Check Answer</Button>
            )}
        </div>
    );
}
