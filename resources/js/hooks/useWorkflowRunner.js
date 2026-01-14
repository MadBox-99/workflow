import { useCallback, useState } from "react";

// Helper to get nested value from object using dot notation path
const getNestedValue = (obj, path) => {
    if (!obj || !path) return undefined;
    const keys = path.split(".");
    let value = obj;
    for (const key of keys) {
        if (value === null || value === undefined) return undefined;
        if (typeof value !== "object") return undefined;
        value = value[key];
    }
    return value;
};

// Helper to parse dynamic field path configuration (supports both old string format and new { nodeId, path } format)
const getDynamicPath = (fieldConfig) => {
    if (!fieldConfig) return null;
    if (typeof fieldConfig === "string") return { nodeId: null, path: fieldConfig };
    if (typeof fieldConfig === "object") {
        return { nodeId: fieldConfig.nodeId, path: fieldConfig.path };
    }
    return null;
};

// Helper to check if value is a placeholder pattern
const isPlaceholder = (val) => typeof val === "string" && val.match(/\{\{\{.*?\}\}\}/);

// Helper to get value, clearing unreplaced placeholders
const getValueOrDefault = (inputVal, configVal) => {
    if (inputVal !== undefined && inputVal !== null) return inputVal;
    if (isPlaceholder(configVal)) return null;
    return configVal;
};

// Time unit multipliers in milliseconds
const TIME_MULTIPLIERS = {
    minutes: 60 * 1000,
    hours: 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
};

// Calculate datetime value based on configuration
const calculateDatetime = (config) => {
    const now = new Date();

    switch (config.datetimeOption) {
        case "now":
            return now;
        case "today":
            return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        case "tomorrow":
            return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
        case "next_week":
            return new Date(now.getTime() + 7 * TIME_MULTIPLIERS.days);
        case "next_month":
            return new Date(now.getTime() + 30 * TIME_MULTIPLIERS.days);
        case "in_1_hour":
            return new Date(now.getTime() + TIME_MULTIPLIERS.hours);
        case "in_2_hours":
            return new Date(now.getTime() + 2 * TIME_MULTIPLIERS.hours);
        case "in_30_min":
            return new Date(now.getTime() + 30 * TIME_MULTIPLIERS.minutes);
        case "end_of_day":
            return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        case "custom_offset": {
            const amount = config.offsetAmount || 1;
            const unit = config.offsetUnit || "hours";
            return new Date(now.getTime() + amount * (TIME_MULTIPLIERS[unit] || 0));
        }
        case "fixed":
            return config.fixedDateTime ? new Date(config.fixedDateTime) : now;
        default:
            return now;
    }
};

// Evaluate condition operator
const evaluateCondition = (operator, a, b) => {
    const numA = parseFloat(a);
    const numB = parseFloat(b);

    switch (operator) {
        case "equals":
            return a == b;
        case "strictEquals":
            return a === b;
        case "notEquals":
            return a != b;
        case "greaterThan":
            return numA > numB;
        case "lessThan":
            return numA < numB;
        case "greaterOrEqual":
            return numA >= numB;
        case "lessOrEqual":
            return numA <= numB;
        case "contains":
            return String(a).includes(String(b));
        case "isEmpty":
            return a === "" || a === null || a === undefined;
        case "isNotEmpty":
            return a !== "" && a !== null && a !== undefined;
        case "isTrue":
            return a === true || a === "true" || a === 1 || a === "1";
        case "isFalse":
            return a === false || a === "false" || a === 0 || a === "0";
        default:
            return false;
    }
};

// Resolve condition value based on mode (static or dynamic)
const resolveConditionValue = (mode, staticVal, path, inputData) => {
    if (mode === "static") {
        return staticVal;
    }
    if (path && inputData && typeof inputData === "object") {
        return getNestedValue(inputData, path);
    }
    return inputData;
};

// Extract dynamic field value from input data
const extractDynamicField = (
    inputData,
    dynamicFieldPaths,
    fieldName,
    fallbackFields,
    asJson = false,
) => {
    if (dynamicFieldPaths[fieldName]) {
        const extracted = getNestedValue(inputData, dynamicFieldPaths[fieldName]);
        if (extracted !== undefined) {
            if (typeof extracted === "string") return extracted;
            return asJson ? JSON.stringify(extracted, null, 2) : JSON.stringify(extracted);
        }
    }
    // Auto-detect from common field names
    for (const field of fallbackFields) {
        const value = inputData._mapped?.[field] ?? inputData[field];
        if (value !== undefined) return value;
    }
    return undefined;
};

// Get source data from specific node or default input (for multi-source nodes like Google Docs)
const getSourceData = (inputValues, fieldConfig, defaultInput) => {
    const pathConfig = getDynamicPath(fieldConfig);
    if (!pathConfig) return defaultInput;

    if (pathConfig.nodeId) {
        const sourceKey = `__node_${pathConfig.nodeId}`;
        if (inputValues[sourceKey] !== undefined) {
            return inputValues[sourceKey];
        }
    }
    return defaultInput;
};

// Extract dynamic field with source node support and path extraction
const extractDynamicFieldWithSource = (
    inputValues,
    dynamicFieldPaths,
    fieldName,
    fallbackFields,
    asJson = false,
) => {
    const pathConfig = getDynamicPath(dynamicFieldPaths[fieldName]);
    const inputData = getSourceData(inputValues, dynamicFieldPaths[fieldName], inputValues.input);

    if (inputData === undefined || inputData === null) return undefined;

    if (typeof inputData === "string") return inputData;

    if (typeof inputData === "object") {
        if (pathConfig?.path) {
            const extracted = getNestedValue(inputData, pathConfig.path);
            if (extracted !== undefined) {
                if (typeof extracted === "string") return extracted;
                return asJson ? JSON.stringify(extracted, null, 2) : JSON.stringify(extracted);
            }
        }
        // Auto-detect from common field names
        for (const field of fallbackFields) {
            const value = inputData._mapped?.[field] ?? inputData[field];
            if (value !== undefined) return value;
        }
        return asJson ? JSON.stringify(inputData, null, 2) : JSON.stringify(inputData);
    }
    return undefined;
};

// Apply response mapping to create _mapped object for dynamic field access
const applyResponseMapping = (data, responseMapping) => {
    if (!responseMapping || responseMapping.length === 0 || !data) return;

    const mapped = {};
    for (const mapping of responseMapping) {
        if (mapping.alias && mapping.path) {
            const value = getNestedValue(data, mapping.path);
            if (value !== undefined) {
                mapped[mapping.alias] = value;
            }
        }
    }
    if (Object.keys(mapped).length > 0) {
        data._mapped = mapped;
    }
};

// Convert HTML rich text to formatted plain text
const convertHtmlToPlaintext = (html) => {
    if (!html) return "";

    let text = html;

    // Process mentions - replace <span data-type="mention" ...>@Label</span> with @Label
    text = text.replace(/<span[^>]*data-type="mention"[^>]*>([^<]*)<\/span>/gi, "$1");

    // Replace headings with text and double newlines
    text = text.replace(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/gis, "\n$1\n\n");

    // Replace paragraphs with text and newlines
    text = text.replace(/<p[^>]*>(.*?)<\/p>/gis, "$1\n\n");

    // Replace list items with bullet points
    text = text.replace(/<li[^>]*>(.*?)<\/li>/gis, "• $1\n");

    // Remove list wrapper tags
    text = text.replace(/<\/?[uo]l[^>]*>/gi, "");

    // Replace blockquotes with indented text
    text = text.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, "> $1\n");

    // Replace code blocks with text
    text = text.replace(/<pre[^>]*>(.*?)<\/pre>/gis, "```\n$1\n```\n");
    text = text.replace(/<code[^>]*>(.*?)<\/code>/gis, "`$1`");

    // Replace line breaks
    text = text.replace(/<br\s*\/?>/gi, "\n");

    // Handle text formatting (just remove the tags, keep content)
    text = text.replace(/<(strong|b)[^>]*>(.*?)<\/\1>/gis, "$2");
    text = text.replace(/<(em|i)[^>]*>(.*?)<\/\1>/gis, "$2");
    text = text.replace(/<(s|strike|del)[^>]*>(.*?)<\/\1>/gis, "$2");
    text = text.replace(/<(u)[^>]*>(.*?)<\/\1>/gis, "$2");

    // Remove any remaining HTML tags
    text = text.replace(/<[^>]+>/g, "");

    // Decode common HTML entities
    text = text.replace(/&nbsp;/g, " ");
    text = text.replace(/&amp;/g, "&");
    text = text.replace(/&lt;/g, "<");
    text = text.replace(/&gt;/g, ">");
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");

    // Clean up excessive whitespace
    text = text.replace(/\n{3,}/g, "\n\n"); // Max 2 consecutive newlines
    text = text.replace(/[ \t]+/g, " "); // Multiple spaces to single space
    text = text
        .split("\n")
        .map((line) => line.trim())
        .join("\n"); // Trim each line

    return text.trim();
};

export const useWorkflowRunner = (nodes, edges, setNodes, setEdges, teamId = null) => {
    const [isRunning, setIsRunning] = useState(false);
    const [currentNodeId, setCurrentNodeId] = useState(null);
    const [executionPath, setExecutionPath] = useState([]);

    // Find all start nodes (including webhook triggers)
    const findStartNodes = useCallback(() => {
        return nodes.filter(
            (node) => node.data.type === "start" || node.data.type === "webhookTrigger",
        );
    }, [nodes]);

    // Find connected nodes from a source node
    const findNextNodes = useCallback(
        (nodeId, sourceHandle = null) => {
            const outgoingEdges = edges.filter((edge) => {
                if (edge.source !== nodeId) return false;
                if (sourceHandle && edge.sourceHandle !== sourceHandle) return false;
                return true;
            });

            return outgoingEdges.map((edge) => ({
                nodeId: edge.target,
                edge: edge,
            }));
        },
        [edges],
    );

    // Find incoming node values (for condition nodes and Google Calendar nodes)
    const getInputValues = useCallback(
        (nodeId) => {
            const incomingEdges = edges.filter((edge) => edge.target === nodeId);
            const values = {};

            incomingEdges.forEach((edge) => {
                const sourceNode = nodes.find((n) => n.id === edge.source);
                if (sourceNode) {
                    // Get the output value from the source node
                    const value =
                        sourceNode.data.outputValue ??
                        sourceNode.data.config?.value ??
                        sourceNode.data.lastResponse;

                    // Check if source node has a targetField configured (for Constant nodes targeting Calendar fields)
                    const targetField = sourceNode.data.config?.targetField;

                    // Store by node ID for multi-source selection (allows getSourceData to find specific nodes)
                    values[`__node_${sourceNode.id}`] = value;

                    if (targetField) {
                        // Use the targetField as the key (e.g., 'summary', 'startDateTime', 'endDateTime', etc.)
                        values[targetField] = value;
                    } else if (edge.targetHandle === "start-input") {
                        values.startDateTime = value;
                    } else if (edge.targetHandle === "end-input") {
                        values.endDateTime = value;
                    } else {
                        values.input = value;
                    }
                }
            });
            return values;
        },
        [nodes, edges],
    );

    // Update node status
    const updateNodeStatus = useCallback(
        (nodeId, status, additionalData = {}) => {
            setNodes((nds) =>
                nds.map((node) => {
                    if (node.id === nodeId) {
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                status,
                                ...additionalData,
                            },
                        };
                    }
                    return node;
                }),
            );
        },
        [setNodes],
    );

    // Update edge status (for animation)
    const updateEdgeStatus = useCallback(
        (edgeId, animated) => {
            setEdges((eds) =>
                eds.map((edge) => {
                    if (edge.id === edgeId) {
                        return {
                            ...edge,
                            animated,
                            style: {
                                ...edge.style,
                                stroke: animated ? "#22c55e" : undefined,
                                strokeWidth: animated ? 3 : 2,
                            },
                        };
                    }
                    return edge;
                }),
            );
        },
        [setEdges],
    );

    // Reset all nodes and edges
    const resetExecution = useCallback(() => {
        setNodes((nds) =>
            nds.map((node) => ({
                ...node,
                data: {
                    ...node.data,
                    status: "initial",
                    conditionResult: undefined,
                    lastResponse: undefined,
                    lastError: undefined,
                    outputValue: undefined,
                },
            })),
        );

        setEdges((eds) =>
            eds.map((edge) => ({
                ...edge,
                animated: false,
                style: {
                    ...edge.style,
                    stroke: undefined,
                    strokeWidth: 2,
                },
            })),
        );

        setExecutionPath([]);
        setCurrentNodeId(null);
    }, [setNodes, setEdges]);

    // Execute a single node
    const executeNode = useCallback(
        async (node) => {
            const nodeType = node.data.type;
            const config = node.data.config || {};
            const inputValues = getInputValues(node.id);

            switch (nodeType) {
                case "start":
                    return { success: true, output: config.value || true };

                case "webhookTrigger":
                    // In frontend simulation, return test payload or empty object
                    return { success: true, output: config.testPayload || {} };

                case "end":
                    return { success: true, finished: true };

                case "constant": {
                    if (config.valueType === "datetime") {
                        const result = calculateDatetime(config);
                        return { success: true, output: result.toISOString() };
                    }

                    if (config.valueType === "richtext" && config.outputFormat === "plaintext") {
                        return {
                            success: true,
                            output: convertHtmlToPlaintext(config.value || ""),
                        };
                    }

                    return { success: true, output: config.value };
                }

                case "condition": {
                    const operator = config.operator || "equals";
                    const passWhen = config.passWhen || "true";
                    const inputData = inputValues.input;

                    const a = resolveConditionValue(
                        config.valueAMode || "static",
                        config.valueAStatic || "",
                        config.valueAPath || "",
                        inputData,
                    );
                    const b = resolveConditionValue(
                        config.valueBMode || "static",
                        config.valueBStatic || "",
                        config.valueBPath || "",
                        inputData,
                    );

                    const result = evaluateCondition(operator, a, b);
                    const shouldContinue =
                        (passWhen === "true" && result) || (passWhen === "false" && !result);

                    return {
                        success: true,
                        conditionResult: result,
                        shouldContinue,
                        output: shouldContinue ? inputData : null,
                    };
                }

                case "branch":
                    // Branch node passes through to ALL outputs
                    return {
                        success: true,
                        output: inputValues.input,
                        isBranch: true,
                    };

                case "join":
                    // Join node waits for inputs and passes through
                    return { success: true, output: inputValues.input };

                case "merge": {
                    // Merge node collects all input values and concatenates them
                    const separator = config.separator ?? "";
                    const inputIds = node.data.inputs || ["input-1", "input-2"];

                    // Collect values from all connected inputs
                    const incomingEdges = edges.filter((edge) => edge.target === node.id);
                    const valuesBySlot = {};

                    for (const edge of incomingEdges) {
                        const sourceNode = nodes.find((n) => n.id === edge.source);
                        if (sourceNode) {
                            const value =
                                sourceNode.data.outputValue ??
                                sourceNode.data.config?.value ??
                                sourceNode.data.lastResponse;
                            if (value !== undefined && value !== null) {
                                // Check if source node has a targetField configured
                                const targetField = sourceNode.data.config?.targetField;
                                const targetHandle = targetField || edge.targetHandle;
                                const slotIndex = inputIds.indexOf(targetHandle);
                                if (slotIndex !== -1) {
                                    valuesBySlot[slotIndex] = String(value);
                                }
                            }
                        }
                    }

                    // Sort by slot index and collect values
                    const sortedKeys = Object.keys(valuesBySlot)
                        .map(Number)
                        .sort((a, b) => a - b);
                    const values = sortedKeys.map((key) => valuesBySlot[key]);

                    const mergedValue = values.join(separator);

                    return { success: true, output: mergedValue };
                }

                case "template": {
                    // Template node applies a template pattern with placeholders
                    const templateStr = config.template || "";
                    const inputIds = node.data.inputs || ["input-1", "input-2"];

                    // Collect values from all connected inputs
                    const incomingEdges = edges.filter((edge) => edge.target === node.id);
                    const valuesByIndex = {};

                    for (const edge of incomingEdges) {
                        const sourceNode = nodes.find((n) => n.id === edge.source);
                        if (sourceNode) {
                            const value =
                                sourceNode.data.outputValue ??
                                sourceNode.data.config?.value ??
                                sourceNode.data.lastResponse;
                            if (value !== undefined && value !== null) {
                                // Check if source node has a targetField configured
                                const targetField = sourceNode.data.config?.targetField;
                                const targetHandle = targetField || edge.targetHandle;
                                const inputIndex = inputIds.indexOf(targetHandle);
                                if (inputIndex !== -1) {
                                    valuesByIndex[inputIndex + 1] = value; // 1-indexed for ${input1}, ${input2}, etc.
                                }
                            }
                        }
                    }

                    // First convert @mentions in HTML to ${inputN} placeholders
                    // Match: <span data-type="mention" data-id="input1" ...>@Label</span>
                    let processedTemplate = templateStr.replace(
                        /<span[^>]*data-type="mention"[^>]*data-id="(input\d+)"[^>]*>[^<]*<\/span>/gi,
                        "${$1}",
                    );

                    // Replace ${inputN} placeholders with actual values
                    const result = processedTemplate.replace(/\$\{input(\d+)\}/g, (match, num) => {
                        const value = valuesByIndex[parseInt(num)];
                        return value !== undefined ? String(value) : match;
                    });

                    return { success: true, output: result };
                }

                case "apiAction": {
                    if (!config.url) {
                        throw new Error("API Action requires a URL");
                    }

                    const {
                        method = "GET",
                        url,
                        requestBody = {},
                        headers = {},
                        responseMapping = [],
                    } = config;
                    const upperMethod = method.toUpperCase();

                    const response = await fetch(url, {
                        method: upperMethod,
                        headers: {
                            "Content-Type": "application/json",
                            Accept: "application/json",
                            ...headers,
                        },
                        body: ["POST", "PUT", "PATCH"].includes(upperMethod)
                            ? JSON.stringify(requestBody)
                            : undefined,
                    });

                    const data = await response.json();
                    applyResponseMapping(data, responseMapping);

                    return { success: true, output: data };
                }

                case "emailAction": {
                    if (!config.template) {
                        throw new Error("Email Action requires a template");
                    }
                    if (!config.recipients || config.recipients.length === 0) {
                        throw new Error("Email Action requires at least one recipient");
                    }

                    const emailResponse = await fetch("/api/workflows/actions/email", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Accept: "application/json",
                        },
                        body: JSON.stringify({
                            template: config.template,
                            recipients: config.recipients,
                            subject: config.subject,
                            customData: config.customData || {},
                        }),
                    });

                    const emailData = await emailResponse.json();

                    if (!emailResponse.ok || !emailData.success) {
                        throw new Error(emailData.error || "Failed to send email");
                    }
                    return { success: true, output: emailData };
                }

                case "googleCalendarAction": {
                    if (!teamId) {
                        throw new Error("Team ID is required for Google Calendar actions");
                    }
                    if (!config.operation) {
                        throw new Error("Google Calendar action requires an operation");
                    }

                    // Extract eventId from connected Calendar event object if available
                    const eventIdFromInput = inputValues.eventId ?? (inputValues.input?.id || null);
                    const dynamicFields = config.dynamicFields || {};
                    const dynamicFieldPaths = config.dynamicFieldPaths || {};
                    const inputData = inputValues.input;

                    // Resolve field values from inputs or config
                    let summary = getValueOrDefault(inputValues.summary, config.summary);
                    let description = getValueOrDefault(
                        inputValues.description,
                        config.description,
                    );
                    let location = getValueOrDefault(inputValues.location, config.location);
                    const startDateTime = getValueOrDefault(
                        inputValues.startDateTime,
                        config.startDateTime,
                    );
                    const endDateTime = getValueOrDefault(
                        inputValues.endDateTime,
                        config.endDateTime,
                    );
                    const attendees = getValueOrDefault(inputValues.attendees, config.attendees);
                    const eventId = getValueOrDefault(eventIdFromInput, config.eventId);

                    // Apply dynamic field extraction from connected action node
                    if (inputData && typeof inputData === "object") {
                        if (dynamicFields.summary) {
                            summary =
                                extractDynamicField(inputData, dynamicFieldPaths, "summary", [
                                    "summary",
                                    "title",
                                ]) ?? summary;
                        }
                        if (dynamicFields.description) {
                            description =
                                extractDynamicField(
                                    inputData,
                                    dynamicFieldPaths,
                                    "description",
                                    ["description", "body"],
                                    true,
                                ) ?? description;
                        }
                        if (dynamicFields.location) {
                            location =
                                extractDynamicField(inputData, dynamicFieldPaths, "location", [
                                    "location",
                                ]) ?? location;
                        }
                    }

                    const calendarResponse = await fetch("/api/workflows/actions/google-calendar", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Accept: "application/json",
                        },
                        body: JSON.stringify({
                            team_id: teamId,
                            operation: config.operation,
                            calendarId: config.calendarId || "primary",
                            summary,
                            description,
                            startDateTime,
                            endDateTime,
                            location,
                            attendees,
                            eventId,
                            timeMin: config.timeMin,
                            timeMax: config.timeMax,
                            maxResults: config.maxResults,
                        }),
                    });

                    const calendarData = await calendarResponse.json();

                    if (!calendarResponse.ok || !calendarData.success) {
                        if (calendarData.errorCode === "EVENT_NOT_FOUND") {
                            console.warn(
                                "[Runner] Event was deleted or not found:",
                                calendarData.error,
                            );
                        }
                        throw new Error(
                            calendarData.error || "Failed to execute Google Calendar action",
                        );
                    }

                    if (calendarData.deleted) {
                        return {
                            success: true,
                            deleted: true,
                            deletedEventId: calendarData.deletedEventId,
                            output: null,
                        };
                    }

                    return { success: true, output: calendarData.data };
                }

                case "googleDocsAction": {
                    if (!teamId) {
                        throw new Error("Team ID is required for Google Docs actions");
                    }
                    if (!config.operation) {
                        throw new Error("Google Docs action requires an operation");
                    }

                    // Extract documentId from connected Docs document object if available
                    const documentIdFromInput =
                        inputValues.documentId ?? (inputValues.input?.id || null);
                    const dynamicFields = config.dynamicFields || {};
                    const dynamicFieldPaths = config.dynamicFieldPaths || {};

                    // Resolve field values from inputs or config
                    let title = getValueOrDefault(inputValues.title, config.title);
                    let content = getValueOrDefault(inputValues.content, config.content);
                    const documentId = getValueOrDefault(documentIdFromInput, config.documentId);

                    // Apply dynamic field extraction from connected action node
                    if (dynamicFields.title) {
                        title =
                            extractDynamicFieldWithSource(inputValues, dynamicFieldPaths, "title", [
                                "title",
                                "name",
                            ]) ?? title;
                    }
                    if (dynamicFields.content) {
                        content =
                            extractDynamicFieldWithSource(
                                inputValues,
                                dynamicFieldPaths,
                                "content",
                                ["content", "body", "text"],
                                true,
                            ) ?? content;
                    }

                    const docsResponse = await fetch("/api/workflows/actions/google-docs", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Accept: "application/json",
                        },
                        body: JSON.stringify({
                            team_id: teamId,
                            operation: config.operation,
                            documentId:
                                documentId && typeof documentId === "string"
                                    ? documentId
                                    : undefined,
                            title,
                            content,
                            updateOperation: config.updateOperation,
                            searchText: config.searchText,
                            insertIndex: config.insertIndex,
                            maxResults: config.maxResults,
                        }),
                    });

                    const docsData = await docsResponse.json();

                    if (!docsResponse.ok || !docsData.success) {
                        if (docsData.errorCode === "DOCUMENT_NOT_FOUND") {
                            console.warn("[Runner] Document not found:", docsData.error);
                        }
                        throw new Error(
                            docsData.message ||
                                docsData.error ||
                                "Failed to execute Google Docs action",
                        );
                    }
                    return { success: true, output: docsData.data };
                }

                default:
                    // For other action types, simulate execution
                    await new Promise((resolve) => setTimeout(resolve, 500));
                    return { success: true, output: inputValues.input };
            }
        },
        [getInputValues, nodes, edges, teamId],
    );

    // Execute node with provided input values (for dependency-aware execution)
    const executeNodeWithInputs = useCallback(
        async (node, inputValues) => {
            const nodeType = node.data.type;
            const config = node.data.config || {};

            switch (nodeType) {
                case "start":
                    return { success: true, output: config.value || true };

                case "webhookTrigger":
                    // In frontend simulation, return test payload or empty object
                    return { success: true, output: config.testPayload || {} };

                case "end":
                    return { success: true, finished: true };

                case "constant": {
                    if (config.valueType === "datetime") {
                        const result = calculateDatetime(config);
                        return { success: true, output: result.toISOString() };
                    }

                    if (config.valueType === "richtext" && config.outputFormat === "plaintext") {
                        return {
                            success: true,
                            output: convertHtmlToPlaintext(config.value || ""),
                        };
                    }

                    return { success: true, output: config.value };
                }

                case "condition": {
                    const operator = config.operator || "equals";
                    const passWhen = config.passWhen || "true";
                    const inputData = inputValues.input;

                    const a = resolveConditionValue(
                        config.valueAMode || "static",
                        config.valueAStatic || "",
                        config.valueAPath || "",
                        inputData,
                    );
                    const b = resolveConditionValue(
                        config.valueBMode || "static",
                        config.valueBStatic || "",
                        config.valueBPath || "",
                        inputData,
                    );

                    const result = evaluateCondition(operator, a, b);
                    const shouldContinue =
                        (passWhen === "true" && result) || (passWhen === "false" && !result);

                    return {
                        success: true,
                        conditionResult: result,
                        shouldContinue,
                        output: shouldContinue ? inputData : null,
                    };
                }

                case "branch":
                case "join":
                    return { success: true, output: inputValues.input };

                case "merge": {
                    // Merge node collects all input values and concatenates them
                    // inputValues should have all the connected values keyed by their source
                    const separator = config.separator ?? "";

                    // Extract values from inputValues - they might be keyed by targetField or generic keys
                    const values = [];
                    Object.values(inputValues).forEach((val) => {
                        if (val !== undefined && val !== null) {
                            values.push(String(val));
                        }
                    });

                    const mergedValue = values.join(separator);

                    return { success: true, output: mergedValue };
                }

                case "template": {
                    // Template node applies a template pattern with placeholders
                    const templateStr = config.template || "";

                    // Extract values from inputValues - keyed by input index
                    const valuesByIndex = {};
                    Object.entries(inputValues).forEach(([key, val]) => {
                        // Input handles follow pattern like input-0, input-1, etc.
                        const match = key.match(/input-(\d+)/);
                        if (match) {
                            valuesByIndex[parseInt(match[1]) + 1] = val; // 1-indexed for ${input1}, ${input2}
                        } else if (key === "input" && val !== undefined) {
                            valuesByIndex[1] = val; // Default single input
                        }
                    });

                    // Replace placeholders in template
                    const result = templateStr.replace(/\$\{input(\d+)\}/g, (match, num) => {
                        const value = valuesByIndex[parseInt(num)];
                        return value !== undefined ? String(value) : match;
                    });

                    return { success: true, output: result };
                }

                case "googleCalendarAction": {
                    if (!teamId) {
                        throw new Error("Team ID is required for Google Calendar actions");
                    }
                    if (!config.operation) {
                        throw new Error("Google Calendar action requires an operation");
                    }

                    // Extract eventId from connected Calendar event object if available
                    const eventIdFromInput = inputValues.eventId ?? (inputValues.input?.id || null);
                    const dynamicFields = config.dynamicFields || {};
                    const dynamicFieldPaths = config.dynamicFieldPaths || {};
                    const inputData = inputValues.input;

                    // Resolve field values from inputs or config
                    let summary = getValueOrDefault(inputValues.summary, config.summary);
                    let description = getValueOrDefault(
                        inputValues.description,
                        config.description,
                    );
                    let location = getValueOrDefault(inputValues.location, config.location);
                    const startDateTime = getValueOrDefault(
                        inputValues.startDateTime,
                        config.startDateTime,
                    );
                    const endDateTime = getValueOrDefault(
                        inputValues.endDateTime,
                        config.endDateTime,
                    );
                    const attendees = getValueOrDefault(inputValues.attendees, config.attendees);
                    const eventId = getValueOrDefault(eventIdFromInput, config.eventId);

                    // Apply dynamic field extraction from connected action node
                    if (inputData && typeof inputData === "object") {
                        if (dynamicFields.summary) {
                            summary =
                                extractDynamicField(inputData, dynamicFieldPaths, "summary", [
                                    "summary",
                                    "title",
                                ]) ?? summary;
                        }
                        if (dynamicFields.description) {
                            description =
                                extractDynamicField(
                                    inputData,
                                    dynamicFieldPaths,
                                    "description",
                                    ["description", "body"],
                                    true,
                                ) ?? description;
                        }
                        if (dynamicFields.location) {
                            location =
                                extractDynamicField(inputData, dynamicFieldPaths, "location", [
                                    "location",
                                ]) ?? location;
                        }
                    }

                    const calendarResponse = await fetch("/api/workflows/actions/google-calendar", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Accept: "application/json",
                        },
                        body: JSON.stringify({
                            team_id: teamId,
                            operation: config.operation,
                            calendarId: config.calendarId || "primary",
                            summary,
                            description,
                            startDateTime,
                            endDateTime,
                            location,
                            attendees,
                            eventId,
                            timeMin: config.timeMin,
                            timeMax: config.timeMax,
                            maxResults: config.maxResults,
                        }),
                    });

                    const calendarData = await calendarResponse.json();

                    if (!calendarResponse.ok || !calendarData.success) {
                        if (calendarData.errorCode === "EVENT_NOT_FOUND") {
                            console.warn(
                                "[Runner] Event was deleted or not found:",
                                calendarData.error,
                            );
                        }
                        throw new Error(
                            calendarData.error || "Failed to execute Google Calendar action",
                        );
                    }

                    if (calendarData.deleted) {
                        return {
                            success: true,
                            deleted: true,
                            deletedEventId: calendarData.deletedEventId,
                            output: null,
                        };
                    }

                    return { success: true, output: calendarData.data };
                }

                case "googleDocsAction": {
                    if (!teamId) {
                        throw new Error("Team ID is required for Google Docs actions");
                    }
                    if (!config.operation) {
                        throw new Error("Google Docs action requires an operation");
                    }

                    // Extract documentId from connected Docs document object if available
                    const documentIdFromInput =
                        inputValues.documentId ?? (inputValues.input?.id || null);
                    const dynamicFields = config.dynamicFields || {};
                    const dynamicFieldPaths = config.dynamicFieldPaths || {};

                    // Resolve field values from inputs or config
                    let title = getValueOrDefault(inputValues.title, config.title);
                    let content = getValueOrDefault(inputValues.content, config.content);
                    const documentId = getValueOrDefault(documentIdFromInput, config.documentId);

                    // Apply dynamic field extraction from connected action node
                    if (dynamicFields.title) {
                        title =
                            extractDynamicFieldWithSource(inputValues, dynamicFieldPaths, "title", [
                                "title",
                                "name",
                            ]) ?? title;
                    }
                    if (dynamicFields.content) {
                        content =
                            extractDynamicFieldWithSource(
                                inputValues,
                                dynamicFieldPaths,
                                "content",
                                ["content", "body", "text"],
                                true,
                            ) ?? content;
                    }

                    const docsResponse = await fetch("/api/workflows/actions/google-docs", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Accept: "application/json",
                        },
                        body: JSON.stringify({
                            team_id: teamId,
                            operation: config.operation,
                            documentId:
                                documentId && typeof documentId === "string"
                                    ? documentId
                                    : undefined,
                            title,
                            content,
                            updateOperation: config.updateOperation,
                            searchText: config.searchText,
                            insertIndex: config.insertIndex,
                            maxResults: config.maxResults,
                        }),
                    });

                    const docsData = await docsResponse.json();

                    if (!docsResponse.ok || !docsData.success) {
                        if (docsData.errorCode === "DOCUMENT_NOT_FOUND") {
                            console.warn("[Runner] Document not found:", docsData.error);
                        }
                        throw new Error(
                            docsData.message ||
                                docsData.error ||
                                "Failed to execute Google Docs action",
                        );
                    }
                    return { success: true, output: docsData.data };
                }

                case "apiAction": {
                    if (!config.url) {
                        throw new Error("API Action requires a URL");
                    }

                    const {
                        method = "GET",
                        url,
                        requestBody = {},
                        headers = {},
                        responseMapping = [],
                    } = config;
                    const upperMethod = method.toUpperCase();

                    const response = await fetch(url, {
                        method: upperMethod,
                        headers: {
                            "Content-Type": "application/json",
                            Accept: "application/json",
                            ...headers,
                        },
                        body: ["POST", "PUT", "PATCH"].includes(upperMethod)
                            ? JSON.stringify(requestBody)
                            : undefined,
                    });

                    const data = await response.json();
                    applyResponseMapping(data, responseMapping);

                    return { success: true, output: data };
                }

                default:
                    await new Promise((resolve) => setTimeout(resolve, 500));
                    return { success: true, output: inputValues.input };
            }
        },
        [teamId],
    );

    // Execute a single node with its dependencies (recursive helper)
    // nodeOutputs is a Map that stores outputs synchronously during execution
    const executeNodeWithDependencies = useCallback(
        async (node, visited, executedNodes, nodeOutputs) => {
            // Skip if already executed in this run
            if (executedNodes.has(node.id)) {
                return nodeOutputs.get(node.id);
            }

            // Find all incoming edges (input dependencies)
            const incomingEdges = edges.filter((edge) => edge.target === node.id);

            // Execute all input dependencies first (but not start nodes or nodes in the main flow)
            for (const edge of incomingEdges) {
                const sourceNode = nodes.find((n) => n.id === edge.source);
                if (
                    sourceNode &&
                    !executedNodes.has(sourceNode.id) &&
                    sourceNode.data.type !== "start"
                ) {
                    await executeNodeWithDependencies(
                        sourceNode,
                        visited,
                        executedNodes,
                        nodeOutputs,
                    );
                }
            }

            // Now execute this node
            if (!executedNodes.has(node.id)) {
                executedNodes.add(node.id);

                setCurrentNodeId(node.id);
                setExecutionPath((prev) => [...prev, node.id]);
                updateNodeStatus(node.id, "loading");

                await new Promise((resolve) => setTimeout(resolve, 300));

                try {
                    // Build input values from nodeOutputs (synchronous map) instead of React state
                    const inputValues = {};
                    incomingEdges.forEach((edge) => {
                        const sourceNode = nodes.find((n) => n.id === edge.source);
                        if (sourceNode) {
                            // Get output from our synchronous map, or fall back to config
                            const value =
                                nodeOutputs.get(sourceNode.id) ?? sourceNode.data.config?.value;
                            const targetField = sourceNode.data.config?.targetField;

                            // Store by node ID for multi-source selection (allows getSourceData to find specific nodes)
                            inputValues[`__node_${sourceNode.id}`] = value;

                            if (targetField) {
                                inputValues[targetField] = value;
                            } else if (edge.targetHandle === "start-input") {
                                inputValues.startDateTime = value;
                            } else if (edge.targetHandle === "end-input") {
                                inputValues.endDateTime = value;
                            } else {
                                inputValues.input = value;
                            }
                        }
                    });

                    // Execute with the computed input values
                    const result = await executeNodeWithInputs(node, inputValues);

                    // Store output in our synchronous map
                    nodeOutputs.set(node.id, result.output);

                    if (result.finished) {
                        updateNodeStatus(node.id, "success");
                        return { finished: true };
                    }

                    // Update node with result (for UI purposes)
                    updateNodeStatus(node.id, "success", {
                        outputValue: result.output,
                        conditionResult: result.conditionResult,
                        shouldContinue: result.shouldContinue,
                        lastResponse: result.output,
                    });

                    return result;
                } catch (error) {
                    console.error("[Runner] Node execution error:", error);
                    updateNodeStatus(node.id, "error", {
                        lastError: error.message,
                    });
                    throw error;
                }
            }
            return nodeOutputs.get(node.id);
        },
        [nodes, edges, executeNodeWithInputs, updateNodeStatus, setCurrentNodeId, setExecutionPath],
    );

    // Run the entire workflow
    const runWorkflow = useCallback(async () => {
        if (isRunning) return;

        const startNodes = findStartNodes();
        if (startNodes.length === 0) {
            alert("No Start node found! Add a Start node to run the workflow.");
            return;
        }

        setIsRunning(true);
        resetExecution();

        const visited = new Set();
        const executedNodes = new Set();
        const nodeOutputs = new Map(); // Synchronous map for node outputs
        // Initialize queue with ALL start nodes
        const queue = startNodes.map((node) => ({ node, fromEdge: null }));

        try {
            while (queue.length > 0) {
                const { node, fromEdge } = queue.shift();

                if (visited.has(node.id)) continue;
                visited.add(node.id);

                setCurrentNodeId(node.id);
                setExecutionPath((prev) => [...prev, node.id]);

                // Animate incoming edge
                if (fromEdge) {
                    updateEdgeStatus(fromEdge.id, true);
                }

                // Set node to loading
                updateNodeStatus(node.id, "loading");

                // Delay for visual effect - let the edge animation play
                await new Promise((resolve) => setTimeout(resolve, 800));

                try {
                    let nodeResult = null;

                    // For non-start nodes, ensure input dependencies are executed first
                    const isStartNode =
                        node.data.type === "start" || node.data.type === "webhookTrigger";
                    if (!isStartNode && !executedNodes.has(node.id)) {
                        nodeResult = await executeNodeWithDependencies(
                            node,
                            visited,
                            executedNodes,
                            nodeOutputs,
                        );
                        // The node was already executed in executeNodeWithDependencies
                    } else {
                        // Execute start nodes or already visited nodes normally
                        executedNodes.add(node.id);
                        nodeResult = await executeNode(node);

                        // Store output in nodeOutputs map
                        nodeOutputs.set(node.id, nodeResult.output);

                        if (nodeResult.finished) {
                            updateNodeStatus(node.id, "success");
                            continue;
                        }

                        // Update node with result
                        updateNodeStatus(node.id, "success", {
                            outputValue: nodeResult.output,
                            conditionResult: nodeResult.conditionResult,
                            shouldContinue: nodeResult.shouldContinue,
                            lastResponse: nodeResult.output,
                        });
                    }

                    // Find next nodes - for condition nodes, check shouldContinue
                    let sourceHandle = null;

                    // For condition nodes with the new single-output design
                    if (node.data.type === "condition") {
                        // Check shouldContinue from the execution result
                        if (nodeResult && nodeResult.shouldContinue === false) {
                            continue;
                        }
                        // Use "output" handle for condition nodes that pass
                        sourceHandle = "output";
                    }

                    const nextNodes = findNextNodes(node.id, sourceHandle);

                    for (const { nodeId, edge } of nextNodes) {
                        const nextNode = nodes.find((n) => n.id === nodeId);
                        if (nextNode && !visited.has(nextNode.id)) {
                            queue.push({ node: nextNode, fromEdge: edge });
                        }
                    }
                } catch (error) {
                    console.error("[Runner] Node execution error:", error);
                    updateNodeStatus(node.id, "error", {
                        lastError: error.message,
                    });
                    // Continue with other branches instead of stopping entire workflow
                    continue;
                }

                // Delay between nodes
                await new Promise((resolve) => setTimeout(resolve, 500));
            }
        } finally {
            setIsRunning(false);
            setCurrentNodeId(null);
        }
    }, [
        isRunning,
        nodes,
        findStartNodes,
        findNextNodes,
        executeNode,
        executeNodeWithDependencies,
        updateNodeStatus,
        updateEdgeStatus,
        resetExecution,
    ]);

    // Stop the workflow (for future use)
    const stopWorkflow = useCallback(() => {
        setIsRunning(false);
        setCurrentNodeId(null);
    }, []);

    return {
        isRunning,
        currentNodeId,
        executionPath,
        runWorkflow,
        stopWorkflow,
        resetExecution,
    };
};
