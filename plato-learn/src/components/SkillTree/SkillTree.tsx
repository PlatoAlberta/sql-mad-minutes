import { useNavigate } from 'react-router-dom';
import { useGamification } from '../../engine';
import type { QuestionData, Round } from '../../types';
import styles from './SkillTree.module.css';

interface SkillTreeProps {
    moduleId: string;
    questionData: QuestionData;
}

/**
 * Skill tree component showing branching progression of rounds
 * Now shows separate Lesson tiles (📖) before Practice tiles
 */
export function SkillTree({ moduleId, questionData }: SkillTreeProps) {
    const navigate = useNavigate();
    const { getRoundScore, isRoundUnlocked, isLessonComplete } = useGamification();

    // Handle clicking a practice node
    const handlePracticeClick = (round: Round, roundIndex: number) => {
        const unlocked = isRoundUnlocked(moduleId, round.prerequisites);
        const lessonDone = !round.lesson || round.lesson.length === 0 || isLessonComplete(moduleId, round.id);

        if (!unlocked || !lessonDone) return;
        navigate(`/practice/${moduleId}?round=${roundIndex}`);
    };

    // Handle clicking a lesson node
    const handleLessonClick = (round: Round) => {
        const unlocked = isRoundUnlocked(moduleId, round.prerequisites);
        if (!unlocked) return;
        navigate(`/lesson/${moduleId}/${round.id}`);
    };

    // Group rounds by row
    const roundsByRow: Map<number, { round: Round; index: number; col: number }[]> = new Map();
    questionData.rounds.forEach((round, index) => {
        const row = round.row ?? index;
        const col = round.col ?? 0;
        if (!roundsByRow.has(row)) {
            roundsByRow.set(row, []);
        }
        roundsByRow.get(row)!.push({ round, index, col });
    });

    // Sort by row
    const sortedRows = Array.from(roundsByRow.entries()).sort((a, b) => a[0] - b[0]);

    // Determine global max columns for grid consistency
    let maxCols = 1;
    sortedRows.forEach(([_, rounds]) => {
        rounds.forEach(r => {
            maxCols = Math.max(maxCols, r.col + 1);
        });
    });

    // Helper to determine unlocked status for connector
    const isPathUnlocked = (prereqs?: string[]) => {
        return isRoundUnlocked(moduleId, prereqs);
    };

    // Check if current round should show "complete all prerequisites" message
    const getPrereqMessage = (round: Round): string | null => {
        if (!round.prerequisites || round.prerequisites.length <= 1) {
            return 'Score 60%+ on previous to unlock';
        }
        const completed = round.prerequisites.filter(pid => {
            const score = getRoundScore(moduleId, pid);
            return score.completed && score.bestScore >= 60;
        });
        return `Complete ${round.prerequisites.length - completed.length} more prerequisite(s)`;
    };

    return (
        <div className={styles.container}>
            {sortedRows.map(([rowIdx, roundsInRow], rowIndex) => {
                // Sort columns within row
                const sortedCols = roundsInRow.sort((a, b) => a.col - b.col);
                const isFirstRow = rowIndex === 0;

                // Determine connector logic from PREVIOUS row to CURRENT row
                let connectorType: 'straight' | 'split' | 'merge' | 'none' = 'none';
                const prevRowRounds = rowIndex > 0 ? sortedRows[rowIndex - 1][1] : [];

                if (!isFirstRow) {
                    if (prevRowRounds.length === 1 && roundsInRow.length > 1) connectorType = 'split';
                    else if (prevRowRounds.length > 1 && roundsInRow.length === 1) connectorType = 'merge';
                    else connectorType = 'straight';
                }

                const isRowUnlocked = roundsInRow.some(r => isPathUnlocked(r.round.prerequisites));

                return (
                    <div key={rowIdx} className={styles.row}>
                        {/* Connector lines from previous row */}
                        {!isFirstRow && (
                            <div
                                className={styles.connectorRow}
                                style={{
                                    gridTemplateColumns: maxCols > 1 ? `repeat(${maxCols}, 1fr)` : '1fr'
                                }}
                            >
                                {/* SPLIT: One parent -> Many children */}
                                {connectorType === 'split' && (
                                    <div
                                        className={`${styles.connectorSplit} ${isRowUnlocked ? styles.unlocked : ''}`}
                                        style={{
                                            gridColumnStart: sortedCols[0].col + 1,
                                            gridColumnEnd: sortedCols[sortedCols.length - 1].col + 2
                                        }}
                                    >
                                        {/* Parent line coming down from center of this block */}
                                        <div className={styles.lineFromParent} />
                                        {/* Horizontal bar spanning children */}
                                        <div className={styles.lineHorizontal} />
                                        {/* Lines down to each child */}
                                        {sortedCols.map((col, i) => (
                                            <div
                                                key={i}
                                                className={styles.lineToChild}
                                                style={{
                                                    left: `${((col.col - sortedCols[0].col) / (sortedCols[sortedCols.length - 1].col - sortedCols[0].col + 1)) * 100 + (100 / (sortedCols.length * 2))}%`
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* MERGE: Many parents -> One child */}
                                {connectorType === 'merge' && (
                                    <div
                                        className={`${styles.connectorMerge} ${isRowUnlocked ? styles.unlocked : ''}`}
                                        style={{
                                            gridColumnStart: prevRowRounds[0].col + 1,
                                            gridColumnEnd: prevRowRounds[prevRowRounds.length - 1].col + 2
                                        }}
                                    >
                                        {/* Horizontal bar spanning parents */}
                                        <div className={styles.lineHorizontal} />
                                        {/* Line down to child (centered in this block) */}
                                        <div className={styles.lineToChild} />
                                    </div>
                                )}

                                {/* STRAIGHT: Vertical lines for each column match */}
                                {connectorType === 'straight' && sortedCols.map((round) => {
                                    const unlocked = isPathUnlocked(round.round.prerequisites);
                                    return (
                                        <div
                                            key={round.round.id}
                                            className={`${styles.connectorStraight} ${unlocked ? styles.unlocked : ''}`}
                                            style={{ gridColumn: round.col + 1 }}
                                        />
                                    );
                                })}
                            </div>
                        )}

                        {/* Nodes in this row */}
                        <div
                            className={styles.nodeRow}
                            style={{
                                gridTemplateColumns: maxCols > 1 ? `repeat(${maxCols}, 1fr)` : '1fr',
                            }}
                        >
                            {sortedCols.map(({ round, index: roundIndex, col }) => {
                                const score = getRoundScore(moduleId, round.id);
                                const unlocked = isRoundUnlocked(moduleId, round.prerequisites);
                                const hasLesson = round.lesson && round.lesson.length > 0;
                                const lessonDone = isLessonComplete(moduleId, round.id);
                                const practiceUnlocked = unlocked && (!hasLesson || lessonDone);
                                const passed = score.bestScore >= 60;
                                const shouldSpanCenter = roundsInRow.length === 1 && maxCols > 1;

                                return (
                                    <div
                                        key={round.id}
                                        className={styles.nodeCell}
                                        style={{
                                            gridColumn: shouldSpanCenter ? `1 / -1` : col + 1,
                                        }}
                                    >
                                        {/* Render Lesson + Practice pair */}
                                        <div className={styles.nodePair}>
                                            {/* LESSON TILE */}
                                            {hasLesson && (
                                                <>
                                                    <div
                                                        className={`
                                                            ${styles.nodeCard}
                                                            ${styles.lessonNode}
                                                            ${!unlocked ? styles.locked : ''}
                                                            ${lessonDone ? styles.completed : ''}
                                                        `}
                                                        onClick={() => handleLessonClick(round)}
                                                    >
                                                        {!unlocked && <div className={styles.lockBadge}>🔒</div>}
                                                        {unlocked && !lessonDone && !round.prerequisites?.length && (
                                                            <div className={styles.startBadge}>Start Here</div>
                                                        )}
                                                        <div className={styles.nodeIcon}>📖</div>
                                                        <div className={styles.nodeName}>{round.name} Lesson</div>
                                                        <div className={styles.nodeDesc}>Learn the concepts</div>
                                                        {lessonDone && (
                                                            <div className={styles.completedBadge}>✓ Complete</div>
                                                        )}
                                                        {!unlocked && (
                                                            <div className={styles.scoreText}>{getPrereqMessage(round)}</div>
                                                        )}
                                                    </div>

                                                    {/* Connector between lesson and practice */}
                                                    <div className={`${styles.pairConnector} ${lessonDone ? styles.unlocked : ''}`} />
                                                </>
                                            )}

                                            {/* PRACTICE TILE */}
                                            <div
                                                className={`
                                                    ${styles.nodeCard}
                                                    ${!practiceUnlocked ? styles.locked : ''}
                                                    ${passed ? styles.completed : ''}
                                                `}
                                                onClick={() => handlePracticeClick(round, roundIndex)}
                                            >
                                                {!practiceUnlocked && <div className={styles.lockBadge}>🔒</div>}
                                                {practiceUnlocked && !score.completed && !hasLesson && !round.prerequisites?.length && (
                                                    <div className={styles.startBadge}>Start Here</div>
                                                )}

                                                <div className={styles.nodeIcon}>R{roundIndex + 1}</div>
                                                <div className={styles.nodeName}>{round.name}</div>
                                                <div className={styles.nodeDesc}>{round.description}</div>

                                                {practiceUnlocked && (
                                                    <>
                                                        <div className={styles.scoreBar}>
                                                            <div
                                                                className={`${styles.scoreFill} ${passed ? styles.passed : ''}`}
                                                                style={{ width: `${score.bestScore}%` }}
                                                            />
                                                        </div>
                                                        <div className={`${styles.scoreText} ${passed ? styles.passed : ''}`}>
                                                            {score.completed ? `Best: ${score.bestScore}%` : score.total > 0 ? `${score.correct}/${score.total}` : 'Not started'}
                                                        </div>
                                                    </>
                                                )}

                                                {!practiceUnlocked && hasLesson && !lessonDone && (
                                                    <div className={styles.scoreText}>Complete lesson first</div>
                                                )}

                                                {!practiceUnlocked && !hasLesson && (
                                                    <div className={styles.scoreText}>{getPrereqMessage(round)}</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
