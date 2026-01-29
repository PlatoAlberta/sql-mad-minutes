import React from 'react';
import { TEMPLATES } from '../constants';
import styles from '../CourseWorkshop.module.css';

interface TemplateLibraryProps {
    handleDragStart: (e: React.DragEvent, item: any) => void;
}

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({ handleDragStart }) => {
    return (
        <div className={styles.templateLibraryContainer}>
            <div className={styles.panelHeader}>Template Library</div>
            <div className={styles.libraryGridFull}>
                {TEMPLATES.map((t, idx) => (
                    <div
                        key={idx}
                        className={styles.libraryCard}
                        draggable
                        onDragStart={(e) => handleDragStart(e, {
                            type: 'template',
                            templateType: t.templateType,
                            defaultRoundType: t.defaultRoundType,
                            isRound: t.type === 'round'
                        })}
                    >
                        <div className={styles.libraryCardIcon}>{t.icon}</div>
                        <h4 className={styles.libraryCardTitle}>{t.label}</h4>
                        <p className={styles.libraryCardDesc}>{t.description}</p>
                        <div className={styles.libraryCardTypeBadge}>
                            {t.type === 'round' ? (t.defaultRoundType === 'test' ? 'TEST' : 'LESSON') : 'ELEMENT'}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
