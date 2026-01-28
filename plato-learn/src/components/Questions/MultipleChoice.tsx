import { useState, useEffect } from 'react';
import type { Question } from '../../types';
import styles from './MultipleChoice.module.css';

interface MultipleChoiceProps {
    question: Question;
    onAnswer: (isCorrect: boolean, answer?: string) => void;
    answerState: 'pending' | 'correct' | 'incorrect';
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

/**
 * Multiple choice question renderer
 * Shows 4 options (correct answer + distractors), user selects one
 * Auto-validates on selection
 */
export function MultipleChoice({ question, onAnswer, answerState }: MultipleChoiceProps) {
    const [selected, setSelected] = useState<string | null>(null);
    const [options, setOptions] = useState<string[]>([]);

    // Shuffle options on mount
    useEffect(() => {
        const correctAnswer = Array.isArray(question.a) ? question.a[0] : question.a;
        const choices = question.choices || [correctAnswer, ...question.distractors];
        const shuffled = [...choices].sort(() => Math.random() - 0.5);
        setOptions(shuffled);
        setSelected(null);
    }, [question]);

    const handleSelect = (option: string) => {
        if (answerState !== 'pending') return;
        setSelected(option);
        // Auto-submit on selection for multiple choice
        const correctAnswer = Array.isArray(question.a) ? question.a[0] : question.a;
        const isCorrect = option.toUpperCase() === correctAnswer.toUpperCase();
        onAnswer(isCorrect, option);
    };

    const getOptionClass = (option: string) => {
        const classes = [styles.option];

        if (answerState !== 'pending') {
            classes.push(styles.disabled);
            const correctAnswer = Array.isArray(question.a) ? question.a[0] : question.a;
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

    return (
        <div className={styles.container}>
            {options.map((option, idx) => (
                <button
                    key={idx}
                    className={getOptionClass(option)}
                    onClick={() => handleSelect(option)}
                >
                    <div className={styles.radio} />
                    <span className={styles.letter}>{LETTERS[idx]}</span>
                    <span className={styles.text}>{option}</span>
                </button>
            ))}
        </div>
    );
}
