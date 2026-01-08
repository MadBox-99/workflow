<?php

use App\Mcp\Servers\FilamentServer;
use Laravel\Mcp\Facades\Mcp;

// Mcp::web('/mcp/demo', \App\Mcp\Servers\PublicServer::class);

Mcp::local('filament', FilamentServer::class);
