<?php

namespace App\Services\Google;

use App\Models\Team;
use Google\Service\Calendar;
use Google\Service\Calendar\Event;
use Google\Service\Calendar\EventDateTime;
use Illuminate\Support\Facades\Log;

class GoogleCalendarService
{
    public function __construct(
        protected GoogleAuthService $authService
    ) {}

    protected function getCalendarService(Team $team): Calendar
    {
        $client = $this->authService->getAuthenticatedClient($team);

        return new Calendar($client);
    }

    public function listCalendars(Team $team): array
    {
        $service = $this->getCalendarService($team);
        $calendarList = $service->calendarList->listCalendarList();

        $calendars = [];
        foreach ($calendarList->getItems() as $calendar) {
            $calendars[] = [
                'id' => $calendar->getId(),
                'summary' => $calendar->getSummary(),
                'description' => $calendar->getDescription(),
                'primary' => $calendar->getPrimary() ?? false,
                'backgroundColor' => $calendar->getBackgroundColor(),
            ];
        }

        return $calendars;
    }

    public function listEvents(Team $team, string $calendarId = 'primary', array $options = []): array
    {
        $service = $this->getCalendarService($team);

        $optParams = [
            'maxResults' => $options['maxResults'] ?? 10,
            'orderBy' => 'startTime',
            'singleEvents' => true,
        ];

        if (! empty($options['timeMin'])) {
            $optParams['timeMin'] = $this->formatDateTime($options['timeMin']);
        } else {
            $optParams['timeMin'] = now()->toRfc3339String();
        }

        if (! empty($options['timeMax'])) {
            $optParams['timeMax'] = $this->formatDateTime($options['timeMax']);
        }

        if (! empty($options['query'])) {
            $optParams['q'] = $options['query'];
        }

        $results = $service->events->listEvents($calendarId, $optParams);

        $events = [];
        foreach ($results->getItems() as $event) {
            $events[] = $this->formatEvent($event);
        }

        return $events;
    }

    public function createEvent(Team $team, string $calendarId, array $eventData): array
    {
        Log::channel('workflow')->info('GoogleCalendarService.createEvent called', [
            'calendarId' => $calendarId,
            'eventData' => $eventData,
        ]);

        $service = $this->getCalendarService($team);

        $event = new Event;
        $event->setSummary($eventData['summary'] ?? '');
        $event->setDescription($eventData['description'] ?? '');
        $event->setLocation($eventData['location'] ?? '');

        $timeZone = $eventData['timeZone'] ?? config('app.timezone', 'Europe/Budapest');

        if (! empty($eventData['start'])) {
            $start = new EventDateTime;
            if (isset($eventData['start']['dateTime'])) {
                $formattedStart = $this->formatDateTime($eventData['start']['dateTime']);
                Log::channel('workflow')->info('Start datetime formatted', [
                    'original' => $eventData['start']['dateTime'],
                    'formatted' => $formattedStart,
                ]);
                $start->setDateTime($formattedStart);
                $start->setTimeZone($eventData['start']['timeZone'] ?? $timeZone);
            } elseif (isset($eventData['start']['date'])) {
                $start->setDate($eventData['start']['date']);
            }
            $event->setStart($start);
        }

        if (! empty($eventData['end'])) {
            $end = new EventDateTime;
            if (isset($eventData['end']['dateTime'])) {
                $formattedEnd = $this->formatDateTime($eventData['end']['dateTime']);
                Log::channel('workflow')->info('End datetime formatted', [
                    'original' => $eventData['end']['dateTime'],
                    'formatted' => $formattedEnd,
                ]);
                $end->setDateTime($formattedEnd);
                $end->setTimeZone($eventData['end']['timeZone'] ?? $timeZone);
            } elseif (isset($eventData['end']['date'])) {
                $end->setDate($eventData['end']['date']);
            }
            $event->setEnd($end);
        }

        if (! empty($eventData['attendees'])) {
            $attendees = [];
            foreach ($eventData['attendees'] as $attendee) {
                $attendees[] = new \Google\Service\Calendar\EventAttendee([
                    'email' => $attendee['email'],
                ]);
            }
            $event->setAttendees($attendees);
        }

        $createdEvent = $service->events->insert($calendarId, $event);

        Log::info('Google Calendar event created', [
            'event_id' => $createdEvent->getId(),
            'summary' => $createdEvent->getSummary(),
        ]);

        return $this->formatEvent($createdEvent);
    }

    public function updateEvent(Team $team, string $calendarId, string $eventId, array $eventData): array
    {
        try {
            $service = $this->getCalendarService($team);

            $event = $service->events->get($calendarId, $eventId);

            if (isset($eventData['summary'])) {
                $event->setSummary($eventData['summary']);
            }

            if (isset($eventData['description'])) {
                $event->setDescription($eventData['description']);
            }

            if (isset($eventData['location'])) {
                $event->setLocation($eventData['location']);
            }

            $timeZone = $eventData['timeZone'] ?? config('app.timezone', 'Europe/Budapest');

            if (! empty($eventData['start'])) {
                $start = new EventDateTime;
                if (isset($eventData['start']['dateTime'])) {
                    $start->setDateTime($this->formatDateTime($eventData['start']['dateTime']));
                    $start->setTimeZone($eventData['start']['timeZone'] ?? $timeZone);
                }
                $event->setStart($start);
            }

            if (! empty($eventData['end'])) {
                $end = new EventDateTime;
                if (isset($eventData['end']['dateTime'])) {
                    $end->setDateTime($this->formatDateTime($eventData['end']['dateTime']));
                    $end->setTimeZone($eventData['end']['timeZone'] ?? $timeZone);
                }
                $event->setEnd($end);
            }

            $updatedEvent = $service->events->update($calendarId, $eventId, $event);

            Log::info('Google Calendar event updated', [
                'event_id' => $updatedEvent->getId(),
                'summary' => $updatedEvent->getSummary(),
            ]);

            return $this->formatEvent($updatedEvent);
        } catch (\Google\Service\Exception $e) {
            if ($e->getCode() === 404) {
                Log::warning('Google Calendar event not found for update', [
                    'event_id' => $eventId,
                    'calendar_id' => $calendarId,
                ]);

                return [
                    'success' => false,
                    'error' => 'Event not found',
                    'errorCode' => 'EVENT_NOT_FOUND',
                    'message' => "Az esemény ({$eventId}) nem található. Lehet, hogy egy korábbi node törölte.",
                ];
            }
            throw $e;
        }
    }

    public function deleteEvent(Team $team, string $calendarId, string $eventId): array
    {
        try {
            $service = $this->getCalendarService($team);

            $service->events->delete($calendarId, $eventId);

            Log::info('Google Calendar event deleted', [
                'event_id' => $eventId,
                'calendar_id' => $calendarId,
            ]);

            return [
                'deleted' => true,
                'deletedEventId' => $eventId,
            ];
        } catch (\Google\Service\Exception $e) {
            if ($e->getCode() === 404) {
                Log::warning('Google Calendar event not found for delete', [
                    'event_id' => $eventId,
                    'calendar_id' => $calendarId,
                ]);

                return [
                    'success' => false,
                    'error' => 'Event not found',
                    'errorCode' => 'EVENT_NOT_FOUND',
                    'message' => "Az esemény ({$eventId}) nem található. Lehet, hogy már törölve lett.",
                ];
            }
            throw $e;
        }
    }

    public function getEvent(Team $team, string $calendarId, string $eventId): array
    {
        $service = $this->getCalendarService($team);
        $event = $service->events->get($calendarId, $eventId);

        return $this->formatEvent($event);
    }

    protected function formatEvent(Event $event): array
    {
        return [
            'id' => $event->getId(),
            'summary' => $event->getSummary(),
            'description' => $event->getDescription(),
            'location' => $event->getLocation(),
            'start' => $event->getStart()?->getDateTime() ?? $event->getStart()?->getDate(),
            'end' => $event->getEnd()?->getDateTime() ?? $event->getEnd()?->getDate(),
            'htmlLink' => $event->getHtmlLink(),
            'status' => $event->getStatus(),
            'created' => $event->getCreated(),
            'updated' => $event->getUpdated(),
            'attendees' => collect($event->getAttendees() ?? [])->map(fn ($a) => [
                'email' => $a->getEmail(),
                'responseStatus' => $a->getResponseStatus(),
            ])->toArray(),
        ];
    }

    protected function formatDateTime(string $dateTime): string
    {
        try {
            return \Carbon\Carbon::parse($dateTime)->toRfc3339String();
        } catch (\Exception $e) {
            return $dateTime;
        }
    }
}
