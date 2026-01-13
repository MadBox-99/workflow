import React from "react";
import { ReactFlow, MiniMap, Controls, Background } from "@xyflow/react";

const WorkflowViewer = ({ workflow, nodes, edges, edgeTypes, colorMode, onBack }) => {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {workflow.name}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">{workflow.description}</p>
                </div>
                <button
                    onClick={onBack}
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
    );
};

export default WorkflowViewer;
