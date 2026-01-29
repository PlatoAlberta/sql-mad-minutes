import React from 'react';
import type { LearningModule, Question, Round, QuestionType } from '../../../types';
import type { Selection } from '../types';
import { CATEGORIES, ICONS, COLORS, QUESTION_TYPES, LANGUAGES } from '../constants';
import styles from '../CourseWorkshop.module.css';

interface InspectorProps {
    course: LearningModule;
    selection: Selection;
    tutorialStep: number | null;
    updateCourse: (updates: Partial<LearningModule>) => void;
    updateRound: (roundId: string, updates: Partial<Round>) => void;
    deleteRound: (roundId: string) => void;
    addQuestion: (roundId: string) => void;
    updateQuestion: (roundId: string, qId: string, updates: Partial<Question>) => void;
    deleteQuestion: (roundId: string, qId: string) => void;
    handleImageDrop: (e: React.DragEvent, roundId: string, qId: string) => void;
}

export const Inspector: React.FC<InspectorProps> = ({
    course,
    selection,
    tutorialStep,
    updateCourse,
    updateRound,
    deleteRound,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    handleImageDrop
}) => {
    const content = (() => {
        if (selection.type === 'course') {
            return (
                <>
                    <div className={styles.panelHeader}>Course Properties</div>
                    <div className={styles.formSection}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Name</label>
                            <input
                                className={styles.formInput}
                                value={course.name}
                                onChange={e => updateCourse({ name: e.target.value })}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Description</label>
                            <textarea
                                className={`${styles.formInput} ${styles.formTextarea}`}
                                value={course.description}
                                onChange={e => updateCourse({ description: e.target.value })}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Category</label>
                            <select
                                className={styles.formInput}
                                value={course.category || 'engineering'}
                                onChange={e => updateCourse({ category: e.target.value as any })}
                            >
                                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Icon</label>
                            <div className={styles.gridSelector}>
                                {ICONS.map(i => (
                                    <div
                                        key={i}
                                        className={`${styles.gridOption} ${course.icon === i ? styles.selected : ''}`}
                                        onClick={() => updateCourse({ icon: i })}
                                    >
                                        {i}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Theme Color</label>
                            <div className={styles.gridSelector}>
                                {COLORS.map(c => (
                                    <div
                                        key={c}
                                        className={`${styles.gridOption} ${course.color === c ? styles.selected : ''}`}
                                        style={{ backgroundColor: c }}
                                        onClick={() => updateCourse({ color: c })}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            );
        }

        if (selection.type === 'round') {
            const round = course.rounds.find(r => r.id === selection.id);
            if (!round) return null;

            return (
                <>
                    <div className={styles.panelHeader}>
                        <span>Round Properties</span>
                        <button style={{ color: '#ef4444' }} onClick={() => deleteRound(round.id)}>🗑️</button>
                    </div>
                    <div className={styles.formSection}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Round Name</label>
                            <input
                                className={styles.formInput}
                                value={round.name}
                                onChange={e => updateRound(round.id, { name: e.target.value })}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Description</label>
                            <textarea
                                className={`${styles.formInput} ${styles.formTextarea}`}
                                value={round.description}
                                onChange={e => updateRound(round.id, { description: e.target.value })}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <button className={styles.addRoundBtn} onClick={() => addQuestion(round.id)}>
                                + Add Item to Round
                            </button>
                        </div>

                        <div style={{ borderTop: '1px solid var(--glass-border)', margin: '16px 0', paddingTop: 16 }}>
                            <h4 style={{ fontSize: 13, marginBottom: 12, color: '#e2e8f0' }}>Progression Logic</h4>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Prerequisites</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: 'rgba(0,0,0,0.2)', padding: 8, borderRadius: 6 }}>
                                    {course.rounds
                                        .filter(r => r.id !== round.id) // Can't depend on self
                                        .map(r => (
                                            <label key={r.id} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={round.prerequisites?.includes(r.id)}
                                                    onChange={(e) => {
                                                        const current = round.prerequisites || [];
                                                        const newPrereqs = e.target.checked
                                                            ? [...current, r.id]
                                                            : current.filter(id => id !== r.id);
                                                        updateRound(round.id, { prerequisites: newPrereqs });
                                                    }}
                                                />
                                                {r.name}
                                            </label>
                                        ))}
                                    {course.rounds.length <= 1 && <div style={{ color: '#64748b', fontSize: 12 }}>No other rounds available.</div>}
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Skill Tree Position</label>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: 10, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Row (Y)</label>
                                        <input
                                            type="number"
                                            className={styles.formInput}
                                            value={round.row ?? 0}
                                            onChange={e => updateRound(round.id, { row: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: 10, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Col (X)</label>
                                        <input
                                            type="number"
                                            className={styles.formInput}
                                            value={round.col ?? 0}
                                            onChange={e => updateRound(round.id, { col: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            );
        }

        if (selection.type === 'question') {
            const round = course.rounds.find(r => r.id === selection.parentId);
            const question = round?.questions.find(q => q.id === selection.id);
            if (!round || !question) return null;

            const isPlayground = question.type === 'playground';
            const isInfo = question.type === 'info';
            const isVideo = question.type === 'video';

            return (
                <>
                    <div className={styles.panelHeader}>
                        <span>{isInfo ? 'Content Block' : 'Question Properties'}</span>
                        <button style={{ color: '#ef4444' }} onClick={() => deleteQuestion(round.id, question.id!)}>🗑️</button>
                    </div>
                    <div className={styles.formSection}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Type</label>
                            <select
                                className={styles.formInput}
                                value={question.type}
                                onChange={e => updateQuestion(round.id, question.id!, { type: e.target.value as QuestionType })}
                            >
                                {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>{isInfo ? 'Title / Header' : 'Goal / Prompt'}</label>
                            <input
                                className={styles.formInput}
                                value={question.goal}
                                onChange={e => updateQuestion(round.id, question.id!, { goal: e.target.value })}
                            />
                        </div>

                        {/* Playground Specific */}
                        {isPlayground && (
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Code Language</label>
                                <select
                                    className={styles.formInput}
                                    value={question.codeLanguage || 'sql'}
                                    onChange={e => updateQuestion(round.id, question.id!, { codeLanguage: e.target.value as any })}
                                >
                                    {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                                </select>
                                <div style={{ marginTop: 10 }}>
                                    <label className={styles.formLabel}>Initial Code</label>
                                    <div style={{
                                        display: 'flex',
                                        background: '#0d1117',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: 8,
                                        height: 240,
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: 32,
                                            borderRight: '1px solid #30363d',
                                            background: '#161b22',
                                            color: '#484f58',
                                            fontFamily: 'monospace',
                                            fontSize: 13,
                                            padding: '8px 0',
                                            textAlign: 'center',
                                            lineHeight: 1.6
                                        }}>
                                            {Array.from({ length: 10 }).map((_, i) => <div key={i}>{i + 1}</div>)}
                                        </div>
                                        <textarea
                                            className={styles.formInput}
                                            style={{
                                                flex: 1,
                                                border: 'none',
                                                borderRadius: 0,
                                                background: 'transparent',
                                                color: '#e6edf3',
                                                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                                padding: 8,
                                                resize: 'none',
                                                outline: 'none',
                                                lineHeight: 1.6
                                            }}
                                            value={question.q}
                                            onChange={e => updateQuestion(round.id, question.id!, { q: e.target.value })}
                                            placeholder="// Initial code seed"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Info Block (Markdown) */}
                        {isInfo && (
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Content (Markdown)</label>
                                <textarea
                                    className={`${styles.formInput} ${styles.formTextarea}`}
                                    style={{ height: 300, fontFamily: 'monospace' }}
                                    value={question.q}
                                    onChange={e => updateQuestion(round.id, question.id!, { q: e.target.value })}
                                    placeholder="## Heading\n\nInfo text goes here..."
                                />
                            </div>
                        )}

                        {/* Video Block */}
                        {isVideo && (
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Video URL (YouTube/MP4)</label>
                                <input
                                    className={styles.formInput}
                                    value={question.media?.url || ''}
                                    onChange={e => updateQuestion(round.id, question.id!, { media: { type: 'video', url: e.target.value } })}
                                    placeholder="https://..."
                                />
                                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Paste a valid video URL</div>
                            </div>
                        )}

                        {/* Multiple Choice Editor */}
                        {question.type === 'multiple-choice' && (
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Options (Select Correct)</label>
                                {(question.choices || []).map((choice, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                                        <input
                                            type="radio"
                                            name="correctAnswer"
                                            checked={question.a === choice}
                                            onChange={() => updateQuestion(round.id, question.id!, { a: choice })}
                                            style={{ cursor: 'pointer' }}
                                            title="Mark as correct answer"
                                        />
                                        <input
                                            className={styles.formInput}
                                            value={choice}
                                            onChange={(e) => {
                                                const newChoices = [...(question.choices || [])];
                                                const oldVal = newChoices[idx];
                                                newChoices[idx] = e.target.value;
                                                // Sync correct answer if it matches
                                                const updates: Partial<Question> = { choices: newChoices };
                                                if (question.a === oldVal) updates.a = e.target.value;
                                                updateQuestion(round.id, question.id!, updates);
                                            }}
                                        />
                                        <button
                                            onClick={() => {
                                                const newChoices = (question.choices || []).filter((_, i) => i !== idx);
                                                updateQuestion(round.id, question.id!, { choices: newChoices });
                                            }}
                                            style={{ color: '#ef4444', padding: '0 8px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18 }}
                                            title="Remove Option"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                                <button
                                    className={styles.addRoundBtn}
                                    style={{ padding: '6px 12px', fontSize: 12, marginTop: 4 }}
                                    onClick={() => {
                                        const newChoices = [...(question.choices || []), `Option ${(question.choices?.length || 0) + 1}`];
                                        updateQuestion(round.id, question.id!, { choices: newChoices });
                                    }}
                                >
                                    + Add Option
                                </button>
                            </div>
                        )}

                        {/* Code Ordering Editor */}
                        {question.type === 'code-ordering' && (
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Code Segments to Order (One per line)</label>
                                <textarea
                                    className={`${styles.formInput} ${styles.formTextarea}`}
                                    style={{ height: 150, fontFamily: 'monospace' }}
                                    value={question.choices?.join('\n') || ''}
                                    onChange={e => updateQuestion(round.id, question.id!, { choices: e.target.value.split('\n') })}
                                    placeholder="SELECT * FROM users&#10;WHERE active = true&#10;ORDER BY created_at DESC"
                                />
                                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Enter the correct order. The game will shuffle them.</div>
                            </div>
                        )}

                        {/* Normal Question Fields */}
                        {!isPlayground && !isInfo && !isVideo && question.type !== 'multiple-choice' && question.type !== 'code-ordering' && (
                            <>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Language</label>
                                    <select
                                        className={styles.formInput}
                                        value={question.codeLanguage || 'sql'}
                                        onChange={e => updateQuestion(round.id, question.id!, { codeLanguage: e.target.value as any })}
                                    >
                                        {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Content / Code</label>
                                    <textarea
                                        className={`${styles.formInput} ${styles.formTextarea}`}
                                        value={question.q}
                                        onChange={e => updateQuestion(round.id, question.id!, { q: e.target.value })}
                                    />
                                    {question.type === 'fill-blank' && (
                                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                                            Use [brackets] to define blanks. Ex: "SELECT * FROM [users]"
                                        </div>
                                    )}
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Correct Answer</label>
                                    <input
                                        className={styles.formInput}
                                        value={Array.isArray(question.a) ? question.a.join(',') : question.a}
                                        onChange={e => updateQuestion(round.id, question.id!, { a: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Distractors</label>
                                    <input
                                        className={styles.formInput}
                                        value={question.distractors?.join(', ')}
                                        onChange={e => updateQuestion(round.id, question.id!, { distractors: e.target.value.split(',').map(s => s.trim()) })}
                                    />
                                </div>
                            </>
                        )}

                        {!isInfo && (
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Hint</label>
                                <input
                                    className={styles.formInput}
                                    value={question.hint}
                                    onChange={e => updateQuestion(round.id, question.id!, { hint: e.target.value })}
                                />
                            </div>
                        )}

                        {/* Media Drop Zone (for non-video types) */}
                        {!isVideo && (
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Media (Image)</label>
                                <div
                                    className={styles.imageUploadArea}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => handleImageDrop(e, round.id, question.id!)}
                                >
                                    {question.media?.url && question.media.type === 'image' ? (
                                        <div style={{ position: 'relative' }}>
                                            <img src={question.media.url} alt="Question Media" style={{ maxWidth: '100%', borderRadius: 4 }} />
                                            <button
                                                className={styles.removeMediaBtn}
                                                onClick={() => updateQuestion(round.id, question.id!, { media: undefined })}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'center', color: '#64748b' }}>
                                            <div style={{ fontSize: 24 }}>📷</div>
                                            <div>Drag & Drop image here</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </>
            );
        }
        return null;
    })();

    return (
        <div className={`${styles.inspector} ${tutorialStep === 3 ? styles.highlightInspector : ''}`}>
            {content}
        </div>
    );
};
