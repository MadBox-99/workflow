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
    const [templates, setTemplates] = useState([]);
    const [loadingTemplates, setLoadingTemplates] = useState(true);
    const [selectedTemplateVariables, setSelectedTemplateVariables] = useState(null);

    // Sync local state with config prop when it changes (e.g., selecting a different node)
    useEffect(() => {
        setTemplate(config.template || '');
        setRecipients(config.recipients ? config.recipients.join(', ') : '');
        setSubject(config.subject || '');
        setCustomData(config.customData ? JSON.stringify(config.customData, null, 2) : '{}');
    }, [config]);

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                setLoadingTemplates(true);
                const response = await fetch('/api/email-templates');
                if (response.ok) {
                    const data = await response.json();
                    setTemplates(data);
                }
            } catch (error) {
                console.error('Failed to fetch email templates:', error);
            } finally {
                setLoadingTemplates(false);
            }
        };

        fetchTemplates();
    }, []);

    useEffect(() => {
        const selectedTemplate = templates.find((t) => t.slug === template);
        setSelectedTemplateVariables(selectedTemplate?.variables || null);

        if (selectedTemplate && !subject) {
            setSubject(selectedTemplate.subject);
        }
    }, [template, templates]);

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
                    disabled={loadingTemplates}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                >
                    <option value="">
                        {loadingTemplates ? 'Loading templates...' : 'Select template...'}
                    </option>
                    {templates.map((t) => (
                        <option key={t.id} value={t.slug}>
                            {t.name}
                        </option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Email templates are managed in Filament admin panel
                </p>
                {selectedTemplateVariables && Object.keys(selectedTemplateVariables).length > 0 && (
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/30 rounded border border-blue-200 dark:border-blue-700">
                        <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                            Template variables:
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {Object.keys(selectedTemplateVariables).map((varName) => (
                                <span
                                    key={varName}
                                    className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded text-xs font-mono"
                                >
                                    {`{{${varName}}}`}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
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
                    <strong>Template:</strong>{' '}
                    {template
                        ? templates.find((t) => t.slug === template)?.name || template
                        : '(not selected)'}
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
