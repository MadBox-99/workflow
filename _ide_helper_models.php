<?php

// @formatter:off
// phpcs:ignoreFile
/**
 * A helper file for your Eloquent Models
 * Copy the phpDocs from this file to the correct Model,
 * And remove them from this file, to prevent double declarations.
 *
 * @author Barry vd. Heuvel <barryvdh@gmail.com>
 */


namespace App\Models{
/**
 * @property int $id
 * @property int $team_id
 * @property string $name
 * @property string $slug
 * @property string $subject
 * @property string $body_html
 * @property string|null $body_text
 * @property array<array-key, mixed>|null $variables
 * @property bool $is_active
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Team $team
 * @method static \Database\Factories\EmailTemplateFactory factory($count = null, $state = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EmailTemplate newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EmailTemplate newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EmailTemplate query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EmailTemplate whereBodyHtml($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EmailTemplate whereBodyText($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EmailTemplate whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EmailTemplate whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EmailTemplate whereIsActive($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EmailTemplate whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EmailTemplate whereSlug($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EmailTemplate whereSubject($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EmailTemplate whereTeamId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EmailTemplate whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|EmailTemplate whereVariables($value)
 */
	class EmailTemplate extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property string $name
 * @property string $cron_expression
 * @property string|null $description
 * @property int $sort_order
 * @property bool $is_active
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Team> $teams
 * @property-read int|null $teams_count
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ScheduleOption active()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ScheduleOption newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ScheduleOption newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ScheduleOption ordered()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ScheduleOption query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ScheduleOption whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ScheduleOption whereCronExpression($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ScheduleOption whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ScheduleOption whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ScheduleOption whereIsActive($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ScheduleOption whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ScheduleOption whereSortOrder($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ScheduleOption whereUpdatedAt($value)
 */
	class ScheduleOption extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property int $owner_id
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\EmailTemplate> $emailTemplates
 * @property-read int|null $email_templates_count
 * @property-read \App\Models\TeamGoogleCredential|null $googleCredential
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\User> $members
 * @property-read int|null $members_count
 * @property-read \App\Models\User $owner
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\ScheduleOption> $scheduleOptions
 * @property-read int|null $schedule_options_count
 * @method static \Database\Factories\TeamFactory factory($count = null, $state = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Team newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Team newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Team query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Team whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Team whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Team whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Team whereOwnerId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Team whereSlug($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Team whereUpdatedAt($value)
 */
	class Team extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property int $team_id
 * @property string $access_token
 * @property string $refresh_token
 * @property string $token_type
 * @property \Illuminate\Support\Carbon|null $expires_at
 * @property array<array-key, mixed>|null $scopes
 * @property string|null $google_email
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Team $team
 * @method static \Database\Factories\TeamGoogleCredentialFactory factory($count = null, $state = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TeamGoogleCredential newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TeamGoogleCredential newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TeamGoogleCredential query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TeamGoogleCredential whereAccessToken($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TeamGoogleCredential whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TeamGoogleCredential whereExpiresAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TeamGoogleCredential whereGoogleEmail($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TeamGoogleCredential whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TeamGoogleCredential whereRefreshToken($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TeamGoogleCredential whereScopes($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TeamGoogleCredential whereTeamId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TeamGoogleCredential whereTokenType($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TeamGoogleCredential whereUpdatedAt($value)
 */
	class TeamGoogleCredential extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property \Illuminate\Support\Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $remember_token
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Notifications\DatabaseNotificationCollection<int, \Illuminate\Notifications\DatabaseNotification> $notifications
 * @property-read int|null $notifications_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Team> $ownedTeams
 * @property-read int|null $owned_teams_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Team> $teams
 * @property-read int|null $teams_count
 * @method static \Database\Factories\UserFactory factory($count = null, $state = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereEmail($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereEmailVerifiedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User wherePassword($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereRememberToken($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereUpdatedAt($value)
 */
	class User extends \Eloquent implements \Filament\Models\Contracts\HasTenants {}
}

namespace App\Models{
/**
 * @property int $id
 * @property int|null $team_id
 * @property string $name
 * @property string|null $description
 * @property bool $is_active
 * @property array<array-key, mixed>|null $metadata
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property bool $is_scheduled
 * @property \Illuminate\Support\Carbon|null $last_run_at
 * @property \Illuminate\Support\Carbon|null $next_run_at
 * @property string|null $schedule_cron
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\WorkflowConnection> $connections
 * @property-read int|null $connections_count
 * @property-read string|null $schedule_description
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\WorkflowNode> $nodes
 * @property-read int|null $nodes_count
 * @property-read \App\Models\Team|null $team
 * @method static \Database\Factories\WorkflowFactory factory($count = null, $state = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Workflow newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Workflow newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Workflow query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Workflow whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Workflow whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Workflow whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Workflow whereIsActive($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Workflow whereIsScheduled($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Workflow whereLastRunAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Workflow whereMetadata($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Workflow whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Workflow whereNextRunAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Workflow whereScheduleCron($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Workflow whereTeamId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Workflow whereUpdatedAt($value)
 */
	class Workflow extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property int $workflow_id
 * @property string $connection_id
 * @property string $source_node_id
 * @property string $target_node_id
 * @property string|null $source_handle
 * @property string|null $target_handle
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Workflow $workflow
 * @method static \Illuminate\Database\Eloquent\Builder<static>|WorkflowConnection newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|WorkflowConnection newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|WorkflowConnection query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|WorkflowConnection whereConnectionId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|WorkflowConnection whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|WorkflowConnection whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|WorkflowConnection whereSourceHandle($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|WorkflowConnection whereSourceNodeId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|WorkflowConnection whereTargetHandle($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|WorkflowConnection whereTargetNodeId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|WorkflowConnection whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|WorkflowConnection whereWorkflowId($value)
 */
	class WorkflowConnection extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property int $workflow_id
 * @property string $node_id
 * @property string $type
 * @property string|null $label
 * @property array<array-key, mixed>|null $data
 * @property array<array-key, mixed>|null $position
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Workflow $workflow
 * @method static \Database\Factories\WorkflowNodeFactory factory($count = null, $state = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static>|WorkflowNode newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|WorkflowNode newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|WorkflowNode query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|WorkflowNode whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|WorkflowNode whereData($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|WorkflowNode whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|WorkflowNode whereLabel($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|WorkflowNode whereNodeId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|WorkflowNode wherePosition($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|WorkflowNode whereType($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|WorkflowNode whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|WorkflowNode whereWorkflowId($value)
 */
	class WorkflowNode extends \Eloquent {}
}

