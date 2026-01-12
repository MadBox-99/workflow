import React, { useState, useEffect, useMemo } from 'react';
import { getFieldsForNodeTypes } from '@/constants/nodeInputFields';
import RichTextEditor from '@/components/ui/RichTextEditor';

const DATETIME_OPTIONS = [
    { value: 'now', label: 'Now (current time)', description: 'Current date and time' },
    { value: 'today', label: 'Today (start of day)', description: "Today at 00:00" },
    { value: 'tomorrow', label: 'Tomorrow (start of day)', description: "Tomorrow at 00:00" },
    { value: 'next_week', label: 'Next week', description: '7 days from now' },
    { value: 'next_month', label: 'Next month', description: '30 days from now' },
    { value: 'in_1_hour', label: 'In 1 hour', description: '1 hour from now' },
    { value: 'in_2_hours', label: 'In 2 hours', description: '2 hours from now' },
    { value: 'in_30_min', label: 'In 30 minutes', description: '30 minutes from now' },
    { value: 'end_of_day', label: 'End of day', description: "Today at 23:59" },
    { value: 'custom_offset', label: 'Custom offset...', description: 'Set custom offset' },
    { value: 'fixed', label: 'Fixed date/time', description: 'Specific date and time' },
];

const ConstantNodeConfig = ({ config, onChange, connectedNodeTypes = [], nodes = [], currentNodeId = null }) => {
    // Dynamically get available fields based on connected node types
    const availableFields = useMemo(
        () => getFieldsForNodeTypes(connectedNodeTypes),
        [connectedNodeTypes]
    );
    const hasRelevantConnection = availableFields.length > 0;

    // Build available nodes for mention in RichTextEditor (exclude current node)
    const availableNodesForMention = useMemo(() => {
        return nodes
            .filter(node => node.id !== currentNodeId && node.data?.type !== 'end')
            .map(node => ({
                id: node.id,
                label: node.data?.label || node.id,
                type: node.data?.type,
                color: node.data?.type === 'constant' ? '#8b5cf6' :
                       node.data?.type === 'start' ? '#22c55e' :
                       node.data?.type === 'googleCalendarAction' ? '#4285f4' :
                       node.data?.type === 'googleDocsAction' ? '#4285f4' :
                       '#6b7280',
            }));
    }, [nodes, currentNodeId]);
    const [valueType, setValueType] = useState(config.valueType || 'string');
    const [value, setValue] = useState(config.value !== undefined ? config.value : '');
    const [datetimeOption, setDatetimeOption] = useState(config.datetimeOption || 'now');
    const [offsetAmount, setOffsetAmount] = useState(config.offsetAmount || 1);
    const [offsetUnit, setOffsetUnit] = useState(config.offsetUnit || 'hours');
    const [fixedDateTime, setFixedDateTime] = useState(config.fixedDateTime || '');
    const [targetField, setTargetField] = useState(config.targetField || '');

    // Sync local state with config prop when it changes (e.g., selecting a different node)
    useEffect(() => {
        setValueType(config.valueType || 'string');
        setValue(config.value !== undefined ? config.value : '');
        setDatetimeOption(config.datetimeOption || 'now');
        setOffsetAmount(config.offsetAmount || 1);
        setOffsetUnit(config.offsetUnit || 'hours');
        setFixedDateTime(config.fixedDateTime || '');
        setTargetField(config.targetField || '');
    }, [config]);

    useEffect(() => {
        const configData = {
            valueType,
            value: convertValue(value, valueType),
            targetField,
        };

        if (valueType === 'datetime') {
            configData.datetimeOption = datetimeOption;
            if (datetimeOption === 'custom_offset') {
                configData.offsetAmount = offsetAmount;
                configData.offsetUnit = offsetUnit;
            }
            if (datetimeOption === 'fixed') {
                configData.fixedDateTime = fixedDateTime;
            }
        }

        onChange(configData);
    }, [valueType, value, datetimeOption, offsetAmount, offsetUnit, fixedDateTime, targetField]);

    const convertValue = (val, type) => {
        if (type === 'number') {
            const num = parseFloat(val);
            return isNaN(num) ? 0 : num;
        }
        if (type === 'boolean') {
            return val === 'true' || val === true;
        }
        return String(val);
    };

    const getDatetimePreview = () => {
        const now = new Date();
        let result;

        switch (datetimeOption) {
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
                result = new Date(now.getTime() + offsetAmount * (multipliers[offsetUnit] || 0));
                break;
            }
            case 'fixed':
                result = fixedDateTime ? new Date(fixedDateTime) : now;
                break;
            default:
                result = now;
        }

        return result.toLocaleString('hu-HU', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleValueChange = (e) => {
        setValue(e.target.value);
    };

    const handleTypeChange = (e) => {
        const newType = e.target.value;
        const oldType = valueType;
        setValueType(newType);

        // Convert current value to new type
        if (newType === 'number' && isNaN(parseFloat(value))) {
            setValue('0');
        } else if (newType === 'boolean') {
            setValue('false');
        } else if (newType === 'datetime') {
            setDatetimeOption('now');
        } else if (newType === 'richtext' && oldType === 'string') {
            // Wrap plain text in paragraph if switching from string to richtext
            if (value && !value.startsWith('<')) {
                setValue(`<p>${value}</p>`);
            }
        } else if (newType === 'string' && oldType === 'richtext') {
            // Strip HTML tags when switching from richtext to string
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = value;
            setValue(tempDiv.textContent || tempDiv.innerText || '');
        }
    };

    return (
        <div className="space-y-4">
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded p-3">
                <h5 className="font-semibold text-sm text-purple-800 dark:text-purple-400 mb-2">
                    Constant Value Configuration
                </h5>
                <p className="text-xs text-purple-600 dark:text-purple-500">
                    Define a constant value that can be used in your workflow
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Value Type
                </label>
                <select
                    value={valueType}
                    onChange={handleTypeChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                    <option value="string">Text (String)</option>
                    <option value="richtext">Rich Text (HTML)</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean (True/False)</option>
                    <option value="datetime">Date/Time (Dynamic)</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Target Field {!hasRelevantConnection && <span className="text-xs text-gray-400">(connect to a node first)</span>}
                </label>
                {hasRelevantConnection ? (
                    <>
                        <div className="mb-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded text-xs text-green-700 dark:text-green-400">
                            Connected to: <strong>{availableFields.map(f => f.label).join(', ')}</strong> - select which field to populate
                        </div>
                        <select
                            value={targetField}
                            onChange={(e) => setTargetField(e.target.value)}
                            className="w-full px-3 py-2 border border-green-300 dark:border-green-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="">-- Select target field --</option>
                            {/* Dynamically show fields for all connected node types */}
                            {availableFields.map((nodeConfig) => (
                                <optgroup key={nodeConfig.nodeType} label={nodeConfig.label}>
                                    {nodeConfig.fields.map((field) => (
                                        <option key={field.value} value={field.value}>
                                            {field.label}
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </>
                ) : (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-sm text-gray-500 dark:text-gray-400">
                        Connect this node to an action (Calendar, Email, API, etc.) to see available target fields.
                    </div>
                )}
            </div>

            {valueType === 'datetime' ? (
                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                            Date/Time Value
                        </label>
                        <select
                            value={datetimeOption}
                            onChange={(e) => setDatetimeOption(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            {DATETIME_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {DATETIME_OPTIONS.find((o) => o.value === datetimeOption)?.description}
                        </p>
                    </div>

                    {datetimeOption === 'custom_offset' && (
                        <div className="flex gap-2">
                            <input
                                type="number"
                                value={offsetAmount}
                                onChange={(e) => setOffsetAmount(parseInt(e.target.value) || 1)}
                                min="1"
                                className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                            <select
                                value={offsetUnit}
                                onChange={(e) => setOffsetUnit(e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="minutes">Minutes from now</option>
                                <option value="hours">Hours from now</option>
                                <option value="days">Days from now</option>
                            </select>
                        </div>
                    )}

                    {datetimeOption === 'fixed' && (
                        <input
                            type="datetime-local"
                            value={fixedDateTime}
                            onChange={(e) => setFixedDateTime(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    )}
                </div>
            ) : (
                <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Value
                    </label>
                    {valueType === 'boolean' ? (
                        <select
                            value={String(value)}
                            onChange={(e) => setValue(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="true">True</option>
                            <option value="false">False</option>
                        </select>
                    ) : valueType === 'number' ? (
                        <input
                            type="number"
                            value={value}
                            onChange={handleValueChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Enter a number"
                            step="any"
                        />
                    ) : valueType === 'richtext' ? (
                        <RichTextEditor
                            value={value}
                            onChange={setValue}
                            placeholder="Enter formatted content... Type @ to reference other nodes"
                            availableNodes={availableNodesForMention}
                        />
                    ) : (
                        <textarea
                            value={value}
                            onChange={handleValueChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Enter text value"
                            rows="3"
                        />
                    )}
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 p-3 rounded border border-purple-300 dark:border-purple-600">
                <p className="text-xs font-medium text-purple-900 dark:text-purple-300 mb-1">
                    {valueType === 'datetime' ? 'Preview (calculated at runtime):' : 'Current Value:'}
                </p>
                {valueType === 'richtext' ? (
                    <div
                        className="text-sm text-purple-800 dark:text-purple-400 prose prose-sm dark:prose-invert max-w-none [&_*]:my-1"
                        dangerouslySetInnerHTML={{ __html: value || '<em>Empty</em>' }}
                    />
                ) : (
                    <p className="text-sm text-purple-800 dark:text-purple-400 font-mono break-all">
                        {valueType === 'string' && `"${value}"`}
                        {valueType === 'number' && convertValue(value, 'number')}
                        {valueType === 'boolean' && String(convertValue(value, 'boolean'))}
                        {valueType === 'datetime' && getDatetimePreview()}
                    </p>
                )}
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Type: <span className="font-semibold">{valueType}</span>
                    {valueType === 'datetime' && datetimeOption !== 'fixed' && (
                        <span className="ml-2 text-green-600 dark:text-green-400">(dynamic - recalculated each run)</span>
                    )}
                    {valueType === 'richtext' && (
                        <span className="ml-2 text-blue-600 dark:text-blue-400">(HTML formatted)</span>
                    )}
                </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded p-2">
                <p className="text-xs text-blue-800 dark:text-blue-400">
                    <strong>💡 Tip:</strong> This constant value can be referenced by other nodes in your workflow.
                </p>
            </div>
        </div>
    );
};

export default ConstantNodeConfig;
