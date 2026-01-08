import React, { useState, useEffect } from 'react';

const GoogleCalendarConfig = ({ config, onChange, teamId }) => {
    const [operation, setOperation] = useState(config.operation || 'create');
    const [calendarId, setCalendarId] = useState(config.calendarId || 'primary');
    const [summary, setSummary] = useState(config.summary || '');
    const [description, setDescription] = useState(config.description || '');
    const [location, setLocation] = useState(config.location || '');
    const [startDateTime, setStartDateTime] = useState(config.startDateTime || '');
    const [endDateTime, setEndDateTime] = useState(config.endDateTime || '');
    const [attendees, setAttendees] = useState(config.attendees || '');
    const [eventId, setEventId] = useState(config.eventId || '');
    const [timeMin, setTimeMin] = useState(config.timeMin || '');
    const [timeMax, setTimeMax] = useState(config.timeMax || '');
    const [maxResults, setMaxResults] = useState(config.maxResults || 10);

    const [calendars, setCalendars] = useState([]);
    const [events, setEvents] = useState([]);
    const [eventsLoading, setEventsLoading] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [connectingUrl, setConnectingUrl] = useState(null);
    const [useManualEventId, setUseManualEventId] = useState(false);

    useEffect(() => {
        setOperation(config.operation || 'create');
        setCalendarId(config.calendarId || 'primary');
        setSummary(config.summary || '');
        setDescription(config.description || '');
        setLocation(config.location || '');
        setStartDateTime(config.startDateTime || '');
        setEndDateTime(config.endDateTime || '');
        setAttendees(config.attendees || '');
        setEventId(config.eventId || '');
        setTimeMin(config.timeMin || '');
        setTimeMax(config.timeMax || '');
        setMaxResults(config.maxResults || 10);
    }, [config]);

    useEffect(() => {
        if (teamId) {
            checkConnectionStatus();
        }
    }, [teamId]);

    // Listen for OAuth callback messages from popup
    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data?.type === 'google-oauth-callback') {
                console.log('Google OAuth callback received:', event.data);
                setConnectingUrl(null);
                if (event.data.success) {
                    // Refresh connection status after successful OAuth
                    checkConnectionStatus();
                } else {
                    alert(event.data.message || 'Failed to connect Google Calendar');
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    useEffect(() => {
        if (connectionStatus?.connected && teamId) {
            fetchCalendars();
        }
    }, [connectionStatus?.connected, teamId]);

    useEffect(() => {
        onChange({
            operation,
            calendarId,
            summary,
            description,
            location,
            startDateTime,
            endDateTime,
            attendees,
            eventId,
            timeMin,
            timeMax,
            maxResults: parseInt(maxResults) || 10,
        });
    }, [
        operation,
        calendarId,
        summary,
        description,
        location,
        startDateTime,
        endDateTime,
        attendees,
        eventId,
        timeMin,
        timeMax,
        maxResults,
    ]);

    const checkConnectionStatus = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/google/auth/status?team_id=${teamId}`);
            if (response.ok) {
                const data = await response.json();
                setConnectionStatus(data);
            }
        } catch (error) {
            console.error('Failed to check Google connection status:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCalendars = async () => {
        try {
            const response = await fetch(`/api/google/calendars?team_id=${teamId}`);
            if (response.ok) {
                const data = await response.json();
                setCalendars(data);
            }
        } catch (error) {
            console.error('Failed to fetch calendars:', error);
        }
    };

    const fetchEvents = async () => {
        if (!connectionStatus?.connected || !teamId) return;

        try {
            setEventsLoading(true);
            // Get events from 30 days ago to include recent past events
            const timeMin = new Date();
            timeMin.setDate(timeMin.getDate() - 30);

            const params = new URLSearchParams({
                team_id: teamId,
                calendar_id: calendarId,
                max_results: '50',
                time_min: timeMin.toISOString(),
            });

            const response = await fetch(`/api/google/events?${params}`);
            if (response.ok) {
                const data = await response.json();
                // Backend returns array directly, not wrapped in 'items'
                setEvents(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Failed to fetch events:', error);
        } finally {
            setEventsLoading(false);
        }
    };

    // Fetch events when calendar changes and operation needs events
    useEffect(() => {
        if ((operation === 'update' || operation === 'delete') && connectionStatus?.connected) {
            fetchEvents();
        }
    }, [calendarId, operation, connectionStatus?.connected]);

    const handleConnect = async () => {
        try {
            const response = await fetch(`/api/google/auth/redirect?team_id=${teamId}`);
            if (response.ok) {
                const data = await response.json();
                setConnectingUrl(data.auth_url);
                window.open(data.auth_url, '_blank', 'width=600,height=700');
            }
        } catch (error) {
            console.error('Failed to get auth URL:', error);
        }
    };

    const handleDisconnect = async () => {
        if (!confirm('Are you sure you want to disconnect Google Calendar?')) {
            return;
        }

        try {
            const response = await fetch('/api/google/auth/disconnect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ team_id: teamId }),
            });

            if (response.ok) {
                setConnectionStatus({ connected: false });
                setCalendars([]);
            }
        } catch (error) {
            console.error('Failed to disconnect:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-sm text-gray-500">Loading...</span>
            </div>
        );
    }

    if (!teamId) {
        return (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded">
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    Please save the workflow first to enable Google Calendar configuration.
                </p>
            </div>
        );
    }

    if (!connectionStatus?.connected) {
        return (
            <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-white rounded-lg shadow flex items-center justify-center">
                            <svg
                                className="w-6 h-6"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z"
                                    stroke="#4285f4"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M16 2V6M8 2V6M3 10H21"
                                    stroke="#4285f4"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                                Google Calendar
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Not connected</p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Connect your Google Calendar to create, update, and manage events directly from
                        your workflows.
                    </p>
                    <button
                        onClick={handleConnect}
                        className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="currentColor"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Connect Google Calendar
                    </button>
                </div>
                {connectingUrl && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded">
                        <p className="text-sm text-blue-700 dark:text-blue-400">
                            A new window has opened for Google authorization.{' '}
                            <button
                                onClick={checkConnectionStatus}
                                className="underline font-medium"
                            >
                                Click here to refresh
                            </button>{' '}
                            after completing the authorization.
                        </p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">
                            Connected
                        </span>
                        {connectionStatus.email && (
                            <span className="text-sm text-green-600 dark:text-green-500">
                                ({connectionStatus.email})
                            </span>
                        )}
                    </div>
                    <button
                        onClick={handleDisconnect}
                        className="text-xs text-red-600 hover:text-red-700 dark:text-red-400"
                    >
                        Disconnect
                    </button>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Operation
                </label>
                <select
                    value={operation}
                    onChange={(e) => setOperation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                    <option value="create">Create Event</option>
                    <option value="list">List Events</option>
                    <option value="update">Update Event</option>
                    <option value="delete">Delete Event</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Calendar
                </label>
                <select
                    value={calendarId}
                    onChange={(e) => setCalendarId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                    <option value="primary">Primary Calendar</option>
                    {calendars.map((cal) => (
                        <option key={cal.id} value={cal.id}>
                            {cal.summary}
                        </option>
                    ))}
                </select>
            </div>

            {(operation === 'update' || operation === 'delete') && (
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Event
                        </label>
                        <button
                            type="button"
                            onClick={() => setUseManualEventId(!useManualEventId)}
                            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                        >
                            {useManualEventId ? 'Select from list' : 'Enter manually'}
                        </button>
                    </div>

                    {useManualEventId ? (
                        <>
                            <input
                                type="text"
                                value={eventId}
                                onChange={(e) => setEventId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="Event ID or {{{input.eventId}}}"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Use {'{{{input.eventId}}}'} to get the ID from a previous node
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="relative">
                                <select
                                    value={eventId}
                                    onChange={(e) => setEventId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    disabled={eventsLoading}
                                >
                                    <option value="">
                                        {eventsLoading ? 'Loading events...' : 'Select an event'}
                                    </option>
                                    {events.map((event) => (
                                        <option key={event.id} value={event.id}>
                                            {event.summary || '(No title)'} -{' '}
                                            {event.start
                                                ? new Date(event.start).toLocaleDateString('hu-HU', {
                                                      month: 'short',
                                                      day: 'numeric',
                                                      hour: '2-digit',
                                                      minute: '2-digit',
                                                  })
                                                : 'No date'}
                                        </option>
                                    ))}
                                </select>
                                {eventsLoading && (
                                    <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                                        <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center justify-between mt-1">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Showing up to 50 upcoming events
                                </p>
                                <button
                                    type="button"
                                    onClick={fetchEvents}
                                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                    disabled={eventsLoading}
                                >
                                    Refresh
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {operation === 'list' && (
                <>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                From
                            </label>
                            <input
                                type="datetime-local"
                                value={timeMin}
                                onChange={(e) => setTimeMin(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                To
                            </label>
                            <input
                                type="datetime-local"
                                value={timeMax}
                                onChange={(e) => setTimeMax(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                            Max Results
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="100"
                            value={maxResults}
                            onChange={(e) => setMaxResults(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                </>
            )}

            {(operation === 'create' || operation === 'update') && (
                <>
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                            Event Title
                        </label>
                        <input
                            type="text"
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Meeting with team"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows="2"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Event description..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                            Location
                        </label>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Conference room or address"
                        />
                    </div>

                    <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded mb-3">
                        <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                                    Dynamic Values via Constant Nodes
                                </p>
                                <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                                    Connect <strong>Constant</strong> nodes to the top input of this node. In each Constant node, set the <strong>Target Field</strong> to specify which calendar field it should populate (e.g., Event Title, Start Date/Time, End Date/Time, Description, etc.). Connected values override the fields below.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                Start <span className="text-xs text-gray-400">(fallback)</span>
                            </label>
                            <input
                                type="datetime-local"
                                value={startDateTime}
                                onChange={(e) => setStartDateTime(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="Optional if node connected"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                End <span className="text-xs text-gray-400">(fallback)</span>
                            </label>
                            <input
                                type="datetime-local"
                                value={endDateTime}
                                onChange={(e) => setEndDateTime(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="Optional if node connected"
                            />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Leave empty if using connected Constant nodes with Target Field set to Start/End Date/Time.
                    </p>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                            Attendees (comma-separated emails)
                        </label>
                        <textarea
                            value={attendees}
                            onChange={(e) => setAttendees(e.target.value)}
                            rows="2"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="user@example.com, other@example.com"
                        />
                    </div>
                </>
            )}

            <div className="bg-white dark:bg-gray-800 p-3 rounded border border-blue-300 dark:border-blue-600">
                <p className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-2">
                    Configuration Preview:
                </p>
                <div className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                    <p>
                        <strong>Operation:</strong> {operation}
                    </p>
                    <p>
                        <strong>Calendar:</strong>{' '}
                        {calendars.find((c) => c.id === calendarId)?.summary || calendarId}
                    </p>
                    {operation === 'create' && summary && (
                        <p>
                            <strong>Event:</strong> {summary}
                        </p>
                    )}
                    {(operation === 'update' || operation === 'delete') && eventId && (
                        <p>
                            <strong>Event ID:</strong> {eventId}
                        </p>
                    )}
                </div>
            </div>

            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    <strong>Tip:</strong> Use {'{{{input.fieldName}}}'} to insert dynamic values from
                    previous workflow nodes.
                </p>
            </div>
        </div>
    );
};

export default GoogleCalendarConfig;
