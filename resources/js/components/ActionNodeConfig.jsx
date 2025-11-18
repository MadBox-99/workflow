import React, { useState, useEffect } from 'react';

const ActionNodeConfig = ({ config, onChange }) => {
    const [method, setMethod] = useState(config.method || 'POST');
    const [url, setUrl] = useState(config.url || '');
    const [requestBody, setRequestBody] = useState(
        config.requestBody ? JSON.stringify(config.requestBody, null, 2) : '{}'
    );
    const [headers, setHeaders] = useState(
        config.headers ? JSON.stringify(config.headers, null, 2) : '{}'
    );

    useEffect(() => {
        try {
            const parsedBody = requestBody ? JSON.parse(requestBody) : {};
            const parsedHeaders = headers ? JSON.parse(headers) : {};

            onChange({
                method,
                url,
                requestBody: parsedBody,
                headers: parsedHeaders,
            });
        } catch (e) {
            // Invalid JSON, don't update
        }
    }, [method, url, requestBody, headers]);

    return (
        <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded p-3">
                <h5 className="font-semibold text-sm text-blue-800 dark:text-blue-400 mb-2">
                    API Action Configuration
                </h5>
                <p className="text-xs text-blue-600 dark:text-blue-500">
                    Configure the API endpoint this action will call
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    HTTP Method
                </label>
                <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    API Endpoint URL
                </label>
                <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="/api/endpoint or https://example.com/api/..."
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Use relative path (/api/...) or full URL
                </p>
            </div>

            {(method === 'POST' || method === 'PUT' || method === 'PATCH') && (
                <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Request Body (JSON)
                    </label>
                    <textarea
                        value={requestBody}
                        onChange={(e) => setRequestBody(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder='{"key": "value"}'
                        rows="6"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        JSON format required
                    </p>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Custom Headers (JSON) - Optional
                </label>
                <textarea
                    value={headers}
                    onChange={(e) => setHeaders(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder='{"Authorization": "Bearer token"}'
                    rows="3"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Additional headers to send with the request
                </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-3 rounded border border-blue-300 dark:border-blue-600">
                <p className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-1">
                    Request Preview:
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-400 font-mono break-all">
                    <strong>{method}</strong> {url || '(no URL set)'}
                </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded p-2">
                <p className="text-xs text-yellow-800 dark:text-yellow-400">
                    <strong>💡 Tip:</strong> Use the trigger button (▶) on the node to test the API call.
                    The node will show loading, success, or error states.
                </p>
            </div>
        </div>
    );
};

export default ActionNodeConfig;
