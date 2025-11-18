import React, { useState, useEffect } from 'react';

const ConstantNodeConfig = ({ config, onChange }) => {
    const [valueType, setValueType] = useState(config.valueType || 'string');
    const [value, setValue] = useState(config.value !== undefined ? config.value : '');

    useEffect(() => {
        onChange({
            valueType,
            value: convertValue(value, valueType),
        });
    }, [valueType, value]);

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

    const handleValueChange = (e) => {
        setValue(e.target.value);
    };

    const handleTypeChange = (e) => {
        const newType = e.target.value;
        setValueType(newType);

        // Convert current value to new type
        if (newType === 'number' && isNaN(parseFloat(value))) {
            setValue('0');
        } else if (newType === 'boolean') {
            setValue('false');
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
                    <option value="number">Number</option>
                    <option value="boolean">Boolean (True/False)</option>
                </select>
            </div>

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

            <div className="bg-white dark:bg-gray-800 p-3 rounded border border-purple-300 dark:border-purple-600">
                <p className="text-xs font-medium text-purple-900 dark:text-purple-300 mb-1">
                    Current Value:
                </p>
                <p className="text-sm text-purple-800 dark:text-purple-400 font-mono break-all">
                    {valueType === 'string' && `"${value}"`}
                    {valueType === 'number' && convertValue(value, 'number')}
                    {valueType === 'boolean' && String(convertValue(value, 'boolean'))}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Type: <span className="font-semibold">{valueType}</span>
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
