import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { LearningModule } from '../../../types';
import styles from '../CourseWorkshop.module.css';

interface TreeEditorProps {
    course: LearningModule;
    setCourse: React.Dispatch<React.SetStateAction<LearningModule | null>>;
    setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
}

export const TreeEditor: React.FC<TreeEditorProps> = ({ course, setCourse, setHasUnsavedChanges }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [draggingNode, setDraggingNode] = useState<string | null>(null);
    const [offset, setOffset] = useState({ x: 0, y: 0 }); // Pan offset
    const [selectedNode, setSelectedNode] = useState<string | null>(null);

    // Grid config
    const CELL_SIZE = 120;
    const GAP = 40;
    const GRID_OFFSET_X = 100;
    const GRID_OFFSET_Y = 100;

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.fillStyle = '#0f172a'; // Background
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid Lines (Optional)
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        // for (let x = 0; x < canvas.width; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
        // for (let y = 0; y < canvas.height; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }

        // Draw Connections
        course.rounds.forEach(round => {
            const startX = GRID_OFFSET_X + (round.col || 0) * (CELL_SIZE + GAP) + CELL_SIZE / 2 + offset.x;
            const startY = GRID_OFFSET_Y + (round.row || 0) * (CELL_SIZE * 0.8 + GAP) + (CELL_SIZE * 0.8) / 2 + offset.y;

            if (round.prerequisites && round.prerequisites.length > 0) {
                round.prerequisites.forEach(preId => {
                    const pre = course.rounds.find(r => r.id === preId);
                    if (pre) {
                        const endX = GRID_OFFSET_X + (pre.col || 0) * (CELL_SIZE + GAP) + CELL_SIZE / 2 + offset.x;
                        const endY = GRID_OFFSET_Y + (pre.row || 0) * (CELL_SIZE * 0.8 + GAP) + (CELL_SIZE * 0.8) / 2 + offset.y;

                        // Draw curved line
                        ctx.strokeStyle = '#64748b';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(endX, endY);
                        ctx.bezierCurveTo(endX, endY + 50, startX, startY - 50, startX, startY);
                        ctx.stroke();

                        // Draw Arrow
                        // ... simplified for now
                    }
                });
            }
        });

        // Draw Nodes
        course.rounds.forEach(round => {
            const x = GRID_OFFSET_X + (round.col || 0) * (CELL_SIZE + GAP) + offset.x;
            const y = GRID_OFFSET_Y + (round.row || 0) * (CELL_SIZE * 0.8 + GAP) + offset.y;
            const w = CELL_SIZE;
            const h = CELL_SIZE * 0.6; // Smaller height

            // Node Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(x + 4, y + 4, w, h);

            // Node Body
            ctx.fillStyle = selectedNode === round.id ? '#3b82f6' : '#334155';
            if (round.type === 'test') ctx.fillStyle = selectedNode === round.id ? '#ec4899' : '#be185d';

            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = selectedNode === round.id ? 2 : 1;

            // Rounded Rect
            ctx.beginPath();
            ctx.roundRect(x, y, w, h, 8);
            ctx.fill();
            ctx.stroke();

            // Text
            ctx.fillStyle = '#f8fafc';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(round.name.substring(0, 15) + (round.name.length > 15 ? '...' : ''), x + w / 2, y + 20);

            ctx.fillStyle = '#94a3b8';
            ctx.font = '10px sans-serif';
            ctx.fillText((round.type || 'Lesson').toUpperCase(), x + w / 2, y + 36);
        });

    }, [course, offset, selectedNode]);

    useEffect(() => {
        const raf = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(raf);
    }, [draw]);

    // Handle Mouse Events for Dragging
    const handleMouseDown = (e: React.MouseEvent) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Check if clicked on a node
        const clickedRound = course.rounds.find(round => {
            const x = GRID_OFFSET_X + (round.col || 0) * (CELL_SIZE + GAP) + offset.x;
            const y = GRID_OFFSET_Y + (round.row || 0) * (CELL_SIZE * 0.8 + GAP) + offset.y;
            return mouseX >= x && mouseX <= x + CELL_SIZE && mouseY >= y && mouseY <= y + CELL_SIZE * 0.6;
        });

        if (clickedRound) {
            setDraggingNode(clickedRound.id);
            setSelectedNode(clickedRound.id);
        } else {
            // Start panning? For now just deselect
            setSelectedNode(null);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!draggingNode) return;

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Snap to grid logic
        const gridX = Math.round((mouseX - offset.x - GRID_OFFSET_X - CELL_SIZE / 2) / (CELL_SIZE + GAP));
        const gridY = Math.round((mouseY - offset.y - GRID_OFFSET_Y - (CELL_SIZE * 0.8) / 2) / (CELL_SIZE * 0.8 + GAP));

        // Update round position if changed
        // Need to debounce or only update on invalidation?
        // Actually rendering logic is derived from state. 
        // We shouldn't update state on every pixel move if using "snap" logic directly.
        // But for "dragging visual" we usually use separate visual state, then commit on mouse up.
        // For simplicity: Update visual immediately but snap to int.

        // Prevent stacking?
        // Let's just update for now.

        setCourse(prev => prev ? ({
            ...prev,
            rounds: prev.rounds.map(r => r.id === draggingNode ? { ...r, col: Math.max(0, gridX), row: Math.max(0, gridY) } : r)
        }) : null);
        setHasUnsavedChanges(true);
    };

    const handleMouseUp = () => {
        setDraggingNode(null);
    };

    return (
        <div className={styles.treeEditorContainer}>
            <div className={styles.panelHeader}>
                Visual Tree Editor
                <div style={{ fontSize: 12, fontWeight: 'normal', opacity: 0.7, marginLeft: 12 }}>
                    Drag nodes to rearrange. Connections are automatic based on prerequisites (edit in Course view).
                </div>
            </div>
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative', background: '#0f172a' }}>
                <canvas
                    ref={canvasRef}
                    width={1200}
                    height={800}
                    style={{ cursor: draggingNode ? 'grabbing' : 'grab' }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                />

                {selectedNode && (
                    <div style={{
                        position: 'absolute', top: 20, right: 20, width: 250,
                        background: 'rgba(30, 41, 59, 0.95)', border: '1px solid rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(10px)', padding: 16, borderRadius: 8, color: 'white'
                    }}>
                        <h5>Node Properties</h5>
                        {(() => {
                            const r = course.rounds.find(x => x.id === selectedNode);
                            if (!r) return null;
                            return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                                    <div>
                                        <label style={{ fontSize: 11, color: '#94a3b8' }}>Name</label>
                                        <input
                                            value={r.name}
                                            onChange={(e) => {
                                                setCourse(prev => prev ? ({ ...prev, rounds: prev.rounds.map(ro => ro.id === r.id ? { ...ro, name: e.target.value } : ro) }) : null);
                                                setHasUnsavedChanges(true);
                                            }}
                                            style={{ width: '100%', background: '#334155', border: 'none', padding: 4, borderRadius: 4, color: 'white' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 11, color: '#94a3b8' }}>Type</label>
                                        <select
                                            value={r.type || 'lesson'}
                                            onChange={(e) => {
                                                setCourse(prev => prev ? ({ ...prev, rounds: prev.rounds.map(ro => ro.id === r.id ? { ...ro, type: e.target.value as any } : ro) }) : null);
                                                setHasUnsavedChanges(true);
                                            }}
                                            style={{ width: '100%', background: '#334155', border: 'none', padding: 4, borderRadius: 4, color: 'white' }}
                                        >
                                            <option value="lesson">Lesson</option>
                                            <option value="test">Test</option>
                                        </select>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>
        </div>
    );
};
