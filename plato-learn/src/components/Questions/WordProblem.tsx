import { useState, useEffect } from 'react';
import type { Question } from '../../types';
import styles from './WordProblem.module.css';

interface WordProblemProps {
    question: Question;
    onAnswer: (isCorrect: boolean) => void;
    answerState: 'pending' | 'correct' | 'incorrect';
}

/**
 * Word Problem component
 * "What does this query do?" style questions.
 * Displays a SQL query and asks the user to select the correct text description.
 */
export function WordProblem({ question, onAnswer, answerState }: WordProblemProps) {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [options, setOptions] = useState<string[]>([]);

    // For word problems, 'a' is the correct text description
    const correctAnswer = Array.isArray(question.a) ? question.a[0] : question.a;

    useEffect(() => {
        // Shuffle options (correct + distractors)
        const allOptions = [correctAnswer, ...question.distractors];
        const shuffled = [...allOptions].sort(() => Math.random() - 0.5);
        setOptions(shuffled);
        setSelectedOption(null);
    }, [question, correctAnswer]);

    const handleOptionClick = (option: string) => {
        if (answerState !== 'pending') return;

        setSelectedOption(option);

        // Auto-submit on select? Or require explicit check?
        // MultipleChoice is auto-submit. Let's do auto-submit for consistency.
        const isCorrect = option === correctAnswer;
        onAnswer(isCorrect);
    };

    // Syntax highlighting helper (reused logic)
    const highlightSQL = (text: string): string => {
        const keywords = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'ON', 'AS', 'IN', 'BETWEEN', 'LIKE', 'IS', 'NULL', 'ASC', 'DESC', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'WITH', 'OVER', 'PARTITION BY', 'ROW_NUMBER', 'RANK', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'EXISTS'];
        let result = text;
        keywords.forEach(kw => {
            const regex = new RegExp(`\\b(${kw})\\b(?![^<]*>)`, 'gi');
            result = result.replace(regex, `<span style="color: var(--royal); font-weight: 700;">$1</span>`);
        });
        result = result.replace(/'([^']+)'/g, `<span style="color: var(--color-success);">'$1'</span>`);
        return result;
    };

    return (
        <div className={styles.container}>
            {/* The Query to Analyze */}
            <div className={styles.queryBlock}>
                <div
                    className={styles.sql}
                    dangerouslySetInnerHTML={{ __html: highlightSQL(question.q) }}
                />
            </div>

            <div className={styles.prompt}>
                {question.goal || "What does this query do?"}
            </div>

            <div className={styles.optionsGrid}>
                {options.map((option, idx) => {
                    let className = styles.optionBtn;
                    if (answerState !== 'pending' && option === selectedOption) {
                        className += option === correctAnswer ? ` ${styles.correct}` : ` ${styles.incorrect}`;
                    }
                    if (answerState !== 'pending' && option === correctAnswer && option !== selectedOption) {
                        className += ` ${styles.correct}`; // Show correct if missed
                    }

                    return (
                        <button
                            key={idx}
                            className={className}
                            onClick={() => handleOptionClick(option)}
                            disabled={answerState !== 'pending'}
                        >
                            {option}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
