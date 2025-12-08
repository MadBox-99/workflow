import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export const useWorkflowAdmin = (toast = null) => {
    const [workflows, setWorkflows] = useState([]);
    const [selectedWorkflow, setSelectedWorkflow] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [workflowName, setWorkflowName] = useState('');
    const [workflowDescription, setWorkflowDescription] = useState('');
    const [loading, setLoading] = useState(false);

    // Helper to show notifications (toast or console fallback)
    const notify = useCallback(
        (type, title, message) => {
            if (toast && toast[type]) {
                toast[type](title, message);
            } else {
                console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
            }
        },
        [toast]
    );

    const fetchWorkflows = useCallback(async () => {
        try {
            console.log('Fetching workflows...');
            setLoading(true);
            const response = await axios.get('/api/workflows');
            console.log('Workflows fetched:', response.data);
            setWorkflows(response.data);
        } catch (error) {
            console.error('Error fetching workflows:', error);
            notify('error', 'Error', 'Failed to fetch workflows');
        } finally {
            setLoading(false);
        }
    }, [notify]);

    const loadWorkflowForEdit = useCallback(
        async (workflowId) => {
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
                notify('error', 'Error', 'Failed to load workflow: ' + (error.response?.data?.message || error.message));
            } finally {
                setLoading(false);
            }
        },
        [notify]
    );

    useEffect(() => {
        console.log('AdminApp mounted');
        fetchWorkflows();

        // Check URL for workflow ID
        const urlParams = new URLSearchParams(window.location.search);
        const workflowId = urlParams.get('workflow');
        if (workflowId) {
            loadWorkflowForEdit(workflowId);
        }
    }, [fetchWorkflows, loadWorkflowForEdit]);

    const handleSaveWorkflow = useCallback(
        async (workflowData) => {
            if (!workflowName.trim()) {
                notify('warning', 'Validation', 'Please enter a workflow name');
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
                    await axios.put(`/api/workflows/${selectedWorkflow.id}`, payload);
                    notify('success', 'Saved', 'Workflow updated successfully');
                    const updatedWorkflow = await axios.get(`/api/workflows/${selectedWorkflow.id}`);
                    setSelectedWorkflow(updatedWorkflow.data);
                } else {
                    const response = await axios.post('/api/workflows', payload);
                    notify('success', 'Created', 'Workflow created successfully');
                    setSelectedWorkflow(response.data);
                    setWorkflowName(response.data.name);
                    setWorkflowDescription(response.data.description || '');
                }

                fetchWorkflows();
            } catch (error) {
                console.error('Error saving workflow:', error);
                notify('error', 'Error', 'Failed to save workflow: ' + (error.response?.data?.message || error.message));
            } finally {
                setLoading(false);
            }
        },
        [workflowName, workflowDescription, selectedWorkflow, fetchWorkflows, notify]
    );

    const handleEditWorkflow = useCallback((workflow) => {
        setSelectedWorkflow(workflow);
        setWorkflowName(workflow.name);
        setWorkflowDescription(workflow.description || '');
        setIsCreating(true);
    }, []);

    const handleDeleteWorkflow = useCallback(
        async (id) => {
            if (!confirm('Are you sure you want to delete this workflow?')) return;

            try {
                setLoading(true);
                await axios.delete(`/api/workflows/${id}`);
                notify('success', 'Deleted', 'Workflow deleted successfully');
                fetchWorkflows();
            } catch (error) {
                console.error('Error deleting workflow:', error);
                notify('error', 'Error', 'Failed to delete workflow');
            } finally {
                setLoading(false);
            }
        },
        [fetchWorkflows, notify]
    );

    const handleNewWorkflow = useCallback(() => {
        setIsCreating(true);
        setSelectedWorkflow(null);
        setWorkflowName('');
        setWorkflowDescription('');
    }, []);

    const handleCloseEditor = useCallback(() => {
        setIsCreating(false);
        setSelectedWorkflow(null);
        setWorkflowName('');
        setWorkflowDescription('');
    }, []);

    return {
        workflows,
        selectedWorkflow,
        isCreating,
        workflowName,
        workflowDescription,
        loading,
        setWorkflowName,
        setWorkflowDescription,
        handleSaveWorkflow,
        handleEditWorkflow,
        handleDeleteWorkflow,
        handleNewWorkflow,
        handleCloseEditor,
    };
};
