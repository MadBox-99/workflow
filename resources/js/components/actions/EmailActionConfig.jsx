import React, { useState, useEffect, useMemo, useRef } from "react";
import { OUTPUT_NODE_TYPES, getNodeTypeLabel } from "../../constants/nodeTypes";

// Target field labels for email
const TARGET_FIELD_LABELS = {
    subject: "Subject",
    recipients: "Recipients",
    customData: "Custom Data",
};

// Helper function to get chip styling based on path type (same as GoogleCalendarConfig)
const getPathChipStyle = (isSelected, type) => {
    if (isSelected) {
        return "bg-blue-500 border-blue-600 text-white ring-2 ring-blue-300 dark:ring-blue-700";
    }

    const typeStyles = {
        mapped: "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/20 dark:border-purple-700 dark:text-purple-400",
        constant:
            "bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/20 dark:border-orange-700 dark:text-orange-400",
        string: "bg-green-50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400",
        number: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-400",
    };

    return (
        typeStyles[type] ||
        "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-400"
    );
};

// Dynamic Field Component for Email Action with path selection (matching GoogleCalendarConfig style)
const DynamicField = ({
    label,
    value,
    onChange,
    type = "text",
    placeholder,
    isDynamic,
    onDynamicChange,
    availableInputs = [],
    sourcePath,
    onSourcePathChange,
    rows,
}) => {
    const safeValue = value ?? "";

    // Parse sourcePath which can be either a string (old format) or { nodeId, path } (new format)
    const sourceNodeId = typeof sourcePath === "object" ? sourcePath?.nodeId : null;
    const sourcePathValue = typeof sourcePath === "object" ? sourcePath?.path : sourcePath;

    const hasMatchingInput = availableInputs.length > 0;
    const hasActionOutput = availableInputs.some((input) => input.isActionOutput);

    // Get the currently selected source node (or first action output if none selected)
    const selectedSourceNode = useMemo(() => {
        if (sourceNodeId) {
            return availableInputs.find((input) => input.nodeId === sourceNodeId);
        }
        // Default to first action output if no source selected
        return availableInputs.find((input) => input.isActionOutput) || availableInputs[0];
    }, [sourceNodeId, availableInputs]);

    // Get discovered paths and response mappings from the selected source node
    const discoveredPaths = selectedSourceNode?.discoveredPaths || [];
    const responseMapping = selectedSourceNode?.responseMapping || [];

    // Build selectable paths list for the selected source node
    const selectablePaths = useMemo(() => {
        const paths = [];

        // For constant nodes, add a simple 'value' path
        if (selectedSourceNode?.nodeType === "constant") {
            paths.push({
                path: "value",
                displayPath: "value",
                type: "constant",
                preview: "The constant value",
            });
            return paths;
        }

        // For webhookTrigger, add common webhook payload paths
        if (selectedSourceNode?.nodeType === "webhookTrigger") {
            paths.push({
                path: "",
                displayPath: "Full payload",
                type: "object",
                preview: "Complete webhook payload",
            });
            return paths;
        }

        // For action outputs, add mapped aliases first (most commonly used)
        responseMapping.forEach((mapping) => {
            if (mapping.path && mapping.alias) {
                paths.push({
                    path: `_mapped.${mapping.alias}`,
                    displayPath: `_mapped.${mapping.alias}`,
                    type: "mapped",
                    preview: `Mapped from: ${mapping.path}`,
                });
            }
        });

        // Add raw paths from discovered paths (filter to useful types)
        discoveredPaths
            .filter((p) => ["string", "number", "boolean"].includes(p.type))
            .slice(0, 15) // Limit to prevent overwhelming UI
            .forEach((p) => {
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
        onSourcePathChange({ nodeId, path: "" });
    };

    // Handler for path selection within the selected node
    const handlePathChange = (path) => {
        onSourcePathChange({
            nodeId: selectedSourceNode?.nodeId || sourceNodeId,
            path,
        });
    };

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {label}
                    {hasMatchingInput && !isDynamic && (
                        <span
                            className="ml-1 text-xs text-green-600 dark:text-green-400"
                            title="Connected input available"
                        >
                            (input available)
                        </span>
                    )}
                </label>
                <button
                    type="button"
                    onClick={() => onDynamicChange(!isDynamic)}
                    className={`text-xs px-2 py-0.5 rounded transition-colors ${
                        isDynamic
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                            : hasMatchingInput
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                    }`}
                >
                    {isDynamic ? "Dynamic" : "Static"}
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
                                            const isSelected =
                                                selectedSourceNode?.nodeId === input.nodeId;
                                            const isAction = input.isActionOutput;
                                            return (
                                                <button
                                                    key={input.nodeId}
                                                    type="button"
                                                    onClick={() =>
                                                        handleSourceNodeChange(input.nodeId)
                                                    }
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border transition-all ${
                                                        isSelected
                                                            ? isAction
                                                                ? "bg-blue-500 border-blue-600 text-white ring-2 ring-blue-300 dark:ring-blue-700"
                                                                : "bg-purple-500 border-purple-600 text-white ring-2 ring-purple-300 dark:ring-purple-700"
                                                            : isAction
                                                              ? "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-400"
                                                              : "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/20 dark:border-purple-700 dark:text-purple-400"
                                                    }`}
                                                >
                                                    {isSelected && (
                                                        <svg
                                                            className="w-3 h-3"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth="2"
                                                                d="M5 13l4 4L19 7"
                                                            />
                                                        </svg>
                                                    )}
                                                    <svg
                                                        className="w-3.5 h-3.5"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        {isAction ? (
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth="2"
                                                                d="M13 10V3L4 14h7v7l9-11h-7z"
                                                            />
                                                        ) : (
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth="2"
                                                                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                                            />
                                                        )}
                                                    </svg>
                                                    <span className="font-medium">
                                                        {input.nodeLabel}
                                                    </span>
                                                    <span className="opacity-70">
                                                        ({getNodeTypeLabel(input.nodeType)})
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className={`flex items-center gap-2 p-2 rounded border ${
                                        hasActionOutput
                                            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600"
                                            : "bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-600"
                                    }`}
                                >
                                    <span
                                        className={
                                            hasActionOutput
                                                ? "text-blue-600 dark:text-blue-400"
                                                : "text-purple-600 dark:text-purple-400"
                                        }
                                    >
                                        <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M13 10V3L4 14h7v7l9-11h-7z"
                                            />
                                        </svg>
                                    </span>
                                    <span
                                        className={`text-sm ${hasActionOutput ? "text-blue-700 dark:text-blue-300" : "text-purple-700 dark:text-purple-300"}`}
                                    >
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
                                                    ? "Select field from response:"
                                                    : "Select value:"}
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {selectablePaths.map((pathItem, idx) => {
                                                    const isSelected =
                                                        sourcePathValue === pathItem.path;
                                                    return (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            onClick={() =>
                                                                handlePathChange(pathItem.path)
                                                            }
                                                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border transition-all hover:scale-105 ${getPathChipStyle(isSelected, pathItem.type)}`}
                                                            title={pathItem.preview}
                                                        >
                                                            {isSelected && (
                                                                <svg
                                                                    className="w-3 h-3"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth="2"
                                                                        d="M5 13l4 4L19 7"
                                                                    />
                                                                </svg>
                                                            )}
                                                            <span className="font-mono">
                                                                {pathItem.displayPath.length > 18
                                                                    ? "..." +
                                                                      pathItem.displayPath.slice(
                                                                          -16,
                                                                      )
                                                                    : pathItem.displayPath}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                                {/* Clear selection button */}
                                                {sourcePathValue && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handlePathChange("")}
                                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                                                        title="Clear selection (auto-detect)"
                                                    >
                                                        <svg
                                                            className="w-3 h-3"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth="2"
                                                                d="M6 18L18 6M6 6l12 12"
                                                            />
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
                                                        value={sourcePathValue || ""}
                                                        onChange={(e) =>
                                                            handlePathChange(e.target.value)
                                                        }
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
                                                value={sourcePathValue || ""}
                                                onChange={(e) => handlePathChange(e.target.value)}
                                                className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                placeholder="e.g., _mapped.title or data.name"
                                            />
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                Run "Test Request" on the API node to see available
                                                fields
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded text-xs text-orange-700 dark:text-orange-400">
                                            Using value from constant node:{" "}
                                            <strong>{selectedSourceNode.nodeLabel}</strong>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded text-xs text-yellow-700 dark:text-yellow-400">
                            No connected input node. Connect an API, Constant, or other action node
                            to use dynamic values.
                        </div>
                    )}
                </div>
            ) : type === "textarea" ? (
                <textarea
                    value={safeValue}
                    onChange={(e) => onChange(e.target.value)}
                    rows={rows || 3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder={placeholder}
                />
            ) : (
                <input
                    type="text"
                    value={safeValue}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder={placeholder}
                />
            )}
        </div>
    );
};

const EmailActionConfig = ({ config, onChange, nodeId, nodes = [], edges = [] }) => {
    // State declarations
    const [template, setTemplate] = useState(config.template || "");
    const [recipients, setRecipients] = useState(
        config.recipients ? config.recipients.join(", ") : "",
    );
    const [subject, setSubject] = useState(config.subject || "");
    const [customData, setCustomData] = useState(
        config.customData ? JSON.stringify(config.customData, null, 2) : "{}",
    );
    const [templates, setTemplates] = useState([]);
    const [loadingTemplates, setLoadingTemplates] = useState(true);
    const [selectedTemplateVariables, setSelectedTemplateVariables] = useState(null);
    const [dynamicFields, setDynamicFields] = useState(config.dynamicFields || {});
    // Dynamic field source paths (for specifying which field to use from API response)
    const [dynamicFieldPaths, setDynamicFieldPaths] = useState(config.dynamicFieldPaths || {});

    // Track initialization to prevent re-syncing when editing
    const isInitializedRef = useRef(false);
    const prevNodeIdRef = useRef(nodeId);
    const prevConfigRef = useRef(null);

    // Toggle dynamic state for a field
    const toggleDynamic = (fieldName, isDynamic) => {
        setDynamicFields((prev) => ({ ...prev, [fieldName]: isDynamic }));
    };

    // Helper to update source path for a dynamic field
    const updateFieldPath = (fieldName, path) => {
        setDynamicFieldPaths((prev) => ({ ...prev, [fieldName]: path }));
    };

    // Find connected nodes that can provide input
    const availableInputs = useMemo(() => {
        if (!nodeId || !edges.length || !nodes.length) return [];

        const incomingEdges = edges.filter((edge) => edge.target === nodeId);
        const inputs = [];

        incomingEdges.forEach((edge) => {
            const sourceNode = nodes.find((n) => n.id === edge.source);
            if (!sourceNode) return;

            const nodeType = sourceNode.data?.type;
            const nodeConfig = sourceNode.data?.config || {};

            // Handle Constant nodes with targetField
            if (nodeType === "constant") {
                const targetField = nodeConfig.targetField;
                if (targetField) {
                    inputs.push({
                        nodeId: sourceNode.id,
                        nodeLabel: sourceNode.data?.label || "Constant",
                        nodeType: "constant",
                        targetField,
                        targetFieldLabel: TARGET_FIELD_LABELS[targetField] || targetField,
                    });
                }
            }

            // Handle action nodes that produce output (API, Calendar, etc.)
            if (OUTPUT_NODE_TYPES.includes(nodeType)) {
                inputs.push({
                    nodeId: sourceNode.id,
                    nodeLabel: sourceNode.data?.label || getNodeTypeLabel(nodeType),
                    nodeType,
                    targetField: "input",
                    targetFieldLabel: getNodeTypeLabel(nodeType),
                    isActionOutput: true,
                    // Include discovered paths from API node for path selection
                    discoveredPaths: nodeConfig.discoveredPaths || [],
                    // Include response mappings for _mapped.alias access
                    responseMapping: nodeConfig.responseMapping || [],
                });
            }

            // Handle webhookTrigger nodes
            if (nodeType === "webhookTrigger") {
                inputs.push({
                    nodeId: sourceNode.id,
                    nodeLabel: sourceNode.data?.label || "Webhook Trigger",
                    nodeType: "webhookTrigger",
                    targetField: "input",
                    targetFieldLabel: "Webhook Payload",
                    isActionOutput: true,
                });
            }
        });

        return inputs;
    }, [nodeId, nodes, edges]);

    // Sync local state with config prop - only on initial mount or when switching to a different node
    useEffect(() => {
        if (isInitializedRef.current && prevNodeIdRef.current === nodeId) {
            return;
        }

        isInitializedRef.current = true;
        prevNodeIdRef.current = nodeId;

        setTemplate(config.template || "");
        setRecipients(config.recipients ? config.recipients.join(", ") : "");
        setSubject(config.subject || "");
        setCustomData(config.customData ? JSON.stringify(config.customData, null, 2) : "{}");
        setDynamicFields(config.dynamicFields || {});
        setDynamicFieldPaths(config.dynamicFieldPaths || {});
    }, [config, nodeId]);

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                setLoadingTemplates(true);
                const response = await fetch("/api/email-templates");
                if (response.ok) {
                    const data = await response.json();
                    setTemplates(data);
                }
            } catch (error) {
                console.error("Failed to fetch email templates:", error);
            } finally {
                setLoadingTemplates(false);
            }
        };

        fetchTemplates();
    }, []);

    // Update selected template variables when template changes
    useEffect(() => {
        const selectedTemplate = templates.find((t) => t.slug === template);
        setSelectedTemplateVariables(selectedTemplate?.variables || null);

        // Auto-fill subject from template if not already set
        if (selectedTemplate && !subject) {
            setSubject(selectedTemplate.subject);
        }
    }, [template, templates, subject]);

    // Propagate changes to parent component
    useEffect(() => {
        try {
            const recipientsList = recipients
                .split(",")
                .map((email) => email.trim())
                .filter((email) => email.length > 0);

            const parsedCustomData = JSON.parse(customData);

            const newConfig = {
                template,
                recipients: recipientsList,
                subject,
                customData: parsedCustomData,
                dynamicFields,
                dynamicFieldPaths,
            };

            // Only call onChange if config actually changed
            const prevConfig = prevConfigRef.current;
            if (prevConfig && JSON.stringify(prevConfig) === JSON.stringify(newConfig)) {
                return;
            }

            prevConfigRef.current = newConfig;
            onChange(newConfig);
        } catch {
            // Invalid JSON, don't update
        }
    }, [template, recipients, subject, customData, dynamicFields, dynamicFieldPaths, onChange]);

    return (
        <div className="space-y-3">
            <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Email Template
                </label>
                <select
                    value={template}
                    onChange={(e) => setTemplate(e.target.value)}
                    disabled={loadingTemplates}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                >
                    <option value="">
                        {loadingTemplates ? "Loading templates..." : "Select template..."}
                    </option>
                    {templates.map((t) => (
                        <option key={t.id} value={t.slug}>
                            {t.name}
                        </option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Email templates are managed in Filament admin panel
                </p>
                {selectedTemplateVariables && Object.keys(selectedTemplateVariables).length > 0 && (
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/30 rounded border border-blue-200 dark:border-blue-700">
                        <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                            Template variables:
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {Object.keys(selectedTemplateVariables).map((varName) => (
                                <span
                                    key={varName}
                                    className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded text-xs font-mono"
                                >
                                    {`{{${varName}}}`}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {availableInputs.length > 0 && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded mb-3">
                    <p className="text-xs text-green-700 dark:text-green-400 mb-1">
                        <strong>Connected inputs:</strong>
                    </p>
                    <ul className="text-xs text-green-600 dark:text-green-500 space-y-0.5">
                        {availableInputs.map((input) => (
                            <li key={input.nodeId}>
                                {input.nodeLabel} → {input.targetFieldLabel}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <DynamicField
                label="Email Subject"
                value={subject}
                onChange={setSubject}
                placeholder="Email subject line"
                isDynamic={dynamicFields.subject}
                onDynamicChange={(isDynamic) => toggleDynamic("subject", isDynamic)}
                availableInputs={availableInputs}
                sourcePath={dynamicFieldPaths.subject}
                onSourcePathChange={(path) => updateFieldPath("subject", path)}
            />

            <DynamicField
                label="Recipients (comma-separated)"
                value={recipients}
                onChange={setRecipients}
                type="textarea"
                rows={3}
                placeholder="user@example.com, admin@example.com"
                isDynamic={dynamicFields.recipients}
                onDynamicChange={(isDynamic) => toggleDynamic("recipients", isDynamic)}
                availableInputs={availableInputs}
                sourcePath={dynamicFieldPaths.recipients}
                onSourcePathChange={(path) => updateFieldPath("recipients", path)}
            />

            <DynamicField
                label="Custom Data (JSON)"
                value={customData}
                onChange={setCustomData}
                type="textarea"
                rows={4}
                placeholder='{"userName": "John", "orderNumber": "12345"}'
                isDynamic={dynamicFields.customData}
                onDynamicChange={(isDynamic) => toggleDynamic("customData", isDynamic)}
                availableInputs={availableInputs}
                sourcePath={dynamicFieldPaths.customData}
                onSourcePathChange={(path) => updateFieldPath("customData", path)}
            />

            <div className="bg-white dark:bg-gray-800 p-3 rounded border border-pink-300 dark:border-pink-600">
                <p className="text-xs font-medium text-pink-900 dark:text-pink-300 mb-1">
                    Email Preview:
                </p>
                <p className="text-sm text-pink-800 dark:text-pink-400 break-all">
                    <strong>Template:</strong>{" "}
                    {template
                        ? templates.find((t) => t.slug === template)?.name || template
                        : "(not selected)"}
                </p>
                <p className="text-sm text-pink-800 dark:text-pink-400 break-all">
                    <strong>Subject:</strong> {subject || "(no subject)"}
                </p>
                <p className="text-sm text-pink-800 dark:text-pink-400 break-all">
                    <strong>Recipients:</strong> {recipients || "(no recipients)"}
                </p>
            </div>

            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700">
                <p className="text-xs text-blue-600 dark:text-blue-400">
                    <strong>Tip:</strong> Connect Constant nodes and set their Target Field, then
                    switch fields to Dynamic mode to use their values.
                </p>
            </div>
        </div>
    );
};

export default EmailActionConfig;
