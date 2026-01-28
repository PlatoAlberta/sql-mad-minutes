import { useState, useEffect } from 'react';
import type { Question } from '../../types';
import { Button } from '../Button';
import styles from './FreeformSQL.module.css';

interface FreeformSQLProps {
    question: Question;
    onAnswer: (isCorrect: boolean) => void;
    answerState: 'pending' | 'correct' | 'incorrect';
}

/**
 * Freeform SQL question renderer
 * User writes complete SQL query, validated against expected answer
 * Ignores whitespace and case differences
 */
export function FreeformSQL({ question, onAnswer, answerState }: FreeformSQLProps) {
    const [userSQL, setUserSQL] = useState('');
    const [feedback, setFeedback] = useState<string | null>(null);

    const expectedSQL = Array.isArray(question.a) ? question.a[0] : question.a;

    // Reset on question change
    useEffect(() => {
        setUserSQL('');
        setFeedback(null);
    }, [question]);

    // Normalize SQL for comparison (remove extra whitespace, lowercase)
    const normalizeSQL = (sql: string): string => {
        return sql
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .replace(/\s*(,|;|\(|\))\s*/g, '$1')
            .trim();
    };

    // Basic SQL syntax validation
    const validateSyntax = (sql: string): { valid: boolean; error?: string } => {
        const trimmed = sql.trim();
        if (!trimmed) return { valid: false, error: 'Query cannot be empty' };

        // Check for balanced parentheses
        let parenCount = 0;
        for (const char of trimmed) {
            if (char === '(') parenCount++;
            if (char === ')') parenCount--;
            if (parenCount < 0) return { valid: false, error: 'Unmatched closing parenthesis' };
        }
        if (parenCount > 0) return { valid: false, error: 'Unmatched opening parenthesis' };

        // Check for balanced quotes
        const singleQuotes = (trimmed.match(/'/g) || []).length;
        if (singleQuotes % 2 !== 0) return { valid: false, error: 'Unmatched single quote' };

        // Check starts with valid keyword
        const validStarts = ['SELECT', 'WITH', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER'];
        const firstWord = trimmed.split(/\s+/)[0].toUpperCase();
        if (!validStarts.includes(firstWord)) {
            return { valid: false, error: `Query should start with a SQL keyword like SELECT` };
        }

        return { valid: true };
    };

    const handleSubmit = () => {
        // First validate syntax
        const syntaxCheck = validateSyntax(userSQL);
        if (!syntaxCheck.valid) {
            setFeedback(syntaxCheck.error || 'Syntax error');
            onAnswer(false);
            return;
        }

        // Compare normalized SQL
        const normalizedUser = normalizeSQL(userSQL);
        const normalizedExpected = normalizeSQL(expectedSQL);

        if (normalizedUser === normalizedExpected) {
            setFeedback('Perfect! Your SQL is correct.');
            onAnswer(true);
        } else {
            setFeedback('Not quite right. Check your syntax and try again.');
            onAnswer(false);
        }
    };

    const getEditorClass = () => {
        let className = styles.editor;
        if (answerState === 'correct') className += ` ${styles.correct}`;
        if (answerState === 'incorrect') className += ` ${styles.incorrect}`;
        return className;
    };

    return (
        <div className={styles.container}>
            <div className={styles.prompt}>{question.goal}</div>

            <div className={styles.label}>Write your SQL query</div>
            <textarea
                className={getEditorClass()}
                value={userSQL}
                onChange={(e) => setUserSQL(e.target.value)}
                disabled={answerState !== 'pending'}
                placeholder="SELECT ..."
                spellCheck={false}
            />

            {answerState === 'pending' && (
                <>
                    <div className={styles.helperText}>
                        Tip: Case and extra whitespace are ignored when checking your answer.
                    </div>
                    <Button onClick={handleSubmit} disabled={!userSQL.trim()}>
                        Check Query
                    </Button>
                </>
            )}

            {feedback && (
                <div className={`${styles.feedback} ${answerState === 'correct' ? styles.success : styles.error}`}>
                    {feedback}
                </div>
            )}

            {answerState === 'incorrect' && (
                <div className={styles.expected}>
                    <span className={styles.expectedLabel}>Expected Query:</span>
                    {expectedSQL}
                </div>
            )}
        </div>
    );
}
