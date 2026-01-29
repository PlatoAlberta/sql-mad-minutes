import React from 'react';
import styles from './LessonRenderer.module.css';

interface LessonRendererProps {
    content: string;
}

/**
 * A lightweight Markdown renderer tailored for SQL lessons.
 * Handles:
 * - ## Headers
 * - ```sql code blocks
 * - - Bullet points
 * - **bold** and `code` inline
 */
export function LessonRenderer({ content }: LessonRendererProps) {
    // Split into lines first
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];

    let inCodeBlock = false;
    let codeBuffer: string[] = [];

    const parseInline = (text: string) => {
        // Handle bold: **text**
        let parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <span key={i} className={styles.bold}>{part.slice(2, -2)}</span>;
            }
            if (part.startsWith('`') && part.endsWith('`')) {
                return <span key={i} className={styles.inlineCode}>{part.slice(1, -1)}</span>;
            }
            return part;
        });
    };


    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Code Block Handling
        if (line.trim().startsWith('```')) {
            if (inCodeBlock) {
                // End block
                const code = codeBuffer.join('\n');
                // Check if it's a SQL block to render playground, otherwise static
                // Since this is a SQL course, we default ```sql (or just ```) to playground
                // but we can also check for explicit language

                // For now, let's assume any block in our SQL lessons is a playground candidate
                // But specifically check for `sql` tag usually

                // End block
                elements.push(
                    <div key={`code-${i}`} className={styles.codeBlock}>
                        <pre dangerouslySetInnerHTML={{ __html: code }} />
                    </div>
                );
                codeBuffer = [];
                inCodeBlock = false;
            } else {
                // Start block
                inCodeBlock = true;
            }
            continue;
        }

        if (inCodeBlock) {
            codeBuffer.push(line);
            continue;
        }

        // Headers
        if (line.startsWith('## ')) {
            elements.push(<h2 key={i} className={styles.h2}>{line.replace('## ', '')}</h2>);
            continue;
        }
        if (line.startsWith('### ')) {
            elements.push(<h3 key={i} className={styles.h3}>{line.replace('### ', '')}</h3>);
            continue;
        }
        if (line.startsWith('#### ')) {
            elements.push(<h4 key={i} className={styles.h4}>{line.replace('#### ', '')}</h4>);
            continue;
        }

        // List Items
        if (line.trim().startsWith('- ')) {
            elements.push(
                <div key={i} className={styles.listItem}>
                    <span className={styles.listDot}>•</span>
                    <div>{parseInline(line.replace('- ', ''))}</div>
                </div>
            );
            continue;
        }

        // Empty Lines
        if (line.trim() === '') {
            elements.push(<div key={i} className={styles.spacer} />);
            continue;
        }

        // Paragraphs
        elements.push(
            <p key={i} className={styles.paragraph}>
                {parseInline(line)}
            </p>
        );
    }

    return <div className={styles.container}>{elements}</div>;
}
