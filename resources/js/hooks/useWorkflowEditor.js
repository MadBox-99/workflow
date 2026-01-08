import { useCallback, useState, useEffect } from 'react';
import { useNodesState, useEdgesState, addEdge, useReactFlow } from '@xyflow/react';
import { nodeTypeConfig } from '@/constants/workflowConstants';
import { getLayoutedElements } from '@/utils/elkLayout';
import axios from 'axios';

// Map data types to React Flow node types
const getReactFlowNodeType = (dataType) => {
    if (dataType === 'googleCalendarAction') return 'googleCalendar';
    const actionTypes = ['apiAction', 'emailAction', 'databaseAction', 'scriptAction', 'webhookAction', 'action'];
    if (actionTypes.includes(dataType)) return 'action';
    if (['start', 'end', 'condition', 'constant', 'branch', 'join'].includes(dataType)) return dataType;
    return 'action'; // fallback
};

// Get default node dimensions based on type
const getNodeDimensions = (nodeType) => {
    switch (nodeType) {
        case 'condition':
            return { width: 120, height: 120 };
        case 'start':
        case 'end':
            return { width: 120, height: 50 };
        case 'constant':
            return { width: 140, height: 60 };
        case 'branch':
        case 'join':
            return { width: 220, height: 70 };
        case 'googleCalendar':
            return { width: 240, height: 80 };
        default:
            return { width: 180, height: 70 };
    }
};

export const useWorkflowEditor = (initialNodes = [], initialEdges = []) => {
    const { screenToFlowPosition } = useReactFlow();
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [selectedNode, setSelectedNode] = useState(null);
    const [selectedEdge, setSelectedEdge] = useState(null);
    const [nodeLabel, setNodeLabel] = useState('');
    const [nodeDescription, setNodeDescription] = useState('');
    const [nodeConfig, setNodeConfig] = useState('');
    const [colorMode, setColorMode] = useState(
        document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    );
    const [snapToGrid, setSnapToGrid] = useState(true);

    const handleNodeDelete = useCallback((nodeId) => {
        setNodes((nds) => nds.filter((node) => node.id !== nodeId));
        setEdges((eds) =>
            eds.filter(
                (edge) => edge.source !== nodeId && edge.target !== nodeId
            )
        );
        setSelectedNode(null);
    }, [setNodes, setEdges]);

    // Update branch node outputs
    const handleUpdateOutputs = useCallback((nodeId, outputs) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === nodeId) {
                    return {
                        ...node,
                        data: { ...node.data, outputs },
                    };
                }
                return node;
            })
        );
    }, [setNodes]);

    // Update join node inputs
    const handleUpdateInputs = useCallback((nodeId, inputs) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === nodeId) {
                    return {
                        ...node,
                        data: { ...node.data, inputs },
                    };
                }
                return node;
            })
        );
    }, [setNodes]);

    const handleNodeTrigger = useCallback(async (nodeId, nodeData) => {
        console.log('Node trigger event:', nodeId, nodeData);

        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === nodeId) {
                    return {
                        ...node,
                        data: { ...node.data, status: 'loading' },
                    };
                }
                return node;
            })
        );

        try {
            const nodeType = nodeData.type;

            // Handle different action node types
            switch (nodeType) {
                case 'action':
                    // Backwards compatibility: old 'action' nodes with actionType config
                    console.log('[Legacy Action] Old action node detected - treating as API Action');
                    if (nodeData.config && nodeData.config.url) {
                        const { method = 'POST', url, requestBody = {}, headers = {} } = nodeData.config;

                        console.log(`[Legacy API Action] Making ${method} request to ${url}`);

                        const config = {
                            method: method.toLowerCase(),
                            url: url,
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json',
                                ...headers,
                            },
                        };

                        // Add data for POST, PUT, PATCH requests
                        if (['post', 'put', 'patch'].includes(method.toLowerCase())) {
                            config.data = requestBody;
                        }

                        const response = await axios(config);

                        setNodes((nds) =>
                            nds.map((node) => {
                                if (node.id === nodeId) {
                                    return {
                                        ...node,
                                        data: {
                                            ...node.data,
                                            status: 'success',
                                            lastResponse: response.data,
                                        },
                                    };
                                }
                                return node;
                            })
                        );
                        console.log('[Legacy API Action] Success:', response.data);
                    } else {
                        console.log('[Legacy Action] Please update this node to use new action types (API Action, Email Action, etc.)');
                        throw new Error('Legacy action node - please update to new action types');
                    }
                    break;

                case 'apiAction':
                    if (nodeData.config && nodeData.config.url) {
                        const { method = 'POST', url, requestBody = {}, headers = {} } = nodeData.config;

                        console.log(`[API Action] Making ${method} request to ${url}`);

                        const config = {
                            method: method.toLowerCase(),
                            url: url,
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json',
                                ...headers,
                            },
                        };

                        // Add data for POST, PUT, PATCH requests
                        if (['post', 'put', 'patch'].includes(method.toLowerCase())) {
                            config.data = requestBody;
                        }

                        const response = await axios(config);

                        setNodes((nds) =>
                            nds.map((node) => {
                                if (node.id === nodeId) {
                                    return {
                                        ...node,
                                        data: {
                                            ...node.data,
                                            status: 'success',
                                            lastResponse: response.data,
                                        },
                                    };
                                }
                                return node;
                            })
                        );
                        console.log('[API Action] Success:', response.data);
                    } else {
                        throw new Error('API Action requires a URL');
                    }
                    break;

                case 'emailAction':
                    if (nodeData.config) {
                        const { template, recipients = [], subject, customData = {} } = nodeData.config;

                        console.log(`[Email Action] Sending email with template: ${template}`);
                        console.log(`[Email Action] Recipients:`, recipients);

                        // TODO: Implement actual email sending via Laravel backend
                        // For now, simulate the action
                        const emailPayload = {
                            template,
                            recipients,
                            subject,
                            data: customData,
                        };

                        // Simulate API call to backend
                        const response = await axios.post('/api/workflows/actions/email', emailPayload);

                        setNodes((nds) =>
                            nds.map((node) => {
                                if (node.id === nodeId) {
                                    return {
                                        ...node,
                                        data: {
                                            ...node.data,
                                            status: 'success',
                                            lastResponse: response.data,
                                        },
                                    };
                                }
                                return node;
                            })
                        );
                        console.log('[Email Action] Success:', response.data);
                    } else {
                        throw new Error('Email Action requires configuration');
                    }
                    break;

                case 'databaseAction':
                    console.log('[Database Action] Not yet implemented');
                    throw new Error('Database action is not yet implemented');

                case 'scriptAction':
                    console.log('[Script Action] Not yet implemented');
                    throw new Error('Script action is not yet implemented');

                case 'webhookAction':
                    console.log('[Webhook Action] Not yet implemented');
                    throw new Error('Webhook action is not yet implemented');

                case 'condition':
                    {
                        const config = nodeData.config || {};
                        const { operator = 'equals', valueA, valueB } = config;

                        console.log(`[Condition] Evaluating: ${valueA} ${operator} ${valueB}`);

                        let result = false;

                        // Convert values for comparison
                        const a = valueA;
                        const b = valueB;
                        const numA = parseFloat(a);
                        const numB = parseFloat(b);

                        switch (operator) {
                            case 'equals':
                                result = a == b;
                                break;
                            case 'strictEquals':
                                result = a === b;
                                break;
                            case 'notEquals':
                                result = a != b;
                                break;
                            case 'greaterThan':
                                result = numA > numB;
                                break;
                            case 'lessThan':
                                result = numA < numB;
                                break;
                            case 'greaterOrEqual':
                                result = numA >= numB;
                                break;
                            case 'lessOrEqual':
                                result = numA <= numB;
                                break;
                            case 'contains':
                                result = String(a).includes(String(b));
                                break;
                            case 'isEmpty':
                                result = a === '' || a === null || a === undefined;
                                break;
                            case 'isNotEmpty':
                                result = a !== '' && a !== null && a !== undefined;
                                break;
                            case 'isTrue':
                                result = a === true || a === 'true' || a === 1 || a === '1';
                                break;
                            case 'isFalse':
                                result = a === false || a === 'false' || a === 0 || a === '0';
                                break;
                            default:
                                result = false;
                        }

                        console.log(`[Condition] Result: ${result ? 'TRUE ✓' : 'FALSE ✗'}`);

                        setNodes((nds) =>
                            nds.map((node) => {
                                if (node.id === nodeId) {
                                    return {
                                        ...node,
                                        data: {
                                            ...node.data,
                                            status: 'success',
                                            conditionResult: result,
                                            lastEvaluation: { valueA: a, valueB: b, operator, result },
                                        },
                                    };
                                }
                                return node;
                            })
                        );
                    }
                    break;

                default:
                    // Fallback for non-action nodes (start, constant, end)
                    console.log(`[${nodeType}] Node triggered (no action logic)`);
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                    setNodes((nds) =>
                        nds.map((node) => {
                            if (node.id === nodeId) {
                                return {
                                    ...node,
                                    data: { ...node.data, status: 'success' },
                                };
                            }
                            return node;
                        })
                    );
                    break;
            }
        } catch (error) {
            setNodes((nds) =>
                nds.map((node) => {
                    if (node.id === nodeId) {
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                status: 'error',
                                lastError: error.response?.data || error.message,
                            },
                        };
                    }
                    return node;
                })
            );
            console.error('Failed to execute action:', error.response?.data || error.message);
        }
    }, [setNodes]);

    useEffect(() => {
        setNodes((nds) =>
            nds.map((node) => ({
                ...node,
                data: {
                    ...node.data,
                    onTrigger: handleNodeTrigger,
                    onDelete: handleNodeDelete,
                    onUpdateOutputs: handleUpdateOutputs,
                    onUpdateInputs: handleUpdateInputs,
                    status: node.data.status || 'initial',
                },
            }))
        );
    }, [handleNodeTrigger, handleNodeDelete, handleUpdateOutputs, handleUpdateInputs, setNodes]);

    useEffect(() => {
        const observer = new MutationObserver(() => {
            const isDark = document.documentElement.classList.contains('dark');
            setColorMode(isDark ? 'dark' : 'light');
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });

        return () => observer.disconnect();
    }, []);

    const onConnect = useCallback(
        (params) => {
            console.log('=== New Connection ===');
            console.log('Source Node:', params.source, '| Handle:', params.sourceHandle);
            console.log('Target Node:', params.target, '| Handle:', params.targetHandle);

            setEdges((eds) => {
                const oppositeConnectionIndex = eds.findIndex(edge =>
                    edge.source === params.target && edge.target === params.source
                );

                if (oppositeConnectionIndex !== -1) {
                    console.log('Reversing existing connection direction');
                    const newEdges = eds.filter((_, index) => index !== oppositeConnectionIndex);
                    return addEdge(params, newEdges);
                }

                const duplicateExists = eds.some(edge =>
                    edge.source === params.source && edge.target === params.target
                );

                if (duplicateExists) {
                    console.log('Duplicate connection - ignoring');
                    return eds;
                }

                // Check if the specific target handle already has a connection
                const targetHandleHasInput = eds.some(edge =>
                    edge.target === params.target && edge.targetHandle === params.targetHandle
                );

                if (targetHandleHasInput) {
                    console.log('Target handle already has an incoming connection');
                    alert('This input already has a connection.');
                    return eds;
                }

                return addEdge(params, eds);
            });
        },
        [setEdges]
    );

    const onDragStart = useCallback((event, nodeType) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    }, []);

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback((event) => {
        event.preventDefault();

        const dataType = event.dataTransfer.getData('application/reactflow');
        if (!dataType) return;

        const position = screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
        });

        const nodeTypeInfo = nodeTypeConfig[dataType];
        const reactFlowType = getReactFlowNodeType(dataType);
        const dimensions = getNodeDimensions(dataType);

        // Set default outputs/inputs for branch/join nodes
        const nodeData = {
            label: `${nodeTypeInfo.label} Node`,
            type: dataType,
            description: '',
            config: {},
            status: 'initial',
            onTrigger: handleNodeTrigger,
            onDelete: handleNodeDelete,
            onUpdateOutputs: handleUpdateOutputs,
            onUpdateInputs: handleUpdateInputs,
        };

        // Add default outputs for branch nodes
        if (dataType === 'branch') {
            nodeData.outputs = ['output-1', 'output-2'];
        }

        // Add default inputs for join nodes
        if (dataType === 'join') {
            nodeData.inputs = ['input-1', 'input-2'];
        }

        const newNode = {
            id: `node-${Date.now()}`,
            type: reactFlowType,
            position,
            data: nodeData,
            style: dimensions,
        };

        setNodes((nds) => [...nds, newNode]);
    }, [screenToFlowPosition, setNodes, handleNodeTrigger, handleNodeDelete, handleUpdateOutputs, handleUpdateInputs]);

    const onNodeClick = useCallback((event, node) => {
        setSelectedNode(node);
        setSelectedEdge(null);
        setNodeLabel(node.data.label || '');
        setNodeDescription(node.data.description || '');
        setNodeConfig(JSON.stringify(node.data.config || {}, null, 2));
    }, []);

    const onEdgeClick = useCallback((event, edge) => {
        setSelectedEdge(edge);
        setSelectedNode(null);
    }, []);

    const updateSelectedNode = useCallback(() => {
        if (!selectedNode) return;

        let parsedConfig = {};
        try {
            parsedConfig = JSON.parse(nodeConfig || '{}');
        } catch (e) {
            alert('Invalid JSON in configuration');
            return;
        }

        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === selectedNode.id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            label: nodeLabel,
                            description: nodeDescription,
                            config: parsedConfig,
                        },
                    };
                }
                return node;
            })
        );
    }, [selectedNode, nodeLabel, nodeDescription, nodeConfig, setNodes]);

    const deleteSelectedNode = useCallback(() => {
        if (!selectedNode) return;

        setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
        setEdges((eds) =>
            eds.filter(
                (edge) =>
                    edge.source !== selectedNode.id && edge.target !== selectedNode.id
            )
        );
        setSelectedNode(null);
    }, [selectedNode, setNodes, setEdges]);

    const deleteSelectedEdge = useCallback(() => {
        if (!selectedEdge) return;
        setEdges((eds) => eds.filter((edge) => edge.id !== selectedEdge.id));
        setSelectedEdge(null);
    }, [selectedEdge, setEdges]);

    const deleteNodeConnections = useCallback(() => {
        if (!selectedNode) return;

        setEdges((eds) =>
            eds.filter(
                (edge) =>
                    edge.source !== selectedNode.id && edge.target !== selectedNode.id
            )
        );
    }, [selectedNode, setEdges]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Delete' || event.key === 'Backspace') {
                // Don't trigger when typing in input fields
                if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
                    return;
                }

                event.preventDefault();

                // Priority: delete selected node first, then edge
                if (selectedNode) {
                    deleteSelectedNode();
                } else if (selectedEdge) {
                    deleteSelectedEdge();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedNode, selectedEdge, deleteSelectedNode, deleteSelectedEdge]);

    const handleSave = useCallback((onSave) => {
        const workflowData = {
            nodes: nodes.map((node) => ({
                id: node.id,
                type: node.data.type || 'action',
                position: node.position,
                data: node.data,
            })),
            connections: edges.map((edge) => ({
                id: edge.id,
                source: edge.source,
                target: edge.target,
                sourceHandle: edge.sourceHandle,
                targetHandle: edge.targetHandle,
            })),
        };
        onSave(workflowData);
    }, [nodes, edges]);

    const toggleSnapToGrid = useCallback(() => {
        setSnapToGrid((prev) => !prev);
    }, []);

    const autoLayoutNodes = useCallback(async () => {
        if (nodes.length === 0) return;

        try {
            const { nodes: layoutedNodes } = await getLayoutedElements(nodes, edges, 'DOWN');
            setNodes(layoutedNodes);
        } catch (error) {
            console.error('Auto-layout failed:', error);
        }
    }, [nodes, edges, setNodes]);

    return {
        nodes,
        edges,
        setNodes,
        setEdges,
        selectedNode,
        selectedEdge,
        nodeLabel,
        nodeDescription,
        nodeConfig,
        colorMode,
        snapToGrid,
        onNodesChange,
        onEdgesChange,
        onConnect,
        onDragStart,
        onDragOver,
        onDrop,
        onNodeClick,
        onEdgeClick,
        setSelectedNode,
        setSelectedEdge,
        setNodeLabel,
        setNodeDescription,
        setNodeConfig,
        updateSelectedNode,
        deleteSelectedNode,
        deleteSelectedEdge,
        deleteNodeConnections,
        handleSave,
        toggleSnapToGrid,
        autoLayoutNodes,
        handleNodeTrigger,
        handleNodeDelete,
        handleUpdateOutputs,
        handleUpdateInputs,
    };
};
