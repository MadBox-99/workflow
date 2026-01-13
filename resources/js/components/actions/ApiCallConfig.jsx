import React, { useState, useEffect, useMemo } from "react";

// Node types that can provide output data
const OUTPUT_NODE_TYPES = [
    "apiAction",
    "googleCalendarAction",
    "googleDocsAction",
    "databaseAction",
    "scriptAction",
    "webhookAction",
];

// Get display name for node type
const getNodeTypeLabel = (type) => {
    const labels = {
        apiAction: "API Response",
        googleCalendarAction: "Calendar Event",
        googleDocsAction: "Document",
        databaseAction: "Database Result",
        scriptAction: "Script Output",
        webhookAction: "Webhook Response",
        constant: "Constant",
    };
    return labels[type] || type;
};

// Component for a field that can be static or dynamic
const DynamicField = ({
    label,
    value,
    onChange,
    type = "text",
    placeholder,
    isDynamic,
    onDynamicChange,
    availableInputs = [],
    rows = 3,
}) => {
    const hasAutoSelected = React.useRef(false);
    const safeValue = value ?? "";

    React.useEffect(() => {
        if (
            isDynamic &&
            availableInputs.length === 1 &&
            !safeValue &&
            !hasAutoSelected.current
        ) {
            hasAutoSelected.current = true;
            onChange(`{{{input.${availableInputs[0].targetField}}}}`);
        }
        if (!isDynamic) {
            hasAutoSelected.current = false;
        }
    }, [isDynamic, availableInputs.length, safeValue]);

    const hasMatchingInput = availableInputs.length > 0;

    // Check if there's an action output connected (API, Calendar, etc.)
    const hasActionOutput = availableInputs.some(
        (input) => input.isActionOutput,
    );

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
                <div>
                    {availableInputs.length > 0 ? (
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
                                Using:{" "}
                                <strong>{availableInputs[0].nodeLabel}</strong>
                                {availableInputs[0].isActionOutput && (
                                    <span className="text-xs ml-1 opacity-75">
                                        (use {"{{{input}}}"} or{" "}
                                        {"{{{input.fieldName}}}"})
                                    </span>
                                )}
                            </span>
                        </div>
                    ) : (
                        <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded text-xs text-yellow-700 dark:text-yellow-400">
                            No connected input node. Connect an API, Constant,
                            or other action node to use dynamic values.
                        </div>
                    )}
                </div>
            ) : type === "textarea" ? (
                <textarea
                    value={safeValue}
                    onChange={(e) => onChange(e.target.value)}
                    rows={rows}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder={placeholder}
                />
            ) : (
                <input
                    type={type}
                    value={safeValue}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder={placeholder}
                />
            )}
        </div>
    );
};

// Helper to extract all paths from a JSON object
const extractPaths = (obj, prefix = "", maxDepth = 5) => {
    if (maxDepth <= 0) return [];

    const paths = [];

    if (obj && typeof obj === "object") {
        if (Array.isArray(obj)) {
            // For arrays, show the first item's structure
            if (obj.length > 0) {
                paths.push({
                    path: prefix,
                    type: "array",
                    preview: `Array[${obj.length}]`,
                });
                const itemPaths = extractPaths(
                    obj[0],
                    `${prefix}.0`,
                    maxDepth - 1,
                );
                paths.push(...itemPaths);
            }
        } else {
            Object.keys(obj).forEach((key) => {
                const fullPath = prefix ? `${prefix}.${key}` : key;
                const value = obj[key];

                if (value === null) {
                    paths.push({
                        path: fullPath,
                        type: "null",
                        preview: "null",
                    });
                } else if (typeof value === "object") {
                    if (Array.isArray(value)) {
                        paths.push({
                            path: fullPath,
                            type: "array",
                            preview: `Array[${value.length}]`,
                        });
                        if (value.length > 0) {
                            const itemPaths = extractPaths(
                                value[0],
                                `${fullPath}.0`,
                                maxDepth - 1,
                            );
                            paths.push(...itemPaths);
                        }
                    } else {
                        paths.push({
                            path: fullPath,
                            type: "object",
                            preview: "{...}",
                        });
                        const nestedPaths = extractPaths(
                            value,
                            fullPath,
                            maxDepth - 1,
                        );
                        paths.push(...nestedPaths);
                    }
                } else {
                    const preview =
                        typeof value === "string"
                            ? value.length > 30
                                ? value.substring(0, 30) + "..."
                                : value
                            : String(value);
                    paths.push({ path: fullPath, type: typeof value, preview });
                }
            });
        }
    }

    return paths;
};

// Target field labels for display
const TARGET_FIELD_LABELS = {
    url: "URL",
    requestBody: "Request Body",
    headers: "Headers",
    authToken: "Auth Token",
};

const ApiCallConfig = ({
    config,
    onChange,
    nodeId,
    nodes = [],
    edges = [],
}) => {
    // Find connected nodes that can provide input (Constant nodes with targetField, or action nodes with output)
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
                        targetField: targetField,
                        targetFieldLabel:
                            TARGET_FIELD_LABELS[targetField] || targetField,
                    });
                }
            }

            // Handle action nodes that produce output (API, Calendar, etc.)
            if (OUTPUT_NODE_TYPES.includes(nodeType)) {
                inputs.push({
                    nodeId: sourceNode.id,
                    nodeLabel:
                        sourceNode.data?.label || getNodeTypeLabel(nodeType),
                    nodeType: nodeType,
                    targetField: "input", // Default field for action outputs
                    targetFieldLabel: getNodeTypeLabel(nodeType),
                    isActionOutput: true,
                });
            }
        });

        return inputs;
    }, [nodeId, nodes, edges]);

    const [method, setMethod] = useState(config.method || "POST");
    const [url, setUrl] = useState(config.url || "");
    const [requestBody, setRequestBody] = useState(
        config.requestBody ? JSON.stringify(config.requestBody, null, 2) : "{}",
    );
    const [headers, setHeaders] = useState(
        config.headers ? JSON.stringify(config.headers, null, 2) : "{}",
    );
    const [authToken, setAuthToken] = useState(config.authToken || "");
    const [dynamicFields, setDynamicFields] = useState(
        config.dynamicFields || {},
    );
    const [responseMapping, setResponseMapping] = useState(
        config.responseMapping || [],
    );
    const [outputField, setOutputField] = useState(config.outputField || "");

    // Test request state
    const [testLoading, setTestLoading] = useState(false);
    const [testResponse, setTestResponse] = useState(null);
    const [testError, setTestError] = useState(null);
    const [availablePaths, setAvailablePaths] = useState(
        config.discoveredPaths || [],
    );
    const [showPathDropdown, setShowPathDropdown] = useState(null); // 'output' | index for mapping

    const toggleDynamic = (fieldName, isDynamic) => {
        setDynamicFields((prev) => ({ ...prev, [fieldName]: isDynamic }));
    };

    const addResponseMapping = () => {
        setResponseMapping((prev) => [...prev, { path: "", alias: "" }]);
    };

    const updateResponseMapping = (index, field, value) => {
        setResponseMapping((prev) =>
            prev.map((item, i) =>
                i === index ? { ...item, [field]: value } : item,
            ),
        );
    };

    const removeResponseMapping = (index) => {
        setResponseMapping((prev) => prev.filter((_, i) => i !== index));
    };

    // Test the API request
    const testRequest = async () => {
        if (!url || dynamicFields.url) {
            setTestError("URL is required and cannot be dynamic for testing");
            return;
        }

        setTestLoading(true);
        setTestError(null);
        setTestResponse(null);

        try {
            let parsedHeaders = {};
            let parsedBody = {};

            try {
                parsedHeaders = headers ? JSON.parse(headers) : {};
            } catch (e) {
                // Invalid headers JSON
            }

            try {
                parsedBody = requestBody ? JSON.parse(requestBody) : {};
            } catch (e) {
                // Invalid body JSON
            }

            if (authToken) {
                parsedHeaders["Authorization"] = authToken.startsWith("Bearer ")
                    ? authToken
                    : `Bearer ${authToken}`;
            }

            const fetchOptions = {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    ...parsedHeaders,
                },
            };

            if (["POST", "PUT", "PATCH"].includes(method)) {
                fetchOptions.body = JSON.stringify(parsedBody);
            }

            const response = await fetch(url, fetchOptions);
            const data = await response.json();

            setTestResponse({
                status: response.status,
                data: data,
            });

            // Extract available paths from the response
            const paths = extractPaths(data);
            setAvailablePaths(paths);
        } catch (error) {
            setTestError(error.message);
        } finally {
            setTestLoading(false);
        }
    };

    // Sync local state with config prop
    useEffect(() => {
        setMethod(config.method || "POST");
        setUrl(config.url || "");
        setRequestBody(
            config.requestBody
                ? JSON.stringify(config.requestBody, null, 2)
                : "{}",
        );
        setHeaders(
            config.headers ? JSON.stringify(config.headers, null, 2) : "{}",
        );
        setAuthToken(config.authToken || "");
        setDynamicFields(config.dynamicFields || {});
        setResponseMapping(config.responseMapping || []);
        setOutputField(config.outputField || "");
        // Restore discovered paths from config
        if (config.discoveredPaths?.length > 0) {
            setAvailablePaths(config.discoveredPaths);
        }
    }, [config]);

    useEffect(() => {
        try {
            const parsedBody = requestBody ? JSON.parse(requestBody) : {};
            const parsedHeaders = headers ? JSON.parse(headers) : {};

            onChange({
                method,
                url,
                requestBody: parsedBody,
                headers: parsedHeaders,
                authToken,
                dynamicFields,
                responseMapping: responseMapping.filter((m) => m.path),
                outputField,
                // Store discovered paths so connected nodes can use them
                discoveredPaths: availablePaths,
            });
        } catch (e) {
            // Invalid JSON, don't update
        }
    }, [
        method,
        url,
        requestBody,
        headers,
        authToken,
        dynamicFields,
        responseMapping,
        outputField,
        availablePaths,
    ]);

    // Render path dropdown
    const renderPathDropdown = (onSelect, currentValue) => {
        if (availablePaths.length === 0) return null;

        return (
            <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {availablePaths.map((item, idx) => (
                    <button
                        key={idx}
                        type="button"
                        onClick={() => {
                            onSelect(item.path);
                            setShowPathDropdown(null);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center ${
                            currentValue === item.path
                                ? "bg-blue-50 dark:bg-blue-900/30"
                                : ""
                        }`}
                    >
                        <span className="font-mono text-gray-800 dark:text-gray-200">
                            {item.path}
                        </span>
                        <span
                            className={`text-xs px-1.5 py-0.5 rounded ${
                                item.type === "string"
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                    : item.type === "number"
                                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                      : item.type === "boolean"
                                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                                        : item.type === "array"
                                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                          : item.type === "object"
                                            ? "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400"
                                            : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                            }`}
                        >
                            {item.type}
                        </span>
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-3">
            {/* Connected inputs info */}
            {availableInputs.length > 0 && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded">
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

            <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    HTTP Method
                </label>
                <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                </select>
            </div>

            <DynamicField
                label="API Endpoint URL"
                value={url}
                onChange={setUrl}
                type="text"
                placeholder="/api/endpoint or https://example.com/api/..."
                isDynamic={dynamicFields.url}
                onDynamicChange={(v) => toggleDynamic("url", v)}
                availableInputs={availableInputs.filter(
                    (i) => i.targetField === "url" || i.isActionOutput,
                )}
            />
            {!dynamicFields.url && (
                <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
                    Use relative path (/api/...) or full URL
                </p>
            )}

            {(method === "POST" || method === "PUT" || method === "PATCH") && (
                <>
                    <DynamicField
                        label="Request Body (JSON)"
                        value={requestBody}
                        onChange={setRequestBody}
                        type="textarea"
                        placeholder='{"key": "value"}'
                        rows={5}
                        isDynamic={dynamicFields.requestBody}
                        onDynamicChange={(v) => toggleDynamic("requestBody", v)}
                        availableInputs={availableInputs.filter(
                            (i) =>
                                i.targetField === "requestBody" ||
                                i.isActionOutput,
                        )}
                    />
                    {!dynamicFields.requestBody && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
                            JSON format required
                        </p>
                    )}
                </>
            )}

            <DynamicField
                label="Custom Headers (JSON)"
                value={headers}
                onChange={setHeaders}
                type="textarea"
                placeholder='{"Authorization": "Bearer token"}'
                rows={3}
                isDynamic={dynamicFields.headers}
                onDynamicChange={(v) => toggleDynamic("headers", v)}
                availableInputs={availableInputs.filter(
                    (i) => i.targetField === "headers" || i.isActionOutput,
                )}
            />
            {!dynamicFields.headers && (
                <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
                    Additional headers to send with the request
                </p>
            )}

            <DynamicField
                label="Auth Token"
                value={authToken}
                onChange={setAuthToken}
                type="text"
                placeholder="Bearer token or API key"
                isDynamic={dynamicFields.authToken}
                onDynamicChange={(v) => toggleDynamic("authToken", v)}
                availableInputs={availableInputs.filter(
                    (i) => i.targetField === "authToken" || i.isActionOutput,
                )}
            />
            {!dynamicFields.authToken && (
                <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
                    Will be added as Authorization header if set
                </p>
            )}

            {/* Test Request Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Test & Configure Response
                    </label>
                    <button
                        type="button"
                        onClick={testRequest}
                        disabled={testLoading || !url || dynamicFields.url}
                        className={`text-xs px-3 py-1.5 rounded font-medium transition-colors flex items-center gap-1 ${
                            testLoading || !url || dynamicFields.url
                                ? "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed"
                                : "bg-blue-500 text-white hover:bg-blue-600"
                        }`}
                    >
                        {testLoading ? (
                            <>
                                <svg
                                    className="animate-spin w-3 h-3"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                                Testing...
                            </>
                        ) : (
                            <>
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
                                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                Test Request
                            </>
                        )}
                    </button>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    Send a test request to see the response structure and easily
                    select which fields to extract.
                </p>

                {testError && (
                    <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded mb-3">
                        <p className="text-xs text-red-700 dark:text-red-400">
                            <strong>Error:</strong> {testError}
                        </p>
                    </div>
                )}

                {testResponse && (
                    <div className="mb-3 space-y-2">
                        <div className="flex items-center gap-2">
                            <span
                                className={`px-2 py-0.5 text-xs font-medium rounded ${
                                    testResponse.status >= 200 &&
                                    testResponse.status < 300
                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                }`}
                            >
                                Status: {testResponse.status}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {availablePaths.length} fields found
                            </span>
                        </div>
                        <details className="text-xs">
                            <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                                View full response
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-x-auto max-h-32 font-mono">
                                {JSON.stringify(testResponse.data, null, 2)}
                            </pre>
                        </details>
                    </div>
                )}
            </div>

            {/* Response Output Configuration */}
            <div className="space-y-3">
                <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Extract Single Field
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Select a specific field to pass to the next node. Leave
                        empty to pass the entire response.
                    </p>
                    <div className="relative">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={outputField}
                                onChange={(e) => setOutputField(e.target.value)}
                                onFocus={() =>
                                    availablePaths.length > 0 &&
                                    setShowPathDropdown("output")
                                }
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="e.g., data.user.id"
                            />
                            {availablePaths.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPathDropdown(
                                            showPathDropdown === "output"
                                                ? null
                                                : "output",
                                        )
                                    }
                                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600"
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
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                </button>
                            )}
                        </div>
                        {showPathDropdown === "output" &&
                            renderPathDropdown(setOutputField, outputField)}
                    </div>
                </div>

                {/* Response Mapping */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                                Field Mappings
                            </label>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Extract multiple fields with custom names for
                                easy access in subsequent nodes.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={addResponseMapping}
                            className="text-xs px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors flex items-center gap-1"
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
                                    d="M12 4v16m8-8H4"
                                />
                            </svg>
                            Add Manual
                        </button>
                    </div>

                    {/* Quick add chips from test response */}
                    {availablePaths.length > 0 && (
                        <div className="mb-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                Quick add from response (click to add):
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {availablePaths
                                    .filter((p) =>
                                        [
                                            "string",
                                            "number",
                                            "boolean",
                                        ].includes(p.type),
                                    )
                                    .filter(
                                        (p) =>
                                            !responseMapping.some(
                                                (m) => m.path === p.path,
                                            ),
                                    )
                                    .slice(0, 12)
                                    .map((path, idx) => {
                                        // Generate alias from path (last part, camelCase)
                                        const pathParts = path.path.split(".");
                                        const lastPart =
                                            pathParts[pathParts.length - 1];
                                        const suggestedAlias = lastPart.replace(
                                            /[^a-zA-Z0-9]/g,
                                            "",
                                        );

                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => {
                                                    setResponseMapping(
                                                        (prev) => [
                                                            ...prev,
                                                            {
                                                                path: path.path,
                                                                alias: suggestedAlias,
                                                            },
                                                        ],
                                                    );
                                                }}
                                                className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border transition-colors hover:scale-105 ${
                                                    path.type === "string"
                                                        ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400"
                                                        : path.type === "number"
                                                          ? "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-400"
                                                          : "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/20 dark:border-purple-700 dark:text-purple-400"
                                                }`}
                                                title={`${path.type}: ${path.preview}`}
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
                                                        d="M12 4v16m8-8H4"
                                                    />
                                                </svg>
                                                <span className="font-mono">
                                                    {path.path.length > 20
                                                        ? "..." +
                                                          path.path.slice(-18)
                                                        : path.path}
                                                </span>
                                            </button>
                                        );
                                    })}
                            </div>
                            {availablePaths.filter((p) =>
                                ["string", "number", "boolean"].includes(
                                    p.type,
                                ),
                            ).length > 12 && (
                                <p className="text-xs text-gray-400 mt-1">
                                    +
                                    {availablePaths.filter((p) =>
                                        [
                                            "string",
                                            "number",
                                            "boolean",
                                        ].includes(p.type),
                                    ).length - 12}{" "}
                                    more fields available
                                </p>
                            )}
                        </div>
                    )}

                    {responseMapping.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Selected mappings:
                            </p>
                            {responseMapping.map((mapping, index) => (
                                <div
                                    key={index}
                                    className="flex gap-2 items-center relative"
                                >
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            value={mapping.path}
                                            onChange={(e) =>
                                                updateResponseMapping(
                                                    index,
                                                    "path",
                                                    e.target.value,
                                                )
                                            }
                                            onFocus={() =>
                                                availablePaths.length > 0 &&
                                                setShowPathDropdown(index)
                                            }
                                            className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            placeholder="data.field.path"
                                        />
                                        {showPathDropdown === index &&
                                            renderPathDropdown(
                                                (path) =>
                                                    updateResponseMapping(
                                                        index,
                                                        "path",
                                                        path,
                                                    ),
                                                mapping.path,
                                            )}
                                    </div>
                                    <svg
                                        className="w-4 h-4 text-gray-400 flex-shrink-0"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M17 8l4 4m0 0l-4 4m4-4H3"
                                        />
                                    </svg>
                                    <input
                                        type="text"
                                        value={mapping.alias}
                                        onChange={(e) =>
                                            updateResponseMapping(
                                                index,
                                                "alias",
                                                e.target.value,
                                            )
                                        }
                                        className="flex-1 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="aliasName"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            removeResponseMapping(index)
                                        }
                                        className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors flex-shrink-0"
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
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {responseMapping.length === 0 &&
                        availablePaths.length === 0 && (
                            <div className="text-center py-3 border border-dashed border-gray-300 dark:border-gray-600 rounded">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Use "Test Request" to see available fields,
                                    or click "Add Manual" to type a path.
                                </p>
                            </div>
                        )}
                </div>
            </div>

            {/* Usage Help - Available Placeholders */}
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-700">
                <p className="text-xs font-medium text-amber-800 dark:text-amber-300 mb-2">
                    Available placeholders for next node:
                </p>
                <div className="space-y-2">
                    {/* Full response */}
                    <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-amber-200 dark:border-amber-600">
                        <div className="flex-1">
                            <code className="text-xs font-mono text-amber-800 dark:text-amber-300">
                                {"{{{input}}}"}
                            </code>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {outputField
                                    ? `Extracted: ${outputField}`
                                    : "Full API response"}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() =>
                                navigator.clipboard.writeText("{{{input}}}")
                            }
                            className="p-1 text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded"
                            title="Copy to clipboard"
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
                                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                            </svg>
                        </button>
                    </div>

                    {/* Nested field access - show available paths from test */}
                    {availablePaths
                        .filter((p) =>
                            ["string", "number", "boolean"].includes(p.type),
                        )
                        .slice(0, 3)
                        .map((path, idx) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-amber-200 dark:border-amber-600"
                            >
                                <div className="flex-1">
                                    <code className="text-xs font-mono text-amber-800 dark:text-amber-300">{`{{{input.${path.path}}}}`}</code>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        {path.type}: {path.preview}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        navigator.clipboard.writeText(
                                            `{{{input.${path.path}}}}`,
                                        )
                                    }
                                    className="p-1 text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded"
                                    title="Copy to clipboard"
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
                                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                        />
                                    </svg>
                                </button>
                            </div>
                        ))}

                    {/* Show mapped fields if any */}
                    {responseMapping
                        .filter((m) => m.path && m.alias)
                        .map((mapping, idx) => (
                            <div
                                key={`mapped-${idx}`}
                                className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-purple-200 dark:border-purple-600"
                            >
                                <div className="flex-1">
                                    <code className="text-xs font-mono text-purple-800 dark:text-purple-300">{`{{{_mapped.${mapping.alias}}}}`}</code>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        Mapped from: {mapping.path}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        navigator.clipboard.writeText(
                                            `{{{_mapped.${mapping.alias}}}}`,
                                        )
                                    }
                                    className="p-1 text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded"
                                    title="Copy to clipboard"
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
                                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                        />
                                    </svg>
                                </button>
                            </div>
                        ))}

                    {availablePaths.length === 0 &&
                        responseMapping.length === 0 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                                Use "Test Request" to see available field
                                placeholders
                            </p>
                        )}
                </div>
            </div>

            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700">
                <p className="text-xs text-blue-600 dark:text-blue-400">
                    <strong>Tip:</strong> Use the "Test Request" button to see
                    the response structure and easily select fields from the
                    dropdown.
                </p>
            </div>
        </div>
    );
};

export default ApiCallConfig;
