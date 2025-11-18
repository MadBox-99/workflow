import React from 'react';
import '@xyflow/react/dist/style.css';
import { useWorkflowsViewer } from '@/hooks/useWorkflowsViewer';
import WorkflowsList from '@/components/workflows/WorkflowsList';
import WorkflowViewer from '@/components/workflows/WorkflowViewer';

const WorkflowsApp = () => {
    const {
        workflows,
        selectedWorkflow,
        loading,
        colorMode,
        nodes,
        edges,
        edgeTypes,
        viewWorkflow,
        backToList,
    } = useWorkflowsViewer();

    console.log('WorkflowsApp rendering, workflows:', workflows.length, 'selectedWorkflow:', selectedWorkflow?.name);

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Available Workflows</h1>

            {selectedWorkflow ? (
                <WorkflowViewer
                    workflow={selectedWorkflow}
                    nodes={nodes}
                    edges={edges}
                    edgeTypes={edgeTypes}
                    colorMode={colorMode}
                    onBack={backToList}
                />
            ) : (
                <WorkflowsList
                    workflows={workflows}
                    loading={loading}
                    onViewWorkflow={viewWorkflow}
                />
            )}
        </div>
    );
};

export default WorkflowsApp;
