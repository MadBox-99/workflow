<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkflowConnection extends Model
{
    protected $fillable = [
        'workflow_id',
        'connection_id',
        'source_node_id',
        'target_node_id',
        'source_handle',
        'target_handle',
    ];

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class);
    }
}
