import React, { useState, useEffect, useMemo } from 'react';

// Node types that can provide output data
const OUTPUT_NODE_TYPES = ['apiAction', 'googleCalendarAction', 'googleDocsAction', 'databaseAction', 'scriptAction', 'webhookAction'];

// Get display name for node type
const getNodeTypeLabel = (type) => {
    const labels = {
        apiAction: 'API Response',
        googleCalendarAction: 'Calendar Event',
        googleDocsAction: 'Document',
        databaseAction: 'Database Result',
        scriptAction: 'Script Output',
        webhookAction: 'Webhook Response',
        constant: 'Constant',
    };
    return labels[type] || type;
};

// Component for a field that can be static or dynamic
const DynamicField = ({ label, value, onChange, type = 'text', placeholder, isDynamic, onDynamicChange, availableInputs = [], sourcePath, onSourcePathChange }) => {
    // Track if we've already auto-selected to prevent infinite loops
    const hasAutoSelected = React.useRef(false);

    // Ensure value is never undefined (prevents controlled/uncontrolled warning)
    const safeValue = value ?? '';

    // Parse sourcePath which can be either a string (old format) or { nodeId, path } (new format)
    const sourceNodeId = typeof sourcePath === 'object' ? sourcePath?.nodeId : null;
    const sourcePathValue = typeof sourcePath === 'object' ? sourcePath?.path : sourcePath;

    // Check if current value matches any available input
    const selectedInput = availableInputs.find(input => safeValue === `{{{input.${input.targetField}}}}`);

    // Auto-select if there's exactly one available input and no value is set
    React.useEffect(() => {
        if (isDynamic && availableInputs.length === 1 && !safeValue && !hasAutoSelected.current) {
            hasAutoSelected.current = true;
            onChange(`{{{input.${availableInputs[0].targetField}}}}`);
        }
        // Reset the flag when switching back to static mode
        if (!isDynamic) {
            hasAutoSelected.current = false;
        }
    }, [isDynamic, availableInputs.length, safeValue]);

    // Check if there's a matching input for this field (shows indicator even in Static mode)
    const hasMatchingInput = availableInputs.length > 0;

    // Check if there's an action output connected (API, Calendar, etc.)
    const hasActionOutput = availableInputs.some(input => input.isActionOutput);

    // Get the currently selected source node (or first action output if none selected)
    const selectedSourceNode = useMemo(() => {
        if (sourceNodeId) {
            return availableInputs.find(input => input.nodeId === sourceNodeId);
        }
        // Default to first action output if no source selected
        return availableInputs.find(input => input.isActionOutput) || availableInputs[0];
    }, [sourceNodeId, availableInputs]);

    // Get discovered paths and response mappings from the selected source node
    const discoveredPaths = selectedSourceNode?.discoveredPaths || [];
    const responseMapping = selectedSourceNode?.responseMapping || [];

    // Build selectable paths list for the selected source node
    const selectablePaths = useMemo(() => {
        const paths = [];

        // For constant nodes, add a simple 'value' path
        if (selectedSourceNode?.nodeType === 'constant') {
            paths.push({
                path: 'value',
                displayPath: 'value',
                type: 'constant',
                preview: 'The constant value',
            });
            return paths;
        }

        // For action outputs, add mapped aliases first (most commonly used)
        responseMapping.forEach(mapping => {
            if (mapping.path && mapping.alias) {
                paths.push({
                    path: `_mapped.${mapping.alias}`,
                    displayPath: `_mapped.${mapping.alias}`,
                    type: 'mapped',
                    preview: `Mapped from: ${mapping.path}`,
                });
            }
        });

        // Add raw paths from discovered paths (filter to useful types)
        discoveredPaths
            .filter(p => ['string', 'number', 'boolean'].includes(p.type))
            .slice(0, 15) // Limit to prevent overwhelming UI
            .forEach(p => {
                paths.push({
                    path: p.path,
                    displayPath: p.path,
                    type: p.type,
                    preview: p.preview,
                });
            });

        return paths;
    }, [selectedSourceNode, discoveredPaths, responseMapping]);

    // Handler for source node selection
    const handleSourceNodeChange = (nodeId) => {
        // Update with new nodeId, clear the path since it might not be valid for the new node
        onSourcePathChange({ nodeId, path: '' });
    };

    // Handler for path selection within the selected node
    const handlePathChange = (path) => {
        onSourcePathChange({ nodeId: selectedSourceNode?.nodeId || sourceNodeId, path });
    };

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {label}
                    {hasMatchingInput && !isDynamic && (
                        <span className="ml-1 text-xs text-green-600 dark:text-green-400" title="Connected input available">
                            (input available)
                        </span>
                    )}
                </label>
                <button
                    type="button"
                    onClick={() => onDynamicChange(!isDynamic)}
                    className={`text-xs px-2 py-0.5 rounded transition-colors ${
                        isDynamic
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                            : hasMatchingInput
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                >
                    {isDynamic ? 'Dynamic' : 'Static'}
                </button>
            </div>
            {isDynamic ? (
                <div className="space-y-2">
                    {availableInputs.length > 0 ? (
                        <>
                            {/* Source Node Selector - Show when multiple inputs are available */}
                            {availableInputs.length > 1 ? (
                                <div className="space-y-1.5">
                                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                        Select source node:
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {availableInputs.map((input) => {
                                            const isSelected = selectedSourceNode?.nodeId === input.nodeId;
                                            const isAction = input.isActionOutput;
                                            return (
                                                <button
                                                    key={input.nodeId}
                                                    type="button"
                                                    onClick={() => handleSourceNodeChange(input.nodeId)}
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border transition-all ${
                                                        isSelected
                                                            ? isAction
                                                                ? 'bg-blue-500 border-blue-600 text-white ring-2 ring-blue-300 dark:ring-blue-700'
                                                                : 'bg-purple-500 border-purple-600 text-white ring-2 ring-purple-300 dark:ring-purple-700'
                                                            : isAction
                                                                ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-400'
                                                                : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/20 dark:border-purple-700 dark:text-purple-400'
                                                    }`}
                                                >
                                                    {isSelected && (
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        {isAction ? (
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                        ) : (
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                        )}
                                                    </svg>
                                                    <span className="font-medium">{input.nodeLabel}</span>
                                                    <span className="opacity-70">({getNodeTypeLabel(input.nodeType)})</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className={`flex items-center gap-2 p-2 rounded border ${
                                    hasActionOutput
                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600'
                                        : 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-600'
                                }`}>
                                    <span className={hasActionOutput ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400'}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </span>
                                    <span className={`text-sm ${hasActionOutput ? 'text-blue-700 dark:text-blue-300' : 'text-purple-700 dark:text-purple-300'}`}>
                                        From: <strong>{availableInputs[0].nodeLabel}</strong>
                                    </span>
                                </div>
                            )}

                            {/* Path selector for the selected source node */}
                            {selectedSourceNode && onSourcePathChange && (
                                <div className="space-y-2">
                                    {/* Chip selector for available paths */}
                                    {selectablePaths.length > 0 ? (
                                        <div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1.5">
                                                {selectedSourceNode.isActionOutput
                                                    ? 'Select field from response:'
                                                    : 'Select value:'}
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {selectablePaths.map((pathItem, idx) => {
                                                    const isSelected = sourcePathValue === pathItem.path;
                                                    return (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            onClick={() => handlePathChange(pathItem.path)}
                                                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border transition-all hover:scale-105 ${
                                                                isSelected
                                                                    ? 'bg-blue-500 border-blue-600 text-white ring-2 ring-blue-300 dark:ring-blue-700'
                                                                    : pathItem.type === 'mapped'
                                                                        ? 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/20 dark:border-purple-700 dark:text-purple-400'
                                                                        : pathItem.type === 'constant'
                                                                            ? 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/20 dark:border-orange-700 dark:text-orange-400'
                                                                            : pathItem.type === 'string'
                                                                                ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400'
                                                                                : pathItem.type === 'number'
                                                                                    ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-400'
                                                                                    : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-400'
                                                            }`}
                                                            title={pathItem.preview}
                                                        >
                                                            {isSelected && (
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                            <span className="font-mono">
                                                                {pathItem.displayPath.length > 18
                                                                    ? '...' + pathItem.displayPath.slice(-16)
                                                                    : pathItem.displayPath}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                                {/* Clear selection button */}
                                                {sourcePathValue && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handlePathChange('')}
                                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                                                        title="Clear selection (auto-detect)"
                                                    >
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                        Auto
                                                    </button>
                                                )}
                                            </div>
                                            {/* Manual input fallback for action outputs */}
                                            {selectedSourceNode.isActionOutput && (
                                                <details className="mt-2">
                                                    <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                                                        Or enter path manually...
                                                    </summary>
                                                    <input
                                                        type="text"
                                                        value={sourcePathValue || ''}
                                                        onChange={(e) => handlePathChange(e.target.value)}
                                                        className="w-full mt-1.5 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                        placeholder="e.g., data.items.0.name"
                                                    />
                                                </details>
                                            )}
                                        </div>
                                    ) : selectedSourceNode.isActionOutput ? (
                                        <div>
                                            <input
                                                type="text"
                                                value={sourcePathValue || ''}
                                                onChange={(e) => handlePathChange(e.target.value)}
                                                className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                placeholder="e.g., _mapped.title or data.name"
                                            />
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                Run "Test Request" on the API node to see available fields
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded text-xs text-orange-700 dark:text-orange-400">
                                            Using value from constant node: <strong>{selectedSourceNode.nodeLabel}</strong>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded text-xs text-yellow-700 dark:text-yellow-400">
                            No connected input node. Connect an API, Constant, or other action node to use dynamic values.
                        </div>
                    )}
                </div>
            ) : (
                type === 'textarea' ? (
                    <textarea
                        value={safeValue}
                        onChange={(e) => onChange(e.target.value)}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder={placeholder}
                    />
                ) : type === 'number' ? (
                    <input
                        type="number"
                        value={safeValue}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder={placeholder}
                    />
                ) : (
                    <input
                        type={type}
                        value={safeValue}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder={placeholder}
                    />
                )
            )}
        </div>
    );
};

// Target field labels for display
const TARGET_FIELD_LABELS = {
    title: 'Document Title',
    content: 'Content',
    documentId: 'Document ID',
    searchText: 'Search Text',
    insertIndex: 'Insert Index',
};

const GoogleDocsConfig = ({ config, onChange, teamId, nodeId, nodes = [], edges = [] }) => {
    // Find connected nodes that can provide input (Constant nodes with targetField, or action nodes with output)
    const availableInputs = useMemo(() => {
        if (!nodeId || !edges.length || !nodes.length) return [];

        // Get edges where this node is the target
        const incomingEdges = edges.filter(edge => edge.target === nodeId);

        const inputs = [];

        incomingEdges.forEach(edge => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            if (!sourceNode) return;

            const nodeType = sourceNode.data?.type;
            const nodeConfig = sourceNode.data?.config || {};

            // Handle Constant nodes with targetField
            if (nodeType === 'constant') {
                const targetField = nodeConfig.targetField;
                if (targetField) {
                    inputs.push({
                        nodeId: sourceNode.id,
                        nodeLabel: sourceNode.data?.label || 'Constant',
                        nodeType: 'constant',
                        targetField: targetField,
                        targetFieldLabel: TARGET_FIELD_LABELS[targetField] || targetField,
                    });
                }
            }

            // Handle action nodes that produce output (API, Calendar, etc.)
            if (OUTPUT_NODE_TYPES.includes(nodeType)) {
                inputs.push({
                    nodeId: sourceNode.id,
                    nodeLabel: sourceNode.data?.label || getNodeTypeLabel(nodeType),
                    nodeType: nodeType,
                    targetField: 'input', // Default field for action outputs
                    targetFieldLabel: getNodeTypeLabel(nodeType),
                    isActionOutput: true,
                    // Include discovered paths from API node for chip selection
                    discoveredPaths: nodeConfig.discoveredPaths || [],
                    // Include response mappings for _mapped.alias access
                    responseMapping: nodeConfig.responseMapping || [],
                });
            }
        });

        return inputs;
    }, [nodeId, nodes, edges]);

    // Find connected Docs nodes that can provide documentId
    const connectedDocsNode = useMemo(() => {
        if (!nodeId || !edges.length || !nodes.length) return null;

        // Get edges where this node is the target
        const incomingEdges = edges.filter(edge => edge.target === nodeId);

        // Find any source node that is a googleDocsAction
        for (const edge of incomingEdges) {
            const sourceNode = nodes.find(n => n.id === edge.source);
            if (sourceNode && sourceNode.data?.type === 'googleDocsAction') {
                return {
                    nodeId: sourceNode.id,
                    nodeLabel: sourceNode.data?.label || 'Google Docs',
                    operation: sourceNode.data?.config?.operation || 'unknown',
                };
            }
        }

        return null;
    }, [nodeId, nodes, edges]);

    const [operation, setOperation] = useState(config.operation || 'create');
    const [documentId, setDocumentId] = useState(config.documentId || '');
    const [title, setTitle] = useState(config.title || '');
    const [content, setContent] = useState(config.content || '');
    const [updateOperation, setUpdateOperation] = useState(config.updateOperation || 'append');
    const [searchText, setSearchText] = useState(config.searchText || '');
    const [insertIndex, setInsertIndex] = useState(config.insertIndex || 1);
    const [maxResults, setMaxResults] = useState(config.maxResults || 20);

    // Dynamic field toggles
    const [dynamicFields, setDynamicFields] = useState(config.dynamicFields || {});
    // Dynamic field source paths (for specifying which field to use from API response)
    const [dynamicFieldPaths, setDynamicFieldPaths] = useState(config.dynamicFieldPaths || {});

    const [documents, setDocuments] = useState([]);
    const [documentsLoading, setDocumentsLoading] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [connectingUrl, setConnectingUrl] = useState(null);
    // documentIdMode: 'dynamic' (from connected Docs node), 'list' (select from dropdown), 'manual' (enter directly)
    const [documentIdMode, setDocumentIdMode] = useState(config.documentIdMode || (connectedDocsNode ? 'dynamic' : 'list'));

    useEffect(() => {
        setOperation(config.operation || 'create');
        setDocumentId(config.documentId || '');
        setTitle(config.title || '');
        setContent(config.content || '');
        setUpdateOperation(config.updateOperation || 'append');
        setSearchText(config.searchText || '');
        setInsertIndex(config.insertIndex || 1);
        setMaxResults(config.maxResults || 20);
        setDynamicFields(config.dynamicFields || {});
        setDynamicFieldPaths(config.dynamicFieldPaths || {});
        setDocumentIdMode(config.documentIdMode || (connectedDocsNode ? 'dynamic' : 'list'));
    }, [config, connectedDocsNode]);

    // Helper to toggle dynamic state for a field
    const toggleDynamic = (fieldName, isDynamic) => {
        setDynamicFields(prev => ({ ...prev, [fieldName]: isDynamic }));
    };

    // Helper to update source path for a dynamic field
    const updateFieldPath = (fieldName, path) => {
        setDynamicFieldPaths(prev => ({ ...prev, [fieldName]: path }));
    };

    useEffect(() => {
        if (teamId) {
            checkConnectionStatus();
        }
    }, [teamId]);

    // Listen for OAuth callback messages from popup
    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data?.type === 'google-oauth-callback') {
                console.log('Google OAuth callback received:', event.data);
                setConnectingUrl(null);
                if (event.data.success) {
                    // Refresh connection status after successful OAuth
                    checkConnectionStatus();
                } else {
                    alert(event.data.message || 'Failed to connect Google');
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    useEffect(() => {
        if (connectionStatus?.connected && teamId) {
            fetchDocuments();
        }
    }, [connectionStatus?.connected, teamId]);

    useEffect(() => {
        onChange({
            operation,
            documentId: documentIdMode === 'dynamic' ? '' : documentId,
            title,
            content,
            updateOperation,
            searchText,
            insertIndex: parseInt(insertIndex) || 1,
            maxResults: parseInt(maxResults) || 20,
            dynamicFields,
            dynamicFieldPaths,
            documentIdMode,
        });
    }, [
        operation,
        documentId,
        title,
        content,
        updateOperation,
        searchText,
        insertIndex,
        maxResults,
        dynamicFields,
        dynamicFieldPaths,
        documentIdMode,
    ]);

    const checkConnectionStatus = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/google/auth/status?team_id=${teamId}`);
            if (response.ok) {
                const data = await response.json();
                setConnectionStatus(data);
            }
        } catch (error) {
            console.error('Failed to check Google connection status:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDocuments = async () => {
        if (!connectionStatus?.connected || !teamId) return;

        try {
            setDocumentsLoading(true);
            const params = new URLSearchParams({
                team_id: teamId,
                max_results: '50',
            });

            const response = await fetch(`/api/google/documents?${params}`);
            if (response.ok) {
                const data = await response.json();
                setDocuments(data.documents || []);
            }
        } catch (error) {
            console.error('Failed to fetch documents:', error);
        } finally {
            setDocumentsLoading(false);
        }
    };

    // Fetch documents when operation needs them
    useEffect(() => {
        if ((operation === 'read' || operation === 'update') && connectionStatus?.connected) {
            fetchDocuments();
        }
    }, [operation, connectionStatus?.connected]);

    const handleConnect = async () => {
        try {
            const response = await fetch(`/api/google/auth/redirect?team_id=${teamId}`);
            if (response.ok) {
                const data = await response.json();
                setConnectingUrl(data.auth_url);
                window.open(data.auth_url, '_blank', 'width=600,height=700');
            }
        } catch (error) {
            console.error('Failed to get auth URL:', error);
        }
    };

    const handleDisconnect = async () => {
        if (!confirm('Are you sure you want to disconnect Google?')) {
            return;
        }

        try {
            const response = await fetch('/api/google/auth/disconnect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ team_id: teamId }),
            });

            if (response.ok) {
                setConnectionStatus({ connected: false });
                setDocuments([]);
            }
        } catch (error) {
            console.error('Failed to disconnect:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-sm text-gray-500">Loading...</span>
            </div>
        );
    }

    if (!teamId) {
        return (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded">
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    Please save the workflow first to enable Google Docs configuration.
                </p>
            </div>
        );
    }

    if (!connectionStatus?.connected) {
        return (
            <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-white rounded-lg shadow flex items-center justify-center">
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#4285f4" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                                Google Docs
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Not connected</p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Connect your Google account to create, read, and update documents directly from
                        your workflows.
                    </p>
                    <button
                        onClick={handleConnect}
                        className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="currentColor"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Connect Google Docs
                    </button>
                </div>
                {connectingUrl && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded">
                        <p className="text-sm text-blue-700 dark:text-blue-400">
                            A new window has opened for Google authorization.{' '}
                            <button
                                onClick={checkConnectionStatus}
                                className="underline font-medium"
                            >
                                Click here to refresh
                            </button>{' '}
                            after completing the authorization.
                        </p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">
                            Connected
                        </span>
                        {connectionStatus.email && (
                            <span className="text-sm text-green-600 dark:text-green-500">
                                ({connectionStatus.email})
                            </span>
                        )}
                    </div>
                    <button
                        onClick={handleDisconnect}
                        className="text-xs text-red-600 hover:text-red-700 dark:text-red-400"
                    >
                        Disconnect
                    </button>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Operation
                </label>
                <select
                    value={operation}
                    onChange={(e) => setOperation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                    <option value="create">Create Document</option>
                    <option value="read">Read Document</option>
                    <option value="update">Update Document</option>
                    <option value="list">List Documents</option>
                </select>
            </div>

            {/* Document ID selector for read/update operations */}
            {(operation === 'read' || operation === 'update') && (
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Document ID Source
                        </label>
                    </div>

                    {/* Mode selector buttons */}
                    <div className="flex gap-1 mb-2">
                        <button
                            type="button"
                            onClick={() => setDocumentIdMode('dynamic')}
                            disabled={!connectedDocsNode}
                            className={`flex-1 px-2 py-1.5 text-xs rounded transition-colors ${
                                documentIdMode === 'dynamic'
                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 font-medium'
                                    : connectedDocsNode
                                        ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        : 'bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed'
                            }`}
                            title={connectedDocsNode ? 'Use ID from connected Docs node' : 'Connect a Docs node first'}
                        >
                            Dynamic
                        </button>
                        <button
                            type="button"
                            onClick={() => setDocumentIdMode('list')}
                            className={`flex-1 px-2 py-1.5 text-xs rounded transition-colors ${
                                documentIdMode === 'list'
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium'
                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                            Select
                        </button>
                        <button
                            type="button"
                            onClick={() => setDocumentIdMode('manual')}
                            className={`flex-1 px-2 py-1.5 text-xs rounded transition-colors ${
                                documentIdMode === 'manual'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium'
                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                            Manual
                        </button>
                    </div>

                    {/* Dynamic mode - from connected Docs node */}
                    {documentIdMode === 'dynamic' && (
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded">
                            {connectedDocsNode ? (
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    <div>
                                        <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                                            Using ID from: {connectedDocsNode.nodeLabel}
                                        </p>
                                        <p className="text-xs text-purple-600 dark:text-purple-400">
                                            Operation: {connectedDocsNode.operation}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-purple-700 dark:text-purple-400">
                                    Connect a Docs node to use its output document ID.
                                </p>
                            )}
                        </div>
                    )}

                    {/* List mode - select from dropdown */}
                    {documentIdMode === 'list' && (
                        <>
                            <div className="relative">
                                <select
                                    value={documentId}
                                    onChange={(e) => setDocumentId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    disabled={documentsLoading}
                                >
                                    <option value="">
                                        {documentsLoading ? 'Loading documents...' : 'Select a document'}
                                    </option>
                                    {documents.map((doc) => (
                                        <option key={doc.id} value={doc.id}>
                                            {doc.name || '(Untitled)'} -{' '}
                                            {doc.modifiedTime
                                                ? new Date(doc.modifiedTime).toLocaleDateString('hu-HU', {
                                                      month: 'short',
                                                      day: 'numeric',
                                                  })
                                                : 'No date'}
                                        </option>
                                    ))}
                                </select>
                                {documentsLoading && (
                                    <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                                        <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center justify-between mt-1">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Showing up to 50 documents
                                </p>
                                <button
                                    type="button"
                                    onClick={fetchDocuments}
                                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                    disabled={documentsLoading}
                                >
                                    Refresh
                                </button>
                            </div>
                        </>
                    )}

                    {/* Manual mode - enter document ID directly */}
                    {documentIdMode === 'manual' && (
                        <>
                            <input
                                type="text"
                                value={documentId}
                                onChange={(e) => setDocumentId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="Enter document ID"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Enter the document ID directly (from URL or another source)
                            </p>
                        </>
                    )}
                </div>
            )}

            {/* Create operation fields */}
            {operation === 'create' && (
                <>
                    {availableInputs.length > 0 && (
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded mb-3">
                            <p className="text-xs text-green-700 dark:text-green-400 mb-1">
                                <strong>Connected inputs:</strong>
                            </p>
                            <ul className="text-xs text-green-600 dark:text-green-500 space-y-0.5">
                                {availableInputs.map(input => (
                                    <li key={input.nodeId}>
                                        {input.nodeLabel} &rarr; {input.targetFieldLabel}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <DynamicField
                        label="Document Title"
                        value={title}
                        onChange={setTitle}
                        type="text"
                        placeholder="My Document"
                        isDynamic={dynamicFields.title}
                        onDynamicChange={(v) => toggleDynamic('title', v)}
                        availableInputs={availableInputs.filter(i => i.targetField === 'title' || i.isActionOutput)}
                        sourcePath={dynamicFieldPaths.title}
                        onSourcePathChange={(path) => updateFieldPath('title', path)}
                    />

                    <DynamicField
                        label="Initial Content (optional)"
                        value={content}
                        onChange={setContent}
                        type="textarea"
                        placeholder="Enter initial document content..."
                        isDynamic={dynamicFields.content}
                        onDynamicChange={(v) => toggleDynamic('content', v)}
                        availableInputs={availableInputs.filter(i => i.targetField === 'content' || i.isActionOutput)}
                        sourcePath={dynamicFieldPaths.content}
                        onSourcePathChange={(path) => updateFieldPath('content', path)}
                    />
                </>
            )}

            {/* Update operation fields */}
            {operation === 'update' && (
                <>
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                            Update Operation
                        </label>
                        <select
                            value={updateOperation}
                            onChange={(e) => setUpdateOperation(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="append">Append to End</option>
                            <option value="prepend">Prepend to Beginning</option>
                            <option value="replace">Find and Replace</option>
                            <option value="insertAt">Insert at Index</option>
                        </select>
                    </div>

                    {availableInputs.length > 0 && (
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded mb-3">
                            <p className="text-xs text-green-700 dark:text-green-400 mb-1">
                                <strong>Connected inputs:</strong>
                            </p>
                            <ul className="text-xs text-green-600 dark:text-green-500 space-y-0.5">
                                {availableInputs.map(input => (
                                    <li key={input.nodeId}>
                                        {input.nodeLabel} &rarr; {input.targetFieldLabel}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <DynamicField
                        label="Content"
                        value={content}
                        onChange={setContent}
                        type="textarea"
                        placeholder="Content to add or replace with..."
                        isDynamic={dynamicFields.content}
                        onDynamicChange={(v) => toggleDynamic('content', v)}
                        availableInputs={availableInputs.filter(i => i.targetField === 'content' || i.isActionOutput)}
                        sourcePath={dynamicFieldPaths.content}
                        onSourcePathChange={(path) => updateFieldPath('content', path)}
                    />

                    {updateOperation === 'replace' && (
                        <DynamicField
                            label="Search Text"
                            value={searchText}
                            onChange={setSearchText}
                            type="text"
                            placeholder="Text to find and replace"
                            isDynamic={dynamicFields.searchText}
                            onDynamicChange={(v) => toggleDynamic('searchText', v)}
                            availableInputs={availableInputs.filter(i => i.targetField === 'searchText' || i.isActionOutput)}
                            sourcePath={dynamicFieldPaths.searchText}
                            onSourcePathChange={(path) => updateFieldPath('searchText', path)}
                        />
                    )}

                    {updateOperation === 'insertAt' && (
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                Insert Index
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={insertIndex}
                                onChange={(e) => setInsertIndex(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="1"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Character index where to insert content (1 = beginning)
                            </p>
                        </div>
                    )}
                </>
            )}

            {/* List operation fields */}
            {operation === 'list' && (
                <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Max Results
                    </label>
                    <input
                        type="number"
                        min="1"
                        max="100"
                        value={maxResults}
                        onChange={(e) => setMaxResults(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                </div>
            )}

            {/* Configuration Preview */}
            <div className="bg-white dark:bg-gray-800 p-3 rounded border border-blue-300 dark:border-blue-600">
                <p className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-2">
                    Configuration Preview:
                </p>
                <div className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                    <p>
                        <strong>Operation:</strong> {operation}
                    </p>
                    {operation === 'create' && title && (
                        <p>
                            <strong>Title:</strong> {title}
                        </p>
                    )}
                    {(operation === 'read' || operation === 'update') && documentId && (
                        <p>
                            <strong>Document ID:</strong> {documentId.substring(0, 20)}...
                        </p>
                    )}
                    {operation === 'update' && (
                        <p>
                            <strong>Update Type:</strong> {updateOperation}
                        </p>
                    )}
                    {operation === 'list' && (
                        <p>
                            <strong>Max Results:</strong> {maxResults}
                        </p>
                    )}
                </div>
            </div>

            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700">
                <p className="text-xs text-blue-600 dark:text-blue-400">
                    <strong>Tip:</strong> Connect Constant nodes and set their Target Field, then switch fields to Dynamic mode to use their values.
                </p>
            </div>
        </div>
    );
};

export default GoogleDocsConfig;
