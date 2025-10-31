<x-filament-panels::page>
    <div class="space-y-4">
        <div class="bg-white p-4 rounded-lg shadow">
            <h2 class="text-xl font-bold mb-4">Workflow Visual Editor</h2>
            <p class="text-gray-600 mb-4">
                Használja a teljes funkcionalitású React Flow editort a workflow szerkesztéséhez:
            </p>
            <div class="flex gap-3">
                <a href="{{ url('/admin?workflow=' . $record->id) }}"
                    target="_blank"
                    class="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 shadow-md transition">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Workflow Editor Megnyitása
                </a>
                <a href="{{ \App\Filament\Resources\Workflows\WorkflowResource::getUrl('index') }}"
                    class="inline-flex items-center px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                    ← Vissza a listához
                </a>
            </div>
        </div>

        <div class="bg-white p-4 rounded-lg shadow">
            <h3 class="font-semibold mb-2">Workflow Információk</h3>
            <dl class="grid grid-cols-2 gap-4">
                <div>
                    <dt class="text-sm font-medium text-gray-500">Név</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ $record->name }}</dd>
                </div>
                <div>
                    <dt class="text-sm font-medium text-gray-500">Státusz</dt>
                    <dd class="mt-1 text-sm text-gray-900">
                        <span
                            class="px-2 py-1 text-xs rounded {{ $record->is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800' }}">
                            {{ $record->is_active ? 'Aktív' : 'Inaktív' }}
                        </span>
                    </dd>
                </div>
                <div class="col-span-2">
                    <dt class="text-sm font-medium text-gray-500">Leírás</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ $record->description ?? 'Nincs leírás' }}</dd>
                </div>
                <div>
                    <dt class="text-sm font-medium text-gray-500">Node-ok száma</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ $record->nodes->count() }}</dd>
                </div>
                <div>
                    <dt class="text-sm font-medium text-gray-500">Kapcsolatok száma</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ $record->connections->count() }}</dd>
                </div>
            </dl>
        </div>
    </div>
</x-filament-panels::page>
