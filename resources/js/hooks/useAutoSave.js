import { useEffect, useRef, useState, useCallback } from "react";

export const useAutoSave = (nodes, edges, onSave, options = {}) => {
    const {
        debounceMs = 2000, // Wait 2 seconds after last change before saving
        enabled = true,
    } = options;

    const [autoSaveStatus, setAutoSaveStatus] = useState("idle"); // 'idle' | 'pending' | 'saving' | 'saved' | 'error'
    const [lastSavedAt, setLastSavedAt] = useState(null);
    const timeoutRef = useRef(null);
    const lastSavedDataRef = useRef(null);
    const isFirstRender = useRef(true);

    // Create a hash of the current state to detect changes
    const createStateHash = useCallback((nodes, edges) => {
        const nodesData = nodes.map((n) => ({
            id: n.id,
            type: n.type,
            position: n.position,
            data: {
                label: n.data?.label,
                description: n.data?.description,
                config: n.data?.config,
                type: n.data?.type,
                outputs: n.data?.outputs,
                inputs: n.data?.inputs,
            },
        }));

        const edgesData = edges.map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle,
            targetHandle: e.targetHandle,
        }));

        return JSON.stringify({ nodes: nodesData, edges: edgesData });
    }, []);

    // Check if data has changed since last save
    const hasChanges = useCallback(() => {
        const currentHash = createStateHash(nodes, edges);
        return currentHash !== lastSavedDataRef.current;
    }, [nodes, edges, createStateHash]);

    // Perform the save
    const performSave = useCallback(async () => {
        if (!hasChanges()) {
            setAutoSaveStatus("idle");
            return;
        }

        setAutoSaveStatus("saving");

        try {
            const workflowData = {
                nodes: nodes.map((node) => ({
                    id: node.id,
                    type: node.data.type || "action",
                    position: node.position,
                    data: node.data,
                })),
                connections: edges.map((edge) => ({
                    id: edge.id,
                    source: edge.source,
                    target: edge.target,
                    sourceHandle: edge.sourceHandle,
                    targetHandle: edge.targetHandle,
                })),
            };

            await onSave(workflowData);

            // Update last saved data hash
            lastSavedDataRef.current = createStateHash(nodes, edges);
            setLastSavedAt(new Date());
            setAutoSaveStatus("saved");

            // Reset status after 2 seconds
            setTimeout(() => {
                setAutoSaveStatus("idle");
            }, 2000);
        } catch (error) {
            console.error("Auto-save failed:", error);
            setAutoSaveStatus("error");

            // Reset error status after 3 seconds
            setTimeout(() => {
                setAutoSaveStatus("idle");
            }, 3000);
        }
    }, [nodes, edges, onSave, hasChanges, createStateHash]);

    // Debounced save effect
    useEffect(() => {
        // Skip first render to avoid saving immediately on load
        if (isFirstRender.current) {
            isFirstRender.current = false;
            lastSavedDataRef.current = createStateHash(nodes, edges);
            return;
        }

        if (!enabled) return;

        // Check if there are actual changes
        if (!hasChanges()) return;

        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Set status to pending
        setAutoSaveStatus("pending");

        // Set new timeout for debounced save
        timeoutRef.current = setTimeout(() => {
            performSave();
        }, debounceMs);

        // Cleanup on unmount or when dependencies change
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [
        nodes,
        edges,
        enabled,
        debounceMs,
        hasChanges,
        performSave,
        createStateHash,
    ]);

    // Manual save function
    const saveNow = useCallback(async () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        await performSave();
    }, [performSave]);

    return {
        autoSaveStatus,
        lastSavedAt,
        saveNow,
        hasUnsavedChanges: hasChanges(),
    };
};
