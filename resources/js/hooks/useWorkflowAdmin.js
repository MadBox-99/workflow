import { useState, useEffect } from 'react';
import axios from 'axios';

export const useWorkflowAdmin = () => {
    const [workflows, setWorkflows] = useState([]);
    const [selectedWorkflow, setSelectedWorkflow] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [workflowName, setWorkflowName] = useState('');
    const [workflowDescription, setWorkflowDescription] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        console.log('AdminApp mounted');
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
            console.log('Fetching workflows...');
            setLoading(true);
            const response = await axios.get('/api/workflows');
            console.log('Workflows fetched:', response.data);
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
                await axios.put(`/api/workflows/${selectedWorkflow.id}`, payload);
                alert('Workflow updated successfully!');
                const updatedWorkflow = await axios.get(`/api/workflows/${selectedWorkflow.id}`);
                setSelectedWorkflow(updatedWorkflow.data);
            } else {
                const response = await axios.post('/api/workflows', payload);
                alert('Workflow created successfully!');
                setSelectedWorkflow(response.data);
                setWorkflowName(response.data.name);
                setWorkflowDescription(response.data.description || '');
            }

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

    const handleCloseEditor = () => {
        setIsCreating(false);
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
