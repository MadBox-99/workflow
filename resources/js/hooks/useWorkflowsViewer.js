import { useState, useEffect, useMemo } from "react";
import { MarkerType } from "@xyflow/react";
import axios from "axios";
import FloatingEdge from "@/components/FloatingEdge";

export const useWorkflowsViewer = () => {
    const [workflows, setWorkflows] = useState([]);
    const [selectedWorkflow, setSelectedWorkflow] = useState(null);
    const [loading, setLoading] = useState(false);
    const [colorMode, setColorMode] = useState(
        document.documentElement.classList.contains("dark") ? "dark" : "light",
    );

    useEffect(() => {
        console.log("WorkflowsApp mounted");
        fetchWorkflows();
    }, []);

    // Listen for theme changes
    useEffect(() => {
        const observer = new MutationObserver(() => {
            const isDark = document.documentElement.classList.contains("dark");
            setColorMode(isDark ? "dark" : "light");
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });

        return () => observer.disconnect();
    }, []);

    const fetchWorkflows = async () => {
        try {
            console.log("Fetching workflows...");
            setLoading(true);
            const response = await axios.get("/api/workflows");
            console.log("Workflows fetched:", response.data);
            const activeWorkflows = response.data.filter((w) => w.is_active);
            console.log("Active workflows:", activeWorkflows);
            setWorkflows(activeWorkflows);
        } catch (error) {
            console.error("Error fetching workflows:", error);
        } finally {
            setLoading(false);
        }
    };

    const viewWorkflow = (workflow) => {
        setSelectedWorkflow(workflow);
    };

    const backToList = () => {
        setSelectedWorkflow(null);
    };

    const nodes =
        selectedWorkflow?.nodes?.map((node) => ({
            id: node.node_id,
            type: "default",
            position: node.position || { x: 0, y: 0 },
            data: node.data || { label: node.label },
            style: {
                background: "#f0f0f0",
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "10px",
                width: 180,
                height: 70,
            },
        })) || [];

    const edges =
        selectedWorkflow?.connections?.map((conn) => ({
            id: conn.connection_id,
            type: "floating",
            source: conn.source_node_id,
            target: conn.target_node_id,
            sourceHandle: conn.source_handle,
            targetHandle: conn.target_handle,
            markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 20,
                height: 20,
            },
        })) || [];

    const edgeTypes = useMemo(() => ({ floating: FloatingEdge }), []);

    return {
        workflows,
        selectedWorkflow,
        loading,
        colorMode,
        nodes,
        edges,
        edgeTypes,
        viewWorkflow,
        backToList,
    };
};
