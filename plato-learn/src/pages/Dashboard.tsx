import { useNavigate } from 'react-router-dom';
import { getAllModules } from '../modules'; // Assuming this exports module list
import { useGamification } from '../engine';
import styles from './Dashboard.module.css';

export function Dashboard() {
    const navigate = useNavigate();
    const modules = getAllModules();
    const { progress } = useGamification();

    // Calculate overall progress? For now just showing stats.
    // In a real app we'd sum up progress from all modules.

    return (
        <div className={styles.container}>
            {/* Header Section */}
            <header className={styles.header}>
                <div className={styles.welcome}>
                    <h1>Welcome back, Scholar.</h1>
                    <p className={styles.subtitle}>Ready to continue your mastery?</p>
                </div>

                {/* Profile Stats - Minimalist Cards */}
                <div className={styles.statsRow}>
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>Total XP</div>
                        <div className={styles.statValue}>{progress.xp.toLocaleString()}</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>Day Streak</div>
                        <div className={styles.statValue}>
                            {progress.streak} <span className={styles.fire}>🔥</span>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>Modules</div>
                        <div className={styles.statValue}>
                            {Object.keys(progress.moduleProgress).length}<span>/{modules.length}</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mad Minute CTA */}
            <section className={styles.ctaSection}>
                <div className={styles.ctaCard} onClick={() => navigate('/mad-minute/sql')}>
                    <div className={styles.ctaIcon}>⚡</div>
                    <div className={styles.ctaContent}>
                        <h2>Mad Minute Challenge</h2>
                        <p>Test your speed. 60 seconds. Unlimited questions.</p>
                    </div>
                    <button className={styles.ctaButton}>Start Drill</button>
                </div>
            </section>

            {/* Courses Grid */}
            <section className={styles.coursesSection}>
                <h2 className={styles.sectionTitle}>Your Courses</h2>
                <div className={styles.courseGrid}>
                    {modules.map((module) => {
                        // Calculate module specific progress (mock for now or derive)
                        const modProgress = progress.moduleProgress[module.id] || {};
                        const completedRounds = Object.values(modProgress).filter(r => r.completed).length;
                        // Assuming roughly 7-10 rounds per module for percentage
                        // Ideally we'd know total rounds per module without loading heavy question data. 
                        // For MVP, we'll just show "Started" or "New".
                        const isStarted = completedRounds > 0;

                        return (
                            <div
                                key={module.id}
                                className={styles.courseCard}
                                onClick={() => navigate(`/course/${module.id}`)}
                            >
                                <div
                                    className={styles.courseIcon}
                                    style={{ color: module.color }}
                                >
                                    {module.icon}
                                </div>
                                <div className={styles.courseInfo}>
                                    <h3 className={styles.courseName}>{module.name}</h3>
                                    <p className={styles.courseDesc}>{module.description}</p>

                                    <div className={styles.courseMeta}>
                                        <div className={styles.progressBar}>
                                            <div
                                                className={styles.progressFill}
                                                style={{ width: isStarted ? `${Math.min(completedRounds * 10, 100)}%` : '0%' }}
                                            />
                                        </div>
                                        <div className={styles.statusText}>
                                            {isStarted ? `${completedRounds} Rounds Complete` : 'Start Course'}
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.arrowIcon}>→</div>
                            </div>
                        );
                    })}

                    {/* Placeholder for future expansion */}
                    <div className={`${styles.courseCard} ${styles.comingSoon}`}>
                        <div className={styles.courseIcon}>⚡</div>
                        <div className={styles.courseInfo}>
                            <h3 className={styles.courseName}>Python for Data</h3>
                            <p className={styles.courseDesc}>Data structures, Pandas, and more.</p>
                            <div className={styles.statusText}>Coming Soon</div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
