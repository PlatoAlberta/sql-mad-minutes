import React from 'react';
import type { LearningModule, QuestionType, Round } from '../../../types';
import type { Selection, DraggedItem } from '../types';
import { TEMPLATES } from '../constants';
import styles from '../CourseWorkshop.module.css';

interface SidebarProps {
    course: LearningModule;
    selection: Selection;
    setSelection: React.Dispatch<React.SetStateAction<Selection>>;
    activeView: 'course' | 'tree' | 'templates' | 'preview';
    setActiveView: (view: 'course' | 'tree' | 'templates' | 'preview') => void;
    updateRound: (roundId: string, updates: Partial<Round>) => void;
    tutorialStep: number | null;
    addRound: () => void;
    addQuestion: (roundId: string) => void;
    handleDragStart: (e: React.DragEvent, item: DraggedItem) => void;
    handleDragOver: (e: React.DragEvent, id?: string) => void;
    handleDrop: (e: React.DragEvent, target: { type: 'round' | 'question', id: string, parentId?: string }) => void;
    dragOverItem: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
    course,
    selection,
    setSelection,
    activeView,
    setActiveView,
    updateRound,
    tutorialStep,
    addRound,
    addQuestion,
    handleDragStart,
    handleDragOver,
    handleDrop,
    dragOverItem
}) => {
    return (
        <div className={`${styles.sidebar} ${tutorialStep === 1 ? styles.highlightSidebar : ''}`}>
            {/* Sidebar Tabs - Replaces Outline/Library */}
            <div className={styles.sidebarTabs} style={{ display: 'flex', gap: 2, padding: 8, background: '#1e293b' }}>
                <button
                    className={`${styles.navTab} ${activeView === 'course' ? styles.activeNavTab : ''}`}
                    onClick={() => setActiveView('course')}
                    title="Course Outline"
                >
                    Course
                </button>
                <button
                    className={`${styles.navTab} ${activeView === 'tree' ? styles.activeNavTab : ''}`}
                    onClick={() => setActiveView('tree')}
                    title="Progression Tree"
                >
                    Tree
                </button>
                <button
                    className={`${styles.navTab} ${activeView === 'templates' ? styles.activeNavTab : ''}`}
                    onClick={() => setActiveView('templates')}
                    title="Template Library"
                >
                    Templates
                </button>
                <button
                    className={`${styles.navTab} ${activeView === 'preview' ? styles.activeNavTab : ''}`}
                    onClick={() => setActiveView('preview')}
                    title="Student Preview"
                >
                    Preview
                </button>
            </div>

            {/* CONTENT: COURSE OUTLINE */}
            {activeView === 'course' && (
                <>
                    <div className={styles.panelHeader}>
                        <span>Content Outline</span>
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
                                    <span className={styles.treeItemIcon}>
                                        {round.type === 'test' ? '📝' : '📖'}
                                    </span>
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                                        <span className={styles.treeItemLabel} style={{ flex: 1 }}>{round.name}</span>
                                        {/* Round Type Dropdown */}
                                        <select
                                            value={round.type || 'lesson'}
                                            onChange={(e) => updateRound(round.id, { type: e.target.value as any })}
                                            onClick={(e) => e.stopPropagation()}
                                            className={styles.miniSelect}
                                        >
                                            <option value="lesson">Lesson</option>
                                            <option value="test">Test</option>
                                        </select>
                                    </div>
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
                        <div style={{ padding: 12 }}>
                            <button className={styles.addRoundBtn} onClick={addRound}>+ Add New Round</button>
                        </div>
                    </div>
                </>
            )}

            {/* CONTENT: TEMPLATES LIST */}
            {activeView === 'templates' && (
                <div className={styles.libraryGrid}>
                    {TEMPLATES.map(t => (
                        <div
                            key={t.label}
                            className={styles.libraryItem}
                            draggable
                            onDragStart={(e) => handleDragStart(e, {
                                type: 'template',
                                templateType: t.templateType,
                                defaultRoundType: t.defaultRoundType,
                                isRound: t.type === 'round'
                            })}
                        >
                            <div className={styles.libraryIcon}>{t.icon}</div>
                            <div className={styles.libraryLabel}>{t.label}</div>
                            <div style={{ fontSize: 10, color: '#94a3b8' }}>{t.description}</div>
                        </div>
                    ))}
                </div>
            )}

            {(activeView === 'tree' || activeView === 'preview') && (
                <div style={{ padding: 20, color: '#94a3b8', fontSize: 13, textAlign: 'center' }}>
                    {activeView === 'tree' ? 'Visual Tree Editor Active' : 'Student Preview Active'}
                </div>
            )}
        </div>
    );
};
