import { useCallback, useState } from 'react';

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

        incomingEdges.forEach((edge) => {
            const sourceNode = nodes.find((n) => n.id === edge.source);
            if (sourceNode) {
                // Get the output value from the source node
                const value = sourceNode.data.outputValue ?? sourceNode.data.config?.value ?? sourceNode.data.lastResponse;

                // Check if source node has a targetField configured (for Constant nodes targeting Calendar fields)
                const targetField = sourceNode.data.config?.targetField;

                if (targetField) {
                    // Use the targetField as the key (e.g., 'summary', 'startDateTime', 'endDateTime', etc.)
                    values[targetField] = value;
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

                    // Format as ISO string for Google Calendar compatibility
                    const formattedDate = result.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"
                    console.log(`[Runner] Constant datetime: ${config.datetimeOption} -> ${formattedDate}`);
                    return { success: true, output: formattedDate };
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

            case 'apiAction': {
                if (!config.url) {
                    throw new Error('API Action requires a URL');
                }

                const { method = 'GET', url, requestBody = {}, headers = {} } = config;

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

                // Use input values from connected nodes if available, otherwise fall back to config
                // This allows dynamic values from Constant nodes with targetField set
                const summary = inputValues.summary || config.summary;
                const description = inputValues.description || config.description;
                const location = inputValues.location || config.location;
                const startDateTime = inputValues.startDateTime || config.startDateTime;
                const endDateTime = inputValues.endDateTime || config.endDateTime;
                const attendees = inputValues.attendees || config.attendees;
                const eventId = inputValues.eventId || config.eventId;

                console.log('[Runner] Executing Google Calendar action:', config);
                console.log('[Runner] Dynamic values from inputs:', inputValues);

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
                    throw new Error(calendarData.error || 'Failed to execute Google Calendar action');
                }

                console.log('[Runner] Google Calendar action completed:', calendarData);
                return { success: true, output: calendarData.data };
            }

            default:
                // For other action types, simulate execution
                await new Promise((resolve) => setTimeout(resolve, 500));
                return { success: true, output: inputValues.input };
        }
    }, [getInputValues]);

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
                    const result = await executeNode(node);

                    if (result.finished) {
                        updateNodeStatus(node.id, 'success');
                        console.log('[Runner] Branch completed at end node:', node.id);
                        // Continue processing other branches instead of breaking
                        continue;
                    }

                    // Update node with result
                    updateNodeStatus(node.id, 'success', {
                        outputValue: result.output,
                        conditionResult: result.conditionResult,
                        lastResponse: result.output,
                    });

                    // Find next nodes based on condition result
                    let sourceHandle = null;
                    if (result.nextHandle) {
                        // For condition nodes, use the appropriate handle
                        sourceHandle = result.conditionResult ? 'true-source' : 'false-source';
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
