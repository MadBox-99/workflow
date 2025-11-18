import React, { useMemo, useRef } from 'react';
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import CustomNode from './CustomNode';
import FloatingEdge from './FloatingEdge';
import WorkflowSidebar from './workflow/WorkflowSidebar';
import WorkflowPropertiesPanel from './workflow/WorkflowPropertiesPanel';
import { useWorkflowEditor } from '@/hooks/useWorkflowEditor';
import { defaultEdgeOptions } from '@/constants/workflowConstants';

const WorkflowEditor = ({ initialNodes = [], initialEdges = [], onSave }) => {
    const reactFlowWrapper = useRef(null);
    const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);
    const edgeTypes = useMemo(() => ({ floating: FloatingEdge }), []);

    const {
        nodes,
        edges,
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
        toggleSnapToGrid,
    } = useWorkflowEditor(initialNodes, initialEdges);

    return (
        <div className="flex gap-4">
            <WorkflowSidebar onDragStart={onDragStart} />

            <div className="flex-1 h-[600px] border border-gray-300 dark:border-gray-600 rounded-lg" ref={reactFlowWrapper}>
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
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    defaultEdgeOptions={defaultEdgeOptions}
                    colorMode={colorMode}
                    snapToGrid={snapToGrid}
                    snapGrid={[15, 15]}
                    fitView
                >
                    <Controls />
                    <MiniMap />
                    <Background variant="dots" gap={12} size={1} />
                    <Panel position="top-right" className="flex gap-2">
                        <button
                            onClick={toggleSnapToGrid}
                            className={`px-4 py-2 rounded-lg shadow-lg font-medium transition-all hover:scale-105 ${
                                snapToGrid
                                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                                    : 'bg-gray-400 text-white hover:bg-gray-500'
                            }`}
                            title={snapToGrid ? 'Snap to Grid: ON' : 'Snap to Grid: OFF'}
                        >
                            {snapToGrid ? '🧲 Grid ON' : '🔓 Free'}
                        </button>
                        <button
                            onClick={() => handleSave(onSave)}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow-lg font-medium transition-all hover:scale-105"
                        >
                            💾 Save Workflow
                        </button>
                    </Panel>
                </ReactFlow>
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
            />
        </div>
    );
};

export default WorkflowEditor;
