import type { ButtonProps } from '../../types';
import styles from './Button.module.css';

/**
 * Neumorphic button component with primary and secondary variants
 */
export function Button({
    variant = 'primary',
    size = 'md',
    disabled = false,
    onClick,
    children,
    className = '',
}: ButtonProps) {
    const classes = [
        styles.button,
        styles[variant],
        styles[size],
        className,
    ].filter(Boolean).join(' ');

    return (
        <button
            className={classes}
            onClick={onClick}
            disabled={disabled}
        >
            {children}
        </button>
    );
}
