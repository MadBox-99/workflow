import React from 'react';
import WorkflowList from './admin/WorkflowList';
import WorkflowEditorView from './admin/WorkflowEditorView';
import { useWorkflowAdmin } from '@/hooks/useWorkflowAdmin';
import { useToast } from '@/components/ui/toast';

const AdminApp = () => {
    const toast = useToast();
    const {
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
    } = useWorkflowAdmin(toast);

    console.log('AdminApp rendering, workflows:', workflows.length, 'isCreating:', isCreating);

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Workflow Admin
                </h1>
                <button
                    onClick={handleNewWorkflow}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    disabled={loading}
                >
                    New Workflow
                </button>
            </div>

            {isCreating ? (
                <WorkflowEditorView
                    selectedWorkflow={selectedWorkflow}
                    workflowName={workflowName}
                    workflowDescription={workflowDescription}
                    onNameChange={setWorkflowName}
                    onDescriptionChange={setWorkflowDescription}
                    onSave={handleSaveWorkflow}
                    onClose={handleCloseEditor}
                    loading={loading}
                />
            ) : (
                <WorkflowList
                    workflows={workflows}
                    loading={loading}
                    onEdit={handleEditWorkflow}
                    onDelete={handleDeleteWorkflow}
                />
            )}
        </div>
    );
};

export default AdminApp;
