import React, { useMemo, useRef, useEffect } from "react";
import { useEditor, EditorContent, ReactRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Mention from "@tiptap/extension-mention";
import tippy from "tippy.js";
import MentionList from "./MentionList";

const MenuButton = ({ onClick, isActive, disabled, children, title }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`p-1.5 rounded transition-colors ${
            isActive
                ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
        {children}
    </button>
);

const Toolbar = ({ editor }) => {
    if (!editor) return null;

    return (
        <div className="flex flex-wrap gap-0.5 p-1.5 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 rounded-t">
            {/* Text formatting */}
            <MenuButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive("bold")}
                title="Bold (Ctrl+B)"
            >
                <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                >
                    <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
                    <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
                </svg>
            </MenuButton>

            <MenuButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive("italic")}
                title="Italic (Ctrl+I)"
            >
                <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <line x1="19" y1="4" x2="10" y2="4" />
                    <line x1="14" y1="20" x2="5" y2="20" />
                    <line x1="15" y1="4" x2="9" y2="20" />
                </svg>
            </MenuButton>

            <MenuButton
                onClick={() => editor.chain().focus().toggleStrike().run()}
                isActive={editor.isActive("strike")}
                title="Strikethrough"
            >
                <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path d="M16 4H9a3 3 0 0 0 0 6h6" />
                    <path d="M8 20h7a3 3 0 0 0 0-6H4" />
                    <line x1="4" y1="12" x2="20" y2="12" />
                </svg>
            </MenuButton>

            <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1" />

            {/* Headings */}
            <MenuButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                isActive={editor.isActive("heading", { level: 1 })}
                title="Heading 1"
            >
                <span className="text-xs font-bold">H1</span>
            </MenuButton>

            <MenuButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                isActive={editor.isActive("heading", { level: 2 })}
                title="Heading 2"
            >
                <span className="text-xs font-bold">H2</span>
            </MenuButton>

            <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1" />

            {/* Lists */}
            <MenuButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editor.isActive("bulletList")}
                title="Bullet List"
            >
                <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <line x1="9" y1="6" x2="20" y2="6" />
                    <line x1="9" y1="12" x2="20" y2="12" />
                    <line x1="9" y1="18" x2="20" y2="18" />
                    <circle cx="4" cy="6" r="1.5" fill="currentColor" />
                    <circle cx="4" cy="12" r="1.5" fill="currentColor" />
                    <circle cx="4" cy="18" r="1.5" fill="currentColor" />
                </svg>
            </MenuButton>

            <MenuButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                isActive={editor.isActive("orderedList")}
                title="Numbered List"
            >
                <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <line x1="10" y1="6" x2="20" y2="6" />
                    <line x1="10" y1="12" x2="20" y2="12" />
                    <line x1="10" y1="18" x2="20" y2="18" />
                    <text x="2" y="8" fontSize="6" fill="currentColor" fontWeight="bold">
                        1
                    </text>
                    <text x="2" y="14" fontSize="6" fill="currentColor" fontWeight="bold">
                        2
                    </text>
                    <text x="2" y="20" fontSize="6" fill="currentColor" fontWeight="bold">
                        3
                    </text>
                </svg>
            </MenuButton>

            <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1" />

            {/* Block elements */}
            <MenuButton
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                isActive={editor.isActive("blockquote")}
                title="Quote"
            >
                <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21" />
                    <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v4" />
                </svg>
            </MenuButton>

            <MenuButton
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                isActive={editor.isActive("codeBlock")}
                title="Code Block"
            >
                <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                </svg>
            </MenuButton>

            <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1" />

            {/* Undo/Redo */}
            <MenuButton
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                title="Undo (Ctrl+Z)"
            >
                <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path d="M3 7v6h6" />
                    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                </svg>
            </MenuButton>

            <MenuButton
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                title="Redo (Ctrl+Y)"
            >
                <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path d="M21 7v6h-6" />
                    <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
                </svg>
            </MenuButton>
        </div>
    );
};

const RichTextEditor = ({
    value,
    onChange,
    placeholder = "Start typing...",
    availableNodes = [], // Array of { id, label, type, color, fields }
}) => {
    // Use a ref to store mention items - this prevents editor recreation when availableNodes change
    const mentionItemsRef = useRef([]);

    // Build mention items from available nodes and update the ref
    const mentionItems = useMemo(() => {
        const items = [];
        if (!Array.isArray(availableNodes)) return items;

        availableNodes.forEach((node) => {
            // Skip undefined/null nodes
            if (!node || !node.id) return;

            // Add node output as a mention option
            items.push({
                id: `${node.id}`,
                label: node.label || node.id,
                type: node.type || "unknown",
                color: node.color || "#8b5cf6",
                nodeId: node.id,
                field: "output",
            });
            // If node has specific fields, add them too
            if (node.fields && Array.isArray(node.fields)) {
                node.fields.forEach((field) => {
                    if (!field || !field.value) return;
                    items.push({
                        id: `${node.id}.${field.value}`,
                        label: `${node.label || node.id} → ${field.label || field.value}`,
                        type: node.type || "unknown",
                        color: node.color || "#8b5cf6",
                        nodeId: node.id,
                        field: field.value,
                    });
                });
            }
        });
        return items;
    }, [availableNodes]);

    // Keep the ref updated with current items
    useEffect(() => {
        mentionItemsRef.current = mentionItems;
    }, [mentionItems]);

    // Suggestion config reads from ref so it doesn't need to change when items change
    const suggestion = useMemo(
        () => ({
            items: ({ query }) => {
                // Read from ref to get current items without causing editor recreation
                return mentionItemsRef.current
                    .filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
                    .slice(0, 10);
            },
            render: () => {
                let component;
                let popup;

                return {
                    onStart: (props) => {
                        component = new ReactRenderer(MentionList, {
                            props,
                            editor: props.editor,
                        });

                        if (!props.clientRect) {
                            return;
                        }

                        popup = tippy("body", {
                            getReferenceClientRect: props.clientRect,
                            appendTo: () => document.body,
                            content: component.element,
                            showOnCreate: true,
                            interactive: true,
                            trigger: "manual",
                            placement: "bottom-start",
                        });
                    },

                    onUpdate(props) {
                        component.updateProps(props);

                        if (!props.clientRect) {
                            return;
                        }

                        popup[0].setProps({
                            getReferenceClientRect: props.clientRect,
                        });
                    },

                    onKeyDown(props) {
                        if (props.event.key === "Escape") {
                            popup[0].hide();
                            return true;
                        }

                        return component.ref?.onKeyDown(props);
                    },

                    onExit() {
                        popup[0].destroy();
                        component.destroy();
                    },
                };
            },
        }),
        [],
    ); // Empty deps - reads from ref instead

    const editor = useEditor(
        {
            extensions: [
                StarterKit.configure({
                    heading: {
                        levels: [1, 2, 3],
                    },
                }),
                Placeholder.configure({
                    placeholder,
                }),
                Mention.configure({
                    HTMLAttributes: {
                        class: "mention",
                    },
                    suggestion,
                    renderText({ node }) {
                        const label = node?.attrs?.label || node?.attrs?.id || "";
                        return `@${label}`;
                    },
                    renderHTML({ node, HTMLAttributes }) {
                        const label = node?.attrs?.label || node?.attrs?.id || "";
                        return [
                            "span",
                            { ...(HTMLAttributes || {}), class: "mention" },
                            `@${label}`,
                        ];
                    },
                }),
            ],
            content: value || "",
            immediatelyRender: false, // Prevent race condition during initialization
            onUpdate: ({ editor }) => {
                // Get HTML content
                const html = editor.getHTML();
                // If empty, return empty string instead of <p></p>
                const isEmpty = editor.isEmpty;
                onChange(isEmpty ? "" : html);
            },
            editorProps: {
                attributes: {
                    class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[100px] p-3",
                },
            },
        },
        [],
    ); // Empty deps - stable editor instance, reads from refs

    // Update content when value changes externally
    React.useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value || "");
        }
    }, [value, editor]);

    return (
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-700">
            <Toolbar editor={editor} />
            <EditorContent
                editor={editor}
                className="text-gray-900 dark:text-white [&_.ProseMirror]:min-h-[100px] [&_.ProseMirror]:max-h-[300px] [&_.ProseMirror]:overflow-y-auto
                    [&_.ProseMirror_p]:my-2
                    [&_.ProseMirror_h1]:text-xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:my-3
                    [&_.ProseMirror_h2]:text-lg [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h2]:my-2
                    [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_ul]:my-2
                    [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5 [&_.ProseMirror_ol]:my-2
                    [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-gray-300 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote]:my-2
                    [&_.ProseMirror_pre]:bg-gray-100 [&_.ProseMirror_pre]:dark:bg-gray-800 [&_.ProseMirror_pre]:p-3 [&_.ProseMirror_pre]:rounded [&_.ProseMirror_pre]:my-2 [&_.ProseMirror_pre]:font-mono [&_.ProseMirror_pre]:text-sm
                    [&_.ProseMirror_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_.is-editor-empty:first-child::before]:text-gray-400 [&_.ProseMirror_.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_.is-editor-empty:first-child::before]:h-0
                    [&_.ProseMirror_.mention]:bg-purple-100 [&_.ProseMirror_.mention]:dark:bg-purple-900/50 [&_.ProseMirror_.mention]:text-purple-700 [&_.ProseMirror_.mention]:dark:text-purple-300 [&_.ProseMirror_.mention]:px-1.5 [&_.ProseMirror_.mention]:py-0.5 [&_.ProseMirror_.mention]:rounded [&_.ProseMirror_.mention]:font-medium [&_.ProseMirror_.mention]:text-sm"
            />
            {availableNodes.length > 0 && (
                <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
                    Type{" "}
                    <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                        @
                    </kbd>{" "}
                    to insert a node reference
                </div>
            )}
        </div>
    );
};

export default RichTextEditor;
