import { useState, useEffect } from 'react';
import type { Question } from '../../types';
import styles from './ErrorFix.module.css';

interface ErrorFixProps {
    question: Question;
    onAnswer: (isCorrect: boolean) => void;
    answerState: 'pending' | 'correct' | 'incorrect';
}

/**
 * Error fix question renderer
 * Shows broken SQL code, user selects the correct fix
 * Auto-validates on selection
 */
export function ErrorFix({ question, onAnswer, answerState }: ErrorFixProps) {
    const [selected, setSelected] = useState<string | null>(null);
    const [options, setOptions] = useState<string[]>([]);

    const correctAnswer = Array.isArray(question.a) ? question.a[0] : question.a;
    const errorCode = question.errorCode || question.q;
    const errorPart = question.errorLocation || '____';

    // Build fix options
    useEffect(() => {
        const allOptions = [correctAnswer, ...question.distractors];
        const shuffled = [...allOptions].sort(() => Math.random() - 0.5);
        setOptions(shuffled);
        setSelected(null);
    }, [question, correctAnswer]);

    const handleSelect = (option: string) => {
        if (answerState !== 'pending') return;
        setSelected(option);
        // Auto-submit on selection
        const isCorrect = option.toUpperCase() === correctAnswer.toUpperCase();
        onAnswer(isCorrect);
    };

    const getOptionClass = (option: string) => {
        const classes = [styles.fixOption];

        if (answerState !== 'pending') {
            if (option.toUpperCase() === correctAnswer.toUpperCase()) {
                classes.push(styles.correct);
            } else if (option === selected) {
                classes.push(styles.incorrect);
            }
        } else if (option === selected) {
            classes.push(styles.selected);
        }

        return classes.join(' ');
    };

    // Highlight the error in the code
    const highlightedCode = errorCode.replace(
        errorPart,
        `<span class="${styles.errorLine}">${errorPart}</span>`
    );

    return (
        <div className={styles.container}>
            <div className={styles.label}>Find and fix the error</div>
            <div
                className={styles.codeBlock}
                dangerouslySetInnerHTML={{ __html: highlightedCode }}
            />

            <div className={styles.label}>Select the correct fix</div>
            <div className={styles.fixOptions}>
                {options.map((option, idx) => (
                    <button
                        key={idx}
                        className={getOptionClass(option)}
                        onClick={() => handleSelect(option)}
                    >
                        <span className={styles.original}>{errorPart}</span>
                        <span className={styles.arrow}>→</span>
                        <span className={styles.fix}>{option}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
