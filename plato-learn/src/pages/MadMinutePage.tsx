import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getModuleById } from '../modules';
import { loadModuleQuestions } from '../engine';
import { Button, LessonRenderer } from '../components';
import {
    MultipleChoice,
    CodeOrdering,
    ErrorFix,
    MultiBlank,
    DragDrop,
    TypeIn,
    FreeformSQL,
    SpotError,
    WordProblem,
    MultiDragDrop
} from '../components/Questions';
import type { Question, Round } from '../types';
import styles from './MadMinutePage.module.css';

type Difficulty = 'easy' | 'medium' | 'hard' | 'all';

interface HistoryItem {
    question: Question;
    correct: boolean;
    originalIndex: number;
    userAnswer?: string;
}

export function MadMinutePage() {
    const { moduleId } = useParams<{ moduleId: string }>();
    const navigate = useNavigate();

    // Data State
    const [allRounds, setAllRounds] = useState<Round[]>([]);
    const [loading, setLoading] = useState(true);

    // Game State
    const [timeLeft, setTimeLeft] = useState(60);
    const [score, setScore] = useState(0);
    const [gameState, setGameState] = useState<'intro' | 'playing' | 'ended' | 'lesson'>('intro');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [feedback, setFeedback] = useState<'none' | 'correct' | 'incorrect'>('none');
    const [difficulty, setDifficulty] = useState<Difficulty>('all');

    // History Tracking
    const [history, setHistory] = useState<HistoryItem[]>([]);

    // Expansion State (Inline, Flowing)
    const [expandedIds, setExpandedIds] = useState<number[]>([]);

    // Timer Ref
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Initial Load
    useEffect(() => {
        async function init() {
            if (!moduleId) return;
            const module = getModuleById(moduleId);
            if (!module) return;

            try {
                const data = await loadModuleQuestions(module.questionsPath);
                setAllRounds(data.rounds);
            } catch (e) {
                console.error("Failed to load mad minute questions", e);
            } finally {
                setLoading(false);
            }
        }
        init();
        return () => stopTimer();
    }, [moduleId]);

    const stopTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const startGame = () => {
        let targetRounds: Round[] = [];
        switch (difficulty) {
            case 'easy': targetRounds = allRounds.slice(0, 2); break;
            case 'medium': targetRounds = allRounds.slice(2, 5); break;
            case 'hard': targetRounds = allRounds.slice(5); break;
            case 'all': default: targetRounds = allRounds; break;
        }

        const pool = targetRounds
            .flatMap(r => r.questions)
            .filter(q => q.type !== 'fill-blank' && q.type !== 'freeform-sql' && q.type !== undefined);

        if (pool.length === 0) {
            alert("No questions available for this difficulty level yet!");
            return;
        }

        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }

        setQuestions(pool);
        setGameState('playing');
        setScore(0);
        setCurrentQIndex(0);
        setTimeLeft(60);
        setHistory([]);
        setExpandedIds([]);

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    stopTimer();
                    setGameState('ended');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleAnswer = (isCorrect: boolean, answer?: string) => {
        setFeedback(isCorrect ? 'correct' : 'incorrect');
        setTimeout(() => setFeedback('none'), 300);

        const currentQ = questions[currentQIndex];
        const currentIndex = history.length;
        setHistory(prev => [...prev, {
            question: currentQ,
            correct: isCorrect,
            originalIndex: currentIndex,
            userAnswer: answer
        }]);

        if (isCorrect) {
            setScore(s => s + 1);
        }

        if (currentQIndex < questions.length - 1) {
            setCurrentQIndex(currentQIndex + 1);
        } else {
            stopTimer();
            setGameState('ended');
        }
    };

    const toggleExpand = (idx: number) => {
        setExpandedIds(prev =>
            prev.includes(idx) ? prev.filter(id => id !== idx) : [...prev, idx]
        );
    };

    const highlightSQL = (text: string): string => {
        const keywords = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'ON', 'AS', 'IN', 'BETWEEN', 'LIKE', 'IS', 'NULL', 'ASC', 'DESC', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'WITH', 'OVER', 'PARTITION BY', 'ROW_NUMBER', 'RANK', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'EXISTS'];
        let result = text || "";
        keywords.forEach(kw => {
            const regex = new RegExp(`\\b(${kw})\\b(?![^<]*>)`, 'gi');
            result = result.replace(regex, `<span style="color: #60a5fa; font-weight: 700;">$1</span>`);
        });
        result = result.replace(/'([^']+)'/g, `<span style="color: #4ade80;">'$1'</span>`);
        return result;
    };

    const SimulatedOutput = ({ question }: { question: Question }) => {
        const query = question.a?.toString() || question.q || "";
        const cols = query.match(/SELECT\s+(.*?)\s+FROM/i)?.[1]?.split(',').map(s => s.trim()) || ['id', 'name', 'value'];
        const headers = cols.map(c => c.split(' as ')[1] || c.split('.').pop() || c).slice(0, 3);
        const rows = [
            ['1', 'Widget A', '100'],
            ['2', 'Widget B', '250'],
            ['3', 'Widget C', '50']
        ];
        return (
            <table className={styles.simTable}>
                <thead>
                    <tr>{headers.map((h, i) => <th key={i}>{h.replace(/['"]/g, '')}</th>)}</tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr key={i}>{headers.map((_, cIdx) => <td key={cIdx}>{row[cIdx] || '-'}</td>)}</tr>
                    ))}
                </tbody>
            </table>
        );
    };

    const DifficultyBtn = ({ level, label }: { level: Difficulty, label: string }) => (
        <button
            className={`${styles.diffBtn} ${difficulty === level ? styles.active : ''}`}
            onClick={() => setDifficulty(level)}
            style={{
                padding: '0.8rem 1.5rem',
                margin: '0 0.5rem',
                borderRadius: '8px',
                border: difficulty === level ? 'none' : '1px solid rgba(82, 113, 255, 0.3)',
                background: difficulty === level ? 'var(--accent-blue)' : 'rgba(255,255,255,0.9)',
                color: difficulty === level ? 'white' : '#1e293b',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.2s',
                boxShadow: difficulty === level ? '0 4px 12px rgba(58, 123, 213, 0.3)' : '0 2px 5px rgba(0,0,0,0.05)'
            }}
        >
            {label}
        </button>
    );

    if (loading) return <div className={styles.container}>Loading...</div>;

    const currentQuestion = questions[currentQIndex];

    const historyGroups = history.reduce((groups, item) => {
        const type = item.question.type || 'unknown';
        if (!groups[type]) groups[type] = [];
        groups[type].push(item);
        return groups;
    }, {} as Record<string, HistoryItem[]>);

    const renderQuestionCurrent = () => {
        if (!currentQuestion) return null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const props: any = {
            question: currentQuestion,
            onAnswer: handleAnswer,
            answerState: 'pending'
        };
        switch (currentQuestion.type) {
            case 'multiple-choice': return <MultipleChoice {...props} />;
            case 'code-ordering': return <CodeOrdering {...props} />;
            case 'error-fix': return <ErrorFix {...props} />;
            case 'multi-blank': return <MultiBlank {...props} />;
            case 'drag-drop': return <DragDrop {...props} />;
            case 'type-in': return <TypeIn {...props} />;
            case 'freeform-sql': return <FreeformSQL {...props} />;
            case 'spot-error': return <SpotError {...props} />;
            case 'word-problem': return <WordProblem {...props} />;
            case 'multi-drag-drop': return <MultiDragDrop {...props} />;
            case 'fill-blank': return <div className={styles.instruction}>Fill-Blank not supported in Speed Mode.</div>;
            default: return <div>Unknown type</div>;
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Button variant="secondary" size="sm" onClick={() => navigate(`/course/${moduleId}`)}>Exit</Button>
                <div className={`${styles.timer} ${timeLeft <= 10 ? styles.urgent : ''}`}>
                    {timeLeft}s
                </div>
                <div className={styles.score}>Score: {score}</div>
            </div>

            {gameState === 'intro' && (
                <div className={styles.resultContainer}>
                    <h1>Mad Minute Challenge</h1>
                    <p style={{ marginBottom: '2rem' }}>60 seconds. Unlimited questions. Speed testing.</p>
                    <div style={{ marginBottom: '3rem' }}>
                        <div style={{ marginBottom: '1rem', opacity: 0.7 }}>SELECT DIFFICULTY</div>
                        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '10px' }}>
                            <DifficultyBtn level="easy" label="Easy (R1-R2)" />
                            <DifficultyBtn level="medium" label="Medium (R3-R5)" />
                            <DifficultyBtn level="hard" label="Hard (R6-R7)" />
                            <DifficultyBtn level="all" label="All Rounds" />
                        </div>
                    </div>
                    <div className={styles.actions}>
                        <Button variant="secondary" size="lg" onClick={() => setGameState('lesson')}>📖 Read Lesson</Button>
                        <Button variant="primary" size="lg" onClick={startGame}>Start Timer</Button>
                    </div>
                </div>
            )}

            {gameState === 'lesson' && (
                <div className={styles.resultContainer}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h1>Lesson: {difficulty.toUpperCase()}</h1>
                        <Button variant="primary" size="sm" onClick={() => setGameState('intro')}>Close</Button>
                    </div>
                    <div className={styles.lessonContent} style={{
                        textAlign: 'left',
                        background: 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(12px)',
                        padding: '2.5rem',
                        borderRadius: '24px',
                        color: '#1e293b',
                        border: '1px solid rgba(255, 255, 255, 0.5)',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.05)'
                    }}>
                        {(() => {
                            let targetRounds: Round[] = [];
                            switch (difficulty) {
                                case 'easy': targetRounds = allRounds.slice(0, 2); break;
                                case 'medium': targetRounds = allRounds.slice(2, 5); break;
                                case 'hard': targetRounds = allRounds.slice(5); break;
                                case 'all': default: targetRounds = allRounds; break;
                            }
                            return targetRounds.map(r => (
                                <div key={r.id} style={{ marginBottom: '3rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '2rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                        <span style={{ fontSize: '2rem' }}>{r.icon}</span>
                                        <h2 style={{ margin: 0, color: '#0f172a' }}>{r.name}</h2>
                                    </div>
                                    {r.lesson && r.lesson.length > 0 ? (
                                        <div style={{ lineHeight: '1.6' }}>
                                            <LessonRenderer
                                                content={Array.isArray(r.lesson)
                                                    ? r.lesson.map(s => `## ${s.title}\n${s.content}`).join('\n\n')
                                                    : r.lesson}
                                            />
                                        </div>
                                    ) : (
                                        <p style={{ fontStyle: 'italic', opacity: 0.6 }}>No lesson content available for this round.</p>
                                    )}
                                </div>
                            ));
                        })()}
                    </div>
                    <div className={styles.actions} style={{ marginTop: '2rem' }}>
                        <Button variant="primary" size="lg" onClick={startGame}>Start Practice</Button>
                    </div>
                </div>
            )}

            {gameState === 'ended' && (
                <div className={styles.resultContainer} style={{ textAlign: 'left', maxWidth: '100%' }}>
                    <div style={{ textAlign: 'center' }}>
                        <h1>Time's Up!</h1>
                        <div className={styles.finalScore}>{score} Points</div>
                        <div className={styles.actions} style={{ marginBottom: '3rem' }}>
                            <Button variant="primary" onClick={startGame}>Try Again</Button>
                            <Button variant="secondary" onClick={() => navigate(`/course/${moduleId}`)}>Back to Course</Button>
                        </div>
                    </div>

                    {/* Tiled Dashboard: Flowing Grid */}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
                        {Object.entries(historyGroups).map(([type, items]) => (
                            <div key={type} className={styles.summaryGroup}>
                                <div className={styles.groupTitle}>
                                    {type.replace(/-/g, ' ')} ({items.length})
                                </div>
                                <div className={styles.summaryGrid}>
                                    {items.map((item) => {
                                        const isExpanded = expandedIds.includes(item.originalIndex);
                                        return (
                                            <div
                                                key={item.originalIndex}
                                                className={`${styles.summaryTile} ${isExpanded ? styles.expanded : ''}`}
                                                onClick={() => toggleExpand(item.originalIndex)}
                                            >
                                                <div className={styles.tileHeader}>
                                                    <span className={`${styles.tileStatus} ${item.correct ? styles.correct : styles.incorrect}`}>
                                                        {item.correct ? 'PASSED' : 'FAILED'}
                                                    </span>
                                                    <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>#{item.originalIndex + 1}</span>
                                                </div>
                                                <div className={styles.tileGoal}>{item.question.goal}</div>

                                                {/* Expanded Content Flowing Inside Tile */}
                                                {isExpanded && (
                                                    <div className={styles.tileContent} onClick={e => e.stopPropagation()}>

                                                        {/* Comparison Box */}
                                                        {!item.correct && (
                                                            <div className={styles.comparisonBox}>
                                                                {item.userAnswer && (
                                                                    <div className={styles.compRow}>
                                                                        <div className={styles.compLabel}>YOU ANSWERED:</div>
                                                                        <div className={`${styles.compValue} ${styles.wrong}`}>
                                                                            {item.userAnswer}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                <div className={styles.compRow}>
                                                                    <div className={styles.compLabel}>CORRECT ANSWER:</div>
                                                                    <div className={`${styles.compValue} ${styles.right}`} dangerouslySetInnerHTML={{
                                                                        __html: highlightSQL(
                                                                            Array.isArray(item.question.a) ? item.question.a[0] : (item.question.a || item.question.q)
                                                                        )
                                                                    }} />
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Hint / How To Remember */}
                                                        {!item.correct && item.question.hint && (
                                                            <div className={styles.hintSection}>
                                                                <div className={styles.hintHeader}>
                                                                    <span>💡 HOW TO REMEMBER</span>
                                                                </div>
                                                                <div className={styles.hintBody}>
                                                                    {item.question.hint}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* For Correct Items or just General Info */}
                                                        {item.correct && (
                                                            <div className={styles.correctInfo}>
                                                                <div className={styles.compLabel}>QUERY:</div>
                                                                <div className={styles.codeBlock} dangerouslySetInnerHTML={{
                                                                    __html: highlightSQL(
                                                                        Array.isArray(item.question.a) ? item.question.a[0] : (item.question.a || item.question.q)
                                                                    )
                                                                }} />
                                                            </div>
                                                        )}

                                                        <div style={{ marginTop: '1.5rem' }}>
                                                            <div className={styles.detailLabel}>OUTPUT PREVIEW</div>
                                                            <SimulatedOutput question={item.question} />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {gameState === 'playing' && (
                <div className={styles.questionContainer}>
                    <div className={`${styles.feedbackOverlay} ${styles[feedback]}`} />
                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{ fontSize: '1.2rem', color: '#8b9bb4', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                            {currentQuestion.goal}
                        </div>
                        {currentQuestion.type === 'multiple-choice' && (
                            <div
                                className={styles.codeBlock}
                                dangerouslySetInnerHTML={{ __html: highlightSQL(currentQuestion.q) }}
                            />
                        )}
                    </div>
                    {renderQuestionCurrent()}
                </div>
            )}
        </div>
    );
}
