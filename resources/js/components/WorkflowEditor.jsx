import React, { useCallback, useState, useMemo, useEffect } from 'react';
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import CustomNode from './CustomNode';
import StartNodeConfig from './StartNodeConfig';

const nodeTypeConfig = {
    start: { label: 'Start', color: '#22c55e', bgColor: '#dcfce7' },
    action: { label: 'Action', color: '#3b82f6', bgColor: '#dbeafe' },
    condition: { label: 'Condition', color: '#eab308', bgColor: '#fef9c3' },
    end: { label: 'End', color: '#ef4444', bgColor: '#fee2e2' },
};

const WorkflowEditor = ({ initialNodes = [], initialEdges = [], onSave }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [selectedNodeType, setSelectedNodeType] = useState('action');
    const [selectedNode, setSelectedNode] = useState(null);
    const [selectedEdge, setSelectedEdge] = useState(null);
    const [nodeLabel, setNodeLabel] = useState('');
    const [nodeDescription, setNodeDescription] = useState('');
    const [nodeConfig, setNodeConfig] = useState('');

    // Define custom node types for ReactFlow
    const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);

    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    const addNode = useCallback(() => {
        const nodeTypeInfo = nodeTypeConfig[selectedNodeType];
        const newNode = {
            id: `node-${Date.now()}`,
            type: 'custom',
            position: { x: Math.random() * 400, y: Math.random() * 400 },
            data: {
                label: `${nodeTypeInfo.label} Node`,
                type: selectedNodeType,
                description: '',
                config: {},
            },
        };
        setNodes((nds) => [...nds, newNode]);
    }, [selectedNodeType, setNodes]);

    const onNodeClick = useCallback((event, node) => {
        setSelectedNode(node);
        setSelectedEdge(null);
        setNodeLabel(node.data.label || '');
        setNodeDescription(node.data.description || '');
        setNodeConfig(JSON.stringify(node.data.config || {}, null, 2));
    }, []);

    const onEdgeClick = useCallback((event, edge) => {
        setSelectedEdge(edge);
        setSelectedNode(null);
    }, []);

    const updateSelectedNode = useCallback(() => {
        if (!selectedNode) return;

        let parsedConfig = {};
        try {
            parsedConfig = JSON.parse(nodeConfig || '{}');
        } catch (e) {
            alert('Invalid JSON in configuration');
            return;
        }

        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === selectedNode.id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            label: nodeLabel,
                            description: nodeDescription,
                            config: parsedConfig,
                        },
                    };
                }
                return node;
            })
        );
    }, [selectedNode, nodeLabel, nodeDescription, nodeConfig, setNodes]);

    const deleteSelectedNode = useCallback(() => {
        if (!selectedNode) return;
        if (!confirm('Are you sure you want to delete this node?')) return;

        setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
        setEdges((eds) =>
            eds.filter(
                (edge) =>
                    edge.source !== selectedNode.id && edge.target !== selectedNode.id
            )
        );
        setSelectedNode(null);
    }, [selectedNode, setNodes, setEdges]);

    const deleteSelectedEdge = useCallback(() => {
        if (!selectedEdge) return;
        setEdges((eds) => eds.filter((edge) => edge.id !== selectedEdge.id));
        setSelectedEdge(null);
    }, [selectedEdge, setEdges]);

    const deleteNodeConnections = useCallback(() => {
        if (!selectedNode) return;
        if (!confirm('Delete all connections for this node?')) return;

        setEdges((eds) =>
            eds.filter(
                (edge) =>
                    edge.source !== selectedNode.id && edge.target !== selectedNode.id
            )
        );
    }, [selectedNode, setEdges]);

    // Handle keyboard shortcuts for deleting selected edge
    useEffect(() => {
        const handleKeyDown = (event) => {
            // Check if Delete or Backspace key is pressed
            if (event.key === 'Delete' || event.key === 'Backspace') {
                // Only delete edge if an edge is selected and not typing in an input
                if (selectedEdge &&
                    event.target.tagName !== 'INPUT' &&
                    event.target.tagName !== 'TEXTAREA') {
                    event.preventDefault();
                    deleteSelectedEdge();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedEdge, deleteSelectedEdge]);

    const handleSave = useCallback(() => {
        const workflowData = {
            nodes: nodes.map((node) => ({
                id: node.id,
                type: node.data.type || 'action',
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
        onSave(workflowData);
    }, [nodes, edges, onSave]);

    return (
        <div className="flex gap-4">
            <div className="flex-1 h-[600px] border border-gray-300 rounded-lg">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={onNodeClick}
                    onEdgeClick={onEdgeClick}
                    nodeTypes={nodeTypes}
                    edgesUpdatable={true}
                    edgesFocusable={true}
                    fitView
                >
                    <Panel position="top-left" className="bg-white p-4 rounded-lg shadow-lg">
                        <div className="space-y-2">
                            <h3 className="font-bold text-sm">Add Node</h3>
                            <select
                                value={selectedNodeType}
                                onChange={(e) => setSelectedNodeType(e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded"
                            >
                                {Object.entries(nodeTypeConfig).map(([key, { label }]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                            <button
                                onClick={addNode}
                                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                            >
                                Add Node
                            </button>
                            <button
                                onClick={handleSave}
                                className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                            >
                                Save Workflow
                            </button>
                        </div>
                    </Panel>
                    <Controls />
                    <MiniMap />
                    <Background variant="dots" gap={12} size={1} />
                </ReactFlow>
            </div>

            {/* Node/Edge Properties Panel */}
            <div className="w-80 bg-white border border-gray-300 rounded-lg p-4 h-[600px] overflow-y-auto">
                {selectedNode ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <h3 className="font-bold text-lg">Node Properties</h3>
                            <button
                                onClick={() => setSelectedNode(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Type</label>
                            <div className="px-3 py-2 bg-gray-100 rounded text-sm">
                                {nodeTypeConfig[selectedNode.data.type]?.label || 'Unknown'}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Label</label>
                            <input
                                type="text"
                                value={nodeLabel}
                                onChange={(e) => setNodeLabel(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                placeholder="Node label"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <textarea
                                value={nodeDescription}
                                onChange={(e) => setNodeDescription(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                placeholder="Node description"
                                rows="3"
                            />
                        </div>

                        {selectedNode.data.type === 'start' ? (
                            <StartNodeConfig
                                config={JSON.parse(nodeConfig || '{}')}
                                onChange={(newConfig) => setNodeConfig(JSON.stringify(newConfig, null, 2))}
                            />
                        ) : (
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Configuration (JSON)
                                </label>
                                <textarea
                                    value={nodeConfig}
                                    onChange={(e) => setNodeConfig(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-mono"
                                    placeholder='{"key": "value"}'
                                    rows="6"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Add custom properties as JSON
                                </p>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button
                                onClick={updateSelectedNode}
                                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                            >
                                Update Node
                            </button>
                            <button
                                onClick={deleteSelectedNode}
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                            >
                                Delete
                            </button>
                        </div>

                        <div className="border-t pt-2">
                            <button
                                onClick={deleteNodeConnections}
                                className="w-full px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm"
                            >
                                Delete All Connections
                            </button>
                        </div>

                        <div className="text-xs text-gray-500 border-t pt-2">
                            <p><strong>Node ID:</strong> {selectedNode.id}</p>
                        </div>
                    </div>
                ) : selectedEdge ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <h3 className="font-bold text-lg">Connection Properties</h3>
                            <button
                                onClick={() => setSelectedEdge(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Source Node</label>
                            <div className="px-3 py-2 bg-gray-100 rounded text-sm font-mono">
                                {selectedEdge.source}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Target Node</label>
                            <div className="px-3 py-2 bg-gray-100 rounded text-sm font-mono">
                                {selectedEdge.target}
                            </div>
                        </div>

                        {selectedEdge.sourceHandle && (
                            <div>
                                <label className="block text-sm font-medium mb-1">Source Handle</label>
                                <div className="px-3 py-2 bg-gray-100 rounded text-sm">
                                    {selectedEdge.sourceHandle}
                                </div>
                            </div>
                        )}

                        {selectedEdge.targetHandle && (
                            <div>
                                <label className="block text-sm font-medium mb-1">Target Handle</label>
                                <div className="px-3 py-2 bg-gray-100 rounded text-sm">
                                    {selectedEdge.targetHandle}
                                </div>
                            </div>
                        )}

                        <button
                            onClick={deleteSelectedEdge}
                            className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                        >
                            Delete Connection
                        </button>

                        <div className="text-xs text-gray-500 border-t pt-2">
                            <p><strong>Connection ID:</strong> {selectedEdge.id}</p>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded p-2">
                            <p className="text-xs text-blue-800">
                                Click on another connection to delete it, or click on a node to edit its properties.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                        Click on a node or connection to edit its properties
                    </div>
                )}
            </div>
        </div>
    );
};

export default WorkflowEditor;
