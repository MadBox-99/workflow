import { useCallback, useState } from 'react';

// Helper to get nested value from object using dot notation path
const getNestedValue = (obj, path) => {
    if (!obj || !path) return undefined;
    const keys = path.split('.');
    let value = obj;
    for (const key of keys) {
        if (value === null || value === undefined) return undefined;
        if (typeof value !== 'object') return undefined;
        value = value[key];
    }
    return value;
};

// Helper to parse dynamic field path configuration (supports both old string format and new { nodeId, path } format)
const getDynamicPath = (fieldConfig) => {
    if (!fieldConfig) return null;
    if (typeof fieldConfig === 'string') return { nodeId: null, path: fieldConfig };
    if (typeof fieldConfig === 'object') return { nodeId: fieldConfig.nodeId, path: fieldConfig.path };
    return null;
};

// Convert HTML rich text to formatted plain text
const convertHtmlToPlaintext = (html) => {
    if (!html) return '';

    let text = html;

    // Process mentions - replace <span data-type="mention" ...>@Label</span> with @Label
    text = text.replace(/<span[^>]*data-type="mention"[^>]*>([^<]*)<\/span>/gi, '$1');

    // Replace headings with text and double newlines
    text = text.replace(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/gis, '\n$1\n\n');

    // Replace paragraphs with text and newlines
    text = text.replace(/<p[^>]*>(.*?)<\/p>/gis, '$1\n\n');

    // Replace list items with bullet points
    text = text.replace(/<li[^>]*>(.*?)<\/li>/gis, '• $1\n');

    // Remove list wrapper tags
    text = text.replace(/<\/?[uo]l[^>]*>/gi, '');

    // Replace blockquotes with indented text
    text = text.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, '> $1\n');

    // Replace code blocks with text
    text = text.replace(/<pre[^>]*>(.*?)<\/pre>/gis, '```\n$1\n```\n');
    text = text.replace(/<code[^>]*>(.*?)<\/code>/gis, '`$1`');

    // Replace line breaks
    text = text.replace(/<br\s*\/?>/gi, '\n');

    // Handle text formatting (just remove the tags, keep content)
    text = text.replace(/<(strong|b)[^>]*>(.*?)<\/\1>/gis, '$2');
    text = text.replace(/<(em|i)[^>]*>(.*?)<\/\1>/gis, '$2');
    text = text.replace(/<(s|strike|del)[^>]*>(.*?)<\/\1>/gis, '$2');
    text = text.replace(/<(u)[^>]*>(.*?)<\/\1>/gis, '$2');

    // Remove any remaining HTML tags
    text = text.replace(/<[^>]+>/g, '');

    // Decode common HTML entities
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");

    // Clean up excessive whitespace
    text = text.replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive newlines
    text = text.replace(/[ \t]+/g, ' '); // Multiple spaces to single space
    text = text.split('\n').map(line => line.trim()).join('\n'); // Trim each line

    return text.trim();
};

export const useWorkflowRunner = (nodes, edges, setNodes, setEdges, teamId = null) => {
    const [isRunning, setIsRunning] = useState(false);
    const [currentNodeId, setCurrentNodeId] = useState(null);
    const [executionPath, setExecutionPath] = useState([]);

    // Find all start nodes
    const findStartNodes = useCallback(() => {
        return nodes.filter((node) => node.data.type === 'start');
    }, [nodes]);

    // Find connected nodes from a source node
    const findNextNodes = useCallback((nodeId, sourceHandle = null) => {
        console.log(`[findNextNodes] Looking for edges from ${nodeId}, sourceHandle filter: ${sourceHandle}`);
        console.log(`[findNextNodes] Total edges:`, edges.length, edges.map(e => ({ source: e.source, target: e.target, sourceHandle: e.sourceHandle })));

        const outgoingEdges = edges.filter((edge) => {
            if (edge.source !== nodeId) return false;
            if (sourceHandle && edge.sourceHandle !== sourceHandle) return false;
            return true;
        });

        console.log(`[findNextNodes] Found ${outgoingEdges.length} outgoing edges:`, outgoingEdges);

        return outgoingEdges.map((edge) => ({
            nodeId: edge.target,
            edge: edge,
        }));
    }, [edges]);

    // Find incoming node values (for condition nodes and Google Calendar nodes)
    const getInputValues = useCallback((nodeId) => {
        const incomingEdges = edges.filter((edge) => edge.target === nodeId);
        const values = {};

        console.log(`[getInputValues] Node ${nodeId} has ${incomingEdges.length} incoming edges`);

        incomingEdges.forEach((edge) => {
            const sourceNode = nodes.find((n) => n.id === edge.source);
            if (sourceNode) {
                // Get the output value from the source node
                const value = sourceNode.data.outputValue ?? sourceNode.data.config?.value ?? sourceNode.data.lastResponse;

                // Check if source node has a targetField configured (for Constant nodes targeting Calendar fields)
                const targetField = sourceNode.data.config?.targetField;

                console.log(`[getInputValues] Source node ${sourceNode.id} (${sourceNode.data.type}):`, {
                    targetField,
                    outputValue: sourceNode.data.outputValue,
                    configValue: sourceNode.data.config?.value,
                    lastResponse: sourceNode.data.lastResponse,
                    finalValue: value,
                });

                // Store by node ID for multi-source selection (allows getSourceData to find specific nodes)
                values[`__node_${sourceNode.id}`] = value;

                if (targetField) {
                    // Use the targetField as the key (e.g., 'summary', 'startDateTime', 'endDateTime', etc.)
                    values[targetField] = value;
                    console.log(`[getInputValues] Set values['${targetField}'] = ${value}`);
                } else if (edge.targetHandle === 'input-a') {
                    values.valueA = value;
                } else if (edge.targetHandle === 'input-b') {
                    values.valueB = value;
                } else if (edge.targetHandle === 'start-input') {
                    values.startDateTime = value;
                } else if (edge.targetHandle === 'end-input') {
                    values.endDateTime = value;
                } else {
                    values.input = value;
                }
            }
        });

        console.log(`[getInputValues] Final values for ${nodeId}:`, values);
        return values;
    }, [nodes, edges]);

    // Update node status
    const updateNodeStatus = useCallback((nodeId, status, additionalData = {}) => {
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
            })
        );
    }, [setNodes]);

    // Update edge status (for animation)
    const updateEdgeStatus = useCallback((edgeId, animated) => {
        setEdges((eds) =>
            eds.map((edge) => {
                if (edge.id === edgeId) {
                    return {
                        ...edge,
                        animated,
                        style: {
                            ...edge.style,
                            stroke: animated ? '#22c55e' : undefined,
                            strokeWidth: animated ? 3 : 2,
                        },
                    };
                }
                return edge;
            })
        );
    }, [setEdges]);

    // Reset all nodes and edges
    const resetExecution = useCallback(() => {
        setNodes((nds) =>
            nds.map((node) => ({
                ...node,
                data: {
                    ...node.data,
                    status: 'initial',
                    conditionResult: undefined,
                    lastResponse: undefined,
                    lastError: undefined,
                    outputValue: undefined,
                },
            }))
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
            }))
        );

        setExecutionPath([]);
        setCurrentNodeId(null);
    }, [setNodes, setEdges]);

    // Execute a single node
    const executeNode = useCallback(async (node) => {
        const nodeType = node.data.type;
        const config = node.data.config || {};
        const inputValues = getInputValues(node.id);

        console.log(`[Runner] Executing ${nodeType}: ${node.data.label}`, inputValues);

        switch (nodeType) {
            case 'start':
                return { success: true, output: config.value || true };

            case 'end':
                return { success: true, finished: true };

            case 'constant': {
                // Handle datetime type - calculate value at runtime
                if (config.valueType === 'datetime') {
                    const now = new Date();
                    let result;

                    switch (config.datetimeOption) {
                        case 'now':
                            result = now;
                            break;
                        case 'today':
                            result = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
                            break;
                        case 'tomorrow':
                            result = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
                            break;
                        case 'next_week':
                            result = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                            break;
                        case 'next_month':
                            result = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                            break;
                        case 'in_1_hour':
                            result = new Date(now.getTime() + 60 * 60 * 1000);
                            break;
                        case 'in_2_hours':
                            result = new Date(now.getTime() + 2 * 60 * 60 * 1000);
                            break;
                        case 'in_30_min':
                            result = new Date(now.getTime() + 30 * 60 * 1000);
                            break;
                        case 'end_of_day':
                            result = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
                            break;
                        case 'custom_offset': {
                            const multipliers = { minutes: 60 * 1000, hours: 60 * 60 * 1000, days: 24 * 60 * 60 * 1000 };
                            const amount = config.offsetAmount || 1;
                            const unit = config.offsetUnit || 'hours';
                            result = new Date(now.getTime() + amount * (multipliers[unit] || 0));
                            break;
                        }
                        case 'fixed':
                            result = config.fixedDateTime ? new Date(config.fixedDateTime) : now;
                            break;
                        default:
                            result = now;
                    }

                    // Format as full ISO 8601 string for Google Calendar compatibility
                    const formattedDate = result.toISOString();
                    console.log(`[Runner] Constant datetime: ${config.datetimeOption} -> ${formattedDate}, targetField: ${config.targetField || 'none'}`);
                    return { success: true, output: formattedDate };
                }

                // Handle richtext with plaintext output format
                if (config.valueType === 'richtext' && config.outputFormat === 'plaintext') {
                    const plaintext = convertHtmlToPlaintext(config.value || '');
                    console.log(`[Runner] Constant richtext -> plaintext: ${plaintext.substring(0, 100)}...`);
                    return { success: true, output: plaintext };
                }

                return { success: true, output: config.value };
            }

            case 'condition': {
                const operator = config.operator || 'equals';
                const a = inputValues.valueA ?? config.valueA;
                const b = inputValues.valueB ?? config.valueB;
                const numA = parseFloat(a);
                const numB = parseFloat(b);

                let result = false;

                switch (operator) {
                    case 'equals': result = a == b; break;
                    case 'strictEquals': result = a === b; break;
                    case 'notEquals': result = a != b; break;
                    case 'greaterThan': result = numA > numB; break;
                    case 'lessThan': result = numA < numB; break;
                    case 'greaterOrEqual': result = numA >= numB; break;
                    case 'lessOrEqual': result = numA <= numB; break;
                    case 'contains': result = String(a).includes(String(b)); break;
                    case 'isEmpty': result = a === '' || a === null || a === undefined; break;
                    case 'isNotEmpty': result = a !== '' && a !== null && a !== undefined; break;
                    case 'isTrue': result = a === true || a === 'true' || a === 1 || a === '1'; break;
                    case 'isFalse': result = a === false || a === 'false' || a === 0 || a === '0'; break;
                    default: result = false;
                }

                console.log(`[Condition] ${a} ${operator} ${b} = ${result}`);

                return {
                    success: true,
                    conditionResult: result,
                    nextHandle: result ? 'true-source' : 'false-source',
                };
            }

            case 'branch':
                // Branch node passes through to ALL outputs
                return { success: true, output: inputValues.input, isBranch: true };

            case 'join':
                // Join node waits for inputs and passes through
                return { success: true, output: inputValues.input };

            case 'merge': {
                // Merge node collects all input values and concatenates them
                const separator = config.separator ?? '';
                const inputIds = node.data.inputs || ['input-1', 'input-2'];

                // Collect values from all connected inputs
                const incomingEdges = edges.filter((edge) => edge.target === node.id);
                const valuesBySlot = {};

                for (const edge of incomingEdges) {
                    const sourceNode = nodes.find((n) => n.id === edge.source);
                    if (sourceNode) {
                        const value = sourceNode.data.outputValue ?? sourceNode.data.config?.value ?? sourceNode.data.lastResponse;
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
                const sortedKeys = Object.keys(valuesBySlot).map(Number).sort((a, b) => a - b);
                const values = sortedKeys.map(key => valuesBySlot[key]);

                const mergedValue = values.join(separator);
                console.log(`[Runner] Merge node: ${values.length} inputs, separator: "${separator}", result: "${mergedValue}"`);

                return { success: true, output: mergedValue };
            }

            case 'template': {
                // Template node applies a template pattern with placeholders
                const templateStr = config.template || '';
                const inputIds = node.data.inputs || ['input-1', 'input-2'];

                // Collect values from all connected inputs
                const incomingEdges = edges.filter((edge) => edge.target === node.id);
                const valuesByIndex = {};

                for (const edge of incomingEdges) {
                    const sourceNode = nodes.find((n) => n.id === edge.source);
                    if (sourceNode) {
                        const value = sourceNode.data.outputValue ?? sourceNode.data.config?.value ?? sourceNode.data.lastResponse;
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
                    '${$1}'
                );

                // Replace ${inputN} placeholders with actual values
                const result = processedTemplate.replace(/\$\{input(\d+)\}/g, (match, num) => {
                    const value = valuesByIndex[parseInt(num)];
                    return value !== undefined ? String(value) : match;
                });

                console.log(`[Runner] Template node: values:`, valuesByIndex, `result length: ${result.length}`);

                return { success: true, output: result };
            }

            case 'apiAction': {
                if (!config.url) {
                    throw new Error('API Action requires a URL');
                }

                const { method = 'GET', url, requestBody = {}, headers = {}, responseMapping = [] } = config;

                const response = await fetch(url, {
                    method: method.toUpperCase(),
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        ...headers,
                    },
                    body: ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())
                        ? JSON.stringify(requestBody)
                        : undefined,
                });

                const data = await response.json();

                // Apply responseMapping to create _mapped object for dynamic field access
                if (responseMapping && responseMapping.length > 0 && data) {
                    const mapped = {};
                    responseMapping.forEach((mapping) => {
                        if (mapping.alias && mapping.path) {
                            const value = getNestedValue(data, mapping.path);
                            if (value !== undefined) {
                                mapped[mapping.alias] = value;
                            }
                        }
                    });
                    // Attach _mapped to the data object so downstream nodes can access it
                    if (Object.keys(mapped).length > 0) {
                        data._mapped = mapped;
                        console.log('[Runner] Applied responseMapping, _mapped:', mapped);
                    }
                }

                return { success: true, output: data };
            }

            case 'emailAction': {
                if (!config.template) {
                    throw new Error('Email Action requires a template');
                }
                if (!config.recipients || config.recipients.length === 0) {
                    throw new Error('Email Action requires at least one recipient');
                }

                const emailResponse = await fetch('/api/workflows/actions/email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
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
                    throw new Error(emailData.error || 'Failed to send email');
                }

                console.log('[Runner] Email sent successfully:', emailData);
                return { success: true, output: emailData };
            }

            case 'googleCalendarAction': {
                if (!teamId) {
                    throw new Error('Team ID is required for Google Calendar actions');
                }

                if (!config.operation) {
                    throw new Error('Google Calendar action requires an operation');
                }

                // Helper to check if value is a placeholder pattern
                const isPlaceholder = (val) => typeof val === 'string' && val.match(/\{\{\{.*?\}\}\}/);

                // Helper to get value, clearing placeholders
                const getValue = (inputVal, configVal) => {
                    if (inputVal !== undefined && inputVal !== null) return inputVal;
                    if (isPlaceholder(configVal)) return null; // Clear unreplaced placeholders
                    return configVal;
                };

                // Check if we have a connected Calendar event object (from previous Calendar node)
                // If so, extract the id for eventId
                let eventIdFromInput = inputValues.eventId;
                if (!eventIdFromInput && inputValues.input && typeof inputValues.input === 'object') {
                    // If input is a Calendar event object, extract the id
                    if (inputValues.input.id) {
                        eventIdFromInput = inputValues.input.id;
                        console.log('[Runner] Extracted eventId from connected Calendar node output:', eventIdFromInput);
                    }
                }

                // Get dynamic field configuration
                const dynamicFields = config.dynamicFields || {};
                const dynamicFieldPaths = config.dynamicFieldPaths || {};

                // Use input values from connected nodes if available, otherwise fall back to config
                // If the config value is a placeholder but no input provides it, use null (will get default on backend)
                let summary = getValue(inputValues.summary, config.summary);
                let description = getValue(inputValues.description, config.description);
                let location = getValue(inputValues.location, config.location);
                let startDateTime = getValue(inputValues.startDateTime, config.startDateTime);
                let endDateTime = getValue(inputValues.endDateTime, config.endDateTime);
                let attendees = getValue(inputValues.attendees, config.attendees);
                const eventId = getValue(eventIdFromInput, config.eventId);

                // Handle dynamic fields from connected action node (API, etc.)
                const inputData = inputValues.input;
                if (inputData && typeof inputData === 'object') {
                    // Summary
                    if (dynamicFields.summary) {
                        if (dynamicFieldPaths.summary) {
                            const extracted = getNestedValue(inputData, dynamicFieldPaths.summary);
                            if (extracted !== undefined) {
                                summary = typeof extracted === 'string' ? extracted : JSON.stringify(extracted);
                                console.log('[Runner] Using dynamic summary from path', dynamicFieldPaths.summary, ':', summary);
                            }
                        } else {
                            summary = inputData._mapped?.summary ?? inputData.summary ?? inputData.title ?? summary;
                        }
                    }
                    // Description
                    if (dynamicFields.description) {
                        if (dynamicFieldPaths.description) {
                            const extracted = getNestedValue(inputData, dynamicFieldPaths.description);
                            if (extracted !== undefined) {
                                description = typeof extracted === 'string' ? extracted : JSON.stringify(extracted, null, 2);
                                console.log('[Runner] Using dynamic description from path', dynamicFieldPaths.description);
                            }
                        } else {
                            description = inputData._mapped?.description ?? inputData.description ?? inputData.body ?? description;
                        }
                    }
                    // Location
                    if (dynamicFields.location) {
                        if (dynamicFieldPaths.location) {
                            const extracted = getNestedValue(inputData, dynamicFieldPaths.location);
                            if (extracted !== undefined) {
                                location = typeof extracted === 'string' ? extracted : JSON.stringify(extracted);
                            }
                        } else {
                            location = inputData._mapped?.location ?? inputData.location ?? location;
                        }
                    }
                }

                console.log('[Runner] Executing Google Calendar action:', config.operation, config.calendarId);
                console.log('[Runner] Dynamic fields:', JSON.stringify(dynamicFields), 'Paths:', JSON.stringify(dynamicFieldPaths));
                console.log('[Runner] Input values:', JSON.stringify(inputValues));
                console.log('[Runner] Final values - summary:', summary, 'startDateTime:', startDateTime, 'endDateTime:', endDateTime, 'eventId:', eventId);

                const calendarResponse = await fetch('/api/workflows/actions/google-calendar', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({
                        team_id: teamId,
                        operation: config.operation,
                        calendarId: config.calendarId || 'primary',
                        summary: summary,
                        description: description,
                        startDateTime: startDateTime,
                        endDateTime: endDateTime,
                        location: location,
                        attendees: attendees,
                        eventId: eventId,
                        timeMin: config.timeMin,
                        timeMax: config.timeMax,
                        maxResults: config.maxResults,
                    }),
                });

                const calendarData = await calendarResponse.json();

                if (!calendarResponse.ok || !calendarData.success) {
                    // Check for specific error codes
                    if (calendarData.errorCode === 'EVENT_NOT_FOUND') {
                        console.warn('[Runner] Event was deleted or not found:', calendarData.error);
                    }
                    throw new Error(calendarData.error || 'Failed to execute Google Calendar action');
                }

                console.log('[Runner] Google Calendar action completed:', calendarData);

                // Handle delete operation - return special marker
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

            case 'googleDocsAction': {
                if (!teamId) {
                    throw new Error('Team ID is required for Google Docs actions');
                }

                if (!config.operation) {
                    throw new Error('Google Docs action requires an operation');
                }

                // Helper to check if value is a placeholder pattern
                const isPlaceholder = (val) => typeof val === 'string' && val.match(/\{\{\{.*?\}\}\}/);

                // Helper to get value, clearing placeholders
                const getValue = (inputVal, configVal) => {
                    if (inputVal !== undefined && inputVal !== null) return inputVal;
                    if (isPlaceholder(configVal)) return null;
                    return configVal;
                };

                // Helper to get input data from specific source node or default input
                const getSourceData = (fieldConfig, defaultInput) => {
                    const pathConfig = getDynamicPath(fieldConfig);
                    if (!pathConfig) return defaultInput;

                    // If nodeId specified, look for that specific node's output in inputValues
                    if (pathConfig.nodeId) {
                        const sourceKey = `__node_${pathConfig.nodeId}`;
                        if (inputValues[sourceKey] !== undefined) {
                            return inputValues[sourceKey];
                        }
                    }
                    return defaultInput;
                };

                // Check if we have a connected Docs document object (from previous Docs node)
                let documentIdFromInput = inputValues.documentId;
                if (!documentIdFromInput && inputValues.input && typeof inputValues.input === 'object') {
                    if (inputValues.input.id) {
                        documentIdFromInput = inputValues.input.id;
                        console.log('[Runner] Extracted documentId from connected Docs node output:', documentIdFromInput);
                    }
                }

                // Get dynamic field configuration
                const dynamicFields = config.dynamicFields || {};
                const dynamicFieldPaths = config.dynamicFieldPaths || {};

                // Extract values using dynamic field paths from API response
                let title = getValue(inputValues.title, config.title);
                let content = getValue(inputValues.content, config.content);
                const documentId = getValue(documentIdFromInput, config.documentId);

                // Handle dynamic title from connected action node (API, Constant, etc.)
                if (dynamicFields.title) {
                    const titlePathConfig = getDynamicPath(dynamicFieldPaths.title);
                    const inputData = getSourceData(dynamicFieldPaths.title, inputValues.input);

                    if (inputData !== undefined && inputData !== null) {
                        if (typeof inputData === 'string') {
                            title = inputData;
                            console.log('[Runner] Using dynamic title from constant:', title);
                        } else if (typeof inputData === 'object') {
                            if (titlePathConfig?.path) {
                                const extracted = getNestedValue(inputData, titlePathConfig.path);
                                if (extracted !== undefined) {
                                    title = typeof extracted === 'string' ? extracted : JSON.stringify(extracted);
                                    console.log('[Runner] Using dynamic title from path', titlePathConfig.path, ':', title);
                                }
                            } else {
                                // Auto-detect common field names
                                title = inputData._mapped?.title ?? inputData.title ?? inputData.name ?? JSON.stringify(inputData);
                                console.log('[Runner] Using auto-detected dynamic title:', title);
                            }
                        }
                    }
                }

                // Handle dynamic content from connected action node (API, Constant, etc.)
                if (dynamicFields.content) {
                    const contentPathConfig = getDynamicPath(dynamicFieldPaths.content);
                    const inputData = getSourceData(dynamicFieldPaths.content, inputValues.input);

                    if (inputData !== undefined && inputData !== null) {
                        if (typeof inputData === 'string') {
                            content = inputData;
                            console.log('[Runner] Using dynamic content from constant');
                        } else if (typeof inputData === 'object') {
                            if (contentPathConfig?.path) {
                                const extracted = getNestedValue(inputData, contentPathConfig.path);
                                if (extracted !== undefined) {
                                    content = typeof extracted === 'string' ? extracted : JSON.stringify(extracted, null, 2);
                                    console.log('[Runner] Using dynamic content from path', contentPathConfig.path);
                                }
                            } else {
                                // Auto-detect common field names
                                content = inputData._mapped?.content ?? inputData.content ?? inputData.body ?? inputData.text ?? JSON.stringify(inputData, null, 2);
                                console.log('[Runner] Using auto-detected dynamic content');
                            }
                        }
                    }
                }

                console.log('[Runner] Executing Google Docs action:', config.operation);
                console.log('[Runner] Dynamic fields:', JSON.stringify(dynamicFields), 'Paths:', JSON.stringify(dynamicFieldPaths));
                console.log('[Runner] Input values:', JSON.stringify(inputValues));
                console.log('[Runner] Final values - title:', title, 'content:', content?.substring(0, 100), 'documentId:', documentId);

                const requestBodyExec = {
                    team_id: teamId,
                    operation: config.operation,
                    // Only include documentId if it's a non-empty string (required for read/update, not for create)
                    documentId: documentId && typeof documentId === 'string' ? documentId : undefined,
                    title: title,
                    content: content,
                    updateOperation: config.updateOperation,
                    searchText: config.searchText,
                    insertIndex: config.insertIndex,
                    maxResults: config.maxResults,
                };
                console.log('[Runner] Sending Google Docs request (executeNode):', requestBodyExec);

                const docsResponse = await fetch('/api/workflows/actions/google-docs', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify(requestBodyExec),
                });

                const docsData = await docsResponse.json();

                if (!docsResponse.ok || !docsData.success) {
                    console.error('[Runner] Google Docs action failed (executeNode):', docsResponse.status, docsData);
                    if (docsData.errorCode === 'DOCUMENT_NOT_FOUND') {
                        console.warn('[Runner] Document not found:', docsData.error);
                    }
                    const errorMsgExec = docsData.message || docsData.error || 'Failed to execute Google Docs action';
                    throw new Error(errorMsgExec);
                }

                console.log('[Runner] Google Docs action completed:', docsData);
                return { success: true, output: docsData.data };
            }

            default:
                // For other action types, simulate execution
                await new Promise((resolve) => setTimeout(resolve, 500));
                return { success: true, output: inputValues.input };
        }
    }, [getInputValues]);

    // Execute node with provided input values (for dependency-aware execution)
    const executeNodeWithInputs = useCallback(async (node, inputValues) => {
        const nodeType = node.data.type;
        const config = node.data.config || {};

        console.log(`[Runner] ExecuteNodeWithInputs ${nodeType}: ${node.data.label}`, inputValues);

        switch (nodeType) {
            case 'start':
                return { success: true, output: config.value || true };

            case 'end':
                return { success: true, finished: true };

            case 'constant': {
                // Handle datetime type - calculate value at runtime
                if (config.valueType === 'datetime') {
                    const now = new Date();
                    let result;

                    switch (config.datetimeOption) {
                        case 'now':
                            result = now;
                            break;
                        case 'today':
                            result = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
                            break;
                        case 'tomorrow':
                            result = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
                            break;
                        case 'next_week':
                            result = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                            break;
                        case 'next_month':
                            result = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                            break;
                        case 'in_1_hour':
                            result = new Date(now.getTime() + 60 * 60 * 1000);
                            break;
                        case 'in_2_hours':
                            result = new Date(now.getTime() + 2 * 60 * 60 * 1000);
                            break;
                        case 'in_30_min':
                            result = new Date(now.getTime() + 30 * 60 * 1000);
                            break;
                        case 'end_of_day':
                            result = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
                            break;
                        case 'custom_offset': {
                            const multipliers = { minutes: 60 * 1000, hours: 60 * 60 * 1000, days: 24 * 60 * 60 * 1000 };
                            const amount = config.offsetAmount || 1;
                            const unit = config.offsetUnit || 'hours';
                            result = new Date(now.getTime() + amount * (multipliers[unit] || 0));
                            break;
                        }
                        case 'fixed':
                            result = config.fixedDateTime ? new Date(config.fixedDateTime) : now;
                            break;
                        default:
                            result = now;
                    }

                    const formattedDate = result.toISOString();
                    console.log(`[Runner] Constant datetime: ${config.datetimeOption} -> ${formattedDate}, targetField: ${config.targetField || 'none'}`);
                    return { success: true, output: formattedDate };
                }

                // Handle richtext with plaintext output format
                if (config.valueType === 'richtext' && config.outputFormat === 'plaintext') {
                    const plaintext = convertHtmlToPlaintext(config.value || '');
                    console.log(`[Runner] Constant richtext -> plaintext: ${plaintext.substring(0, 100)}...`);
                    return { success: true, output: plaintext };
                }

                return { success: true, output: config.value };
            }

            case 'condition': {
                const operator = config.operator || 'equals';
                const a = inputValues.valueA ?? config.valueA;
                const b = inputValues.valueB ?? config.valueB;
                const numA = parseFloat(a);
                const numB = parseFloat(b);

                let result = false;

                switch (operator) {
                    case 'equals': result = a == b; break;
                    case 'notEquals': result = a != b; break;
                    case 'greaterThan': result = numA > numB; break;
                    case 'lessThan': result = numA < numB; break;
                    case 'greaterOrEqual': result = numA >= numB; break;
                    case 'lessOrEqual': result = numA <= numB; break;
                    case 'contains': result = String(a).includes(String(b)); break;
                    case 'isEmpty': result = !a || a === ''; break;
                    case 'isNotEmpty': result = a && a !== ''; break;
                    case 'isTrue': result = a === true || a === 'true'; break;
                    case 'isFalse': result = a === false || a === 'false'; break;
                    default: result = false;
                }

                console.log(`[Runner] Condition: ${a} ${operator} ${b} = ${result}`);

                return {
                    success: true,
                    output: result,
                    conditionResult: result,
                    nextHandle: result ? 'true-source' : 'false-source',
                };
            }

            case 'branch':
                return { success: true, output: inputValues.input };

            case 'join':
                return { success: true, output: inputValues.input };

            case 'merge': {
                // Merge node collects all input values and concatenates them
                // inputValues should have all the connected values keyed by their source
                const separator = config.separator ?? '';

                // Extract values from inputValues - they might be keyed by targetField or generic keys
                const values = [];
                Object.values(inputValues).forEach((val) => {
                    if (val !== undefined && val !== null) {
                        values.push(String(val));
                    }
                });

                const mergedValue = values.join(separator);
                console.log(`[Runner] Merge (with inputs): ${values.length} inputs, separator: "${separator}", result: "${mergedValue}"`);

                return { success: true, output: mergedValue };
            }

            case 'template': {
                // Template node applies a template pattern with placeholders
                const templateStr = config.template || '';

                // Extract values from inputValues - keyed by input index
                const valuesByIndex = {};
                Object.entries(inputValues).forEach(([key, val]) => {
                    // Input handles follow pattern like input-0, input-1, etc.
                    const match = key.match(/input-(\d+)/);
                    if (match) {
                        valuesByIndex[parseInt(match[1]) + 1] = val; // 1-indexed for ${input1}, ${input2}
                    } else if (key === 'input' && val !== undefined) {
                        valuesByIndex[1] = val; // Default single input
                    }
                });

                // Replace placeholders in template
                const result = templateStr.replace(/\$\{input(\d+)\}/g, (match, num) => {
                    const value = valuesByIndex[parseInt(num)];
                    return value !== undefined ? String(value) : match;
                });

                console.log(`[Runner] Template (with inputs): template="${templateStr}", values:`, valuesByIndex, `result: "${result}"`);

                return { success: true, output: result };
            }

            case 'googleCalendarAction': {
                if (!teamId) {
                    throw new Error('Team ID is required for Google Calendar actions');
                }

                if (!config.operation) {
                    throw new Error('Google Calendar action requires an operation');
                }

                // Helper to check if value is a placeholder pattern
                const isPlaceholder = (val) => typeof val === 'string' && val.match(/\{\{\{.*?\}\}\}/);

                // Helper to get value, clearing placeholders
                const getValue = (inputVal, configVal) => {
                    if (inputVal !== undefined && inputVal !== null) return inputVal;
                    if (isPlaceholder(configVal)) return null; // Clear unreplaced placeholders
                    return configVal;
                };

                // Check if we have a connected Calendar event object (from previous Calendar node)
                // If so, extract the id for eventId
                let eventIdFromInput = inputValues.eventId;
                if (!eventIdFromInput && inputValues.input && typeof inputValues.input === 'object') {
                    // If input is a Calendar event object, extract the id
                    if (inputValues.input.id) {
                        eventIdFromInput = inputValues.input.id;
                        console.log('[Runner] Extracted eventId from connected Calendar node output:', eventIdFromInput);
                    }
                }

                // Get dynamic field configuration
                const dynamicFields = config.dynamicFields || {};
                const dynamicFieldPaths = config.dynamicFieldPaths || {};

                // Use input values from connected nodes if available, otherwise fall back to config
                // If the config value is a placeholder but no input provides it, use null (will get default on backend)
                let summary = getValue(inputValues.summary, config.summary);
                let description = getValue(inputValues.description, config.description);
                let location = getValue(inputValues.location, config.location);
                let startDateTime = getValue(inputValues.startDateTime, config.startDateTime);
                let endDateTime = getValue(inputValues.endDateTime, config.endDateTime);
                let attendees = getValue(inputValues.attendees, config.attendees);
                const eventId = getValue(eventIdFromInput, config.eventId);

                // Handle dynamic fields from connected action node (API, etc.)
                const inputData = inputValues.input;
                if (inputData && typeof inputData === 'object') {
                    // Summary
                    if (dynamicFields.summary) {
                        if (dynamicFieldPaths.summary) {
                            const extracted = getNestedValue(inputData, dynamicFieldPaths.summary);
                            if (extracted !== undefined) {
                                summary = typeof extracted === 'string' ? extracted : JSON.stringify(extracted);
                                console.log('[Runner] Using dynamic summary from path', dynamicFieldPaths.summary, ':', summary);
                            }
                        } else {
                            summary = inputData._mapped?.summary ?? inputData.summary ?? inputData.title ?? summary;
                        }
                    }
                    // Description
                    if (dynamicFields.description) {
                        if (dynamicFieldPaths.description) {
                            const extracted = getNestedValue(inputData, dynamicFieldPaths.description);
                            if (extracted !== undefined) {
                                description = typeof extracted === 'string' ? extracted : JSON.stringify(extracted, null, 2);
                                console.log('[Runner] Using dynamic description from path', dynamicFieldPaths.description);
                            }
                        } else {
                            description = inputData._mapped?.description ?? inputData.description ?? inputData.body ?? description;
                        }
                    }
                    // Location
                    if (dynamicFields.location) {
                        if (dynamicFieldPaths.location) {
                            const extracted = getNestedValue(inputData, dynamicFieldPaths.location);
                            if (extracted !== undefined) {
                                location = typeof extracted === 'string' ? extracted : JSON.stringify(extracted);
                            }
                        } else {
                            location = inputData._mapped?.location ?? inputData.location ?? location;
                        }
                    }
                }

                console.log('[Runner] ExecuteNodeWithInputs Google Calendar - dynamicFields:', JSON.stringify(dynamicFields), 'Paths:', JSON.stringify(dynamicFieldPaths));
                console.log('[Runner] Input values:', JSON.stringify(inputValues));
                console.log('[Runner] Final values - summary:', summary, 'startDateTime:', startDateTime, 'endDateTime:', endDateTime, 'eventId:', eventId);

                const calendarResponse = await fetch('/api/workflows/actions/google-calendar', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({
                        team_id: teamId,
                        operation: config.operation,
                        calendarId: config.calendarId || 'primary',
                        summary: summary,
                        description: description,
                        startDateTime: startDateTime,
                        endDateTime: endDateTime,
                        location: location,
                        attendees: attendees,
                        eventId: eventId,
                        timeMin: config.timeMin,
                        timeMax: config.timeMax,
                        maxResults: config.maxResults,
                    }),
                });

                const calendarData = await calendarResponse.json();

                if (!calendarResponse.ok || !calendarData.success) {
                    // Check for specific error codes
                    if (calendarData.errorCode === 'EVENT_NOT_FOUND') {
                        console.warn('[Runner] Event was deleted or not found:', calendarData.error);
                    }
                    throw new Error(calendarData.error || 'Failed to execute Google Calendar action');
                }

                console.log('[Runner] Google Calendar action completed:', calendarData);

                // Handle delete operation - return special marker
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

            case 'googleDocsAction': {
                if (!teamId) {
                    throw new Error('Team ID is required for Google Docs actions');
                }

                if (!config.operation) {
                    throw new Error('Google Docs action requires an operation');
                }

                // Helper to check if value is a placeholder pattern
                const isPlaceholder = (val) => typeof val === 'string' && val.match(/\{\{\{.*?\}\}\}/);

                // Helper to get value, clearing placeholders
                const getValue = (inputVal, configVal) => {
                    if (inputVal !== undefined && inputVal !== null) return inputVal;
                    if (isPlaceholder(configVal)) return null;
                    return configVal;
                };

                // Helper to get input data from specific source node or default input
                const getSourceData = (fieldConfig, defaultInput) => {
                    const pathConfig = getDynamicPath(fieldConfig);
                    if (!pathConfig) return defaultInput;

                    // If nodeId specified, look for that specific node's output in inputValues
                    if (pathConfig.nodeId) {
                        const sourceKey = `__node_${pathConfig.nodeId}`;
                        if (inputValues[sourceKey] !== undefined) {
                            return inputValues[sourceKey];
                        }
                    }
                    return defaultInput;
                };

                // Check if we have a connected Docs document object (from previous Docs node)
                let documentIdFromInput = inputValues.documentId;
                if (!documentIdFromInput && inputValues.input && typeof inputValues.input === 'object') {
                    if (inputValues.input.id) {
                        documentIdFromInput = inputValues.input.id;
                        console.log('[Runner] Extracted documentId from connected Docs node output:', documentIdFromInput);
                    }
                }

                // Get dynamic field configuration
                const dynamicFields = config.dynamicFields || {};
                const dynamicFieldPaths = config.dynamicFieldPaths || {};

                // Extract values using dynamic field paths from API response
                let title = getValue(inputValues.title, config.title);
                let content = getValue(inputValues.content, config.content);
                const documentId = getValue(documentIdFromInput, config.documentId);

                // Handle dynamic title from connected action node (API, Constant, etc.)
                if (dynamicFields.title) {
                    const titlePathConfig = getDynamicPath(dynamicFieldPaths.title);
                    const inputData = getSourceData(dynamicFieldPaths.title, inputValues.input);

                    if (inputData !== undefined && inputData !== null) {
                        if (typeof inputData === 'string') {
                            title = inputData;
                            console.log('[Runner] Using dynamic title from constant:', title);
                        } else if (typeof inputData === 'object') {
                            if (titlePathConfig?.path) {
                                const extracted = getNestedValue(inputData, titlePathConfig.path);
                                if (extracted !== undefined) {
                                    title = typeof extracted === 'string' ? extracted : JSON.stringify(extracted);
                                    console.log('[Runner] Using dynamic title from path', titlePathConfig.path, ':', title);
                                }
                            } else {
                                // Auto-detect common field names
                                title = inputData._mapped?.title ?? inputData.title ?? inputData.name ?? JSON.stringify(inputData);
                                console.log('[Runner] Using auto-detected dynamic title:', title);
                            }
                        }
                    }
                }

                // Handle dynamic content from connected action node (API, Constant, etc.)
                if (dynamicFields.content) {
                    const contentPathConfig = getDynamicPath(dynamicFieldPaths.content);
                    const inputData = getSourceData(dynamicFieldPaths.content, inputValues.input);

                    if (inputData !== undefined && inputData !== null) {
                        if (typeof inputData === 'string') {
                            content = inputData;
                            console.log('[Runner] Using dynamic content from constant');
                        } else if (typeof inputData === 'object') {
                            if (contentPathConfig?.path) {
                                const extracted = getNestedValue(inputData, contentPathConfig.path);
                                if (extracted !== undefined) {
                                    content = typeof extracted === 'string' ? extracted : JSON.stringify(extracted, null, 2);
                                    console.log('[Runner] Using dynamic content from path', contentPathConfig.path);
                                }
                            } else {
                                // Auto-detect common field names
                                content = inputData._mapped?.content ?? inputData.content ?? inputData.body ?? inputData.text ?? JSON.stringify(inputData, null, 2);
                                console.log('[Runner] Using auto-detected dynamic content');
                            }
                        }
                    }
                }

                console.log('[Runner] ExecuteNodeWithInputs Google Docs - dynamicFields:', JSON.stringify(dynamicFields), 'Paths:', JSON.stringify(dynamicFieldPaths));
                console.log('[Runner] Input values:', JSON.stringify(inputValues));
                console.log('[Runner] Final values - title:', title, 'content:', content?.substring(0, 100), 'documentId:', documentId);

                const requestBody = {
                    team_id: teamId,
                    operation: config.operation,
                    // Only include documentId if it's a non-empty string (required for read/update, not for create)
                    documentId: documentId && typeof documentId === 'string' ? documentId : undefined,
                    title: title,
                    content: content,
                    updateOperation: config.updateOperation,
                    searchText: config.searchText,
                    insertIndex: config.insertIndex,
                    maxResults: config.maxResults,
                };
                console.log('[Runner] Sending Google Docs request:', requestBody);

                const docsResponse = await fetch('/api/workflows/actions/google-docs', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify(requestBody),
                });

                const docsData = await docsResponse.json();

                if (!docsResponse.ok || !docsData.success) {
                    console.error('[Runner] Google Docs action failed:', docsResponse.status, docsData);
                    if (docsData.errorCode === 'DOCUMENT_NOT_FOUND') {
                        console.warn('[Runner] Document not found:', docsData.error);
                    }
                    // For validation errors (422), show the detailed message
                    const errorMessage = docsData.message || docsData.error || 'Failed to execute Google Docs action';
                    throw new Error(errorMessage);
                }

                console.log('[Runner] Google Docs action completed:', docsData);
                return { success: true, output: docsData.data };
            }

            case 'apiAction': {
                if (!config.url) {
                    throw new Error('API Action requires a URL');
                }

                const { method = 'GET', url, requestBody = {}, headers = {}, responseMapping = [] } = config;

                const response = await fetch(url, {
                    method: method.toUpperCase(),
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        ...headers,
                    },
                    body: ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())
                        ? JSON.stringify(requestBody)
                        : undefined,
                });

                const data = await response.json();

                // Apply responseMapping to create _mapped object for dynamic field access
                if (responseMapping && responseMapping.length > 0 && data) {
                    const mapped = {};
                    responseMapping.forEach((mapping) => {
                        if (mapping.alias && mapping.path) {
                            const value = getNestedValue(data, mapping.path);
                            if (value !== undefined) {
                                mapped[mapping.alias] = value;
                            }
                        }
                    });
                    if (Object.keys(mapped).length > 0) {
                        data._mapped = mapped;
                        console.log('[Runner] Applied responseMapping (executeNodeWithInputs), _mapped:', mapped);
                    }
                }

                return { success: true, output: data };
            }

            default:
                await new Promise((resolve) => setTimeout(resolve, 500));
                return { success: true, output: inputValues.input };
        }
    }, [teamId]);

    // Execute a single node with its dependencies (recursive helper)
    // nodeOutputs is a Map that stores outputs synchronously during execution
    const executeNodeWithDependencies = useCallback(async (node, visited, executedNodes, nodeOutputs) => {
        // Skip if already executed in this run
        if (executedNodes.has(node.id)) {
            console.log(`[Runner] Node ${node.id} already executed, skipping`);
            return nodeOutputs.get(node.id);
        }

        // Find all incoming edges (input dependencies)
        const incomingEdges = edges.filter((edge) => edge.target === node.id);

        // Execute all input dependencies first (but not start nodes or nodes in the main flow)
        for (const edge of incomingEdges) {
            const sourceNode = nodes.find((n) => n.id === edge.source);
            if (sourceNode && !executedNodes.has(sourceNode.id) && sourceNode.data.type !== 'start') {
                console.log(`[Runner] Executing input dependency ${sourceNode.id} (${sourceNode.data.type}) for ${node.id}`);
                await executeNodeWithDependencies(sourceNode, visited, executedNodes, nodeOutputs);
            }
        }

        // Now execute this node
        if (!executedNodes.has(node.id)) {
            executedNodes.add(node.id);

            setCurrentNodeId(node.id);
            setExecutionPath((prev) => [...prev, node.id]);
            updateNodeStatus(node.id, 'loading');

            await new Promise((resolve) => setTimeout(resolve, 300));

            try {
                // Build input values from nodeOutputs (synchronous map) instead of React state
                const inputValues = {};
                incomingEdges.forEach((edge) => {
                    const sourceNode = nodes.find((n) => n.id === edge.source);
                    if (sourceNode) {
                        // Get output from our synchronous map, or fall back to config
                        const value = nodeOutputs.get(sourceNode.id) ?? sourceNode.data.config?.value;
                        const targetField = sourceNode.data.config?.targetField;

                        console.log(`[executeNodeWithDependencies] Source ${sourceNode.id} output:`, value, 'targetField:', targetField);

                        // Store by node ID for multi-source selection (allows getSourceData to find specific nodes)
                        inputValues[`__node_${sourceNode.id}`] = value;

                        if (targetField) {
                            inputValues[targetField] = value;
                        } else if (edge.targetHandle === 'input-a') {
                            inputValues.valueA = value;
                        } else if (edge.targetHandle === 'input-b') {
                            inputValues.valueB = value;
                        } else if (edge.targetHandle === 'start-input') {
                            inputValues.startDateTime = value;
                        } else if (edge.targetHandle === 'end-input') {
                            inputValues.endDateTime = value;
                        } else {
                            inputValues.input = value;
                        }
                    }
                });

                console.log(`[executeNodeWithDependencies] Input values for ${node.id}:`, inputValues);

                // Execute with the computed input values
                const result = await executeNodeWithInputs(node, inputValues);

                // Store output in our synchronous map
                nodeOutputs.set(node.id, result.output);

                if (result.finished) {
                    updateNodeStatus(node.id, 'success');
                    console.log('[Runner] Branch completed at end node:', node.id);
                    return { finished: true };
                }

                // Update node with result (for UI purposes)
                updateNodeStatus(node.id, 'success', {
                    outputValue: result.output,
                    conditionResult: result.conditionResult,
                    lastResponse: result.output,
                });

                return result;
            } catch (error) {
                console.error('[Runner] Node execution error:', error);
                updateNodeStatus(node.id, 'error', {
                    lastError: error.message,
                });
                throw error;
            }
        }
        return nodeOutputs.get(node.id);
    }, [nodes, edges, executeNodeWithInputs, updateNodeStatus, setCurrentNodeId, setExecutionPath]);

    // Run the entire workflow
    const runWorkflow = useCallback(async () => {
        if (isRunning) return;

        const startNodes = findStartNodes();
        if (startNodes.length === 0) {
            alert('No Start node found! Add a Start node to run the workflow.');
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
                updateNodeStatus(node.id, 'loading');

                // Delay for visual effect - let the edge animation play
                await new Promise((resolve) => setTimeout(resolve, 800));

                try {
                    // For non-start nodes, ensure input dependencies are executed first
                    if (node.data.type !== 'start' && !executedNodes.has(node.id)) {
                        await executeNodeWithDependencies(node, visited, executedNodes, nodeOutputs);
                        // The node was already executed in executeNodeWithDependencies
                    } else {
                        // Execute start nodes or already visited nodes normally
                        executedNodes.add(node.id);
                        const result = await executeNode(node);

                        // Store output in nodeOutputs map
                        nodeOutputs.set(node.id, result.output);

                        if (result.finished) {
                            updateNodeStatus(node.id, 'success');
                            console.log('[Runner] Branch completed at end node:', node.id);
                            continue;
                        }

                        // Update node with result
                        updateNodeStatus(node.id, 'success', {
                            outputValue: result.output,
                            conditionResult: result.conditionResult,
                            lastResponse: result.output,
                        });
                    }

                    // Find next nodes based on condition result (get updated node data)
                    const updatedNode = nodes.find(n => n.id === node.id);
                    let sourceHandle = null;
                    if (updatedNode?.data?.conditionResult !== undefined) {
                        sourceHandle = updatedNode.data.conditionResult ? 'true-source' : 'false-source';
                    }

                    const nextNodes = findNextNodes(node.id, sourceHandle);

                    console.log(`[Runner] Node ${node.id} (${node.data.type}) - sourceHandle: ${sourceHandle}, nextNodes:`, nextNodes);

                    for (const { nodeId, edge } of nextNodes) {
                        const nextNode = nodes.find((n) => n.id === nodeId);
                        console.log(`[Runner] Checking nextNode ${nodeId}:`, nextNode ? `found (visited: ${visited.has(nextNode.id)})` : 'NOT FOUND');
                        if (nextNode && !visited.has(nextNode.id)) {
                            queue.push({ node: nextNode, fromEdge: edge });
                        }
                    }

                } catch (error) {
                    console.error('[Runner] Node execution error:', error);
                    updateNodeStatus(node.id, 'error', {
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
