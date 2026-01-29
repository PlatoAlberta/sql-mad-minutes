import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadModuleQuestions, useGamification } from '../engine';
import { Button, LessonRenderer, LessonPlayground } from '../components';
import type { Round, LessonSlide } from '../types';
import styles from './LessonPage.module.css';

/**
 * Full-page lesson view with slide navigation
 */
export function LessonPage() {
    const { moduleId, roundId } = useParams<{ moduleId: string; roundId: string }>();
    const navigate = useNavigate();
    const { markLessonComplete } = useGamification();

    const [round, setRound] = useState<Round | null>(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            if (!moduleId) return;
            try {
                const data = await loadModuleQuestions(`/modules/${moduleId}/questions.json`);
                const foundRound = data.rounds.find(r => r.id === roundId);
                setRound(foundRound || null);
            } catch (e) {
                console.error('Failed to load lesson:', e);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [moduleId, roundId]);

    const slides: LessonSlide[] = round?.lesson || [];
    const totalSlides = slides.length;
    const isLastSlide = currentSlide === totalSlides - 1;
    const isFirstSlide = currentSlide === 0;

    const handleNext = () => {
        if (!isLastSlide) {
            setCurrentSlide(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (!isFirstSlide) {
            setCurrentSlide(prev => prev - 1);
        }
    };

    const handleComplete = () => {
        if (moduleId && roundId) {
            markLessonComplete(moduleId, roundId);
            navigate(`/course/${moduleId}`);
        }
    };


    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Loading lesson...</div>
            </div>
        );
    }

    if (!round || !slides.length) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    <h2>No Lesson Found</h2>
                    <p>This round doesn't have lesson content yet.</p>
                    <Button variant="primary" onClick={() => navigate(-1)}>Go Back</Button>
                </div>
            </div>
        );
    }

    const slide = slides[currentSlide];

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <button className={styles.backBtn} onClick={() => navigate(-1)}>
                    ← Back
                </button>
                <div className={styles.headerTitle}>
                    <span className={styles.headerIcon}>{round.icon || '📖'}</span>
                    <h1>{round.name}</h1>
                </div>
                <div className={styles.slideCounter}>
                    {currentSlide + 1} / {totalSlides}
                </div>
            </header>

            {/* Progress Bar */}
            <div className={styles.progressBar}>
                <div
                    className={styles.progressFill}
                    style={{ width: `${((currentSlide + 1) / totalSlides) * 100}%` }}
                />
            </div>

            {/* Split Layout Container */}
            <div className={styles.splitLayout}>

                {/* Left Panel */}
                <section className={styles.panelColumn}>
                    <header className={styles.panelHeader}>
                        <h2 className={styles.panelTitle}>{slide.title}</h2>
                    </header>

                    <div className={styles.contentCard}>
                        <div className={styles.scrollableContent}>
                            <div className={styles.lessonText}>
                                <LessonRenderer content={slide.content} />
                            </div>

                            {slide.codeExample && (
                                <div className={styles.codeBlock}>
                                    <div className={styles.codeHeader}>
                                        <span>Example</span>
                                    </div>
                                    <pre className={styles.code}>{slide.codeExample}</pre>
                                    {slide.codeExplanation && (
                                        <div className={styles.codeExplanation}>
                                            <LessonRenderer content={slide.codeExplanation} />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <footer className={styles.navigation}>
                        <Button
                            variant="secondary"
                            size="lg"
                            onClick={handlePrev}
                            disabled={isFirstSlide}
                        >
                            ← Previous
                        </Button>

                        <div className={styles.progressDots}>
                            {slides.map((_, idx) => (
                                <button
                                    key={idx}
                                    className={`${styles.dot} ${idx === currentSlide ? styles.active : ''} ${idx < currentSlide ? styles.completed : ''}`}
                                    onClick={() => setCurrentSlide(idx)}
                                    aria-label={`Go to slide ${idx + 1}`}
                                />
                            ))}
                        </div>

                        {isLastSlide ? (
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={handleComplete}
                            >
                                ✓ Complete
                            </Button>
                        ) : (
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={handleNext}
                            >
                                Next →
                            </Button>
                        )}
                    </footer>
                </section>

                {/* Right Panel */}
                <section className={styles.panelColumn}>
                    <header className={styles.panelHeader}>
                        <h2 className={styles.panelTitle}>SQL Playground</h2>
                    </header>

                    <div className={styles.contentCard}>
                        <LessonPlayground initialSQL={slide.codeExample || 'SELECT * FROM students'} />
                    </div>
                </section>

            </div>
        </div>
    );
}
