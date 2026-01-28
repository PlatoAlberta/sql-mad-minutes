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
 */
export function SkillTree({ moduleId, questionData }: SkillTreeProps) {
    const navigate = useNavigate();
    const { getRoundScore, isRoundUnlocked } = useGamification();

    const handleNodeClick = (round: Round, roundIndex: number) => {
        if (!isRoundUnlocked(moduleId, round.prerequisites)) return;
        navigate(`/module/${moduleId}?round=${roundIndex}`);
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
                                                    // Simplified: Just use absolute positioning relative to the grid cell?
                                                    // Actually, mapping to grid columns is easier.
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
                                const passed = score.bestScore >= 60;

                                // If single item in multi-col grid, assume it should center relative to its 'col'
                                // or if it replaces the whole row (like root), maybe span all?
                                // Based on screenshots and intent, root and merge nodes (single items) seem to be centered visually.
                                // Our data has them at col 0. To center them in a 2-col grid, we force span.
                                const shouldSpanCenter = roundsInRow.length === 1 && maxCols > 1;

                                return (
                                    <div
                                        key={round.id}
                                        className={styles.nodeCell}
                                        style={{
                                            gridColumn: shouldSpanCenter ? `1 / -1` : col + 1,
                                        }}
                                    >
                                        <div
                                            className={`
                        ${styles.nodeCard}
                        ${!unlocked ? styles.locked : ''}
                        ${passed ? styles.completed : ''}
                      `}
                                            onClick={() => handleNodeClick(round, roundIndex)}
                                        >
                                            {/* Lock badge etc... */}
                                            {!unlocked && <div className={styles.lockBadge}>🔒</div>}
                                            {unlocked && !score.completed && !round.prerequisites?.length && (
                                                <div className={styles.startBadge}>Start Here</div>
                                            )}

                                            <div className={styles.nodeIcon}>R{roundIndex + 1}</div>
                                            <div className={styles.nodeName}>{round.name}</div>
                                            <div className={styles.nodeDesc}>{round.description}</div>

                                            {unlocked && (
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

                                            {!unlocked && (
                                                <div className={styles.scoreText}>{getPrereqMessage(round)}</div>
                                            )}
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
