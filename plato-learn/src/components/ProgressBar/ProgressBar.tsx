import type { ProgressBarProps } from '../../types';
import styles from './ProgressBar.module.css';

/**
 * Neumorphic progress bar with optional label and percentage display
 */
export function ProgressBar({
    value,
    max,
    label,
    showPercent = true,
}: ProgressBarProps) {
    const percent = Math.round((value / max) * 100);

    return (
        <div className={styles.container}>
            {(label || showPercent) && (
                <div className={styles.header}>
                    <span className={styles.label}>{label}</span>
                    {showPercent && <span className={styles.percent}>{percent}%</span>}
                </div>
            )}
            <div className={styles.bar}>
                <div
                    className={styles.fill}
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
}
