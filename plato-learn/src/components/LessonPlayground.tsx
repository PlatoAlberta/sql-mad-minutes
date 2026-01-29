import { useState, useEffect } from 'react';
import alasql from 'alasql';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-sql';
import 'prismjs/themes/prism-dark.css';
import { universityData } from '../data/universitySchema';
import styles from './LessonPlayground.module.css';

interface LessonPlaygroundProps {
    initialSQL?: string;
}

export function LessonPlayground({ initialSQL = '' }: LessonPlaygroundProps) {
    const [sql, setSql] = useState(initialSQL || 'SELECT * FROM students');
    const [results, setResults] = useState<any[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Initialize database
    useEffect(() => {
        // Check if DB exists to prevent 'already exists' error
        if (!alasql.databases.university) {
            alasql('CREATE DATABASE university');
            alasql('USE university');

            alasql('CREATE TABLE students (id INT, name STRING, email STRING, major STRING, year_started INT, gpa FLOAT)');
            alasql('SELECT * INTO students FROM ?', [universityData.students]);

            alasql('CREATE TABLE courses (id INT, code STRING, name STRING, department STRING, credits INT)');
            alasql('SELECT * INTO courses FROM ?', [universityData.courses]);

            alasql('CREATE TABLE enrollments (student_id INT, course_id INT, grade STRING, semester STRING)');
            alasql('SELECT * INTO enrollments FROM ?', [universityData.enrollments]);
        }
    }, []);

    const runQuery = () => {
        try {
            setError(null);
            // Ensure we use the university DB
            alasql('USE university');
            const data = alasql(sql);

            // Check if result is array of objects (SELECT) vs other stats
            if (Array.isArray(data)) {
                setResults(data);
            } else {
                setResults([]); // Command executed but no data returned
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'An error occurred while running the query');
            setResults(null);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.editorCard}>
                <div className={styles.editorHeader}>
                    <div className={styles.editorLabel}>SQL Playground</div>
                </div>
                <div className={styles.editorWrapper}>
                    <Editor
                        value={sql}
                        onValueChange={code => setSql(code)}
                        highlight={code => highlight(code, languages.sql || languages.extend('sql', {}), 'sql')}
                        padding={16}
                        className={styles.editorArea}
                        style={{
                            fontFamily: '"JetBrains Mono", monospace',
                            fontSize: 14,
                            backgroundColor: 'transparent',
                            minHeight: '120px',
                            color: '#f8fafc',
                        }}
                        textareaId="sql-code-editor"
                    />
                </div>
                <div className={styles.cardFooter}>
                    <button className={styles.runBtn} onClick={runQuery}>
                        ▶ Run Query
                    </button>
                </div>
            </div>

            {error && (
                <div className={styles.resultsContainer}>
                    <div className={styles.errorBox}>
                        <span>⚠</span>
                        <div>{error}</div>
                    </div>
                </div>
            )}

            {results && (
                <div className={styles.resultsContainer}>
                    <div className={styles.tableWrapper}>
                        {results.length > 0 ? (
                            <table className={styles.resultTable}>
                                <thead>
                                    <tr>
                                        {Object.keys(results[0]).map((key) => (
                                            <th key={key}>{key}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.map((row, i) => (
                                        <tr key={i}>
                                            {Object.values(row).map((val: any, j) => (
                                                <td key={j}>{String(val)}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className={styles.emptyState}>
                                Query executed successfully (no results to display)
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
