import React, { useState, useEffect, useMemo } from 'react';
import { ReactFlow, MiniMap, Controls, Background, MarkerType } from '@xyflow/react';
import axios from 'axios';
import '@xyflow/react/dist/style.css';
import FloatingEdge from './FloatingEdge';

const WorkflowsApp = () => {
    const [workflows, setWorkflows] = useState([]);
    const [selectedWorkflow, setSelectedWorkflow] = useState(null);
    const [loading, setLoading] = useState(false);
    const [colorMode, setColorMode] = useState(
        document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    );

    useEffect(() => {
        console.log('WorkflowsApp mounted');
        fetchWorkflows();
    }, []);

    // Listen for theme changes
    useEffect(() => {
        const observer = new MutationObserver(() => {
            const isDark = document.documentElement.classList.contains('dark');
            setColorMode(isDark ? 'dark' : 'light');
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });

        return () => observer.disconnect();
    }, []);

    const fetchWorkflows = async () => {
        try {
            console.log('Fetching workflows...');
            setLoading(true);
            const response = await axios.get('/api/workflows');
            console.log('Workflows fetched:', response.data);
            const activeWorkflows = response.data.filter(w => w.is_active);
            console.log('Active workflows:', activeWorkflows);
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
            width: 180,
            height: 70,
        },
    })) || [];

    const edges = selectedWorkflow?.connections?.map((conn) => ({
        id: conn.connection_id,
        type: 'floating',
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

    // Define custom edge types
    const edgeTypes = useMemo(() => ({ floating: FloatingEdge }), []);

    console.log('WorkflowsApp rendering, workflows:', workflows.length, 'selectedWorkflow:', selectedWorkflow?.name);

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Available Workflows</h1>

            {selectedWorkflow ? (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedWorkflow.name}</h2>
                            <p className="text-gray-600 dark:text-gray-400">{selectedWorkflow.description}</p>
                        </div>
                        <button
                            onClick={() => setSelectedWorkflow(null)}
                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                            Back to List
                        </button>
                    </div>

                    <div className="h-[600px] border border-gray-300 dark:border-gray-600 rounded-lg">
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            edgeTypes={edgeTypes}
                            colorMode={colorMode}
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
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Active Workflows</h2>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>
                        ) : workflows.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                No active workflows available
                            </div>
                        ) : (
                            workflows.map((workflow) => (
                                <div key={workflow.id} className="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <div>
                                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{workflow.name}</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{workflow.description}</p>
                                        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
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
