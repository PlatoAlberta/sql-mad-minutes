import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCourseEditor } from '../../hooks/useCourseEditor';
import { useCourseDragDrop } from '../../hooks/useCourseDragDrop';
import { TreeEditor } from './components/TreeEditor';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { Inspector } from './components/Inspector';
import styles from './CourseWorkshop.module.css';

export function CourseWorkshop() {
    const { courseId } = useParams<{ courseId?: string }>();
    const navigate = useNavigate();

    // Custom Hooks
    const {
        course,
        setCourse,
        selection,
        setSelection,
        hasUnsavedChanges,
        setHasUnsavedChanges,
        tutorialStep,
        actions
    } = useCourseEditor(courseId);

    const {
        draggedItem,
        setDraggedItem,
        dragOverItem,
        setDragOverItem,
        handleDragStart,
        handleDragOver,
        handleDrop,
        handleImageDrop
    } = useCourseDragDrop(
        course,
        setCourse,
        setSelection,
        setHasUnsavedChanges,
        actions.generateId,
        actions.updateQuestion
    );

    const [activeView, setActiveView] = useState<'course' | 'tree' | 'templates' | 'preview'>('course');
    const [isInspectorOpen] = useState(true);

    // Safety check for rendering
    if (!course || !course.rounds) {
        return <div className={styles.studioContainer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Course... (If stuck, please refresh)</div>;
    }

    // Determine Main Content based on activeView
    const renderMainContent = () => {
        switch (activeView) {
            case 'course':
            case 'templates': // Templates view also shows Canvas so you can drag TO it
                return (
                    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                        <Canvas
                            course={course}
                            setCourse={setCourse}
                            selection={selection}
                            setSelection={setSelection}
                            setHasUnsavedChanges={setHasUnsavedChanges}
                            tutorialStep={tutorialStep}
                            draggedItem={draggedItem}
                            setDraggedItem={setDraggedItem}
                            setDragOverItem={setDragOverItem}
                            generateId={actions.generateId}
                        />
                        <div className={`${styles.inspector} ${isInspectorOpen ? styles.open : ''}`}>
                            <Inspector
                                course={course}
                                selection={selection}
                                tutorialStep={tutorialStep}
                                updateCourse={actions.updateCourse}
                                updateRound={actions.updateRound}
                                deleteRound={actions.deleteRound}
                                addQuestion={actions.addQuestion}
                                updateQuestion={actions.updateQuestion}
                                deleteQuestion={actions.deleteQuestion}
                                handleImageDrop={handleImageDrop}
                            />
                        </div>
                    </div>
                );
            case 'tree':
                return (
                    <TreeEditor
                        course={course}
                        setCourse={setCourse}
                        setHasUnsavedChanges={setHasUnsavedChanges}
                    />
                );
            case 'preview':
                return (
                    <div style={{ flex: 1, background: '#f1f5f9', padding: 40, overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
                        <div style={{ width: '100%', maxWidth: 800, background: 'white', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', padding: 40, minHeight: 800 }}>
                            <h1 style={{ color: '#334155' }}>{course.name}</h1>
                            <p style={{ color: '#64748b', fontSize: 18 }}>{course.description}</p>
                            <hr style={{ margin: '32px 0', borderColor: '#e2e8f0' }} />
                            {course.rounds.map(r => (
                                <div key={r.id} style={{ marginBottom: 32 }}>
                                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <span style={{ background: r.type === 'test' ? '#ec4899' : '#3b82f6', color: 'white', padding: '4px 8px', borderRadius: 4, fontSize: 12, textTransform: 'uppercase' }}>{r.type || 'Lesson'}</span>
                                        {r.name}
                                    </h3>
                                    <div style={{ marginLeft: 20, borderLeft: '2px solid #e2e8f0', paddingLeft: 20, paddingTop: 12 }}>
                                        {r.questions.length === 0 && <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>Empty round</span>}
                                        {r.questions.map((q, i) => (
                                            <div key={i} style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
                                                <span style={{ color: '#94a3b8' }}>{i + 1}.</span>
                                                <span>{q.goal}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className={styles.studioContainer}>
            {/* Top Bar - Simplified for V2 */}
            <header className={styles.topBar}>
                <div className={styles.headerLeft}>
                    <button className={styles.backButton} onClick={() => navigate('/courses')} title="Back to Courses">
                        ←
                    </button>
                    <div className={styles.courseTitle}>
                        {course.icon || '🎓'} {course.name}
                        {hasUnsavedChanges && <span className={styles.statusBadge} style={{ color: '#f59e0b', borderColor: '#f59e0b' }}>Unsaved</span>}
                    </div>
                </div>

                <div className={styles.headerActions}>
                    <button className={styles.actionButton} style={{ background: 'transparent', color: 'var(--text-secondary)' }}>
                        Undo
                    </button>
                    <button className={`${styles.actionButton} ${styles.saveButton}`} onClick={actions.handleSave}>
                        💾 Save Course
                    </button>
                </div>
            </header>

            {/* Main V3 Layout (Sidebar Navigation) */}
            <div className={styles.workspace} style={{ display: 'flex', flexDirection: 'row' }}>
                <Sidebar
                    course={course}
                    selection={selection}
                    setSelection={setSelection}
                    activeView={activeView}
                    setActiveView={setActiveView}
                    updateRound={actions.updateRound}
                    tutorialStep={tutorialStep}
                    addRound={actions.addRound}
                    addQuestion={actions.addQuestion}
                    handleDragStart={handleDragStart}
                    handleDragOver={handleDragOver}
                    handleDrop={handleDrop}
                    dragOverItem={dragOverItem}
                />

                {renderMainContent()}
            </div>
        </div>
    );
}
