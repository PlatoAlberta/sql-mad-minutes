import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getModuleById } from '../modules';
import { loadModuleQuestions } from '../engine';
import { SkillTree, Button } from '../components'; // Button for back if needed
import type { QuestionData } from '../types';
import styles from './CoursePage.module.css';

export function CoursePage() {
    const { moduleId } = useParams<{ moduleId: string }>();
    const navigate = useNavigate();
    const [questionData, setQuestionData] = useState<QuestionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const module = moduleId ? getModuleById(moduleId) : null;

    useEffect(() => {
        if (!module) {
            setError('Module not found');
            setLoading(false);
            return;
        }

        async function loadData() {
            try {
                const data = await loadModuleQuestions(module!.questionsPath);
                setQuestionData(data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError('Failed to load course data');
                setLoading(false);
            }
        }
        loadData();
    }, [module]);

    if (loading) {
        return <div className={styles.loading}>Loading course map...</div>;
    }

    if (error || !module || !questionData) {
        return (
            <div className={styles.errorContainer}>
                <h2>{error || 'Course not found'}</h2>
                <Button onClick={() => navigate('/')}>Back to Dashboard</Button>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <button
                    className={styles.backButton}
                    onClick={() => navigate('/')}
                >
                    ← Dashboard
                </button>
                <div className={styles.headerContent}>
                    <div
                        className={styles.moduleIcon}
                        style={{ color: module.color }}
                    >
                        {module.icon}
                    </div>
                    <div>
                        <h1 className={styles.title}>{module.name}</h1>
                        <p className={styles.description}>{module.description}</p>
                        <div style={{ marginTop: '16px' }}>
                            <Button size="sm" variant="secondary" onClick={() => navigate(`/mad-minute/${module.id}`)}>
                                ⚡ Mad Minute
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className={styles.treeContainer}>
                <SkillTree
                    moduleId={module.id}
                    questionData={questionData}
                />
            </main>
        </div>
    );
}
