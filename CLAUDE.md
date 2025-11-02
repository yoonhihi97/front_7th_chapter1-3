# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React-based calendar application with event management capabilities including recurring events, notifications, drag-and-drop functionality, and holiday integration. The application uses Material-UI for components, Vitest for testing, and Express for the backend server.

## Development Commands

### Running the Application
- `pnpm dev` - Start both the Express server and Vite dev server concurrently
- `pnpm start` - Start Vite dev server only
- `pnpm server` - Start Express server only
- `pnpm server:watch` - Start Express server with watch mode

### Testing
- `pnpm test` - Run tests in watch mode
- `pnpm test:ui` - Run tests with Vitest UI
- `pnpm test:coverage` - Generate test coverage report (outputs to `./.coverage` directory)

### Building and Linting
- `pnpm build` - Compile TypeScript and build for production with Vite
- `pnpm lint` - Run both ESLint and TypeScript compiler checks
- `pnpm lint:eslint` - Run ESLint only
- `pnpm lint:tsc` - Run TypeScript compiler checks only

## Architecture

### Backend (server.js)

The Express server provides REST API endpoints for event management:

- **Single Events**: `GET/POST/PUT/DELETE /api/events/:id?`
- **Batch Events**: `POST/PUT/DELETE /api/events-list` - For creating/updating/deleting multiple events at once (used for recurring events)
- **Recurring Events**: `PUT/DELETE /api/recurring-events/:repeatId` - For editing/deleting all events in a recurring series by `repeatId`

Data is persisted to JSON files in `src/__mocks__/response/`:
- `realEvents.json` - Used in development
- `e2e.json` - Used when `TEST_ENV=e2e` (for E2E tests)

### Frontend Architecture

The application follows a custom hooks pattern for state management and business logic:

**Core Hooks**:
- `useEventOperations` - Manages CRUD operations for events, including API calls for creating, updating, deleting events and fetching from server
- `useRecurringEventOperations` - Handles editing and deleting recurring events with "single vs all" logic
- `useEventForm` - Manages form state and validation for event creation/editing
- `useCalendarView` - Manages calendar view state (week/month), date navigation, and holiday fetching
- `useNotifications` - Manages notification state and display logic
- `useSearch` - Manages search and filtering logic for events

**Event Types**:
- `Event` - A complete event with an `id`
- `EventForm` - Event data without an `id` (used for creating new events)
- `RepeatInfo` - Contains recurring event configuration: `type`, `interval`, `endDate`, and `id` (the `id` field is the `repeatId` that groups all events in a recurring series)

**Recurring Events**:
Recurring events are created by generating multiple individual event records that share the same `repeat.id` (repeatId). When editing/deleting:
- Single event: Updates/deletes just that event (when editing, the repeat type is set to 'none')
- All events: Updates/deletes all events with the same `repeat.id` via the `/api/recurring-events/:repeatId` endpoint

The `useRecurringEventOperations` hook provides:
- `handleRecurringEdit(event, editSingleOnly)` - Handles recurring event edits
- `handleRecurringDelete(event, deleteSingleOnly)` - Handles recurring event deletions
- `findRelatedRecurringEvents(event)` - Finds all events in the same recurring series

### Utility Functions

**dateUtils.ts**: Calendar date manipulation and formatting
- `getWeeksAtMonth(date)` - Returns array of weeks for month view
- `getWeekDates(date)` - Returns array of dates for week view
- `formatMonth/formatWeek/formatDate` - Formatting functions

**eventUtils.ts**: Event-related utilities
- Event filtering and searching logic

**generateRepeatEvents.ts**: Logic for generating recurring event instances from a single event template

**eventOverlap.ts**: Detects overlapping events based on date and time

**timeValidation.ts**: Validates start/end time relationships

**notificationUtils.ts**: Notification timing calculations

### Component Structure

- `App.tsx` - Main component containing the entire calendar UI and event management form
- `RecurringEventDialog.tsx` - Dialog for choosing between editing/deleting single vs all recurring events

### Test Organization

Tests are organized in `src/__tests__/`:
- `unit/` - Unit tests for utility functions
- `hooks/` - Tests for custom hooks
- `components/` - Component tests
- `integration/` - Integration tests for workflows
- `edge-cases/` - Edge case tests for recurring events
- `regression/` - Regression tests

Test files are prefixed with difficulty level (`easy.`, `medium.`, `hard.`) for assignment grading purposes.

## Key Implementation Details

### Vite Configuration
- Uses SWC plugin for React (faster than Babel)
- Proxies `/api` requests to `http://localhost:3000` (Express server)
- Test environment configured with jsdom and setupTests.ts

### Notification System
Notifications are displayed when an event's start time is within the configured notification time. The `useNotifications` hook:
- Checks every minute for upcoming events
- Displays notifications in the top-right corner
- Highlights notified events in red throughout the UI

### Event Overlap Detection
Before saving an event, `findOverlappingEvents` checks for time conflicts. If overlaps are detected, a confirmation dialog appears allowing the user to proceed or cancel.

### TypeScript Configuration
The project uses TypeScript project references:
- `tsconfig.json` - Root config that references app and node configs
- `tsconfig.app.json` - Frontend application config
- `tsconfig.node.json` - Node.js/Vite config

## Assignment Context

This is assignment 3 (chapter 1-3) which focuses on:
- Implementing drag-and-drop functionality for calendar events
- Adding date click functionality to auto-populate the form
- Writing E2E tests for the complete event management workflow
- Writing visual regression tests for calendar rendering
