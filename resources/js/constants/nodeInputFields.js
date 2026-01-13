/**
 * Central registry of input fields for each node type.
 * When adding a new node type, just add its fields here.
 * The Constant node config will automatically pick them up.
 */

export const NODE_INPUT_FIELDS = {
    // Google Calendar
    googleCalendarAction: {
        label: "Google Calendar",
        fields: [
            { value: "summary", label: "Event Title (summary)" },
            { value: "description", label: "Event Description" },
            { value: "location", label: "Event Location" },
            { value: "startDateTime", label: "Start Date/Time" },
            { value: "endDateTime", label: "End Date/Time" },
            { value: "attendees", label: "Attendees (emails)" },
            { value: "eventId", label: "Event ID" },
        ],
    },

    // Google Docs
    googleDocsAction: {
        label: "Google Docs",
        fields: [
            { value: "title", label: "Document Title" },
            { value: "content", label: "Content" },
            { value: "documentId", label: "Document ID" },
            { value: "searchText", label: "Search Text (for replace)" },
        ],
    },

    // Email Action
    emailAction: {
        label: "Email",
        fields: [
            { value: "emailTo", label: "To (recipients)" },
            { value: "emailSubject", label: "Subject" },
            { value: "emailBody", label: "Body Content" },
            { value: "emailCc", label: "CC" },
            { value: "emailBcc", label: "BCC" },
        ],
    },

    // API Action
    apiAction: {
        label: "API",
        fields: [
            { value: "url", label: "URL" },
            { value: "requestBody", label: "Request Body" },
            { value: "headers", label: "Headers" },
            { value: "authToken", label: "Auth Token" },
        ],
    },

    // Webhook Action
    webhookAction: {
        label: "Webhook",
        fields: [
            { value: "url", label: "URL" },
            { value: "requestBody", label: "Request Body" },
            { value: "headers", label: "Headers" },
        ],
    },

    // Database Action
    databaseAction: {
        label: "Database",
        fields: [
            { value: "query", label: "Query" },
            { value: "tableName", label: "Table Name" },
            { value: "whereClause", label: "Where Clause" },
        ],
    },

    // Condition Node
    condition: {
        label: "Condition",
        fields: [
            { value: "valueA", label: "Value A" },
            { value: "valueB", label: "Value B" },
        ],
    },

    // Template Node
    template: {
        label: "Template",
        fields: [
            { value: "input-1", label: "Input 1 (${input1})" },
            { value: "input-2", label: "Input 2 (${input2})" },
            { value: "input-3", label: "Input 3 (${input3})" },
            { value: "input-4", label: "Input 4 (${input4})" },
            { value: "input-5", label: "Input 5 (${input5})" },
        ],
    },

    // Merge Node
    merge: {
        label: "Merge",
        fields: [
            { value: "input-1", label: "Input 1" },
            { value: "input-2", label: "Input 2" },
            { value: "input-3", label: "Input 3" },
            { value: "input-4", label: "Input 4" },
            { value: "input-5", label: "Input 5" },
        ],
    },
};

/**
 * Get all input fields for given node types.
 * Returns an array of { nodeType, label, fields } objects.
 */
export const getFieldsForNodeTypes = (nodeTypes = []) => {
    return nodeTypes
        .filter((type) => NODE_INPUT_FIELDS[type])
        .map((type) => ({
            nodeType: type,
            ...NODE_INPUT_FIELDS[type],
        }));
};

/**
 * Get a flat list of all field values for validation.
 */
export const getAllFieldValues = () => {
    const allFields = [];
    Object.values(NODE_INPUT_FIELDS).forEach((config) => {
        config.fields.forEach((field) => {
            if (!allFields.includes(field.value)) {
                allFields.push(field.value);
            }
        });
    });
    return allFields;
};
