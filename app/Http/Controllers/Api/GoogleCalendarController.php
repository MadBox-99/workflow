<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Team;
use App\Services\Google\GoogleCalendarService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GoogleCalendarController extends Controller
{
    public function __construct(
        protected GoogleCalendarService $calendarService
    ) {}

    public function calendars(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'team_id' => 'required|exists:teams,id',
        ]);

        $team = Team::findOrFail($validated['team_id']);

        if (! $team->hasGoogleCalendarConnected()) {
            return response()->json([
                'error' => 'Google Calendar is not connected',
            ], 400);
        }

        try {
            $calendars = $this->calendarService->listCalendars($team);

            return response()->json($calendars);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch calendars: '.$e->getMessage(),
            ], 500);
        }
    }

    public function events(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'team_id' => 'required|exists:teams,id',
            'calendar_id' => 'nullable|string',
            'time_min' => 'nullable|date',
            'time_max' => 'nullable|date',
            'max_results' => 'nullable|integer|min:1|max:100',
            'query' => 'nullable|string',
        ]);

        $team = Team::findOrFail($validated['team_id']);

        if (! $team->hasGoogleCalendarConnected()) {
            return response()->json([
                'error' => 'Google Calendar is not connected',
            ], 400);
        }

        try {
            $events = $this->calendarService->listEvents(
                $team,
                $validated['calendar_id'] ?? 'primary',
                [
                    'timeMin' => $validated['time_min'] ?? null,
                    'timeMax' => $validated['time_max'] ?? null,
                    'maxResults' => $validated['max_results'] ?? 10,
                    'query' => $validated['query'] ?? null,
                ]
            );

            return response()->json($events);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch events: '.$e->getMessage(),
            ], 500);
        }
    }
}
