import { useNavigate } from 'react-router-dom';
import { getAllModules } from '../modules'; // Assuming this exports module list
import { useGamification } from '../engine';
import { Card, Button } from '../components';
import styles from './Dashboard.module.css';

export function Dashboard() {
    const navigate = useNavigate();
    const modules = getAllModules();
    const { progress } = useGamification();

    return (
        <div className={styles.container}>
            {/* Header Section */}
            <header className={styles.header}>
                <div className={styles.welcome}>
                    <h1>Welcome back, Scholar.</h1>
                    <p className={styles.subtitle}>Ready to continue your mastery?</p>
                </div>

                {/* Profile Stats */}
                <div className={styles.statsRow}>
                    <Card className={styles.statCard} padding="md">
                        <div className={styles.statLabel}>Total XP</div>
                        <div className={styles.statValue}>{progress.xp.toLocaleString()}</div>
                    </Card>
                    <Card className={styles.statCard} padding="md">
                        <div className={styles.statLabel}>Day Streak</div>
                        <div className={styles.statValue}>
                            {progress.streak} <span className={styles.fire}>🔥</span>
                        </div>
                    </Card>
                    <Card className={styles.statCard} padding="md">
                        <div className={styles.statLabel}>Modules</div>
                        <div className={styles.statValue}>
                            {Object.keys(progress.moduleProgress).length}<span>/{modules.length}</span>
                        </div>
                    </Card>
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
                    <Button variant="primary" onClick={(e) => { e?.stopPropagation(); navigate('/mad-minute/sql'); }}>
                        Start Drill
                    </Button>
                </div>
            </section>

            {/* Courses Grid */}
            <section className={styles.coursesSection}>
                <h2 className={styles.sectionTitle}>Your Courses</h2>
                <div className={styles.courseGrid}>
                    {modules.map((module) => {
                        const modProgress = progress.moduleProgress[module.id] || {};
                        const completedRounds = Object.values(modProgress).filter(r => r.completed).length;
                        const isStarted = completedRounds > 0;

                        return (
                            <Card
                                key={module.id}
                                className={styles.courseCard}
                                interactive
                                onClick={() => navigate(`/course/${module.id}`)}
                                padding="lg"
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
                                        {isStarted ? (
                                            <>
                                                <div className={styles.progressBar}>
                                                    <div
                                                        className={styles.progressFill}
                                                        style={{ width: `${Math.min(completedRounds * 10, 100)}%` }}
                                                    />
                                                </div>
                                                <div className={styles.statusText}>
                                                    {completedRounds} Rounds
                                                </div>
                                            </>
                                        ) : (
                                            /* Not started: Show Start Course text next to arrow */
                                            <div className={styles.startAction}>
                                                <span className={styles.statusText}>START COURSE</span>
                                                <div className={styles.arrowIcon}>→</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {/* Arrow removed from root level, now conditional inside meta */}
                            </Card>
                        );
                    })}

                    {/* Placeholder for future expansion */}
                    <Card className={`${styles.comingSoon}`} padding="lg">
                        <div className={styles.courseIcon}>⚡</div>
                        <div className={styles.courseInfo}>
                            <h3 className={styles.courseName}>Python for Data</h3>
                            <p className={styles.courseDesc}>Data structures, Pandas, and more.</p>
                            <div className={styles.statusText}>Coming Soon</div>
                        </div>
                    </Card>
                </div>
            </section>
        </div>
    );
}
