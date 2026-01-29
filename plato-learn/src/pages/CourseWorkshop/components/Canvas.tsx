import React, { useCallback } from 'react';
import type { LearningModule, Question, Round } from '../../../types';
import type { Selection, DraggedItem } from '../types';
import { CATEGORIES } from '../constants';
import styles from '../CourseWorkshop.module.css';

interface CanvasProps {
    course: LearningModule;
    setCourse: React.Dispatch<React.SetStateAction<LearningModule | null>>;
    selection: Selection;
    setSelection: React.Dispatch<React.SetStateAction<Selection>>;
    setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
    tutorialStep: number | null;
    draggedItem: DraggedItem | null;
    setDraggedItem: React.Dispatch<React.SetStateAction<DraggedItem | null>>;
    setDragOverItem: React.Dispatch<React.SetStateAction<string | null>>;
    generateId: () => string;
}

export const Canvas: React.FC<CanvasProps> = ({
    course,
    setCourse,
    selection,
    setSelection,
    setHasUnsavedChanges,
    tutorialStep,
    draggedItem,
    setDraggedItem,
    setDragOverItem,
    generateId
}) => {

    const handleCanvasDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (draggedItem?.type === 'template' && draggedItem.templateType) {
            const newQuestion: Question = {
                id: generateId(),
                type: draggedItem.templateType,
                goal: draggedItem.templateType === 'info' ? 'New Info Block' : draggedItem.templateType === 'video' ? 'New Video' : 'New Question',
                q: draggedItem.templateType === 'info' ? '## Information\nWrite your content here.' : '',
                a: '',
                choices: draggedItem.templateType === 'multiple-choice' ? ['Option 1', 'Option 2'] : [],
                distractors: [],
                ctx: [],
                hint: '',
                codeLanguage: 'sql'
            };

            let targetRoundId: string | undefined;
            let insertIndex: number = -1;

            if (selection.type === 'question' && selection.parentId) {
                targetRoundId = selection.parentId;
                const r = course.rounds.find(x => x.id === targetRoundId);
                if (r) {
                    const idx = r.questions.findIndex(q => q.id === selection.id);
                    if (idx !== -1) insertIndex = idx + 1;
                }
            } else if (selection.type === 'round') {
                targetRoundId = selection.id;
            } else if (course.rounds.length > 0) {
                targetRoundId = course.rounds[0].id;
            }

            if (targetRoundId) {
                setCourse(prev => prev ? ({
                    ...prev,
                    rounds: prev.rounds.map(r => {
                        if (r.id === targetRoundId) {
                            const qs = [...r.questions];
                            if (insertIndex !== -1) qs.splice(insertIndex, 0, newQuestion);
                            else qs.push(newQuestion);
                            return { ...r, questions: qs };
                        }
                        return r;
                    })
                }) : null);
                setSelection({ type: 'question', id: newQuestion.id!, parentId: targetRoundId });
                setHasUnsavedChanges(true);
            } else {
                const newRoundId = generateId();
                const newRound: Round = {
                    id: newRoundId, name: 'New Round', description: '', questions: [newQuestion], row: 0, col: 0
                };
                setCourse(prev => prev ? ({ ...prev, rounds: [...prev.rounds, newRound] }) : null);
                setSelection({ type: 'question', id: newQuestion.id!, parentId: newRoundId });
                setHasUnsavedChanges(true);
            }
        }
        setDraggedItem(null);
        setDragOverItem(null);
    }, [draggedItem, selection, course, setCourse, setSelection, setHasUnsavedChanges, generateId, setDraggedItem, setDragOverItem]);

    return (
        <div
            className={`${styles.canvas} ${tutorialStep === 2 ? styles.highlightCanvas : ''}`}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
            onDrop={handleCanvasDrop}
        >
            <div className={styles.canvasContent}>
                {/* Course Level Preview */}
                {selection.type === 'course' && (
                    <div className={styles.previewCard}>
                        <div className={styles.previewIcon} style={{ color: course.color }}>
                            {course.icon}
                        </div>
                        <h2 className={styles.previewTitle}>{course.name}</h2>
                        <p style={{ marginBottom: 8, fontSize: 13, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                            {CATEGORIES.find(c => c.value === course.category)?.label || 'Engineering'}
                        </p>
                        <p className={styles.previewDesc}>{course.description || <i>No description provided</i>}</p>

                        <div className={styles.previewStats}>
                            <div className={styles.previewStat}>
                                <div className={styles.previewStatValue}>{course.rounds.length}</div>
                                <div className={styles.previewStatLabel}>Rounds</div>
                            </div>
                            <div className={styles.previewStat}>
                                <div className={styles.previewStatValue}>
                                    {course.rounds.reduce((acc, r) => acc + (r.questions?.length || 0), 0)}
                                </div>
                                <div className={styles.previewStatLabel}>Questions</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Round Level Preview */}
                {selection.type === 'round' && (() => {
                    const round = course.rounds.find(r => r.id === selection.id);
                    if (!round) return <div>Select a round</div>;
                    return (
                        <div className={styles.roundPreview}>
                            <div className={styles.roundHeader}>
                                <div className={styles.roundIndex}>#</div>
                                <div>
                                    <h3 className={styles.roundName} style={{ fontSize: 24 }}>{round.name}</h3>
                                    <div className={styles.roundMeta}>{round.description}</div>
                                </div>
                            </div>
                            <div className={styles.qList}>
                                {round.questions.length === 0 && <div className={styles.emptyCanvas} style={{ margin: 20 }}>No questions yet. Add one!</div>}
                                {round.questions.map((q, idx) => (
                                    <div key={q.id} className={styles.qItem} onClick={() => setSelection({ type: 'question', id: q.id!, parentId: round.id })} style={{ cursor: 'pointer' }}>
                                        <div style={{ fontWeight: 600 }}>{idx + 1}. {q.goal}</div>
                                        <div style={{ fontSize: 12, color: '#64748b' }}>
                                            {q.type} • {q.codeLanguage || 'text'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })()}

                {/* Question Level Preview */}
                {selection.type === 'question' && (() => {
                    const round = course.rounds.find(r => r.id === selection.parentId);
                    const question = round?.questions.find(q => q.id === selection.id);
                    if (!question) return <div>Select a question</div>;

                    const isInfo = question.type === 'info';
                    // const isVideo = question.type === 'video';
                    const isPlayground = question.type === 'playground';
                    const isMC = question.type === 'multiple-choice';
                    const isOrdering = question.type === 'code-ordering';

                    return (
                        <div className={styles.studentPreview}>
                            <div className={styles.previewBar}>
                                <span>Student Preview Mode</span>
                                <span style={{ marginLeft: 10, background: '#e2e8f0', padding: '2px 6px', borderRadius: 4, fontSize: 10 }}>
                                    {(question.codeLanguage || 'generic').toUpperCase()}
                                </span>
                                <span style={{ flex: 1 }}></span>
                                <span>{round?.name}</span>
                            </div>
                            <div className={styles.previewContent}>
                                <h3 style={{ marginBottom: 16 }}>{question.goal}</h3>

                                {/* Media Display */}
                                {question.media?.url && (
                                    <div style={{ marginBottom: 20 }}>
                                        {question.media.type === 'video' ? (
                                            <div style={{ textAlign: 'center', background: '#000', color: 'white', padding: 40, borderRadius: 8 }}>
                                                VIDEO PLACEHOLDER<br />
                                                {question.media.url}
                                            </div>
                                        ) : (
                                            <img src={question.media.url} alt="Question Media" style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8 }} />
                                        )}
                                    </div>
                                )}

                                {isOrdering ? (
                                    <div style={{ background: '#f8fafc', padding: 20, borderRadius: 8 }}>
                                        <div style={{ marginBottom: 12, fontSize: 13, color: '#64748b' }}>Drag to reorder (Preview):</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            {(question.choices || ['SELECT * FROM table', 'WHERE id = 1']).map((seg, i) => (
                                                <div key={i} style={{
                                                    background: 'white', padding: '12px', borderRadius: 6,
                                                    border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                    fontFamily: 'monospace', cursor: 'grab', display: 'flex', alignItems: 'center'
                                                }}>
                                                    <span style={{ marginRight: 12, color: '#cbd5e1' }}>☰</span>
                                                    {seg}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : isMC ? (
                                    <div style={{ display: 'grid', gap: 12 }}>
                                        {(question.choices || []).length > 0 ? (question.choices || []).map((choice, i) => (
                                            <div
                                                key={i}
                                                style={{
                                                    padding: '12px 16px',
                                                    background: question.a === choice ? 'rgba(34, 197, 94, 0.1)' : 'white',
                                                    border: `2px solid ${question.a === choice ? '#22c55e' : '#e2e8f0'}`,
                                                    borderRadius: 8,
                                                    color: '#334155',
                                                    fontWeight: 500,
                                                    display: 'flex',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <div style={{
                                                    width: 24, height: 24, borderRadius: '50%',
                                                    border: `2px solid ${question.a === choice ? '#22c55e' : '#cbd5e1'}`,
                                                    marginRight: 12,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    {question.a === choice && <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#22c55e' }} />}
                                                </div>
                                                {choice}
                                            </div>
                                        )) : <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>No options defined. Add them in the Inspector.</div>}
                                    </div>
                                ) : isPlayground ? (
                                    <div className={styles.playgroundContainer}>
                                        <div className={styles.playgroundEditor}>
                                            {question.q || '// Your code playground'}
                                        </div>
                                        <div className={styles.playgroundPreview}>
                                            Output Window (Results appear here)
                                        </div>
                                    </div>
                                ) : isInfo ? (
                                    <div style={{ lineHeight: 1.6, color: '#334155' }}>
                                        {/* Minimal markdown rendering simulation */}
                                        {question.q.split('\n').map((line, i) => (
                                            <div key={i}>
                                                {line.startsWith('##') ? <h4 style={{ marginTop: 16, marginBottom: 8 }}>{line.replace('##', '')}</h4> : <p>{line}</p>}
                                            </div>
                                        ))}
                                    </div>
                                ) : question.type === 'fill-blank' ? (
                                    <div style={{ fontFamily: 'monospace', fontSize: 16, lineHeight: '2.0', background: '#f1f5f9', padding: 20, borderRadius: 8 }}>
                                        {question.q.split(/(\[.*?\])/g).map((part, i) => {
                                            if (part.startsWith('[') && part.endsWith(']')) {
                                                const answer = part.slice(1, -1);
                                                return (
                                                    <span key={i} style={{
                                                        display: 'inline-block',
                                                        borderBottom: '2px solid #3b82f6',
                                                        color: '#3b82f6',
                                                        minWidth: 40,
                                                        textAlign: 'center',
                                                        margin: '0 4px',
                                                        background: 'white',
                                                        borderRadius: 4,
                                                        padding: '0 4px',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {answer}
                                                    </span>
                                                );
                                            }
                                            return <span key={i}>{part}</span>;
                                        })}
                                    </div>
                                ) : (
                                    /* Default code/text question view */
                                    <div style={{
                                        background: '#1e293b',
                                        color: '#e2e8f0',
                                        padding: 20,
                                        borderRadius: 8,
                                        fontFamily: 'monospace',
                                        marginBottom: 20
                                    }}>
                                        {question.q || '// Code/Answer goes here...'}
                                    </div>
                                )}

                                {question.type === 'multiple-choice' && (
                                    <div className={styles.qList}>
                                        <div className={styles.qItem}>{question.a} (Correct)</div>
                                        {question.distractors.map(d => (
                                            <div key={d} className={styles.qItem}>{d}</div>
                                        ))}
                                    </div>
                                )}

                                <div style={{ marginTop: 20, fontSize: 13, color: '#64748b' }}>
                                    💡 Hint: {question.hint || 'No hint provided'}
                                </div>
                            </div>
                        </div>
                    );
                })()}

            </div>
        </div>
    );
};
