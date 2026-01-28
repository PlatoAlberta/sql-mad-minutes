import { useState, useEffect, useRef } from 'react';
import type { Question } from '../../types';
import styles from './DragDrop.module.css';

interface DragDropProps {
    question: Question;
    onAnswer: (isCorrect: boolean, answer?: string) => void;
    answerState: 'pending' | 'correct' | 'incorrect';
}

/**
 * Drag-and-drop question renderer
 * User drags answer chip into the blank in the SQL statement
 */
export function DragDrop({ question, onAnswer, answerState }: DragDropProps) {
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [answerOptions, setAnswerOptions] = useState<string[]>([]);
    const [draggingChip, setDraggingChip] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const dropZoneRef = useRef<HTMLSpanElement>(null);

    const correctAnswer = Array.isArray(question.a) ? question.a[0] : question.a;

    // Shuffle options on mount
    useEffect(() => {
        const allOptions = [correctAnswer, ...question.distractors];
        const shuffled = [...allOptions].sort(() => Math.random() - 0.5);
        setAnswerOptions(shuffled);
        setSelectedAnswer(null);
        setDraggingChip(null);
    }, [question, correctAnswer]);

    // Handle drag start
    const handleDragStart = (e: React.DragEvent, chip: string) => {
        e.dataTransfer.setData('text/plain', chip);
        e.dataTransfer.effectAllowed = 'move';
        setDraggingChip(chip);
    };

    // Handle drag end
    const handleDragEnd = () => {
        setDraggingChip(null);
        setDragOver(false);
    };

    // Handle drop zone drag over
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOver(true);
    };

    // Handle drop zone drag leave
    const handleDragLeave = () => {
        setDragOver(false);
    };

    // Handle drop
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const chip = e.dataTransfer.getData('text/plain');
        if (chip && answerState === 'pending') {
            setSelectedAnswer(chip);
            // Removed auto-validate to allow re-dragging/correction
        }
        setDragOver(false);
        setDraggingChip(null);
    };

    // Handle click to clear
    const handleDropZoneClick = () => {
        if (answerState === 'pending' && selectedAnswer) {
            setSelectedAnswer(null);
        }
    };

    const checkAnswer = () => {
        if (!selectedAnswer) return;
        const isCorrect = selectedAnswer.toUpperCase() === correctAnswer.toUpperCase();
        onAnswer(isCorrect, selectedAnswer);
    };

    // Build SQL display with drop zone
    const getDropZoneClass = () => {
        let className = styles.dropZone;
        if (dragOver) className += ` ${styles.dragOver}`;
        if (selectedAnswer) className += ` ${styles.filled}`;
        if (answerState === 'correct') className += ` ${styles.correct}`;
        if (answerState === 'incorrect') className += ` ${styles.incorrect}`;
        return className;
    };

    // Highlight SQL keywords
    const highlightSQL = (text: string): string => {
        const keywords = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'ON', 'AS', 'IN', 'BETWEEN', 'LIKE', 'IS', 'NULL', 'ASC', 'DESC', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'WITH', 'OVER', 'PARTITION BY', 'ROW_NUMBER', 'RANK', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'EXISTS'];
        let result = text;
        keywords.forEach(kw => {
            const regex = new RegExp(`\\b(${kw})\\b(?![^<]*>)`, 'gi');
            result = result.replace(regex, `<span style="color: var(--midnight); font-weight: 600;">$1</span>`);
        });
        result = result.replace(/'([^']+)'/g, `<span style="color: #22A06B;">'$1'</span>`);
        return result;
    };

    // Create SQL with drop zone
    const renderSQL = () => {
        const parts = question.q.split('____');
        return (
            <div className={styles.sqlDisplay}>
                <span dangerouslySetInnerHTML={{ __html: highlightSQL(parts[0] || '') }} />
                <span
                    ref={dropZoneRef}
                    className={getDropZoneClass()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={handleDropZoneClick}
                >
                    {selectedAnswer || ''}
                </span>
                <span dangerouslySetInnerHTML={{ __html: highlightSQL(parts[1] || '') }} />
            </div>
        );
    };

    return (
        <div className={styles.container}>
            {renderSQL()}

            <div className={styles.label}>Drag an answer into the blank</div>
            <div className={styles.chipTray}>
                {answerOptions.map((chip, idx) => (
                    <div
                        key={idx}
                        className={`${styles.chip} ${selectedAnswer === chip ? styles.used : ''} ${draggingChip === chip ? styles.dragging : ''}`}
                        draggable={answerState === 'pending' && selectedAnswer !== chip}
                        onDragStart={(e) => handleDragStart(e, chip)}
                        onDragEnd={handleDragEnd}
                    >
                        {chip}
                    </div>
                ))}
            </div>

            {/* Manual Check Button */}
            {selectedAnswer && answerState === 'pending' && (
                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
                    <button
                        onClick={checkAnswer}
                        style={{
                            padding: '0.8rem 2rem',
                            background: 'var(--accent-blue)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        Check Answer
                    </button>
                </div>
            )}
        </div>
    );
}
