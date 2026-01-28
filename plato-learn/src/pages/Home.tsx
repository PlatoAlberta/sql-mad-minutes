import { useState, useEffect } from 'react';
import { getAllModules } from '../modules';
import { loadModuleQuestions } from '../engine';
import { SkillTree } from '../components';
import type { QuestionData } from '../types';
import styles from './Home.module.css';

/**
 * Home page displaying skill tree progression for each module
 */
export function Home() {
    const modules = getAllModules();
    const [questionData, setQuestionData] = useState<{ [moduleId: string]: QuestionData }>({});
    const [loading, setLoading] = useState(true);

    // Load question data for all modules
    useEffect(() => {
        async function loadAllModules() {
            const data: { [moduleId: string]: QuestionData } = {};
            for (const module of modules) {
                try {
                    data[module.id] = await loadModuleQuestions(module.questionsPath);
                } catch (e) {
                    console.error(`Failed to load ${module.id}:`, e);
                }
            }
            setQuestionData(data);
            setLoading(false);
        }
        loadAllModules();
    }, [modules]);

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Loading skill tree...</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Welcome Section */}
            <section className={styles.welcome}>
                <div className={styles.welcomeIcon}>P</div>
                <h2 className={styles.welcomeTitle}>PLATO Learn</h2>
                <p className={styles.welcomeSubtitle}>
                    Master SQL through interactive lessons. Complete each level with 60%+ to unlock the next.
                </p>
            </section>

            {/* Skill Trees for each module */}
            {modules.map((module) => (
                <section key={module.id} className={styles.moduleSection}>
                    <div className={styles.moduleHeader}>
                        <div
                            className={styles.moduleIcon}
                            style={{ background: `linear-gradient(135deg, ${module.color}, var(--midnight))` }}
                        >
                            {module.icon}
                        </div>
                        <div>
                            <h3 className={styles.moduleName}>{module.name}</h3>
                            <p className={styles.moduleDesc}>{module.description}</p>
                        </div>
                    </div>

                    {questionData[module.id] ? (
                        <SkillTree
                            moduleId={module.id}
                            questionData={questionData[module.id]}
                        />
                    ) : (
                        <div className={styles.error}>Failed to load module</div>
                    )}
                </section>
            ))}
        </div>
    );
}
