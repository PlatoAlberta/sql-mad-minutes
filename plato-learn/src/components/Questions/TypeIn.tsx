import { useState, useEffect } from 'react';
import type { Question } from '../../types';
import { Button } from '../Button';
import styles from './TypeIn.module.css';

interface TypeInProps {
    question: Question;
    onAnswer: (isCorrect: boolean) => void;
    answerState: 'pending' | 'correct' | 'incorrect';
}

/**
 * Type-in question renderer
 * User must type the exact answer (case-insensitive)
 */
export function TypeIn({ question, onAnswer, answerState }: TypeInProps) {
    const [userInput, setUserInput] = useState('');

    const correctAnswer = Array.isArray(question.a) ? question.a[0] : question.a;

    // Reset on question change
    useEffect(() => {
        setUserInput('');
    }, [question]);

    const handleSubmit = () => {
        if (!userInput.trim()) return;
        const isCorrect = userInput.trim().toUpperCase() === correctAnswer.toUpperCase();
        onAnswer(isCorrect);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && answerState === 'pending') {
            handleSubmit();
        }
    };

    // Highlight SQL keywords
    const highlightSQL = (text: string): string => {
        const keywords = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'ON', 'AS', 'IN', 'BETWEEN', 'LIKE', 'IS', 'NULL', 'ASC', 'DESC', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'WITH', 'OVER', 'PARTITION BY'];
        let result = text;
        keywords.forEach(kw => {
            const regex = new RegExp(`\\b(${kw})\\b(?![^<]*>)`, 'gi');
            result = result.replace(regex, `<span style="color: var(--midnight); font-weight: 600;">$1</span>`);
        });
        result = result.replace(/'([^']+)'/g, `<span style="color: #22A06B;">'$1'</span>`);
        return result;
    };

    const getInputClass = () => {
        let className = styles.inputField;
        if (answerState === 'correct') className += ` ${styles.correct}`;
        if (answerState === 'incorrect') className += ` ${styles.incorrect}`;
        return className;
    };

    return (
        <div className={styles.container}>
            <div
                className={styles.sqlDisplay}
                dangerouslySetInnerHTML={{ __html: highlightSQL(question.q) }}
            />

            <div className={styles.label}>Type your answer</div>
            <div className={styles.inputWrapper}>
                <input
                    type="text"
                    className={getInputClass()}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={answerState !== 'pending'}
                    placeholder="Type the SQL keyword..."
                    autoComplete="off"
                    spellCheck={false}
                />
            </div>

            {answerState === 'pending' && (
                <Button onClick={handleSubmit} disabled={!userInput.trim()}>
                    Check Answer
                </Button>
            )}
        </div>
    );
}
