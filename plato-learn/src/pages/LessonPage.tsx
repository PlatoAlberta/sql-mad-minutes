import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadModuleQuestions, useGamification } from '../engine';
import { Button } from '../components';
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

    // Simple markdown parser
    const parseMarkdown = (text: string) => {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br/>');
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

            {/* Slide Content */}
            <main className={styles.slideContainer}>
                <div className={styles.slide}>
                    <h2 className={styles.slideTitle}>{slide.title}</h2>

                    <div
                        className={styles.slideContent}
                        dangerouslySetInnerHTML={{ __html: parseMarkdown(slide.content) }}
                    />

                    {slide.codeExample && (
                        <div className={styles.codeBlock}>
                            <div className={styles.codeHeader}>Example</div>
                            <pre className={styles.code}>{slide.codeExample}</pre>
                            {slide.codeExplanation && (
                                <div className={styles.codeExplanation}>
                                    <span dangerouslySetInnerHTML={{ __html: parseMarkdown(slide.codeExplanation) }} />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Progress Dots */}
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

            {/* Navigation */}
            <footer className={styles.navigation}>
                <Button
                    variant="secondary"
                    size="lg"
                    onClick={handlePrev}
                    disabled={isFirstSlide}
                >
                    ← Previous
                </Button>

                {isLastSlide ? (
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={handleComplete}
                    >
                        ✓ Complete Lesson
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
        </div>
    );
}
