import React, { useState, useEffect } from 'react';

const EmailActionConfig = ({ config, onChange }) => {
    const [template, setTemplate] = useState(config.template || '');
    const [recipients, setRecipients] = useState(
        config.recipients ? config.recipients.join(', ') : ''
    );
    const [subject, setSubject] = useState(config.subject || '');
    const [customData, setCustomData] = useState(
        config.customData ? JSON.stringify(config.customData, null, 2) : '{}'
    );

    useEffect(() => {
        try {
            const recipientsList = recipients
                .split(',')
                .map((email) => email.trim())
                .filter((email) => email.length > 0);

            const parsedCustomData = customData ? JSON.parse(customData) : {};

            onChange({
                template,
                recipients: recipientsList,
                subject,
                customData: parsedCustomData,
            });
        } catch (e) {
            // Invalid JSON, don't update
        }
    }, [template, recipients, subject, customData]);

    return (
        <div className="space-y-3">
            <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Email Template
                </label>
                <select
                    value={template}
                    onChange={(e) => setTemplate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                    <option value="">Select template...</option>
                    <option value="welcome">Welcome Email</option>
                    <option value="notification">Notification</option>
                    <option value="reminder">Reminder</option>
                    <option value="custom">Custom Template</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Email templates are managed in Filament admin panel
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Email Subject
                </label>
                <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Email subject line"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Recipients (comma-separated)
                </label>
                <textarea
                    value={recipients}
                    onChange={(e) => setRecipients(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="user@example.com, admin@example.com"
                    rows="3"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Enter email addresses separated by commas
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Custom Data (JSON) - Optional
                </label>
                <textarea
                    value={customData}
                    onChange={(e) => setCustomData(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder='{"userName": "John", "orderNumber": "12345"}'
                    rows="4"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Additional data to pass to the email template
                </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-3 rounded border border-pink-300 dark:border-pink-600">
                <p className="text-xs font-medium text-pink-900 dark:text-pink-300 mb-1">
                    Email Preview:
                </p>
                <p className="text-sm text-pink-800 dark:text-pink-400 break-all">
                    <strong>Template:</strong> {template || '(not selected)'}
                </p>
                <p className="text-sm text-pink-800 dark:text-pink-400 break-all">
                    <strong>Subject:</strong> {subject || '(no subject)'}
                </p>
                <p className="text-sm text-pink-800 dark:text-pink-400 break-all">
                    <strong>Recipients:</strong> {recipients || '(no recipients)'}
                </p>
            </div>
        </div>
    );
};

export default EmailActionConfig;
