import './bootstrap';
import React from 'react';
import { createRoot } from 'react-dom/client';
import AdminApp from './components/AdminApp';
import WorkflowsApp from './components/WorkflowsApp';

const adminContainer = document.getElementById('admin-app');
if (adminContainer) {
    const root = createRoot(adminContainer);
    root.render(<AdminApp />);
}

const workflowsContainer = document.getElementById('workflows-app');
if (workflowsContainer) {
    const root = createRoot(workflowsContainer);
    root.render(<WorkflowsApp />);
}
