import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getModuleById } from '../modules';
import { loadModuleQuestions, useGamification } from '../engine';
import { Button } from '../components';
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
import type { QuestionData, Question, Round, QuestionType } from '../types';
import styles from './ModulePage.module.css';

/**
 * Module learning page with question flow
 * Supports multiple question types: fill-blank, multiple-choice, code-ordering, error-fix, multi-blank
 */
export function ModulePage() {
    const { moduleId } = useParams<{ moduleId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { addXP, incrementStreak, resetStreak, recordAnswer, completeRound, isRoundUnlocked, resetRoundProgress } = useGamification();

    const [questionData, setQuestionData] = useState<QuestionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Get round from URL query param or default to 0
    const initialRound = parseInt(searchParams.get('round') || '0', 10);
    const [currentRoundIndex, setCurrentRoundIndex] = useState(initialRound);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [answerState, setAnswerState] = useState<'pending' | 'correct' | 'incorrect'>('pending');
    const [showHint, setShowHint] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [roundComplete, setRoundComplete] = useState(false);
    const [roundScore, setRoundScore] = useState({ correct: 0, total: 0 });

    const module = moduleId ? getModuleById(moduleId) : null;

    // Load question data
    useEffect(() => {
        if (!module) {
            setError('Module not found');
            setLoading(false);
            return;
        }

        loadModuleQuestions(module.questionsPath)
            .then(data => {
                setQuestionData(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, [module]);

    // Reset round progress when starting
    useEffect(() => {
        if (module && questionData && currentRoundIndex >= 0) {
            const round = questionData.rounds[currentRoundIndex];
            if (round) {
                resetRoundProgress(module.id, round.id);
                setRoundScore({ correct: 0, total: 0 });
                setCurrentQuestionIndex(0);
                setRoundComplete(false);
            }
        }
    }, [currentRoundIndex, module, questionData]);

    const currentRound: Round | null = questionData?.rounds[currentRoundIndex] || null;
    const currentQuestion: Question | null = currentRound?.questions[currentQuestionIndex] || null;

    // Get question type (default to fill-blank for backwards compatibility)
    const questionType: QuestionType = currentQuestion?.type || 'fill-blank';

    // Shuffle answers for fill-blank type
    const shuffleArray = <T,>(arr: T[]): T[] => {
        const shuffled = [...arr];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    const [answerOptions, setAnswerOptions] = useState<string[]>([]);

    useEffect(() => {
        if (currentQuestion) {
            const answer = Array.isArray(currentQuestion.a) ? currentQuestion.a[0] : currentQuestion.a;
            setAnswerOptions(shuffleArray([answer, ...currentQuestion.distractors]));
            setSelectedAnswer(null);
            setAnswerState('pending');
            setShowHint(false);
        }
    }, [currentQuestion]);

    const selectRound = (round: Round, index: number) => {
        if (!isRoundUnlocked(module?.id || '', round.prerequisites)) return;
        setCurrentRoundIndex(index);
    };

    const handleAnswerSelect = (answer: string) => {
        if (answerState !== 'pending') return;
        setSelectedAnswer(answer);
    };

    // Handle answer from child components
    const handleQuestionAnswer = useCallback((isCorrect: boolean) => {
        if (!module || !currentRound) return;

        // Record answer
        recordAnswer(module.id, currentRound.id, isCorrect);
        setRoundScore(prev => ({
            correct: prev.correct + (isCorrect ? 1 : 0),
            total: prev.total + 1,
        }));

        if (isCorrect) {
            setAnswerState('correct');
            addXP(10);
            incrementStreak();
        } else {
            setAnswerState('incorrect');
            resetStreak();
        }

        setShowResult(true);
    }, [module, currentRound, recordAnswer, addXP, incrementStreak, resetStreak]);

    const checkAnswer = useCallback(() => {
        if (!selectedAnswer || !currentQuestion) return;
        const correctAnswer = Array.isArray(currentQuestion.a) ? currentQuestion.a[0] : currentQuestion.a;
        const isCorrect = selectedAnswer.toUpperCase() === correctAnswer.toUpperCase();
        handleQuestionAnswer(isCorrect);
    }, [selectedAnswer, currentQuestion, handleQuestionAnswer]);

    const nextQuestion = useCallback(() => {
        if (!module || !currentRound) return;

        const nextIndex = currentQuestionIndex + 1;

        if (nextIndex >= currentRound.questions.length) {
            // Round complete - calculate score and show summary
            completeRound(module.id, currentRound.id, currentRound.questions.length);
            setRoundComplete(true);
        } else {
            setCurrentQuestionIndex(nextIndex);
        }

        setShowResult(false);
    }, [currentQuestionIndex, currentRound, module, completeRound]);

    const skipQuestion = () => {
        // Skip counts as incorrect
        if (module && currentRound) {
            recordAnswer(module.id, currentRound.id, false);
            setRoundScore(prev => ({
                correct: prev.correct,
                total: prev.total + 1,
            }));
        }
        nextQuestion();
    };

    const goToNextRound = () => {
        if (currentRoundIndex < (questionData?.rounds.length || 0) - 1) {
            setCurrentRoundIndex(prev => prev + 1);
        } else {
            navigate('/');
        }
    };

    const retryRound = () => {
        if (module && currentRound) {
            resetRoundProgress(module.id, currentRound.id);
        }
        setRoundScore({ correct: 0, total: 0 });
        setCurrentQuestionIndex(0);
        setRoundComplete(false);
    };

    // Highlight SQL keywords
    const highlightSQL = (sql: string): string => {
        const keywords = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'ON', 'AS', 'IN', 'BETWEEN', 'LIKE', 'IS', 'NULL', 'ASC', 'DESC', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'WITH', 'OVER', 'PARTITION BY', 'ROW_NUMBER', 'RANK', 'DENSE_RANK', 'LEAD', 'LAG', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'EXISTS', 'COALESCE', 'NULLIF'];
        let result = sql;
        keywords.forEach(kw => {
            const regex = new RegExp(`\\b(${kw}) \\b(?![^<]*>)`, 'gi');
            result = result.replace(regex, `<span class="${styles.sqlKeyword}">$1</span>`);
        });
        result = result.replace(/'([^']+)'/g, `<span class="${styles.sqlString}">'$1'</span>`);
        return result;
    };

    // Render question based on type
    const renderQuestion = () => {
        if (!currentQuestion) return null;

        switch (questionType) {
            case 'multiple-choice':
                return (
                    <MultipleChoice
                        question={currentQuestion}
                        onAnswer={handleQuestionAnswer}
                        answerState={answerState}
                    />
                );

            case 'code-ordering':
                return (
                    <CodeOrdering
                        question={currentQuestion}
                        onAnswer={handleQuestionAnswer}
                        answerState={answerState}
                    />
                );

            case 'error-fix':
                return (
                    <ErrorFix
                        question={currentQuestion}
                        onAnswer={handleQuestionAnswer}
                        answerState={answerState}
                    />
                );

            case 'multi-blank':
                return (
                    <MultiBlank
                        question={currentQuestion}
                        onAnswer={handleQuestionAnswer}
                        answerState={answerState}
                    />
                );

            case 'drag-drop':
                return (
                    <DragDrop
                        question={currentQuestion}
                        onAnswer={handleQuestionAnswer}
                        answerState={answerState}
                    />
                );

            case 'type-in':
                return (
                    <TypeIn
                        question={currentQuestion}
                        onAnswer={handleQuestionAnswer}
                        answerState={answerState}
                    />
                );

            case 'freeform-sql':
                return (
                    <FreeformSQL
                        question={currentQuestion}
                        onAnswer={handleQuestionAnswer}
                        answerState={answerState}
                    />
                );

            case 'spot-error':
                return (
                    <SpotError
                        question={currentQuestion}
                        onAnswer={handleQuestionAnswer}
                        answerState={answerState}
                    />
                );

            case 'word-problem':
                return (
                    <WordProblem
                        question={currentQuestion}
                        onAnswer={handleQuestionAnswer}
                        answerState={answerState}
                    />
                );

            case 'multi-drag-drop':
                return (
                    <MultiDragDrop
                        question={currentQuestion}
                        onAnswer={handleQuestionAnswer}
                        answerState={answerState}
                    />
                );

            case 'fill-blank':
            default: {
                const dropZoneState = answerState === 'correct' ? styles.correct : answerState === 'incorrect' ? styles.incorrect : selectedAnswer ? styles.filled : '';
                const sqlWithBlank = currentQuestion.q.replace(
                    /____/g,
                    `<span class="${styles.dropZone} ${dropZoneState}" id="drop-zone">${selectedAnswer || ''}</span>`
                );
                return (
                    <div
                        className={styles.sqlDisplay}
                        dangerouslySetInnerHTML={{ __html: highlightSQL(sqlWithBlank) }}
                    />
                );
            }
        }
    };

    // Render answer controls based on type
    const renderAnswerControls = () => {
        // For fill-blank, show the chip tray
        if (questionType === 'fill-blank' || !currentQuestion?.type) {
            return (
                <>
                    <div className={styles.trayLabel}>Select an answer</div>
                    <div className={styles.answerChips}>
                        {answerOptions.map((answer, idx) => (
                            <button
                                key={idx}
                                className={`${styles.answerChip} ${selectedAnswer === answer ? styles.used : ''} `}
                                onClick={() => handleAnswerSelect(answer)}
                                disabled={answerState !== 'pending'}
                            >
                                {answer}
                            </button>
                        ))}
                    </div>
                </>
            );
        }
        return null;
    };

    // Loading state
    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.loadingIcon}>...</div>
                <p>Loading questions...</p>
            </div>
        );
    }

    // Error state
    if (error || !module || !questionData) {
        return (
            <div className={styles.error}>
                <div className={styles.errorIcon}>!</div>
                <h3>Error Loading Module</h3>
                <p>{error || 'Module not found'}</p>
                <Button onClick={() => navigate('/')}>Back to Home</Button>
            </div>
        );
    }

    // Round Complete Summary
    if (roundComplete && currentRound) {
        const percentage = Math.round((roundScore.correct / roundScore.total) * 100);
        const passed = percentage >= 60;
        const canContinue = passed && currentRoundIndex < questionData.rounds.length - 1;

        return (
            <div className={styles.roundSummary}>
                <div className={`${styles.summaryIcon} ${passed ? styles.passed : styles.failed} `}>
                    {passed ? '★' : '↻'}
                </div>
                <h2 className={styles.summaryTitle}>
                    {passed ? 'Round Complete!' : 'Keep Practicing!'}
                </h2>
                <div className={styles.summaryScore}>
                    <span className={styles.scoreNumber}>{percentage}%</span>
                    <span className={styles.scoreLabel}>{roundScore.correct}/{roundScore.total} correct</span>
                </div>
                <p className={styles.summaryMessage}>
                    {passed
                        ? 'Great job! You unlocked the next round.'
                        : 'You need 60% to unlock the next round. Try again!'}
                </p>
                <div className={styles.summaryActions}>
                    <Button variant="secondary" onClick={() => navigate('/')}>Back to Tree</Button>
                    {passed ? (
                        canContinue ? (
                            <Button onClick={goToNextRound}>Next Round</Button>
                        ) : (
                            <Button onClick={() => navigate('/')}>All Done!</Button>
                        )
                    ) : (
                        <Button onClick={retryRound}>Try Again</Button>
                    )}
                </div>
            </div>
        );
    }

    if (!currentQuestion || !currentRound) {
        return (
            <div className={styles.error}>
                <div className={styles.errorIcon}>!</div>
                <h3>No Questions Available</h3>
                <Button onClick={() => navigate('/')}>Back to Home</Button>
            </div>
        );
    }

    // Get correct answer for result display
    const correctAnswer = Array.isArray(currentQuestion.a)
        ? currentQuestion.a.join(', ')
        : currentQuestion.a;

    return (
        <div className={styles.container}>
            {/* Module Header */}
            <div className={styles.moduleHeader}>
                <div
                    className={styles.moduleIcon}
                    style={{ background: `linear - gradient(135deg, ${module.color}, var(--midnight))` }}
                >
                    {module.icon}
                </div>
                <div className={styles.moduleInfo}>
                    <h2>{currentRound.name}</h2>
                    <p>Question {currentQuestionIndex + 1} of {currentRound.questions.length}</p>
                </div>
                <div className={styles.roundScoreLive}>
                    {roundScore.correct}/{roundScore.total}
                </div>
            </div>

            {/* Round Selector */}
            <div className={styles.roundSelector}>
                {questionData.rounds.map((round, index) => {
                    const unlocked = isRoundUnlocked(module.id, round.prerequisites);
                    return (
                        <button
                            key={round.id}
                            className={`${styles.roundBtn} ${index === currentRoundIndex ? styles.active : ''} ${!unlocked ? styles.locked : ''} `}
                            onClick={() => selectRound(round, index)}
                            disabled={!unlocked}
                        >
                            <div className={styles.roundIcon}>R{index + 1}</div>
                            <span>{round.name}</span>
                            {!unlocked && <span className={styles.lockIcon}>🔒</span>}
                        </button>
                    );
                })}
            </div>

            {/* Question Card */}
            <div className={styles.questionCard}>
                <div className={styles.questionContext}>
                    <div className={styles.topicBadge}>
                        {currentRound.name} • {questionType.replace('-', ' ').toUpperCase()}
                    </div>

                    <div className={styles.schemaBox}>
                        <div className={styles.schemaLabel}>Schema</div>
                        <div className={styles.schemaTables}>
                            {currentQuestion.ctx.map(key => questionData.schema[key]).join('\n')}
                        </div>
                    </div>

                    <div className={styles.goalText}>{currentQuestion.goal}</div>
                </div>

                <div className={styles.questionCode}>
                    {renderQuestion()}
                </div>

                <div className={styles.hintSection}>
                    <button className={styles.hintToggle} onClick={() => setShowHint(!showHint)}>
                        {showHint ? 'Hide Hint' : 'Show Hint'}
                    </button>
                    {showHint && (
                        <div className={styles.hintContent}>{currentQuestion.hint}</div>
                    )}
                </div>
            </div>

            {/* Answer Tray */}
            <div className={styles.answerTray}>
                {renderAnswerControls()}
                <div className={styles.actionButtons}>
                    <Button variant="secondary" onClick={skipQuestion}>Skip</Button>
                    {answerState === 'pending' ? (
                        <Button onClick={checkAnswer} disabled={questionType === 'fill-blank' && !selectedAnswer}>
                            Check Answer
                        </Button>
                    ) : (
                        <Button onClick={nextQuestion}>Next</Button>
                    )}
                </div>
            </div>

            {/* Result Overlay */}
            {showResult && (
                <div className={styles.resultOverlay}>
                    <div className={styles.resultCard}>
                        <div className={`${styles.resultIcon} ${answerState === 'correct' ? styles.success : styles.error} `}>
                            {answerState === 'correct' ? '✓' : '✗'}
                        </div>
                        <div className={`${styles.resultTitle} ${answerState === 'correct' ? styles.success : styles.error} `}>
                            {answerState === 'correct' ? 'Correct!' : 'Not Quite'}
                        </div>
                        <div className={styles.resultMessage}>
                            {answerState === 'correct'
                                ? 'Great job! You nailed it.'
                                : "That wasn't the right answer, but here's what you need to know:"}
                        </div>

                        {answerState === 'incorrect' && (
                            <>
                                <div className={styles.resultCorrect}>
                                    <div className="label">Correct Answer</div>
                                    <div className="answer">{correctAnswer}</div>
                                </div>
                                <div className={styles.resultExplanation}>
                                    <div className="label">Why?</div>
                                    <div className="text">{currentQuestion.hint}</div>
                                </div>
                            </>
                        )}

                        {answerState === 'correct' && (
                            <div className={styles.resultXP}>+10 XP</div>
                        )}

                        <Button onClick={nextQuestion}>Continue</Button>
                    </div>
                </div>
            )}
        </div>
    );
}
