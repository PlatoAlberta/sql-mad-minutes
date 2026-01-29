import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllModules, getCustomModules, deleteCustomModule } from '../modules';
import type { LearningModule } from '../types';
import styles from './CoursesPage.module.css';

type FilterType = 'all' | 'built-in' | 'custom';

export function CoursesPage() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<FilterType>('all');

    // Get all modules (built-in + custom)
    const allModules = useMemo(() => getAllModules(), []);
    const customModuleIds = useMemo(() =>
        new Set(getCustomModules().map(m => m.id)),
        []
    );

    // Filter modules based on search and type
    const filteredModules = useMemo(() => {
        return allModules.filter(module => {
            // Search filter
            const matchesSearch = searchQuery === '' ||
                module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                module.description.toLowerCase().includes(searchQuery.toLowerCase());

            // Type filter
            const isCustom = customModuleIds.has(module.id);
            const matchesType = filter === 'all' ||
                (filter === 'custom' && isCustom) ||
                (filter === 'built-in' && !isCustom);

            return matchesSearch && matchesType;
        });
    }, [allModules, searchQuery, filter, customModuleIds]);

    const handleCourseClick = (moduleId: string) => {
        navigate(`/course/${moduleId}`);
    };

    const handleEditCourse = (e: React.MouseEvent, moduleId: string) => {
        e.stopPropagation();
        navigate(`/workshop/${moduleId}`);
    };

    const handleDeleteCourse = (e: React.MouseEvent, module: LearningModule) => {
        e.stopPropagation();
        if (confirm(`Delete "${module.name}"? This cannot be undone.`)) {
            deleteCustomModule(module.id);
            // Force re-render by updating state
            setFilter(prev => prev); // This triggers a re-render
            window.location.reload(); // Simple reload to refresh data
        }
    };

    const countRounds = (module: LearningModule): number => {
        return module.rounds?.length || 0;
    };

    const countQuestions = (module: LearningModule): number => {
        return module.rounds?.reduce((sum, round) => sum + (round.questions?.length || 0), 0) || 0;
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <h1>Course Library</h1>
                    <p>Browse courses or create your own custom learning content</p>
                </div>
                <button
                    className={styles.createButton}
                    onClick={() => navigate('/workshop')}
                >
                    <span className={styles.plusIcon}>+</span>
                    Create Course
                </button>
            </header>

            {/* Filters */}
            <div className={styles.filters}>
                <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Search courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                    className={`${styles.filterButton} ${filter === 'all' ? styles.active : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All
                </button>
                <button
                    className={`${styles.filterButton} ${filter === 'built-in' ? styles.active : ''}`}
                    onClick={() => setFilter('built-in')}
                >
                    Built-in
                </button>
                <button
                    className={`${styles.filterButton} ${filter === 'custom' ? styles.active : ''}`}
                    onClick={() => setFilter('custom')}
                >
                    Custom
                </button>
            </div>

            {/* Course Grid */}
            <div className={styles.courseGrid}>
                {filteredModules.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>📚</div>
                        <h3>No courses found</h3>
                        <p>
                            {filter === 'custom'
                                ? "You haven't created any custom courses yet."
                                : "No courses match your search."}
                        </p>
                        {filter === 'custom' && (
                            <button
                                className={styles.createButton}
                                onClick={() => navigate('/workshop')}
                            >
                                <span className={styles.plusIcon}>+</span>
                                Create Your First Course
                            </button>
                        )}
                    </div>
                ) : (
                    filteredModules.map((module) => {
                        const isCustom = customModuleIds.has(module.id);
                        const roundCount = countRounds(module);
                        const questionCount = countQuestions(module);

                        return (
                            <div
                                key={module.id}
                                className={styles.courseCard}
                                style={{ '--card-accent-color': module.color } as React.CSSProperties}
                                onClick={() => handleCourseClick(module.id)}
                            >
                                {/* Card Actions (only for custom courses) */}
                                {isCustom && (
                                    <div className={styles.cardActions}>
                                        <button
                                            className={`${styles.actionButton} ${styles.editButton}`}
                                            onClick={(e) => handleEditCourse(e, module.id)}
                                            title="Edit course"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            className={`${styles.actionButton} ${styles.deleteButton}`}
                                            onClick={(e) => handleDeleteCourse(e, module)}
                                            title="Delete course"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                )}

                                <div className={styles.cardHeader}>
                                    <div
                                        className={styles.courseIcon}
                                        style={{ color: module.color }}
                                    >
                                        {module.icon}
                                    </div>
                                    <div className={styles.cardHeaderText}>
                                        <h3 className={styles.courseName}>{module.name}</h3>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <span className={`${styles.courseType} ${isCustom ? styles.custom : styles.builtIn}`}>
                                                {isCustom ? 'Custom' : 'Official'}
                                            </span>
                                            {module.category && (
                                                <span className={styles.courseType} style={{ background: '#f1f5f9', color: '#64748b' }}>
                                                    {module.category.toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <p className={styles.courseDesc}>{module.description}</p>

                                <div className={styles.courseStats}>
                                    <div className={styles.stat}>
                                        <span className={styles.statValue}>{roundCount}</span>
                                        <span className={styles.statLabel}>Rounds</span>
                                    </div>
                                    <div className={styles.stat}>
                                        <span className={styles.statValue}>{questionCount}</span>
                                        <span className={styles.statLabel}>Questions</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
