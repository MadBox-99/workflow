<?php

use App\Models\Team;
use App\Models\TeamGoogleCredential;
use App\Models\Workflow;
use App\Models\WorkflowNode;
use App\Services\Google\GoogleCalendarService;
use App\Services\Workflow\WorkflowRunnerService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->team = Team::factory()->create();
    $this->workflow = Workflow::factory()->for($this->team)->create();
});

describe('executeGoogleCalendarAction', function () {
    it('fails when Google Calendar is not connected', function () {
        WorkflowNode::factory()->for($this->workflow)->create([
            'node_id' => 'start-1',
            'type' => 'start',
            'data' => ['type' => 'start', 'config' => ['value' => true]],
        ]);

        WorkflowNode::factory()->for($this->workflow)->create([
            'node_id' => 'calendar-1',
            'type' => 'googleCalendarAction',
            'data' => [
                'type' => 'googleCalendarAction',
                'config' => [
                    'operation' => 'create',
                    'summary' => 'Test Event',
                ],
            ],
        ]);

        $this->workflow->connections()->create([
            'connection_id' => 'conn-1',
            'source_node_id' => 'start-1',
            'target_node_id' => 'calendar-1',
            'source_handle' => 'bottom-source',
            'target_handle' => 'top-target',
        ]);

        $runner = new WorkflowRunnerService;
        $result = $runner->execute($this->workflow->fresh());

        expect($result['success'])->toBeFalse();
        expect($result['failedNodes'])->toHaveCount(1);
        expect($result['failedNodes'][0]['error'])->toContain('Google Calendar is not connected');
    });

    it('creates event when connected', function () {
        TeamGoogleCredential::factory()->for($this->team)->create();

        $this->mock(GoogleCalendarService::class, function ($mock) {
            $mock->shouldReceive('createEvent')
                ->once()
                ->andReturn([
                    'id' => 'test-event-id',
                    'summary' => 'Test Event',
                    'htmlLink' => 'https://calendar.google.com/event/test',
                ]);
        });

        WorkflowNode::factory()->for($this->workflow)->create([
            'node_id' => 'start-1',
            'type' => 'start',
            'data' => ['type' => 'start', 'config' => ['value' => true]],
        ]);

        WorkflowNode::factory()->for($this->workflow)->create([
            'node_id' => 'calendar-1',
            'type' => 'googleCalendarAction',
            'data' => [
                'type' => 'googleCalendarAction',
                'config' => [
                    'operation' => 'create',
                    'calendarId' => 'primary',
                    'summary' => 'Test Event',
                    'description' => 'Test Description',
                    'startDateTime' => '2024-01-15T09:00:00',
                    'endDateTime' => '2024-01-15T10:00:00',
                ],
            ],
        ]);

        WorkflowNode::factory()->for($this->workflow)->create([
            'node_id' => 'end-1',
            'type' => 'end',
            'data' => ['type' => 'end', 'config' => []],
        ]);

        $this->workflow->connections()->createMany([
            [
                'connection_id' => 'conn-1',
                'source_node_id' => 'start-1',
                'target_node_id' => 'calendar-1',
                'source_handle' => 'bottom-source',
                'target_handle' => 'top-target',
            ],
            [
                'connection_id' => 'conn-2',
                'source_node_id' => 'calendar-1',
                'target_node_id' => 'end-1',
                'source_handle' => 'bottom-source',
                'target_handle' => 'top-target',
            ],
        ]);

        $runner = new WorkflowRunnerService;
        $result = $runner->execute($this->workflow->fresh());

        expect($result['success'])->toBeTrue();
        expect($result['outputs']['calendar-1'])->toHaveKey('id', 'test-event-id');
    });

    it('lists events when connected', function () {
        TeamGoogleCredential::factory()->for($this->team)->create();

        $this->mock(GoogleCalendarService::class, function ($mock) {
            $mock->shouldReceive('listEvents')
                ->once()
                ->andReturn([
                    ['id' => 'event-1', 'summary' => 'Event 1'],
                    ['id' => 'event-2', 'summary' => 'Event 2'],
                ]);
        });

        WorkflowNode::factory()->for($this->workflow)->create([
            'node_id' => 'start-1',
            'type' => 'start',
            'data' => ['type' => 'start', 'config' => ['value' => true]],
        ]);

        WorkflowNode::factory()->for($this->workflow)->create([
            'node_id' => 'calendar-1',
            'type' => 'googleCalendarAction',
            'data' => [
                'type' => 'googleCalendarAction',
                'config' => [
                    'operation' => 'list',
                    'calendarId' => 'primary',
                    'maxResults' => 10,
                ],
            ],
        ]);

        $this->workflow->connections()->create([
            'connection_id' => 'conn-1',
            'source_node_id' => 'start-1',
            'target_node_id' => 'calendar-1',
            'source_handle' => 'bottom-source',
            'target_handle' => 'top-target',
        ]);

        $runner = new WorkflowRunnerService;
        $result = $runner->execute($this->workflow->fresh());

        expect($result['success'])->toBeTrue();
        expect($result['outputs']['calendar-1'])->toHaveCount(2);
    });

    it('deletes event when connected', function () {
        TeamGoogleCredential::factory()->for($this->team)->create();

        $this->mock(GoogleCalendarService::class, function ($mock) {
            $mock->shouldReceive('deleteEvent')
                ->once()
                ->andReturn(['success' => true, 'eventId' => 'event-to-delete']);
        });

        WorkflowNode::factory()->for($this->workflow)->create([
            'node_id' => 'start-1',
            'type' => 'start',
            'data' => ['type' => 'start', 'config' => ['value' => true]],
        ]);

        WorkflowNode::factory()->for($this->workflow)->create([
            'node_id' => 'calendar-1',
            'type' => 'googleCalendarAction',
            'data' => [
                'type' => 'googleCalendarAction',
                'config' => [
                    'operation' => 'delete',
                    'calendarId' => 'primary',
                    'eventId' => 'event-to-delete',
                ],
            ],
        ]);

        $this->workflow->connections()->create([
            'connection_id' => 'conn-1',
            'source_node_id' => 'start-1',
            'target_node_id' => 'calendar-1',
            'source_handle' => 'bottom-source',
            'target_handle' => 'top-target',
        ]);

        $runner = new WorkflowRunnerService;
        $result = $runner->execute($this->workflow->fresh());

        expect($result['success'])->toBeTrue();
        expect($result['outputs']['calendar-1'])->toHaveKey('success', true);
    });
});

describe('Team Google Calendar connection', function () {
    it('correctly reports connection status', function () {
        expect($this->team->hasGoogleCalendarConnected())->toBeFalse();

        TeamGoogleCredential::factory()->for($this->team)->create();

        expect($this->team->fresh()->hasGoogleCalendarConnected())->toBeTrue();
    });
});
