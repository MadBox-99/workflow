import React from "react";
import { MarkerType, ReactFlowProvider } from "@xyflow/react";
import WorkflowEditor from "../WorkflowEditor";
import WorkflowForm from "./WorkflowForm";

// Map data types to React Flow node types
const getReactFlowNodeType = (dataType) => {
    if (dataType === "googleCalendarAction") return "googleCalendar";
    if (dataType === "googleDocsAction") return "googleDocs";
    const actionTypes = [
        "apiAction",
        "emailAction",
        "databaseAction",
        "scriptAction",
        "webhookAction",
        "action",
    ];
    if (actionTypes.includes(dataType)) return "action";
    if (
        ["start", "end", "condition", "constant", "branch", "join", "merge", "template"].includes(
            dataType,
        )
    )
        return dataType;
    return "action"; // fallback for old 'custom' nodes
};

// Get default node dimensions based on type
const getNodeDimensions = (dataType) => {
    switch (dataType) {
        case "condition":
            return { width: 120, height: 120 };
        case "start":
        case "end":
            return { width: 120, height: 50 };
        case "constant":
            return { width: 140, height: 60 };
        case "branch":
        case "join":
        case "merge":
        case "template":
            return { width: 220, height: 90 };
        case "googleCalendarAction":
        case "googleDocsAction":
            return { width: 240, height: 80 };
        default:
            return { width: 180, height: 70 };
    }
};

const WorkflowEditorView = ({
    selectedWorkflow,
    workflowName,
    workflowDescription,
    isScheduled,
    scheduleCron,
    teamId,
    teams,
    scheduleOptions,
    onNameChange,
    onDescriptionChange,
    onScheduledChange,
    onScheduleCronChange,
    onTeamChange,
    onSave,
    onClose,
    loading,
}) => {
    const initialNodes =
        selectedWorkflow?.nodes?.map((node) => {
            const dataType = node.data?.type || node.type || "action";
            return {
                id: node.node_id,
                type: getReactFlowNodeType(dataType),
                position: node.position || { x: 0, y: 0 },
                data: {
                    ...node.data,
                    label: node.data?.label || node.label,
                    type: dataType,
                },
                style: node.style || getNodeDimensions(dataType),
            };
        }) || [];

    const initialEdges =
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

    return (
        <div className="space-y-4">
            <WorkflowForm
                workflowName={workflowName}
                workflowDescription={workflowDescription}
                isScheduled={isScheduled}
                scheduleCron={scheduleCron}
                selectedWorkflow={selectedWorkflow}
                teamId={teamId}
                teams={teams}
                scheduleOptions={scheduleOptions}
                onNameChange={onNameChange}
                onDescriptionChange={onDescriptionChange}
                onScheduledChange={onScheduledChange}
                onScheduleCronChange={onScheduleCronChange}
                onTeamChange={onTeamChange}
            />

            <ReactFlowProvider>
                <WorkflowEditor
                    initialNodes={initialNodes}
                    initialEdges={initialEdges}
                    onSave={onSave}
                    teamId={teamId}
                />
            </ReactFlowProvider>

            <div className="flex gap-2">
                <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    disabled={loading}
                >
                    Close Editor
                </button>
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                    Workflow will stay open after saving
                </p>
            </div>
        </div>
    );
};

export default WorkflowEditorView;
