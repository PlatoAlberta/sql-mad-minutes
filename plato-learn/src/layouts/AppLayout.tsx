import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useGamification } from '../engine';
import styles from './AppLayout.module.css';

/**
 * Main application layout with header, navigation, and stats
 */
export function AppLayout() {
    const { progress } = useGamification();
    const location = useLocation();
    const isFullscreen = location.pathname.startsWith('/workshop');

    if (isFullscreen) {
        return (
            <div className={styles.fullscreenLayout}>
                <Outlet />
            </div>
        );
    }

    return (
        <div className={styles.layout}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <div className={styles.logo}>PLATO</div>
                    <h1 className={styles.title}>PLATO Learn</h1>
                </div>
                <div className={styles.stats}>
                    <div className={styles.stat}>
                        <div className={styles.statIcon}>XP</div>
                        <span className={styles.statValue}>{progress.xp}</span>
                    </div>
                    <div className={styles.stat}>
                        <div className={styles.statIcon}>S</div>
                        <span className={styles.statValue}>{progress.streak}</span>
                        <span className={styles.statLabel}>Streak</span>
                    </div>
                </div>
            </header>

            {/* Navigation */}
            <nav className={styles.nav}>
                <NavLink
                    to="/"
                    className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
                    end
                >
                    Dashboard
                </NavLink>
                <NavLink
                    to="/courses"
                    className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
                >
                    Courses
                </NavLink>
                <NavLink
                    to="/mad-minute/sql"
                    className={({ isActive }) => `${styles.navLink} ${styles.madMinuteLink} ${isActive ? styles.active : ''}`}
                >
                    ⚡ Mad Minute
                </NavLink>
                <NavLink
                    to="/profile"
                    className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
                >
                    Profile
                </NavLink>
            </nav>

            {/* Main Content */}
            <main className={styles.main}>
                <Outlet />
            </main>
        </div>
    );
}
