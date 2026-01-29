import type { CardProps } from '../../types';
import styles from './Card.module.css';

/**
 * Neumorphic card container with raised/inset/flat variants
 */
export function Card({
    variant = 'raised',
    padding = 'md',
    interactive = false,
    children,
    className = '',
    onClick,
    style,
}: CardProps) {
    const classes = [
        styles.card,
        styles[variant],
        styles[`padding-${padding}`],
        interactive ? styles.interactive : '',
        className,
    ].filter(Boolean).join(' ');

    return (
        <div
            className={classes}
            onClick={onClick}
            style={style}
            role={interactive || onClick ? "button" : undefined}
            tabIndex={interactive || onClick ? 0 : undefined}
        >
            {children}
        </div>
    );
}
