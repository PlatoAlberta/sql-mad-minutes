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
    type = 'button',
    title,
}: ButtonProps) {
    const classes = [
        styles.button,
        styles[variant],
        styles[size],
        className,
    ].filter(Boolean).join(' ');

    return (
        <button
            type={type}
            className={classes}
            onClick={onClick}
            disabled={disabled}
            title={title}
        >
            {children}
        </button>
    );
}
