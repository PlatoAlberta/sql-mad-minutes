import type { CardProps } from '../../types';
import styles from './Card.module.css';

/**
 * Neumorphic card container with raised/inset/flat variants
 */
export function Card({
    variant = 'raised',
    padding = 'md',
    children,
    className = '',
}: CardProps) {
    const classes = [
        styles.card,
        styles[variant],
        styles[`padding-${padding}`],
        className,
    ].filter(Boolean).join(' ');

    return (
        <div className={classes}>
            {children}
        </div>
    );
}
