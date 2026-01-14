import React, { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { ReactFlow, Background, Panel, useReactFlow, useOnViewportChange } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { CircleCheck, GitBranch, GitMerge, Layers, Network, Sparkles } from "lucide-react";

import { nodeTypes } from "./nodes";
import FloatingEdge from "./FloatingEdge";
import WorkflowSidebar from "./workflow/WorkflowSidebar";
import WorkflowPropertiesPanel from "./workflow/WorkflowPropertiesPanel";
import WorkflowSettingsModal from "./workflow/WorkflowSettingsModal";
import { useWorkflowEditor } from "@/hooks/useWorkflowEditor";
import { useWorkflowRunner } from "@/hooks/useWorkflowRunner";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useToast } from "@/components/ui/toast";
import { defaultEdgeOptions, nodeTypeConfig } from "@/constants/workflowConstants";
import { Button } from "@/components/ui/button";

const contextMenuIcons = {
    start: <Sparkles className="w-4 h-4" />,
    apiAction: <Network className="w-4 h-4" />,
    merge: <Layers className="w-4 h-4" />,
    join: <GitMerge className="w-4 h-4" />,
    branch: <GitBranch className="w-4 h-4" />,
    end: <CircleCheck className="w-4 h-4" />,
};

// Context Menu Component
const ContextMenu = ({ x, y, onClose, onAddNode }) => {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    const menuItems = [
        { type: "start", label: "Initial Node", icon: contextMenuIcons.start },
        {
            type: "apiAction",
            label: "Transform Node",
            icon: contextMenuIcons.apiAction,
        },
        { type: "merge", label: "Merge Node", icon: contextMenuIcons.merge },
        { type: "join", label: "Join Node", icon: contextMenuIcons.join },
        { type: "branch", label: "Branch Node", icon: contextMenuIcons.branch },
        { type: "end", label: "Output Node", icon: contextMenuIcons.end },
    ];

    return (
        <div
            ref={menuRef}
            className="fixed bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-2 z-50 min-w-[200px]"
            style={{ left: x, top: y }}
        >
            <div className="px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white">
                Add Node
            </div>
            {menuItems.map(({ type, label, icon }) => (
                <button
                    key={type}
                    onClick={() => {
                        onAddNode(type);
                        onClose();
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    <span className="text-gray-500 dark:text-gray-400">{icon}</span>
                    {label}
                </button>
            ))}
        </div>
    );
};

// Zoom Controls Component
const ZoomControls = ({ onSave, onReset, isSaving }) => {
    const { zoomIn, zoomOut, fitView } = useReactFlow();
    const [zoom, setZoom] = useState(100);

    useOnViewportChange({
        onChange: (viewport) => setZoom(Math.round(viewport.zoom * 100)),
    });

    return (
        <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 shadow-sm">
            {/* Save button */}
            <button
                onClick={onSave}
                disabled={isSaving}
                className="h-8 px-3 flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                title="Save (Ctrl+S)"
            >
                <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                </svg>
                Save
            </button>

            <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />

            {/* Reset button */}
            <button
                onClick={onReset}
                className="h-8 px-3 flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Reset execution state"
            >
                <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                </svg>
                Reset
            </button>

            <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />

            {/* Zoom controls */}
            <button
                onClick={zoomOut}
                className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Zoom out"
            >
                <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
            </button>

            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-12 text-center">
                {zoom}%
            </span>

            <button
                onClick={zoomIn}
                className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Zoom in"
            >
                <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
            </button>

            <button
                onClick={() => fitView({ padding: 0.2 })}
                className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Fit view"
            >
                <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                </svg>
            </button>
        </div>
    );
};

const WorkflowEditor = ({
    initialNodes = [],
    initialEdges = [],
    onSave,
    teamId,
    webhookEnabled = false,
    webhookToken = null,
    isScheduled = false,
    scheduleCron = "",
    scheduleOptions = [],
    onScheduledChange,
    onScheduleCronChange,
    onWebhookEnabledChange,
    onGenerateToken,
}) => {
    const reactFlowWrapper = useRef(null);
    const edgeTypes = useMemo(() => ({ floating: FloatingEdge }), []);
    const [isSaving, setIsSaving] = useState(false);
    const [contextMenu, setContextMenu] = useState(null);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isGeneratingToken, setIsGeneratingToken] = useState(false);
    const { screenToFlowPosition } = useReactFlow();

    // Generate webhook URL from token
    const webhookUrl = useMemo(() => {
        if (!webhookToken) return null;
        return `${window.location.origin}/api/webhooks/${webhookToken}`;
    }, [webhookToken]);

    const {
        nodes,
        edges,
        setNodes,
        setEdges,
        selectedNode,
        selectedEdge,
        nodeLabel,
        nodeDescription,
        nodeConfig,
        colorMode,
        snapToGrid,
        onNodesChange,
        onEdgesChange,
        onConnect,
        onDragStart,
        onDragOver,
        onDrop,
        onNodeClick,
        onEdgeClick,
        setSelectedNode,
        setSelectedEdge,
        setNodeLabel,
        setNodeDescription,
        setNodeConfig,
        updateSelectedNode,
        deleteSelectedNode,
        deleteSelectedEdge,
        deleteNodeConnections,
        handleSave,
        handleNodeTrigger,
        handleNodeDelete,
        handleUpdateOutputs,
        handleUpdateInputs,
    } = useWorkflowEditor(initialNodes, initialEdges);

    const { isRunning, runWorkflow, resetExecution } = useWorkflowRunner(
        nodes,
        edges,
        setNodes,
        setEdges,
        teamId,
    );

    // Check for multiple trigger nodes
    const triggerWarning = useMemo(() => {
        const triggerTypes = ["start", "webhookTrigger"];
        const triggers = nodes.filter((node) => {
            const nodeType = node.data?.type || node.type;
            return triggerTypes.includes(nodeType);
        });

        if (triggers.length > 1) {
            const triggerNames = triggers.map((t) => {
                const type = t.data?.type || t.type;
                return type === "start" ? "Start" : "Webhook Trigger";
            });
            return `A workflow több triggert tartalmaz (${triggerNames.join(", ")}). Csak az első trigger fog lefutni.`;
        }
        return null;
    }, [nodes]);

    // Toast notifications
    const toast = useToast();

    // Auto-save functionality
    const { autoSaveStatus, saveNow } = useAutoSave(nodes, edges, onSave, {
        debounceMs: 2000,
    });

    // Show toast notifications on save status changes
    const prevStatusRef = useRef(autoSaveStatus);
    useEffect(() => {
        if (prevStatusRef.current !== autoSaveStatus) {
            if (autoSaveStatus === "saved") {
                toast.success("Saved", "Workflow changes saved successfully");
            } else if (autoSaveStatus === "error") {
                toast.error("Save Failed", "Failed to save workflow changes");
            }
            prevStatusRef.current = autoSaveStatus;
        }
    }, [autoSaveStatus, toast]);

    const doSave = useCallback(async () => {
        setIsSaving(true);
        await saveNow();
        setIsSaving(false);
    }, [saveNow]);

    // Context menu handler
    const onPaneContextMenu = useCallback(
        (event) => {
            event.preventDefault();
            setContextMenu({
                x: event.clientX,
                y: event.clientY,
                flowPosition: screenToFlowPosition({
                    x: event.clientX,
                    y: event.clientY,
                }),
            });
        },
        [screenToFlowPosition],
    );

    const handleAddNodeFromMenu = useCallback(
        (nodeType) => {
            if (!contextMenu) return;

            const nodeTypeInfo = nodeTypeConfig[nodeType] || { label: "Node" };
            const dataType = nodeType.replace("Action", "");

            const nodeData = {
                label: `${nodeTypeInfo.label} Node`,
                type: dataType,
                description: "",
                config: {},
                status: "initial",
                onTrigger: handleNodeTrigger,
                onDelete: handleNodeDelete,
                onUpdateOutputs: handleUpdateOutputs,
                onUpdateInputs: handleUpdateInputs,
            };

            // Add default outputs for branch nodes
            if (nodeType === "branch") {
                nodeData.outputs = ["output-1", "output-2"];
            }

            // Add default inputs for join nodes
            if (nodeType === "join") {
                nodeData.inputs = ["input-1", "input-2"];
            }

            // Add default inputs for merge nodes
            if (nodeType === "merge") {
                nodeData.inputs = ["input-1", "input-2"];
                nodeData.config = { separator: "" };
            }

            const newNode = {
                id: `${nodeType}_${Date.now()}`,
                type: nodeType,
                position: contextMenu.flowPosition,
                data: nodeData,
            };

            setNodes((nds) => [...nds, newNode]);
            setContextMenu(null);
        },
        [
            contextMenu,
            setNodes,
            handleNodeTrigger,
            handleNodeDelete,
            handleUpdateOutputs,
            handleUpdateInputs,
        ],
    );

    const closeContextMenu = useCallback(() => {
        setContextMenu(null);
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (event) => {
            // Ctrl+S to save
            if ((event.ctrlKey || event.metaKey) && event.key === "s") {
                event.preventDefault();
                doSave();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [doSave]);

    const handleGenerateToken = useCallback(async () => {
        if (!onGenerateToken) return;
        setIsGeneratingToken(true);
        try {
            await onGenerateToken();
        } finally {
            setIsGeneratingToken(false);
        }
    }, [onGenerateToken]);

    const handleSettingsSave = useCallback(async () => {
        setIsSaving(true);
        await saveNow(true); // Force save to include settings changes
        setIsSaving(false);
        setIsSettingsModalOpen(false);
    }, [saveNow]);

    return (
        <div className="flex gap-4 h-[700px]">
            <WorkflowSidebar
                onDragStart={onDragStart}
                onSettingsClick={() => setIsSettingsModalOpen(true)}
            />

            <div
                className="flex-1 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
                ref={reactFlowWrapper}
            >
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={onNodeClick}
                    onEdgeClick={onEdgeClick}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onPaneContextMenu={onPaneContextMenu}
                    onPaneClick={closeContextMenu}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    defaultEdgeOptions={defaultEdgeOptions}
                    colorMode={colorMode}
                    snapToGrid={snapToGrid}
                    snapGrid={[15, 15]}
                    fitView
                    proOptions={{ hideAttribution: true }}
                >
                    <Background
                        variant="dots"
                        gap={20}
                        size={1}
                        color={colorMode === "dark" ? "#374151" : "#d1d5db"}
                    />

                    {/* Top Left - Auto-save status */}
                    <Panel position="top-left" className="m-4">
                        <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 shadow-sm text-sm">
                            {autoSaveStatus === "idle" && (
                                <span className="text-gray-500 dark:text-gray-400">
                                    Auto-save enabled
                                </span>
                            )}
                            {autoSaveStatus === "pending" && (
                                <>
                                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                                    <span className="text-amber-600 dark:text-amber-400">
                                        Unsaved changes...
                                    </span>
                                </>
                            )}
                            {autoSaveStatus === "saving" && (
                                <>
                                    <svg
                                        className="w-4 h-4 animate-spin text-blue-500"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                    </svg>
                                    <span className="text-blue-600 dark:text-blue-400">
                                        Saving...
                                    </span>
                                </>
                            )}
                            {autoSaveStatus === "saved" && (
                                <>
                                    <svg
                                        className="w-4 h-4 text-green-500"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path d="M20 6L9 17l-5-5" />
                                    </svg>
                                    <span className="text-green-600 dark:text-green-400">
                                        Saved
                                    </span>
                                </>
                            )}
                            {autoSaveStatus === "error" && (
                                <>
                                    <svg
                                        className="w-4 h-4 text-red-500"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="15" y1="9" x2="9" y2="15" />
                                        <line x1="9" y1="9" x2="15" y2="15" />
                                    </svg>
                                    <span className="text-red-600 dark:text-red-400">
                                        Save failed
                                    </span>
                                </>
                            )}
                        </div>
                    </Panel>

                    {/* Top Center - Multiple Trigger Warning */}
                    {triggerWarning && (
                        <Panel position="top-center" className="m-4">
                            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-lg px-4 py-2 shadow-sm">
                                <svg
                                    className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                </svg>
                                <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                                    {triggerWarning}
                                </span>
                            </div>
                        </Panel>
                    )}

                    {/* Top Right - Run Button */}
                    <Panel position="top-right" className="m-4">
                        <Button
                            onClick={runWorkflow}
                            disabled={isRunning}
                            className={`gap-2 px-5 py-2.5 rounded-lg font-medium shadow-sm ${
                                isRunning
                                    ? "bg-amber-500 hover:bg-amber-500 text-white"
                                    : "bg-blue-600 hover:bg-blue-700 text-white"
                            }`}
                        >
                            {isRunning ? (
                                <>
                                    <svg
                                        className="w-4 h-4 animate-spin"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                    </svg>
                                    Running...
                                </>
                            ) : (
                                <>
                                    <svg
                                        className="w-4 h-4"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                    >
                                        <polygon points="5 3 19 12 5 21 5 3" />
                                    </svg>
                                    Run Workflow
                                </>
                            )}
                        </Button>
                    </Panel>

                    {/* Bottom Center - Controls */}
                    <Panel position="bottom-center" className="mb-4">
                        <ZoomControls
                            onSave={doSave}
                            onReset={resetExecution}
                            isSaving={isSaving}
                        />
                    </Panel>
                </ReactFlow>

                {/* Context Menu */}
                {contextMenu && (
                    <ContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        onClose={closeContextMenu}
                        onAddNode={handleAddNodeFromMenu}
                    />
                )}
            </div>

            <WorkflowPropertiesPanel
                selectedNode={selectedNode}
                selectedEdge={selectedEdge}
                nodeLabel={nodeLabel}
                nodeDescription={nodeDescription}
                nodeConfig={nodeConfig}
                setSelectedNode={setSelectedNode}
                setSelectedEdge={setSelectedEdge}
                setNodeLabel={setNodeLabel}
                setNodeDescription={setNodeDescription}
                setNodeConfig={setNodeConfig}
                updateSelectedNode={updateSelectedNode}
                deleteSelectedNode={deleteSelectedNode}
                deleteNodeConnections={deleteNodeConnections}
                deleteSelectedEdge={deleteSelectedEdge}
                teamId={teamId}
                nodes={nodes}
                edges={edges}
                onUpdateNodeInputs={handleUpdateInputs}
                webhookUrl={webhookUrl}
                webhookEnabled={webhookEnabled}
            />

            <WorkflowSettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                isScheduled={isScheduled}
                scheduleCron={scheduleCron}
                scheduleOptions={scheduleOptions}
                webhookEnabled={webhookEnabled}
                webhookToken={webhookToken}
                onScheduledChange={onScheduledChange}
                onScheduleCronChange={onScheduleCronChange}
                onWebhookEnabledChange={onWebhookEnabledChange}
                onGenerateToken={handleGenerateToken}
                isGeneratingToken={isGeneratingToken}
                onSave={handleSettingsSave}
                isSaving={isSaving}
            />
        </div>
    );
};

export default WorkflowEditor;
