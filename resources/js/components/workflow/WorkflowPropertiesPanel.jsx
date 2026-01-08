import React from 'react';
import { nodeTypeConfig } from '@/constants/workflowConstants';
import StartNodeConfig from '../StartNodeConfig';
import ConstantNodeConfig from '../ConstantNodeConfig';
import ApiCallConfig from '../actions/ApiCallConfig';
import EmailActionConfig from '../actions/EmailActionConfig';
import DatabaseConfig from '../actions/DatabaseConfig';
import GoogleCalendarConfig from '../actions/GoogleCalendarConfig';

const WorkflowPropertiesPanel = ({
    selectedNode,
    selectedEdge,
    nodeLabel,
    nodeDescription,
    nodeConfig,
    setSelectedNode,
    setSelectedEdge,
    setNodeLabel,
    setNodeDescription,
    setNodeConfig,
    updateSelectedNode,
    deleteSelectedNode,
    deleteNodeConnections,
    deleteSelectedEdge,
    teamId,
}) => {
    return (
        <div className="w-80 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4 h-[600px] overflow-y-auto">
            {selectedNode ? (
                <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                            Node Properties
                        </h3>
                        <button
                            onClick={() => setSelectedNode(null)}
                            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                            ✕
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                            Type
                        </label>
                        <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded text-sm text-gray-900 dark:text-white">
                            {nodeTypeConfig[selectedNode.data.type]?.label || 'Unknown'}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                            Label
                        </label>
                        <input
                            type="text"
                            value={nodeLabel}
                            onChange={(e) => setNodeLabel(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Node label"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                            Description
                        </label>
                        <textarea
                            value={nodeDescription}
                            onChange={(e) => setNodeDescription(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Node description"
                            rows="3"
                        />
                    </div>

                    {(() => {
                        const nodeType = selectedNode.data.type;
                        const parsedConfig = JSON.parse(nodeConfig || '{}');
                        const configChangeHandler = (newConfig) => setNodeConfig(JSON.stringify(newConfig, null, 2));

                        switch (nodeType) {
                            case 'start':
                                return <StartNodeConfig config={parsedConfig} onChange={configChangeHandler} />;

                            case 'constant':
                                return <ConstantNodeConfig config={parsedConfig} onChange={configChangeHandler} />;

                            case 'apiAction':
                                return (
                                    <div className="space-y-4">
                                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded p-3">
                                            <h5 className="font-semibold text-sm text-blue-800 dark:text-blue-400 mb-2">
                                                🌐 API Action Configuration
                                            </h5>
                                            <p className="text-xs text-blue-600 dark:text-blue-500">
                                                Configure HTTP API requests to external services
                                            </p>
                                        </div>
                                        <ApiCallConfig config={parsedConfig} onChange={configChangeHandler} />
                                    </div>
                                );

                            case 'emailAction':
                                return (
                                    <div className="space-y-4">
                                        <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-700 rounded p-3">
                                            <h5 className="font-semibold text-sm text-pink-800 dark:text-pink-400 mb-2">
                                                📧 Email Action Configuration
                                            </h5>
                                            <p className="text-xs text-pink-600 dark:text-pink-500">
                                                Send emails using templates from Filament admin panel
                                            </p>
                                        </div>
                                        <EmailActionConfig config={parsedConfig} onChange={configChangeHandler} />
                                    </div>
                                );

                            case 'databaseAction':
                                return (
                                    <div className="space-y-4">
                                        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded p-3">
                                            <h5 className="font-semibold text-sm text-purple-800 dark:text-purple-400 mb-2">
                                                🗄️ Database Action Configuration
                                            </h5>
                                            <p className="text-xs text-purple-600 dark:text-purple-500">
                                                Execute database queries directly from the workflow
                                            </p>
                                        </div>
                                        <DatabaseConfig config={parsedConfig} onChange={configChangeHandler} />
                                    </div>
                                );

                            case 'scriptAction':
                                return (
                                    <div className="space-y-4">
                                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded p-3">
                                            <h5 className="font-semibold text-sm text-amber-800 dark:text-amber-400 mb-2">
                                                ⚡ Script Action Configuration
                                            </h5>
                                            <p className="text-xs text-amber-600 dark:text-amber-500">
                                                Execute custom PHP or JavaScript code
                                            </p>
                                        </div>
                                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded p-3">
                                            <p className="text-sm text-amber-800 dark:text-amber-400">
                                                🚧 Script execution configuration coming soon...
                                            </p>
                                        </div>
                                    </div>
                                );

                            case 'webhookAction':
                                return (
                                    <div className="space-y-4">
                                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded p-3">
                                            <h5 className="font-semibold text-sm text-green-800 dark:text-green-400 mb-2">
                                                🔔 Webhook Action Configuration
                                            </h5>
                                            <p className="text-xs text-green-600 dark:text-green-500">
                                                Trigger external webhooks with custom payloads
                                            </p>
                                        </div>
                                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded p-3">
                                            <p className="text-sm text-green-800 dark:text-green-400">
                                                🚧 Webhook configuration coming soon...
                                            </p>
                                        </div>
                                    </div>
                                );

                            case 'googleCalendarAction':
                                return (
                                    <div className="space-y-4">
                                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded p-3">
                                            <h5 className="font-semibold text-sm text-blue-800 dark:text-blue-400 mb-2">
                                                📅 Google Calendar Configuration
                                            </h5>
                                            <p className="text-xs text-blue-600 dark:text-blue-500">
                                                Create, update, list, or delete Google Calendar events
                                            </p>
                                        </div>
                                        <GoogleCalendarConfig
                                            config={parsedConfig}
                                            onChange={configChangeHandler}
                                            teamId={teamId}
                                        />
                                    </div>
                                );

                            default:
                                return (
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                                            Configuration (JSON)
                                        </label>
                                        <textarea
                                            value={nodeConfig}
                                            onChange={(e) => setNodeConfig(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            placeholder='{"key": "value"}'
                                            rows="6"
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Add custom properties as JSON
                                        </p>
                                    </div>
                                );
                        }
                    })()}

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

                    <div className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-2">
                        <p><strong>Node ID:</strong> {selectedNode.id}</p>
                    </div>
                </div>
            ) : selectedEdge ? (
                <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                            Connection Properties
                        </h3>
                        <button
                            onClick={() => setSelectedEdge(null)}
                            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                            ✕
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                            Source Node
                        </label>
                        <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono text-gray-900 dark:text-white">
                            {selectedEdge.source}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                            Target Node
                        </label>
                        <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono text-gray-900 dark:text-white">
                            {selectedEdge.target}
                        </div>
                    </div>

                    {selectedEdge.sourceHandle && (
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                                Source Handle
                            </label>
                            <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded text-sm text-gray-900 dark:text-white">
                                {selectedEdge.sourceHandle}
                            </div>
                        </div>
                    )}

                    {selectedEdge.targetHandle && (
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                                Target Handle
                            </label>
                            <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded text-sm text-gray-900 dark:text-white">
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

                    <div className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-2">
                        <p><strong>Connection ID:</strong> {selectedEdge.id}</p>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded p-2">
                        <p className="text-xs text-blue-800 dark:text-blue-300">
                            Click on another connection to delete it, or click on a node to edit its properties.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500 text-sm">
                    Click on a node or connection to edit its properties
                </div>
            )}
        </div>
    );
};

export default WorkflowPropertiesPanel;
