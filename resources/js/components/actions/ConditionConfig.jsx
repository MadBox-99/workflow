import React, { useMemo, useCallback } from 'react';

const OPERATORS = [
    { value: 'equals', label: 'Equals (==)', symbol: '=', description: 'Loose equality comparison' },
    { value: 'strictEquals', label: 'Strict Equals (===)', symbol: '===', description: 'Strict equality comparison' },
    { value: 'notEquals', label: 'Not Equals (!=)', symbol: '≠', description: 'Loose inequality comparison' },
    { value: 'greaterThan', label: 'Greater Than (>)', symbol: '>', description: 'A is greater than B' },
    { value: 'lessThan', label: 'Less Than (<)', symbol: '<', description: 'A is less than B' },
    { value: 'greaterOrEqual', label: 'Greater or Equal (>=)', symbol: '≥', description: 'A is greater than or equal to B' },
    { value: 'lessOrEqual', label: 'Less or Equal (<=)', symbol: '≤', description: 'A is less than or equal to B' },
    { value: 'contains', label: 'Contains', symbol: '∈', description: 'A contains B (string or array)' },
    { value: 'isEmpty', label: 'Is Empty', symbol: '∅', description: 'A is empty (ignores B)' },
    { value: 'isNotEmpty', label: 'Is Not Empty', symbol: '∃', description: 'A is not empty (ignores B)' },
    { value: 'isTrue', label: 'Is Truthy', symbol: '?T', description: 'A is truthy (ignores B)' },
    { value: 'isFalse', label: 'Is Falsy', symbol: '?F', description: 'A is falsy (ignores B)' },
];

const ConditionConfig = ({ config, onChange, nodeId, nodes, edges }) => {
    const operator = config.operator || 'equals';
    const passWhen = config.passWhen || 'true';
    const defaultValueA = config.defaultValueA || '';
    const defaultValueB = config.defaultValueB || '';

    const updateConfig = useCallback((updates) => {
        onChange({
            operator,
            passWhen,
            defaultValueA,
            defaultValueB,
            ...updates,
        });
    }, [onChange, operator, passWhen, defaultValueA, defaultValueB]);

    // Get connected input nodes
    const connectedInputs = useMemo(() => {
        if (!edges || !nodes) return { inputA: null, inputB: null };

        const inputAEdge = edges.find(e => e.target === nodeId && e.targetHandle === 'input-a');
        const inputBEdge = edges.find(e => e.target === nodeId && e.targetHandle === 'input-b');

        const inputANode = inputAEdge ? nodes.find(n => n.id === inputAEdge.source) : null;
        const inputBNode = inputBEdge ? nodes.find(n => n.id === inputBEdge.source) : null;

        return {
            inputA: inputANode ? { id: inputANode.id, label: inputANode.data?.label || inputANode.id } : null,
            inputB: inputBNode ? { id: inputBNode.id, label: inputBNode.data?.label || inputBNode.id } : null,
        };
    }, [edges, nodes, nodeId]);

    const selectedOperator = OPERATORS.find(op => op.value === operator);
    const isUnaryOperator = ['isEmpty', 'isNotEmpty', 'isTrue', 'isFalse'].includes(operator);

    return (
        <div className="space-y-4">
            {/* Operator Selection */}
            <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                    Operator
                </label>
                <select
                    value={operator}
                    onChange={(e) => updateConfig({ operator: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                    {OPERATORS.map(op => (
                        <option key={op.value} value={op.value}>
                            {op.label}
                        </option>
                    ))}
                </select>
                {selectedOperator && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {selectedOperator.description}
                    </p>
                )}
            </div>

            {/* Pass When Selection */}
            <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                    Continue to output when
                </label>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => updateConfig({ passWhen: 'true' })}
                        className={`flex-1 px-4 py-2.5 rounded-lg border-2 transition-all font-medium text-sm ${
                            passWhen === 'true'
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400'
                        }`}
                    >
                        <span className="block text-lg mb-0.5">✓</span>
                        Condition is TRUE
                    </button>
                    <button
                        type="button"
                        onClick={() => updateConfig({ passWhen: 'false' })}
                        className={`flex-1 px-4 py-2.5 rounded-lg border-2 transition-all font-medium text-sm ${
                            passWhen === 'false'
                                ? 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400'
                        }`}
                    >
                        <span className="block text-lg mb-0.5">✗</span>
                        Condition is FALSE
                    </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                    The workflow will only continue to connected nodes when this condition is met.
                </p>
            </div>

            {/* Connected Inputs Display */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded p-3">
                <h5 className="font-medium text-sm text-amber-800 dark:text-amber-400 mb-2">
                    Connected Inputs
                </h5>
                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">A:</span>
                        {connectedInputs.inputA ? (
                            <span className="text-gray-700 dark:text-gray-300">
                                {connectedInputs.inputA.label}
                            </span>
                        ) : (
                            <span className="text-gray-400 dark:text-gray-500 italic">
                                Not connected
                            </span>
                        )}
                    </div>
                    {!isUnaryOperator && (
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-purple-600 dark:text-purple-400 font-semibold">B:</span>
                            {connectedInputs.inputB ? (
                                <span className="text-gray-700 dark:text-gray-300">
                                    {connectedInputs.inputB.label}
                                </span>
                            ) : (
                                <span className="text-gray-400 dark:text-gray-500 italic">
                                    Not connected
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Default Values */}
            <div className="space-y-3">
                <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                        Default Value for A
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                            (if not connected)
                        </span>
                    </label>
                    <input
                        type="text"
                        value={defaultValueA}
                        onChange={(e) => updateConfig({ defaultValueA: e.target.value })}
                        placeholder="Leave empty to require connection"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                </div>

                {!isUnaryOperator && (
                    <div>
                        <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                            Default Value for B
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                                (if not connected)
                            </span>
                        </label>
                        <input
                            type="text"
                            value={defaultValueB}
                            onChange={(e) => updateConfig({ defaultValueB: e.target.value })}
                            placeholder="Leave empty to require connection"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                )}
            </div>

            {/* Condition Preview */}
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded p-3">
                <h5 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">
                    Condition Preview
                </h5>
                <div className="font-mono text-lg text-center py-2 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                    <span className="text-blue-600 dark:text-blue-400">A</span>
                    <span className="mx-2 text-amber-600 dark:text-amber-400">
                        {selectedOperator?.symbol || '?'}
                    </span>
                    {!isUnaryOperator && (
                        <span className="text-purple-600 dark:text-purple-400">B</span>
                    )}
                </div>
            </div>

            {/* Output Description */}
            <div className="bg-gray-100 dark:bg-gray-700 rounded p-3 text-sm">
                <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${passWhen === 'true' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="text-gray-700 dark:text-gray-300">
                        Continues when condition is <strong>{passWhen.toUpperCase()}</strong>
                    </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    The output can be connected to multiple nodes - all will receive the result when the condition passes.
                </p>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded p-2">
                <p className="text-xs text-blue-800 dark:text-blue-400">
                    <strong>Tip:</strong> Connect constant or action outputs to inputs A and B.
                    When the condition matches your "pass when" setting, the workflow continues to connected nodes.
                </p>
            </div>
        </div>
    );
};

export default ConditionConfig;
