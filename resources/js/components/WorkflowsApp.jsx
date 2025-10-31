import React, { useState, useEffect } from 'react';
import { ReactFlow, MiniMap, Controls, Background } from 'reactflow';
import axios from 'axios';
import 'reactflow/dist/style.css';

const WorkflowsApp = () => {
    const [workflows, setWorkflows] = useState([]);
    const [selectedWorkflow, setSelectedWorkflow] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchWorkflows();
    }, []);

    const fetchWorkflows = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/workflows');
            const activeWorkflows = response.data.filter(w => w.is_active);
            setWorkflows(activeWorkflows);
        } catch (error) {
            console.error('Error fetching workflows:', error);
        } finally {
            setLoading(false);
        }
    };

    const viewWorkflow = (workflow) => {
        setSelectedWorkflow(workflow);
    };

    const nodes = selectedWorkflow?.nodes?.map((node) => ({
        id: node.node_id,
        type: 'default',
        position: node.position || { x: 0, y: 0 },
        data: node.data || { label: node.label },
        style: {
            background: '#f0f0f0',
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: '10px',
        },
    })) || [];

    const edges = selectedWorkflow?.connections?.map((conn) => ({
        id: conn.connection_id,
        source: conn.source_node_id,
        target: conn.target_node_id,
        sourceHandle: conn.source_handle,
        targetHandle: conn.target_handle,
    })) || [];

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Available Workflows</h1>

            {selectedWorkflow ? (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold">{selectedWorkflow.name}</h2>
                            <p className="text-gray-600">{selectedWorkflow.description}</p>
                        </div>
                        <button
                            onClick={() => setSelectedWorkflow(null)}
                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                            Back to List
                        </button>
                    </div>

                    <div className="h-[600px] border border-gray-300 rounded-lg">
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            fitView
                            nodesDraggable={false}
                            nodesConnectable={false}
                            elementsSelectable={false}
                        >
                            <Controls showInteractive={false} />
                            <MiniMap />
                            <Background variant="dots" gap={12} size={1} />
                        </ReactFlow>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow">
                    <div className="p-4 border-b">
                        <h2 className="text-xl font-bold">Active Workflows</h2>
                    </div>
                    <div className="divide-y">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500">Loading...</div>
                        ) : workflows.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                No active workflows available
                            </div>
                        ) : (
                            workflows.map((workflow) => (
                                <div key={workflow.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                                    <div>
                                        <h3 className="font-semibold text-lg">{workflow.name}</h3>
                                        <p className="text-sm text-gray-600">{workflow.description}</p>
                                        <div className="mt-2 text-sm text-gray-500">
                                            <span className="mr-4">Nodes: {workflow.nodes?.length || 0}</span>
                                            <span>Connections: {workflow.connections?.length || 0}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => viewWorkflow(workflow)}
                                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    >
                                        View
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkflowsApp;
