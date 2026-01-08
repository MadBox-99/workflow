import React from 'react';

const WorkflowForm = ({
    workflowName,
    workflowDescription,
    isScheduled,
    scheduleCron,
    selectedWorkflow,
    teamId,
    teams = [],
    scheduleOptions = [],
    onNameChange,
    onDescriptionChange,
    onScheduledChange,
    onScheduleCronChange,
    onTeamChange,
}) => {

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                {selectedWorkflow ? 'Edit Workflow' : 'Create New Workflow'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left column - Basic info */}
                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                            Name
                        </label>
                        <input
                            type="text"
                            value={workflowName}
                            onChange={(e) => onNameChange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Workflow name"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                            Team
                        </label>
                        <select
                            value={teamId || ''}
                            onChange={(e) => onTeamChange(e.target.value ? Number(e.target.value) : null)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="">Select team...</option>
                            {teams.map((team) => (
                                <option key={team.id} value={team.id}>
                                    {team.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                            Description
                        </label>
                        <textarea
                            value={workflowDescription}
                            onChange={(e) => onDescriptionChange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Workflow description"
                            rows="2"
                        />
                    </div>
                </div>

                {/* Right column - Schedule settings */}
                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                            Ütemezett futtatás
                        </label>
                        <div className="flex items-center gap-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isScheduled}
                                    onChange={(e) => onScheduledChange(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-blue-600"></div>
                                <span className="ms-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {isScheduled ? 'Bekapcsolva' : 'Kikapcsolva'}
                                </span>
                            </label>
                        </div>
                    </div>

                    {isScheduled && teamId && (
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                                Futtatási gyakoriság
                            </label>
                            {scheduleOptions.length > 0 ? (
                                <select
                                    value={scheduleCron || ''}
                                    onChange={(e) => onScheduleCronChange(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="">Válassz...</option>
                                    {scheduleOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                    Nincs elérhető ütemezési lehetőség ehhez a csapathoz
                                </p>
                            )}
                        </div>
                    )}

                    {isScheduled && !teamId && (
                        <p className="text-sm text-amber-600 dark:text-amber-400">
                            Válassz csapatot az ütemezési lehetőségek megtekintéséhez
                        </p>
                    )}

                    {(selectedWorkflow?.last_run_at || selectedWorkflow?.next_run_at) && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-600">
                            {selectedWorkflow?.last_run_at && (
                                <p>
                                    <span className="font-medium">Utolsó futás:</span>{' '}
                                    {new Date(selectedWorkflow.last_run_at).toLocaleString()}
                                </p>
                            )}
                            {selectedWorkflow?.next_run_at && (
                                <p>
                                    <span className="font-medium">Következő futás:</span>{' '}
                                    {new Date(selectedWorkflow.next_run_at).toLocaleString()}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WorkflowForm;
