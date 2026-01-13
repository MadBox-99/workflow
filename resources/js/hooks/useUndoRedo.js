import { useCallback, useState, useRef } from "react";

const MAX_HISTORY_LENGTH = 50;

export const useUndoRedo = (nodes, edges, setNodes, setEdges) => {
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const isUndoRedoAction = useRef(false);
    const lastSavedState = useRef(null);

    // Save current state to history
    const saveState = useCallback(() => {
        if (isUndoRedoAction.current) {
            isUndoRedoAction.current = false;
            return;
        }

        const currentState = {
            nodes: JSON.parse(JSON.stringify(nodes)),
            edges: JSON.parse(JSON.stringify(edges)),
            timestamp: Date.now(),
        };

        // Don't save if state hasn't changed
        if (lastSavedState.current) {
            const nodesChanged =
                JSON.stringify(currentState.nodes) !== JSON.stringify(lastSavedState.current.nodes);
            const edgesChanged =
                JSON.stringify(currentState.edges) !== JSON.stringify(lastSavedState.current.edges);
            if (!nodesChanged && !edgesChanged) {
                return;
            }
        }

        lastSavedState.current = currentState;

        setHistory((prev) => {
            // Remove any future states if we're not at the end
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push(currentState);

            // Limit history length
            if (newHistory.length > MAX_HISTORY_LENGTH) {
                newHistory.shift();
                return newHistory;
            }

            return newHistory;
        });

        setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY_LENGTH - 1));
    }, [nodes, edges, historyIndex]);

    // Undo to previous state
    const undo = useCallback(() => {
        if (historyIndex <= 0) return;

        isUndoRedoAction.current = true;
        const prevIndex = historyIndex - 1;
        const prevState = history[prevIndex];

        if (prevState) {
            setNodes(prevState.nodes);
            setEdges(prevState.edges);
            setHistoryIndex(prevIndex);
            lastSavedState.current = prevState;
        }
    }, [history, historyIndex, setNodes, setEdges]);

    // Redo to next state
    const redo = useCallback(() => {
        if (historyIndex >= history.length - 1) return;

        isUndoRedoAction.current = true;
        const nextIndex = historyIndex + 1;
        const nextState = history[nextIndex];

        if (nextState) {
            setNodes(nextState.nodes);
            setEdges(nextState.edges);
            setHistoryIndex(nextIndex);
            lastSavedState.current = nextState;
        }
    }, [history, historyIndex, setNodes, setEdges]);

    // Check if undo/redo is available
    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;

    return {
        saveState,
        undo,
        redo,
        canUndo,
        canRedo,
        historyLength: history.length,
        historyIndex,
    };
};
