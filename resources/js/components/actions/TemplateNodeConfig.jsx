import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import RichTextEditor from "../ui/RichTextEditor";
import { getFieldsForNodeTypes } from "@/constants/nodeInputFields";

// Modal component for full-screen editing
const TemplateEditorModal = ({ isOpen, onClose, value, onChange, availableNodes, inputLabels }) => {
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
        if (isOpen) {
            setLocalValue(value);
        }
    }, [isOpen, value]);

    const handleSave = () => {
        onChange(localValue);
        onClose();
    };

    const handleKeyDown = (e) => {
        // Stop ALL keyboard events from propagating to React Flow
        // This prevents Delete/Backspace from deleting the node while editing
        e.stopPropagation();

        if (e.key === "Escape") {
            onClose();
        }
    };

    if (!isOpen) return null;

    // Get preview text
    const getPreviewText = () => {
        if (!localValue) return "";
        // Convert mentions to placeholders then strip HTML
        const withPlaceholders = localValue.replace(
            /<span[^>]*data-type="mention"[^>]*data-id="(input\d+)"[^>]*>[^<]*<\/span>/g,
            (_, id) => `\${${id}}`,
        );
        const plainText = withPlaceholders.replace(/<[^>]*>/g, "");
        return plainText.replace(/\$\{input(\d+)\}/g, (_, num) => {
            const label = inputLabels[parseInt(num) - 1] || `Input ${num}`;
            return `[${label}]`;
        });
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={onClose}
            onKeyDown={handleKeyDown}
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[90vw] max-w-4xl max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Edit Template
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6 space-y-4">
                    <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-700 rounded p-3">
                        <p className="text-sm text-sky-700 dark:text-sky-400">
                            Type{" "}
                            <kbd className="px-1.5 py-0.5 bg-sky-100 dark:bg-sky-800 rounded text-xs font-mono">
                                @
                            </kbd>{" "}
                            to insert input placeholders. Use the toolbar to format your text with
                            bold, italic, lists, and more.
                        </p>
                    </div>

                    <RichTextEditor
                        value={localValue}
                        onChange={setLocalValue}
                        placeholder="Type @ to insert input values..."
                        availableNodes={availableNodes}
                    />

                    {/* Preview */}
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                            Preview (with example values):
                        </p>
                        <p className="text-sm text-gray-800 dark:text-gray-200">
                            {getPreviewText() || (
                                <em className="text-gray-400">No template defined</em>
                            )}
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

const TemplateNodeConfig = ({
    config,
    onChange,
    inputs = [],
    onInputsChange,
    connectedNodeTypes = [],
}) => {
    const [template, setTemplate] = useState(config.template || "");
    const [inputLabels, setInputLabels] = useState(config.inputLabels || []);
    const [targetField, setTargetField] = useState(config.targetField || "");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const isInitialMount = useRef(true);
    const lastConfigRef = useRef(null);

    // Get available target fields based on connected node types
    const availableFields = useMemo(
        () => getFieldsForNodeTypes(connectedNodeTypes),
        [connectedNodeTypes],
    );
    const hasRelevantConnection = availableFields.length > 0;

    // Normalize inputs - they can be strings like 'input-1' or objects
    const normalizeInputs = useCallback((inputArr) => {
        return (inputArr || []).map((inp, i) => {
            if (typeof inp === "string") {
                return inp;
            }
            return inp.id || `input-${i + 1}`;
        });
    }, []);

    const normalizedInputs = normalizeInputs(inputs);

    // Build available nodes for the @mention feature in RichTextEditor
    const availableNodes = useMemo(() => {
        return normalizedInputs.map((input, i) => ({
            id: `input${i + 1}`,
            label: inputLabels[i] || `Input ${i + 1}`,
            type: "input",
            color: "#0ea5e9", // sky color
        }));
    }, [normalizedInputs, inputLabels]);

    // Initialize labels on mount or when inputs length changes
    useEffect(() => {
        setInputLabels((prev) => {
            const newLabels = [...prev];
            // Ensure we have enough labels
            while (newLabels.length < normalizedInputs.length) {
                newLabels.push(`Input ${newLabels.length + 1}`);
            }
            // Trim excess labels
            if (newLabels.length > normalizedInputs.length) {
                return newLabels.slice(0, normalizedInputs.length);
            }
            return newLabels;
        });
    }, [normalizedInputs.length]);

    // Sync from config only when config actually changes from outside
    useEffect(() => {
        const configKey = JSON.stringify({
            template: config.template,
            inputLabels: config.inputLabels,
            targetField: config.targetField,
        });
        if (lastConfigRef.current === configKey) {
            return;
        }
        lastConfigRef.current = configKey;

        if (config.template !== undefined) {
            setTemplate(config.template || "");
        }
        if (config.inputLabels && Array.isArray(config.inputLabels)) {
            setInputLabels(config.inputLabels);
        }
        if (config.targetField !== undefined) {
            setTargetField(config.targetField || "");
        }
    }, [config]);

    // Notify parent of changes - but skip on initial mount
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const newConfig = {
            template,
            inputLabels,
            targetField,
        };
        const configKey = JSON.stringify(newConfig);
        if (lastConfigRef.current !== configKey) {
            lastConfigRef.current = configKey;
            onChange(newConfig);
        }
    }, [template, inputLabels, targetField, onChange]);

    const handleAddInput = useCallback(() => {
        if (!onInputsChange) return;
        const newInputId = `input-${normalizedInputs.length + 1}`;
        const newInputs = [...normalizedInputs, newInputId];
        // Update labels locally to match
        setInputLabels((prev) => [...prev, `Input ${newInputs.length}`]);
        onInputsChange(newInputs);
    }, [normalizedInputs, onInputsChange]);

    const handleRemoveInput = useCallback(
        (index) => {
            if (!onInputsChange) return;
            if (normalizedInputs.length <= 2) return; // Minimum 2 inputs
            const newInputs = normalizedInputs.filter((_, i) => i !== index);
            setInputLabels((prev) => prev.filter((_, i) => i !== index));
            onInputsChange(newInputs);
        },
        [normalizedInputs, onInputsChange],
    );

    const handleLabelChange = useCallback((index, label) => {
        setInputLabels((prev) => {
            const newLabels = [...prev];
            newLabels[index] = label;
            return newLabels;
        });
    }, []);

    // Get preview text - strip HTML and show placeholder values
    const getPreviewText = useCallback(() => {
        if (!template) return "";
        // First convert mentions to placeholders
        const withPlaceholders = template.replace(
            /<span[^>]*data-type="mention"[^>]*data-id="(input\d+)"[^>]*>[^<]*<\/span>/g,
            (_, id) => `\${${id}}`,
        );
        // Strip HTML tags
        const plainText = withPlaceholders.replace(/<[^>]*>/g, "");
        // Replace placeholders with example values
        return plainText.replace(/\$\{input(\d+)\}/g, (_, num) => {
            const label = inputLabels[parseInt(num) - 1] || `Input ${num}`;
            return `[${label}]`;
        });
    }, [template, inputLabels]);

    return (
        <div className="space-y-4">
            <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-700 rounded p-3">
                <h5 className="font-semibold text-sm text-sky-800 dark:text-sky-400 mb-2">
                    Template Configuration
                </h5>
                <p className="text-xs text-sky-600 dark:text-sky-500">
                    Combine multiple inputs into a single output using rich text
                </p>
            </div>

            {/* Inputs configuration */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Inputs ({normalizedInputs.length})
                    </label>
                    <button
                        type="button"
                        onClick={handleAddInput}
                        className="text-xs px-2 py-1 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 rounded hover:bg-sky-200 dark:hover:bg-sky-900/50 transition-colors"
                    >
                        + Add Input
                    </button>
                </div>
                <div className="space-y-2">
                    {normalizedInputs.map((input, i) => (
                        <div key={`${input}-${i}`} className="flex items-center gap-2">
                            <div className="w-20 text-xs font-mono text-gray-500 dark:text-gray-400 bg-sky-50 dark:bg-sky-900/30 px-1.5 py-0.5 rounded truncate">
                                @{inputLabels[i]?.substring(0, 8) || `Input ${i + 1}`}
                            </div>
                            <input
                                type="text"
                                value={inputLabels[i] || ""}
                                onChange={(e) => handleLabelChange(i, e.target.value)}
                                placeholder={`Input ${i + 1} label`}
                                className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                            {normalizedInputs.length > 2 && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveInput(i)}
                                    className="px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                >
                                    X
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Template Preview with Edit Button */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Template
                    </label>
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="text-xs px-2 py-1 bg-sky-600 text-white rounded hover:bg-sky-700 transition-colors flex items-center gap-1"
                    >
                        <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                        </svg>
                        Edit Template
                    </button>
                </div>

                {/* Mini preview */}
                <div
                    onClick={() => setIsModalOpen(true)}
                    className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600 cursor-pointer hover:border-sky-400 dark:hover:border-sky-500 transition-colors min-h-[60px]"
                >
                    {template ? (
                        <div
                            className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 prose prose-sm dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: template }}
                        />
                    ) : (
                        <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                            Click "Edit Template" to create your template...
                        </p>
                    )}
                </div>
            </div>

            {/* Target Field Selector */}
            <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Target Field{" "}
                    {!hasRelevantConnection && (
                        <span className="text-xs text-gray-400">(connect to a node first)</span>
                    )}
                </label>
                {hasRelevantConnection ? (
                    <>
                        <div className="mb-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded text-xs text-green-700 dark:text-green-400">
                            Connected to:{" "}
                            <strong>{availableFields.map((f) => f.label).join(", ")}</strong> -
                            select which field to populate
                        </div>
                        <select
                            value={targetField}
                            onChange={(e) => setTargetField(e.target.value)}
                            className="w-full px-3 py-2 border border-green-300 dark:border-green-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="">-- Select target field --</option>
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
                        Connect this node to an action (Calendar, Email, API, etc.) to see available
                        target fields.
                    </div>
                )}
            </div>

            {/* Preview */}
            <div className="bg-white dark:bg-gray-800 p-3 rounded border border-sky-300 dark:border-sky-600">
                <p className="text-xs font-medium text-sky-900 dark:text-sky-300 mb-1">
                    Preview (with example values):
                </p>
                <p className="text-sm text-sky-800 dark:text-sky-400 break-all">
                    {getPreviewText() || <em className="text-gray-400">No template defined</em>}
                </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded p-2">
                <p className="text-xs text-blue-800 dark:text-blue-400">
                    <strong>Tip:</strong> In the editor, type{" "}
                    <kbd className="px-1 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-xs">
                        @
                    </kbd>{" "}
                    to insert input placeholders.
                </p>
            </div>

            {/* Modal Editor */}
            <TemplateEditorModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                value={template}
                onChange={setTemplate}
                availableNodes={availableNodes}
                inputLabels={inputLabels}
            />
        </div>
    );
};

export default TemplateNodeConfig;
