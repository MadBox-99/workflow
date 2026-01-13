import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { getFieldsForNodeTypes } from "@/constants/nodeInputFields";
import RichTextEditor from "@/components/ui/RichTextEditor";

// Modal Editor Component for full-screen rich text editing
const RichTextModal = ({
    isOpen,
    onClose,
    value,
    onChange,
    onSave,
    availableNodes,
}) => {
    const [tempValue, setTempValue] = useState(value);

    // Sync tempValue when modal opens
    useEffect(() => {
        if (isOpen) {
            setTempValue(value);
        }
    }, [isOpen, value]);

    const handleSave = () => {
        onChange(tempValue);
        onSave?.();
        onClose();
    };

    const handleCancel = () => {
        setTempValue(value); // Reset to original value
        onClose();
    };

    // Handle Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" && isOpen) {
                handleCancel();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            data-modal-open="true"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleCancel}
            />

            {/* Modal */}
            <div className="relative w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                            <svg
                                className="w-5 h-5 text-purple-600 dark:text-purple-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Rich Text Editor
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Edit your formatted content in full screen
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleCancel}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <svg
                            className="w-5 h-5"
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

                {/* Editor Content */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="min-h-[400px] [&_.ProseMirror]:min-h-[350px] [&_.ProseMirror]:max-h-[500px]">
                        <RichTextEditor
                            value={tempValue}
                            onChange={setTempValue}
                            placeholder="Enter your formatted content... Type @ to reference other nodes"
                            availableNodes={availableNodes}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-b-xl">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        Press{" "}
                        <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">
                            Esc
                        </kbd>{" "}
                        to cancel
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleCancel}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
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
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
};

// Simple HTML to plaintext preview (client-side approximation)
const htmlToPlaintextPreview = (html) => {
    if (!html) return "";

    let text = html;

    // Process mentions
    text = text.replace(
        /<span[^>]*data-type="mention"[^>]*>([^<]*)<\/span>/gi,
        "$1",
    );

    // Headings
    text = text.replace(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/gis, "\n$1\n\n");

    // Paragraphs
    text = text.replace(/<p[^>]*>(.*?)<\/p>/gis, "$1\n\n");

    // List items
    text = text.replace(/<li[^>]*>(.*?)<\/li>/gis, "• $1\n");

    // Remove list wrappers
    text = text.replace(/<\/?[uo]l[^>]*>/gi, "");

    // Blockquotes
    text = text.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, "> $1\n");

    // Code blocks
    text = text.replace(/<pre[^>]*>(.*?)<\/pre>/gis, "```\n$1\n```\n");
    text = text.replace(/<code[^>]*>(.*?)<\/code>/gis, "`$1`");

    // Line breaks
    text = text.replace(/<br\s*\/?>/gi, "\n");

    // Remove formatting tags
    text = text.replace(
        /<(strong|b|em|i|s|strike|del|u)[^>]*>(.*?)<\/\1>/gis,
        "$2",
    );

    // Remove remaining HTML tags
    text = text.replace(/<[^>]+>/g, "");

    // Decode entities
    const textarea = document.createElement("textarea");
    textarea.innerHTML = text;
    text = textarea.value;

    // Clean up whitespace
    text = text.replace(/\n{3,}/g, "\n\n");
    text = text.replace(/[ \t]+/g, " ");
    text = text
        .split("\n")
        .map((line) => line.trim())
        .join("\n");

    return text.trim();
};

const DATETIME_OPTIONS = [
    {
        value: "now",
        label: "Now (current time)",
        description: "Current date and time",
    },
    {
        value: "today",
        label: "Today (start of day)",
        description: "Today at 00:00",
    },
    {
        value: "tomorrow",
        label: "Tomorrow (start of day)",
        description: "Tomorrow at 00:00",
    },
    { value: "next_week", label: "Next week", description: "7 days from now" },
    {
        value: "next_month",
        label: "Next month",
        description: "30 days from now",
    },
    { value: "in_1_hour", label: "In 1 hour", description: "1 hour from now" },
    {
        value: "in_2_hours",
        label: "In 2 hours",
        description: "2 hours from now",
    },
    {
        value: "in_30_min",
        label: "In 30 minutes",
        description: "30 minutes from now",
    },
    { value: "end_of_day", label: "End of day", description: "Today at 23:59" },
    {
        value: "custom_offset",
        label: "Custom offset...",
        description: "Set custom offset",
    },
    {
        value: "fixed",
        label: "Fixed date/time",
        description: "Specific date and time",
    },
];

const ConstantNodeConfig = ({
    config,
    onChange,
    connectedNodeTypes = [],
    nodes = [],
    currentNodeId = null,
}) => {
    // Dynamically get available fields based on connected node types
    const availableFields = useMemo(
        () => getFieldsForNodeTypes(connectedNodeTypes),
        [connectedNodeTypes],
    );
    const hasRelevantConnection = availableFields.length > 0;

    // Build available nodes for mention in RichTextEditor (exclude current node)
    const availableNodesForMention = useMemo(() => {
        return nodes
            .filter(
                (node) =>
                    node.id !== currentNodeId && node.data?.type !== "end",
            )
            .map((node) => ({
                id: node.id,
                label: node.data?.label || node.id,
                type: node.data?.type,
                color:
                    node.data?.type === "constant"
                        ? "#8b5cf6"
                        : node.data?.type === "start"
                          ? "#22c55e"
                          : node.data?.type === "googleCalendarAction"
                            ? "#4285f4"
                            : node.data?.type === "googleDocsAction"
                              ? "#4285f4"
                              : "#6b7280",
            }));
    }, [nodes, currentNodeId]);
    const [valueType, setValueType] = useState(config.valueType || "string");
    const [value, setValue] = useState(
        config.value !== undefined ? config.value : "",
    );
    const [datetimeOption, setDatetimeOption] = useState(
        config.datetimeOption || "now",
    );
    const [offsetAmount, setOffsetAmount] = useState(config.offsetAmount || 1);
    const [offsetUnit, setOffsetUnit] = useState(config.offsetUnit || "hours");
    const [fixedDateTime, setFixedDateTime] = useState(
        config.fixedDateTime || "",
    );
    const [targetField, setTargetField] = useState(config.targetField || "");
    const [outputFormat, setOutputFormat] = useState(
        config.outputFormat || "html",
    );
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Sync local state with config prop when it changes (e.g., selecting a different node)
    useEffect(() => {
        setValueType(config.valueType || "string");
        setValue(config.value !== undefined ? config.value : "");
        setDatetimeOption(config.datetimeOption || "now");
        setOffsetAmount(config.offsetAmount || 1);
        setOffsetUnit(config.offsetUnit || "hours");
        setFixedDateTime(config.fixedDateTime || "");
        setTargetField(config.targetField || "");
        setOutputFormat(config.outputFormat || "html");
    }, [config]);

    useEffect(() => {
        const configData = {
            valueType,
            value: convertValue(value, valueType),
            targetField,
        };

        if (valueType === "datetime") {
            configData.datetimeOption = datetimeOption;
            if (datetimeOption === "custom_offset") {
                configData.offsetAmount = offsetAmount;
                configData.offsetUnit = offsetUnit;
            }
            if (datetimeOption === "fixed") {
                configData.fixedDateTime = fixedDateTime;
            }
        }

        if (valueType === "richtext") {
            configData.outputFormat = outputFormat;
        }

        onChange(configData);
    }, [
        valueType,
        value,
        datetimeOption,
        offsetAmount,
        offsetUnit,
        fixedDateTime,
        targetField,
        outputFormat,
    ]);

    const convertValue = (val, type) => {
        if (type === "number") {
            const num = parseFloat(val);
            return isNaN(num) ? 0 : num;
        }
        if (type === "boolean") {
            return val === "true" || val === true;
        }
        return String(val);
    };

    const getDatetimePreview = () => {
        const now = new Date();
        let result;

        switch (datetimeOption) {
            case "now":
                result = now;
                break;
            case "today":
                result = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate(),
                    0,
                    0,
                    0,
                );
                break;
            case "tomorrow":
                result = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate() + 1,
                    0,
                    0,
                    0,
                );
                break;
            case "next_week":
                result = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                break;
            case "next_month":
                result = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                break;
            case "in_1_hour":
                result = new Date(now.getTime() + 60 * 60 * 1000);
                break;
            case "in_2_hours":
                result = new Date(now.getTime() + 2 * 60 * 60 * 1000);
                break;
            case "in_30_min":
                result = new Date(now.getTime() + 30 * 60 * 1000);
                break;
            case "end_of_day":
                result = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate(),
                    23,
                    59,
                    59,
                );
                break;
            case "custom_offset": {
                const multipliers = {
                    minutes: 60 * 1000,
                    hours: 60 * 60 * 1000,
                    days: 24 * 60 * 60 * 1000,
                };
                result = new Date(
                    now.getTime() +
                        offsetAmount * (multipliers[offsetUnit] || 0),
                );
                break;
            }
            case "fixed":
                result = fixedDateTime ? new Date(fixedDateTime) : now;
                break;
            default:
                result = now;
        }

        return result.toLocaleString("hu-HU", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
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
        if (newType === "number" && isNaN(parseFloat(value))) {
            setValue("0");
        } else if (newType === "boolean") {
            setValue("false");
        } else if (newType === "datetime") {
            setDatetimeOption("now");
        } else if (newType === "richtext" && oldType === "string") {
            // Wrap plain text in paragraph if switching from string to richtext
            if (value && !value.startsWith("<")) {
                setValue(`<p>${value}</p>`);
            }
        } else if (newType === "string" && oldType === "richtext") {
            // Strip HTML tags when switching from richtext to string
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = value;
            setValue(tempDiv.textContent || tempDiv.innerText || "");
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
                    Target Field{" "}
                    {!hasRelevantConnection && (
                        <span className="text-xs text-gray-400">
                            (connect to a node first)
                        </span>
                    )}
                </label>
                {hasRelevantConnection ? (
                    <>
                        <div className="mb-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded text-xs text-green-700 dark:text-green-400">
                            Connected to:{" "}
                            <strong>
                                {availableFields.map((f) => f.label).join(", ")}
                            </strong>{" "}
                            - select which field to populate
                        </div>
                        <select
                            value={targetField}
                            onChange={(e) => setTargetField(e.target.value)}
                            className="w-full px-3 py-2 border border-green-300 dark:border-green-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="">-- Select target field --</option>
                            {/* Dynamically show fields for all connected node types */}
                            {availableFields.map((nodeConfig) => (
                                <optgroup
                                    key={nodeConfig.nodeType}
                                    label={nodeConfig.label}
                                >
                                    {nodeConfig.fields.map((field) => (
                                        <option
                                            key={field.value}
                                            value={field.value}
                                        >
                                            {field.label}
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </>
                ) : (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-sm text-gray-500 dark:text-gray-400">
                        Connect this node to an action (Calendar, Email, API,
                        etc.) to see available target fields.
                    </div>
                )}
            </div>

            {valueType === "datetime" ? (
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
                            {
                                DATETIME_OPTIONS.find(
                                    (o) => o.value === datetimeOption,
                                )?.description
                            }
                        </p>
                    </div>

                    {datetimeOption === "custom_offset" && (
                        <div className="flex gap-2">
                            <input
                                type="number"
                                value={offsetAmount}
                                onChange={(e) =>
                                    setOffsetAmount(
                                        parseInt(e.target.value) || 1,
                                    )
                                }
                                min="1"
                                className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                            <select
                                value={offsetUnit}
                                onChange={(e) => setOffsetUnit(e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="minutes">
                                    Minutes from now
                                </option>
                                <option value="hours">Hours from now</option>
                                <option value="days">Days from now</option>
                            </select>
                        </div>
                    )}

                    {datetimeOption === "fixed" && (
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
                    {valueType === "boolean" ? (
                        <select
                            value={String(value)}
                            onChange={(e) => setValue(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="true">True</option>
                            <option value="false">False</option>
                        </select>
                    ) : valueType === "number" ? (
                        <input
                            type="number"
                            value={value}
                            onChange={handleValueChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Enter a number"
                            step="any"
                        />
                    ) : valueType === "richtext" ? (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium mb-1.5 text-gray-600 dark:text-gray-400">
                                    Output Format
                                </label>
                                <select
                                    value={outputFormat}
                                    onChange={(e) =>
                                        setOutputFormat(e.target.value)
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="html">
                                        HTML (preserve formatting tags)
                                    </option>
                                    <option value="plaintext">
                                        Plain Text (for Google Docs, etc.)
                                    </option>
                                </select>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {outputFormat === "html"
                                        ? "Output will include HTML tags like <p>, <h1>, <strong>, etc."
                                        : "HTML will be converted to formatted plain text with proper line breaks and structure."}
                                </p>
                            </div>
                            <RichTextEditor
                                value={value}
                                onChange={setValue}
                                placeholder="Enter formatted content... Type @ to reference other nodes"
                                availableNodes={availableNodesForMention}
                            />
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(true)}
                                className="w-full px-3 py-2 text-sm bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-700 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors flex items-center justify-center gap-2"
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
                                        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                                    />
                                </svg>
                                Open Full Screen Editor
                            </button>
                            <RichTextModal
                                isOpen={isModalOpen}
                                onClose={() => setIsModalOpen(false)}
                                value={value}
                                onChange={setValue}
                                availableNodes={availableNodesForMention}
                            />
                        </div>
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
                    {valueType === "datetime"
                        ? "Preview (calculated at runtime):"
                        : "Current Value:"}
                </p>
                {valueType === "richtext" ? (
                    outputFormat === "plaintext" ? (
                        <pre className="text-sm text-purple-800 dark:text-purple-400 whitespace-pre-wrap font-sans">
                            {htmlToPlaintextPreview(value) || "Empty"}
                        </pre>
                    ) : (
                        <div
                            className="text-sm text-purple-800 dark:text-purple-400 prose prose-sm dark:prose-invert max-w-none [&_*]:my-1"
                            dangerouslySetInnerHTML={{
                                __html: value || "<em>Empty</em>",
                            }}
                        />
                    )
                ) : (
                    <p className="text-sm text-purple-800 dark:text-purple-400 font-mono break-all">
                        {valueType === "string" && `"${value}"`}
                        {valueType === "number" &&
                            convertValue(value, "number")}
                        {valueType === "boolean" &&
                            String(convertValue(value, "boolean"))}
                        {valueType === "datetime" && getDatetimePreview()}
                    </p>
                )}
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Type: <span className="font-semibold">{valueType}</span>
                    {valueType === "datetime" && datetimeOption !== "fixed" && (
                        <span className="ml-2 text-green-600 dark:text-green-400">
                            (dynamic - recalculated each run)
                        </span>
                    )}
                    {valueType === "richtext" && (
                        <span className="ml-2 text-blue-600 dark:text-blue-400">
                            (
                            {outputFormat === "html"
                                ? "HTML formatted"
                                : "Plain text output"}
                            )
                        </span>
                    )}
                </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded p-2">
                <p className="text-xs text-blue-800 dark:text-blue-400">
                    <strong>💡 Tip:</strong> This constant value can be
                    referenced by other nodes in your workflow.
                </p>
            </div>
        </div>
    );
};

export default ConstantNodeConfig;
