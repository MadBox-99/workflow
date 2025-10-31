import React, { useState, useEffect } from 'react';
import WorkflowEditor from './WorkflowEditor';
import axios from 'axios';

const AdminApp = () => {
    const [workflows, setWorkflows] = useState([]);
    const [selectedWorkflow, setSelectedWorkflow] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [workflowName, setWorkflowName] = useState('');
    const [workflowDescription, setWorkflowDescription] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchWorkflows();

        // Check URL for workflow ID
        const urlParams = new URLSearchParams(window.location.search);
        const workflowId = urlParams.get('workflow');
        if (workflowId) {
            loadWorkflowForEdit(workflowId);
        }
    }, []);

    const fetchWorkflows = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/workflows');
            setWorkflows(response.data);
        } catch (error) {
            console.error('Error fetching workflows:', error);
            alert('Error fetching workflows');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveWorkflow = async (workflowData) => {
        if (!workflowName.trim()) {
            alert('Please enter a workflow name');
            return;
        }

        try {
            setLoading(true);
            const payload = {
                name: workflowName,
                description: workflowDescription,
                nodes: workflowData.nodes,
                connections: workflowData.connections,
                is_active: true,
            };

            if (selectedWorkflow) {
                const response = await axios.put(`/api/workflows/${selectedWorkflow.id}`, payload);
                alert('Workflow updated successfully!');
                // Reload the workflow to get updated data
                const updatedWorkflow = await axios.get(`/api/workflows/${selectedWorkflow.id}`);
                setSelectedWorkflow(updatedWorkflow.data);
            } else {
                const response = await axios.post('/api/workflows', payload);
                alert('Workflow created successfully!');
                // Load the newly created workflow
                setSelectedWorkflow(response.data);
                setWorkflowName(response.data.name);
                setWorkflowDescription(response.data.description || '');
            }

            // Don't close the editor after save
            // setIsCreating(false);
            // setSelectedWorkflow(null);
            // setWorkflowName('');
            // setWorkflowDescription('');
            fetchWorkflows();
        } catch (error) {
            console.error('Error saving workflow:', error);
            alert('Error saving workflow: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleEditWorkflow = (workflow) => {
        setSelectedWorkflow(workflow);
        setWorkflowName(workflow.name);
        setWorkflowDescription(workflow.description || '');
        setIsCreating(true);
    };

    const handleDeleteWorkflow = async (id) => {
        if (!confirm('Are you sure you want to delete this workflow?')) return;

        try {
            setLoading(true);
            await axios.delete(`/api/workflows/${id}`);
            alert('Workflow deleted successfully!');
            fetchWorkflows();
        } catch (error) {
            console.error('Error deleting workflow:', error);
            alert('Error deleting workflow');
        } finally {
            setLoading(false);
        }
    };

    const handleNewWorkflow = () => {
        setIsCreating(true);
        setSelectedWorkflow(null);
        setWorkflowName('');
        setWorkflowDescription('');
    };

    const loadWorkflowForEdit = async (workflowId) => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/workflows/${workflowId}`);
            const workflow = response.data;
            setSelectedWorkflow(workflow);
            setWorkflowName(workflow.name);
            setWorkflowDescription(workflow.description || '');
            setIsCreating(true);
        } catch (error) {
            console.error('Error loading workflow:', error);
            alert('Error loading workflow: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const initialNodes = selectedWorkflow?.nodes?.map((node) => ({
        id: node.node_id,
        type: 'custom',
        position: node.position || { x: 0, y: 0 },
        data: {
            ...node.data,
            label: node.data?.label || node.label,
            type: node.data?.type || node.type || 'action',
        },
    })) || [];

    const initialEdges = selectedWorkflow?.connections?.map((conn) => ({
        id: conn.connection_id,
        source: conn.source_node_id,
        target: conn.target_node_id,
        sourceHandle: conn.source_handle,
        targetHandle: conn.target_handle,
    })) || [];

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Workflow Admin</h1>
                <button
                    onClick={handleNewWorkflow}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    disabled={loading}
                >
                    New Workflow
                </button>
            </div>

            {isCreating ? (
                <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h2 className="text-xl font-bold mb-4">
                            {selectedWorkflow ? 'Edit Workflow' : 'Create New Workflow'}
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name</label>
                                <input
                                    type="text"
                                    value={workflowName}
                                    onChange={(e) => setWorkflowName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded"
                                    placeholder="Workflow name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea
                                    value={workflowDescription}
                                    onChange={(e) => setWorkflowDescription(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded"
                                    placeholder="Workflow description"
                                    rows="3"
                                />
                            </div>
                        </div>
                    </div>

                    <WorkflowEditor
                        initialNodes={initialNodes}
                        initialEdges={initialEdges}
                        onSave={handleSaveWorkflow}
                    />

                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                setIsCreating(false);
                                setSelectedWorkflow(null);
                                setWorkflowName('');
                                setWorkflowDescription('');
                            }}
                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                            disabled={loading}
                        >
                            Close Editor
                        </button>
                        <p className="text-sm text-gray-500 flex items-center">
                            Workflow will stay open after saving
                        </p>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow">
                    <div className="p-4 border-b">
                        <h2 className="text-xl font-bold">Workflows</h2>
                    </div>
                    <div className="divide-y">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500">Loading...</div>
                        ) : workflows.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                No workflows yet. Create one to get started!
                            </div>
                        ) : (
                            workflows.map((workflow) => (
                                <div key={workflow.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                                    <div>
                                        <h3 className="font-semibold">{workflow.name}</h3>
                                        <p className="text-sm text-gray-600">{workflow.description}</p>
                                        <span className={`inline-block mt-1 px-2 py-1 text-xs rounded ${
                                            workflow.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {workflow.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEditWorkflow(workflow)}
                                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteWorkflow(workflow.id)}
                                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminApp;
