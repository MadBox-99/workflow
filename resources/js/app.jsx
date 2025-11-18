import React from 'react';
import { createRoot } from 'react-dom/client';
import './bootstrap';
import AdminApp from './components/AdminApp';
import WorkflowsApp from './components/WorkflowsApp';

console.log('App.jsx loaded');

const adminContainer = document.getElementById('admin-app');
console.log('Admin container:', adminContainer);
if (adminContainer) {
    console.log('Rendering AdminApp');
    const root = createRoot(adminContainer);
    root.render(<AdminApp />);
    console.log('AdminApp rendered');
}

const workflowsContainer = document.getElementById('workflows-app');
console.log('Workflows container:', workflowsContainer);
if (workflowsContainer) {
    console.log('Rendering WorkflowsApp');
    const root = createRoot(workflowsContainer);
    root.render(<WorkflowsApp />);
    console.log('WorkflowsApp rendered');
}
