import React, { useState, useEffect, useRef } from 'react';

const SEPARATOR_PRESETS = [
    { value: '', label: 'No separator', description: 'Join values directly' },
    { value: ' ', label: 'Space', description: 'Join with single space' },
    { value: ', ', label: 'Comma + space', description: 'Join with comma and space' },
    { value: '\n', label: 'New line', description: 'Join with line breaks' },
    { value: ' - ', label: 'Dash', description: 'Join with dash' },
    { value: ' | ', label: 'Pipe', description: 'Join with pipe' },
    { value: 'custom', label: 'Custom...', description: 'Enter custom separator' },
];

const MergeNodeConfig = ({ config, onChange, inputs = [], onInputsChange }) => {
    const [separator, setSeparator] = useState(config.separator ?? '');
    const [separatorType, setSeparatorType] = useState('preset');
    const [customSeparator, setCustomSeparator] = useState('');
    const isInitialMount = useRef(true);
    const lastConfigRef = useRef(config);

    // Sync with config on mount
    useEffect(() => {
        // Skip if config reference is the same (no external change)
        if (lastConfigRef.current === config && !isInitialMount.current) {
            return;
        }
        lastConfigRef.current = config;

        const configSeparator = config.separator ?? '';
        const isPreset = SEPARATOR_PRESETS.some(p => p.value === configSeparator && p.value !== 'custom');

        if (isPreset) {
            setSeparatorType('preset');
            setSeparator(configSeparator);
        } else if (configSeparator) {
            setSeparatorType('custom');
            setCustomSeparator(configSeparator);
            setSeparator(configSeparator);
        }
    }, [config]);

    // Notify parent of changes - but skip on initial mount
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const finalSeparator = separatorType === 'custom' ? customSeparator : separator;
        onChange({ separator: finalSeparator });
    }, [separator, separatorType, customSeparator]);

    const handleSeparatorChange = (e) => {
        const value = e.target.value;
        if (value === 'custom') {
            setSeparatorType('custom');
            setSeparator(customSeparator);
        } else {
            setSeparatorType('preset');
            setSeparator(value);
        }
    };

    const handleCustomSeparatorChange = (e) => {
        const value = e.target.value;
        setCustomSeparator(value);
        setSeparator(value);
    };

    const addInput = () => {
        if (onInputsChange) {
            const newInputs = [...inputs, `input-${inputs.length + 1}`];
            onInputsChange(newInputs);
        }
    };

    const removeInput = (index) => {
        if (onInputsChange && inputs.length > 2) {
            const newInputs = inputs.filter((_, i) => i !== index);
            onInputsChange(newInputs);
        }
    };

    // Preview of merge result
    const getPreview = () => {
        const finalSeparator = separatorType === 'custom' ? customSeparator : separator;
        const exampleValues = inputs.map((_, i) => `Value ${i + 1}`);
        return exampleValues.join(finalSeparator);
    };

    return (
        <div className="space-y-4">
            <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700 rounded p-3">
                <h5 className="font-semibold text-sm text-teal-800 dark:text-teal-400 mb-2">
                    Merge Node Configuration
                </h5>
                <p className="text-xs text-teal-600 dark:text-teal-500">
                    Combine multiple input values into a single output
                </p>
            </div>

            {/* Input handles management */}
            <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Input Connections ({inputs.length})
                </label>
                <div className="space-y-2">
                    {inputs.map((inputId, index) => (
                        <div
                            key={inputId}
                            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                        >
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                Input {index + 1}
                            </span>
                            {inputs.length > 2 && (
                                <button
                                    onClick={() => removeInput(index)}
                                    className="text-red-500 hover:text-red-700 text-xs px-2 py-1"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                <button
                    onClick={addInput}
                    className="mt-2 w-full px-3 py-2 text-sm text-teal-600 dark:text-teal-400 border border-teal-300 dark:border-teal-600 rounded hover:bg-teal-50 dark:hover:bg-teal-900/30"
                >
                    + Add Input
                </button>
            </div>

            {/* Separator selection */}
            <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Separator
                </label>
                <select
                    value={separatorType === 'custom' ? 'custom' : separator}
                    onChange={handleSeparatorChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                    {SEPARATOR_PRESETS.map((preset) => (
                        <option key={preset.value} value={preset.value}>
                            {preset.label}
                        </option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {SEPARATOR_PRESETS.find(p =>
                        separatorType === 'custom' ? p.value === 'custom' : p.value === separator
                    )?.description}
                </p>
            </div>

            {/* Custom separator input */}
            {separatorType === 'custom' && (
                <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Custom Separator
                    </label>
                    <input
                        type="text"
                        value={customSeparator}
                        onChange={handleCustomSeparatorChange}
                        placeholder="Enter custom separator"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                </div>
            )}

            {/* Preview */}
            <div className="bg-white dark:bg-gray-800 p-3 rounded border border-teal-300 dark:border-teal-600">
                <p className="text-xs font-medium text-teal-900 dark:text-teal-300 mb-1">
                    Preview:
                </p>
                <p className="text-sm text-teal-800 dark:text-teal-400 font-mono break-all whitespace-pre-wrap">
                    "{getPreview()}"
                </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded p-2">
                <p className="text-xs text-blue-800 dark:text-blue-400">
                    <strong>Tip:</strong> Connect Constant nodes or other nodes to the inputs.
                    Values will be merged in order from left to right.
                </p>
            </div>
        </div>
    );
};

export default MergeNodeConfig;
