import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getModuleById, saveCustomModule } from '../modules';
import type { LearningModule, Round, Question, QuestionType } from '../types';
import styles from './CourseWorkshop.module.css';

// --- Constants ---
const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#14b8a6', '#6366f1'];
const ICONS = ['📊', '💻', '🔧', '📈', '🎯', '⚡', '🚀', '📚', '🧪', '🔐', '🌐', '🎮'];
const CATEGORIES = [
    { value: 'engineering', label: 'Engineering' },
    { value: 'qa', label: 'QA & Testing' },
    { value: 'data', label: 'Data Science' },
    { value: 'design', label: 'Design' },
    { value: 'compliance', label: 'Compliance' },
    { value: 'other', label: 'Other' }
];
const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
    { value: 'fill-blank', label: 'Fill in the Blank' },
    { value: 'multiple-choice', label: 'Multiple Choice' },
    { value: 'code-ordering', label: 'Code Ordering' },
    { value: 'drag-drop', label: 'Drag & Drop' },
    { value: 'type-in', label: 'Type Answer' },
    { value: 'playground', label: 'Playground (Sandbox)' },
    { value: 'info', label: 'Info Block' },
    { value: 'video', label: 'Video Clip' },
];

const TEMPLATES = [
    { type: 'info', label: 'Text Block', icon: '📝', description: 'Markdown text for explanations' },
    { type: 'video', label: 'Video', icon: '📹', description: 'Embed a video lecture' },
    { type: 'playground', label: 'Sandbox', icon: '🛠️', description: 'Interactive code environment' },
    { type: 'multiple-choice', label: 'Quiz', icon: '❓', description: 'Multiple choice question' },
    { type: 'fill-blank', label: 'Fill Blanks', icon: '🖊️', description: 'Cloze test' }
];

const LANGUAGES = [
    { value: 'sql', label: 'SQL' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'text', label: 'Plain Text' }
];

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

// --- Types ---
type SelectionType = 'course' | 'round' | 'question';
interface Selection {
    type: SelectionType;
    id: string; // The ID of the round or question (or 'root' for course)
    parentId?: string; // For questions, the round ID
}

export function CourseWorkshop() {
    const navigate = useNavigate();
    const { courseId } = useParams<{ courseId?: string }>();

    // --- State ---
    const [course, setCourse] = useState<LearningModule>({
        id: courseId || `custom-${generateId()}`,
        name: 'Untitled Course',
        description: '',
        icon: '📊',
        color: COLORS[0],
        questionsPath: '',
        category: 'engineering',
        rounds: [],
    });

    const [selection, setSelection] = useState<Selection>({ type: 'course', id: 'root' });
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Tutorial State: null = off, 0 = welcome, 1 = sidebar, 2 = canvas, 3 = inspector
    const [tutorialStep, setTutorialStep] = useState<number | null>(null);
    const [activeSidebarTab, setActiveSidebarTab] = useState<'outline' | 'library'>('outline');

    // Drag & Drop State
    const [draggedItem, setDraggedItem] = useState<{ type: 'round' | 'question' | 'template', id?: string, parentId?: string, templateType?: QuestionType } | null>(null);
    const [dragOverItem, setDragOverItem] = useState<string | null>(null);

    // Load existing course if editing
    useEffect(() => {
        if (courseId) {
            const existing = getModuleById(courseId);
            if (existing) {
                setCourse(JSON.parse(JSON.stringify(existing))); // Deep copy
            }
        }

        // Check if tutorial seen
        const seen = localStorage.getItem('plato_studio_tutorial_seen');
        if (!seen) {
            setTutorialStep(0);
        }
    }, [courseId]);

    const handleSave = () => {
        saveCustomModule(course);
        setHasUnsavedChanges(false);
        navigate('/courses');
    };

    const startTutorial = () => setTutorialStep(1);
    const nextTutorialStep = () => setTutorialStep(prev => (prev !== null && prev < 3 ? prev + 1 : null));
    const skipTutorial = () => {
        setTutorialStep(null);
        localStorage.setItem('plato_studio_tutorial_seen', 'true');
    };
    const finishTutorial = () => {
        setTutorialStep(null);
        localStorage.setItem('plato_studio_tutorial_seen', 'true');
    };
    const resetTutorial = () => {
        setTutorialStep(0);
    };

    // --- Drag & Drop Handlers ---

    const handleDragStart = (e: React.DragEvent, item: { type: 'round' | 'question' | 'template', id?: string, parentId?: string, templateType?: QuestionType }) => {
        setDraggedItem(item);
        e.dataTransfer.effectAllowed = 'move';
        // Fix: Required for drag to work in all browsers
        e.dataTransfer.setData('text/plain', item.id || 'new-template');

        // Visual polish: Transparent drag image or default? Default is fine for now.
    };

    const handleDragOver = (e: React.DragEvent, id?: string) => {
        e.preventDefault(); // Allow drop
        e.dataTransfer.dropEffect = 'move';
        if (id && id !== dragOverItem) setDragOverItem(id);
    };

    const handleDrop = (e: React.DragEvent, target: { type: 'round' | 'question', id: string, parentId?: string }) => {
        e.preventDefault();

        if (!draggedItem) return;

        // Handle Template Drop (Creating New Items)
        if (draggedItem.type === 'template') {
            const templateType = draggedItem.templateType;
            if (!templateType) return;

            const newQuestion: Question = {
                id: generateId(),
                type: templateType,
                goal: templateType === 'info' ? 'New Info Block' : templateType === 'video' ? 'New Video' : 'New Question',
                q: templateType === 'info' ? '## Information\nWrite your content here.' : '',
                a: '',
                distractors: [],
                ctx: [],
                hint: '',
                codeLanguage: 'sql'
            };

            // Drop on Round -> Append to end
            if (target.type === 'round') {
                const roundId = target.id;
                setCourse(prev => ({
                    ...prev,
                    rounds: prev.rounds.map(r =>
                        r.id === roundId ? { ...r, questions: [...(r.questions || []), newQuestion] } : r
                    )
                }));
                setSelection({ type: 'question', id: newQuestion.id!, parentId: roundId });
                setHasUnsavedChanges(true);
            }

            // Drop on Question -> Insert after target
            if (target.type === 'question') {
                const roundId = target.parentId!;
                setCourse(prev => ({
                    ...prev,
                    rounds: prev.rounds.map(r => {
                        if (r.id === roundId) {
                            const qs = [...r.questions];
                            const targetIndex = qs.findIndex(q => q.id === target.id);
                            if (targetIndex !== -1) {
                                qs.splice(targetIndex + 1, 0, newQuestion);
                                return { ...r, questions: qs };
                            }
                        }
                        return r;
                    })
                }));
                setSelection({ type: 'question', id: newQuestion.id!, parentId: roundId });
                setHasUnsavedChanges(true);
            }

            setDraggedItem(null);
            return;
        }

        // Reorder Rounds
        if (draggedItem.type === 'round' && target.type === 'round') {
            const rounds = [...course.rounds];
            const fromIndex = rounds.findIndex(r => r.id === draggedItem.id);
            const toIndex = rounds.findIndex(r => r.id === target.id);

            if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
                const [moved] = rounds.splice(fromIndex, 1);
                rounds.splice(toIndex, 0, moved);
                setCourse(prev => ({ ...prev, rounds }));
                setHasUnsavedChanges(true);
            }
        }

        // Reorder Questions
        if (draggedItem.type === 'question' && target.type === 'question') {
            // Only allow reordering within the same round for simplicity (or handle cross-round)
            if (draggedItem.parentId === target.parentId) {
                const newRounds = course.rounds.map(r => {
                    if (r.id === draggedItem.parentId) {
                        const qs = [...r.questions];
                        const fromIndex = qs.findIndex(q => q.id === draggedItem.id);
                        const toIndex = qs.findIndex(q => q.id === target.id);
                        if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
                            const [moved] = qs.splice(fromIndex, 1);
                            qs.splice(toIndex, 0, moved);
                            return { ...r, questions: qs };
                        }
                    }
                    return r;
                });
                setCourse(prev => ({ ...prev, rounds: newRounds }));
                setHasUnsavedChanges(true);
            } else if (draggedItem.parentId !== target.parentId) {
                // Cross-round drag logic (simplified)
                const newRounds = [...course.rounds];
                const sourceRound = newRounds.find(r => r.id === draggedItem.parentId);
                const destRound = newRounds.find(r => r.id === target.parentId);

                if (sourceRound && destRound) {
                    const fromIndex = sourceRound.questions.findIndex(q => q.id === draggedItem.id);
                    if (fromIndex !== -1) {
                        const [moved] = sourceRound.questions.splice(fromIndex, 1);
                        // Insert at destination index
                        const toIndex = destRound.questions.findIndex(q => q.id === target.id);
                        destRound.questions.splice(toIndex, 0, moved);

                        setCourse(prev => ({ ...prev, rounds: newRounds }));
                        setHasUnsavedChanges(true);

                        if (selection.id === draggedItem.id) {
                            setSelection(prev => ({ ...prev, parentId: target.parentId }));
                        }
                    }
                }
            }
        }

        setDraggedItem(null);
        setDragOverItem(null);
    };

    // Image Drop Handler for Inspector
    const handleImageDrop = (e: React.DragEvent, roundId: string, qId: string) => {
        e.preventDefault();
        e.stopPropagation();

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                const url = URL.createObjectURL(file);
                updateQuestion(roundId, qId, {
                    media: { type: 'image', url: url }
                });
            }
        }
    };

    // --- Actions ---

    const updateCourse = (updates: Partial<LearningModule>) => {
        setCourse(prev => ({ ...prev, ...updates }));
        setHasUnsavedChanges(true);
    };

    const addRound = () => {
        const newRound: Round = {
            id: generateId(),
            name: 'New Round',
            description: '',
            questions: [],
            row: course.rounds.length,
            col: 0
        };
        setCourse(prev => ({ ...prev, rounds: [...prev.rounds, newRound] }));
        setSelection({ type: 'round', id: newRound.id });
        setHasUnsavedChanges(true);
    };

    const updateRound = (roundId: string, updates: Partial<Round>) => {
        setCourse(prev => ({
            ...prev,
            rounds: prev.rounds.map(r => r.id === roundId ? { ...r, ...updates } : r)
        }));
        setHasUnsavedChanges(true);
    };

    const deleteRound = (roundId: string) => {
        if (confirm('Delete this round and all contents?')) {
            setCourse(prev => ({
                ...prev,
                rounds: prev.rounds.filter(r => r.id !== roundId)
            }));
            setSelection({ type: 'course', id: 'root' });
            setHasUnsavedChanges(true);
        }
    };

    const addQuestion = (roundId: string) => {
        const newQuestion: Question = {
            id: generateId(),
            type: 'fill-blank',
            goal: 'New Question',
            q: '',
            a: '',
            distractors: [],
            ctx: [],
            hint: '',
            codeLanguage: 'sql'
        };
        setCourse(prev => ({
            ...prev,
            rounds: prev.rounds.map(r => {
                if (r.id === roundId) {
                    return { ...r, questions: [...(r.questions || []), newQuestion] };
                }
                return r;
            })
        }));
        setSelection({ type: 'question', id: newQuestion.id!, parentId: roundId });
        setHasUnsavedChanges(true);
    };

    const updateQuestion = (roundId: string, qId: string, updates: Partial<Question>) => {
        setCourse(prev => ({
            ...prev,
            rounds: prev.rounds.map(r => {
                if (r.id === roundId) {
                    return {
                        ...r,
                        questions: r.questions.map(q => q.id === qId ? { ...q, ...updates } : q)
                    };
                }
                return r;
            })
        }));
        setHasUnsavedChanges(true);
    };

    const deleteQuestion = (roundId: string, qId: string) => {
        setCourse(prev => ({
            ...prev,
            rounds: prev.rounds.map(r => {
                if (r.id === roundId) {
                    return {
                        ...r,
                        questions: r.questions.filter(q => q.id !== qId)
                    };
                }
                return r;
            })
        }));
        setSelection({ type: 'round', id: roundId });
        setHasUnsavedChanges(true);
    };


    // --- Subcomponents ---

    // 1. Sidebar (Outline) - With Template Library
    const Sidebar = () => (
        <div className={`${styles.sidebar} ${tutorialStep === 1 ? styles.highlightSidebar : ''}`}>
            {/* Sidebar Tabs */}
            <div className={styles.sidebarTabs}>
                <div
                    className={`${styles.sidebarTab} ${activeSidebarTab === 'outline' ? styles.activeTab : ''}`}
                    onClick={() => setActiveSidebarTab('outline')}
                >
                    Outline
                </div>
                <div
                    className={`${styles.sidebarTab} ${activeSidebarTab === 'library' ? styles.activeTab : ''}`}
                    onClick={() => setActiveSidebarTab('library')}
                >
                    Library
                </div>
            </div>

            {activeSidebarTab === 'outline' ? (
                <>
                    <div className={styles.panelHeader}>
                        <span>Course Tree</span>
                        <button title="Add Round" onClick={addRound}>+</button>
                    </div>
                    <div className={styles.treeView}>
                        {/* Root Course Item */}
                        <div
                            className={`${styles.treeItem} ${selection.type === 'course' ? styles.selected : ''}`}
                            onClick={() => setSelection({ type: 'course', id: 'root' })}
                        >
                            <span className={styles.treeItemIcon}>{course.icon}</span>
                            <span className={styles.treeItemLabel}>{course.name}</span>
                        </div>

                        {/* Rounds & Questions */}
                        {course.rounds.map((round) => (
                            <div
                                key={round.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, { type: 'round', id: round.id })}
                                onDragOver={(e) => handleDragOver(e, round.id)}
                                onDrop={(e) => handleDrop(e, { type: 'round', id: round.id })}
                                className={`${styles.draggableItem} ${dragOverItem === round.id ? styles.dragOver : ''}`}
                            >
                                <div
                                    className={`${styles.treeItem} ${selection.id === round.id ? styles.selected : ''}`}
                                    onClick={() => setSelection({ type: 'round', id: round.id })}
                                >
                                    <span className={styles.treeItemIcon}>⭕</span>
                                    <span className={styles.treeItemLabel}>{round.name}</span>
                                </div>

                                <div className={styles.treeGroup}>
                                    {round.questions?.map((q, idx) => (
                                        <div
                                            key={q.id || idx}
                                            draggable
                                            onDragStart={(e) => {
                                                e.stopPropagation();
                                                handleDragStart(e, { type: 'question', id: q.id!, parentId: round.id });
                                            }}
                                            onDragOver={(e) => handleDragOver(e, q.id)}
                                            onDrop={(e) => {
                                                e.stopPropagation();
                                                handleDrop(e, { type: 'question', id: q.id!, parentId: round.id });
                                            }}
                                            className={`${styles.treeItem} ${selection.id === q.id ? styles.selected : ''} ${styles.draggableItem} ${dragOverItem === q.id ? styles.dragOver : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelection({ type: 'question', id: q.id!, parentId: round.id });
                                            }}
                                        >
                                            <span className={styles.treeItemIcon}>
                                                {q.type === 'info' ? '📝' : q.type === 'video' ? '📹' : q.type === 'playground' ? '🛠️' : '🔹'}
                                            </span>
                                            <span className={styles.treeItemLabel}>{q.goal || 'Untitled Item'}</span>
                                        </div>
                                    ))}
                                    <div
                                        className={`${styles.treeItem}`}
                                        style={{ opacity: 0.6, fontSize: 13 }}
                                        onClick={() => addQuestion(round.id)}
                                    >
                                        <span className={styles.treeItemIcon}>+</span>
                                        <span>Add Item</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className={styles.libraryGrid}>
                    {TEMPLATES.map(t => (
                        <div
                            key={t.label}
                            className={styles.libraryItem}
                            draggable
                            onDragStart={(e) => handleDragStart(e, { type: 'template', templateType: t.type as QuestionType })}
                        >
                            <div className={styles.libraryIcon}>{t.icon}</div>
                            <div className={styles.libraryLabel}>{t.label}</div>
                            <div style={{ fontSize: 10, color: '#94a3b8' }}>{t.description}</div>
                        </div>
                    ))}
                </div>
            )}

            {activeSidebarTab === 'outline' && (
                <button className={styles.addRoundBtn} onClick={addRound}>+ Add New Round</button>
            )}
        </div>
    );

    // 2. Inspector (Properties)
    const Inspector = () => {
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
                                        <textarea
                                            className={`${styles.formInput} ${styles.formTextarea}`}
                                            style={{ fontFamily: 'monospace', height: 200, background: '#1e293b', color: '#e2e8f0' }}
                                            value={question.q}
                                            onChange={e => updateQuestion(round.id, question.id!, { q: e.target.value })}
                                            placeholder="// Initial code seed"
                                        />
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

                            {/* Normal Question Fields */}
                            {!isPlayground && !isInfo && !isVideo && (
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

    // 3. Canvas (Live Preview)
    const Canvas = () => {
        return (
            <div className={`${styles.canvas} ${tutorialStep === 2 ? styles.highlightCanvas : ''}`}>
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
                        const isVideo = question.type === 'video';
                        const isPlayground = question.type === 'playground';

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

                                    {isPlayground ? (
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

    return (
        <div className={styles.studioContainer}>
            {/* Tutorial Overlay */}
            {tutorialStep !== null && (
                <div className={styles.tutorialOverlay}>
                    {tutorialStep === 0 && (
                        <div className={styles.tutorialModal}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>🎨</div>
                            <h2 className={styles.tutorialTitle}>Welcome to the Studio</h2>
                            <p className={styles.tutorialText}>
                                Ready to build your own interactive courses? The Studio gives you full control.
                                Take a quick tour to learn the ropes.
                            </p>
                            <div className={styles.tutorialActions}>
                                <button className={`${styles.tutorialBtn} ${styles.tutorialBtnSecondary}`} onClick={skipTutorial}>
                                    Skip
                                </button>
                                <button className={`${styles.tutorialBtn} ${styles.tutorialBtnPrimary}`} onClick={startTutorial}>
                                    Start Tour
                                </button>
                            </div>
                        </div>
                    )}

                    {tutorialStep === 1 && (
                        <div className={`${styles.tutorialTooltip} ${styles.tooltipSidebar}`}>
                            <h4>1. Course Structure</h4>
                            <p>Use the <b>Library</b> tab to drag-and-drop lessons, quizzes, and videos into your <b>Outline</b>.</p>
                            <div className={styles.tutorialActions} style={{ justifyContent: 'flex-start' }}>
                                <button className={`${styles.tutorialBtn} ${styles.tutorialBtnPrimary}`} onClick={nextTutorialStep}>Next →</button>
                            </div>
                        </div>
                    )}

                    {tutorialStep === 2 && (
                        <div className={`${styles.tutorialTooltip} ${styles.tooltipCanvas}`}>
                            <h4>2. The Canvas</h4>
                            <p>This is your live preview. See exactly what your students will see as you build it.</p>
                            <div className={styles.tutorialActions} style={{ justifyContent: 'flex-start' }}>
                                <button className={`${styles.tutorialBtn} ${styles.tutorialBtnPrimary}`} onClick={nextTutorialStep}>Next →</button>
                            </div>
                        </div>
                    )}

                    {tutorialStep === 3 && (
                        <div className={`${styles.tutorialTooltip} ${styles.tooltipInspector}`}>
                            <h4>3. The Inspector</h4>
                            <p>Edit the properties of whatever you've selected. Customize content, correct answers, and media here.</p>
                            <div className={styles.tutorialActions} style={{ justifyContent: 'flex-start' }}>
                                <button className={`${styles.tutorialBtn} ${styles.tutorialBtnPrimary}`} onClick={finishTutorial}>Finish</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Top Bar */}
            <div className={styles.topBar}>
                <div className={styles.headerLeft}>
                    <div className={styles.backButton} onClick={() => navigate('/courses')}>←</div>
                    <div className={styles.courseTitle}>
                        {course.name}
                        {hasUnsavedChanges && <span className={styles.statusBadge}>Unsaved</span>}
                    </div>
                </div>
                <div className={styles.headerActions}>
                    <button className={styles.actionButton} onClick={resetTutorial} title="Replay Tutorial">❓</button>
                    <button className={`${styles.actionButton} ${styles.saveButton}`} onClick={handleSave}>
                        Save Course
                    </button>
                </div>
            </div>

            {/* Main Workspace */}
            <div className={styles.workspace}>
                <Sidebar />
                <Canvas />
                <Inspector />
            </div>
        </div>
    );
}
