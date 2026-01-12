import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

const MentionList = forwardRef((props, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index) => {
        const item = props.items[index];
        if (item) {
            props.command(item);
        }
    };

    const upHandler = () => {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
    };

    const downHandler = () => {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
    };

    const enterHandler = () => {
        selectItem(selectedIndex);
    };

    useEffect(() => setSelectedIndex(0), [props.items]);

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }) => {
            if (event.key === 'ArrowUp') {
                upHandler();
                return true;
            }

            if (event.key === 'ArrowDown') {
                downHandler();
                return true;
            }

            if (event.key === 'Enter') {
                enterHandler();
                return true;
            }

            return false;
        },
    }));

    if (props.items.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 text-sm text-gray-500 dark:text-gray-400">
                No nodes found
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden max-h-64 overflow-y-auto">
            {props.items.map((item, index) => (
                <button
                    key={item.id}
                    onClick={() => selectItem(index)}
                    className={`w-full text-left px-3 py-2 flex items-center gap-2 text-sm transition-colors ${
                        index === selectedIndex
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                >
                    <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color || '#8b5cf6' }}
                    />
                    <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.label}</div>
                        {item.field && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                Field: {item.field}
                            </div>
                        )}
                        {item.type && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                {item.type}
                            </div>
                        )}
                    </div>
                </button>
            ))}
        </div>
    );
});

MentionList.displayName = 'MentionList';

export default MentionList;
