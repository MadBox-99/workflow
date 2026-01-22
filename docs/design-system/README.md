# Cégem360 Design System Documentation

This documentation provides a complete reference for creating consistent landing pages and UI across all Cégem360 modules.

## Table of Contents

1. [Module Setup](./01-module-setup.md) - Initial Laravel + Filament configuration
2. [Color System](./02-color-system.md) - Module colors and theming
3. [Typography](./03-typography.md) - Fonts and text styles
4. [Layout Components](./04-layout-components.md) - Navbar, Footer, App layout
5. [Landing Page Sections](./05-landing-page-sections.md) - Hero, Features, Pricing, etc.
6. [CSS Configuration](./06-css-configuration.md) - Tailwind v4 + Filament setup
7. [Common Issues](./07-common-issues.md) - Troubleshooting guide
8. [Authentication Pages](./08-authentication-pages.md) - Login, Registration with custom layouts
9. [User Dashboard](./09-user-dashboard.md) - Livewire dashboard with Filament Schemas
10. [React Workflow Editor](./10-react-workflow-editor.md) - React Flow integration and patterns

## Quick Start

When creating a new module landing page:

1. Copy the layout components from an existing module
2. Update colors to match the module's theme
3. Add `@filamentStyles` and `@filamentScripts` to app.blade.php
4. Import Filament CSS in app.css
5. Follow the Hungarian content structure

## Existing Modules

Reference these existing implementations when creating new modules:

| Module | Path | Color | Description |
|--------|------|-------|-------------|
| Subscriber (Main) | `~/Herd/subscriber` | Indigo #6161FF | Main subscription management portal |
| Controlling | `~/Herd/controlling` | Emerald #10B981 | Financial controlling module |
| CRM | `~/Herd/crm` | Blue #3B82F6 | Customer relationship management |
| Workflow | `~/Herd/workflow` | Violet #8B5CF6 | Automation & workflow editor |

## Module Color Reference

| Module | Color Name | Hex Code | Tailwind Class |
|--------|-----------|----------|----------------|
| Subscriber (Main) | Indigo | #6161FF | `indigo-*` |
| Controlling | Emerald | #10B981 | `emerald-*` |
| CRM | Blue | #3B82F6 | `blue-*` |
| Automatizálás (Workflow) | Violet | #8B5CF6 | `violet-*` |

## Tech Stack

**Primary Stack (TALL):**
- **Tailwind CSS v4** - Styling (CSS-first config)
- **Alpine.js** - JavaScript (included with Filament)
- **Laravel 12** - PHP Framework
- **Livewire 3** - Dynamic Components
- **Filament 4** - Admin Panel
- **Vite** - Frontend Build Tool

**Workflow Module Only:**
- **React 19** - Used exclusively for the visual workflow editor (React Flow requires React)
