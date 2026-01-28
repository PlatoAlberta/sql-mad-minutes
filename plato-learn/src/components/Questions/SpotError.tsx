import { useState, useEffect } from 'react';
import type { Question } from '../../types';
import styles from './SpotError.module.css';

interface SpotErrorProps {
    question: Question;
    onAnswer: (isCorrect: boolean) => void;
    answerState: 'pending' | 'correct' | 'incorrect';
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

/**
 * Spot-error question renderer
 * Shows broken SQL, user picks WHY it's wrong from multiple choices
 */
export function SpotError({ question, onAnswer, answerState }: SpotErrorProps) {
    const [selected, setSelected] = useState<string | null>(null);
    const [options, setOptions] = useState<string[]>([]);

    const correctAnswer = Array.isArray(question.a) ? question.a[0] : question.a;
    const errorCode = question.errorCode || question.q;

    // Build options from correct answer + distractors
    useEffect(() => {
        const allOptions = [correctAnswer, ...question.distractors];
        const shuffled = [...allOptions].sort(() => Math.random() - 0.5);
        setOptions(shuffled);
        setSelected(null);
    }, [question, correctAnswer]);

    const handleSelect = (option: string) => {
        if (answerState !== 'pending') return;
        setSelected(option);
        // Auto-validate on selection
        const isCorrect = option === correctAnswer;
        onAnswer(isCorrect);
    };

    const getOptionClass = (option: string) => {
        let className = styles.option;
        if (answerState !== 'pending') {
            className += ` ${styles.disabled}`;
            if (option === correctAnswer) {
                className += ` ${styles.correct}`;
            } else if (option === selected) {
                className += ` ${styles.incorrect}`;
            }
        } else if (option === selected) {
            className += ` ${styles.selected}`;
        }
        return className;
    };

    return (
        <div className={styles.container}>
            <div className={styles.badCode}>
                <code>{errorCode}</code>
            </div>

            <div className={styles.label}>What's wrong with this SQL?</div>

            <div className={styles.options}>
                {options.map((option, idx) => (
                    <button
                        key={idx}
                        className={getOptionClass(option)}
                        onClick={() => handleSelect(option)}
                    >
                        <span className={styles.optionLetter}>{LETTERS[idx]}</span>
                        <span className={styles.optionText}>{option}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
