<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkflowNode extends Model
{
    use HasFactory;

    protected $fillable = [
        'workflow_id',
        'node_id',
        'type',
        'label',
        'data',
        'position',
    ];

    protected $casts = [
        'data' => 'array',
        'position' => 'array',
    ];

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class);
    }
}
