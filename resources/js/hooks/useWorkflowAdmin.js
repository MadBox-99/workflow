import { useState, useEffect, useCallback } from "react";
import axios from "axios";

export const useWorkflowAdmin = (toast = null) => {
    const [workflows, setWorkflows] = useState([]);
    const [selectedWorkflow, setSelectedWorkflow] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [workflowName, setWorkflowName] = useState("");
    const [workflowDescription, setWorkflowDescription] = useState("");
    const [isScheduled, setIsScheduled] = useState(false);
    const [scheduleCron, setScheduleCron] = useState("*/5 * * * *");
    const [loading, setLoading] = useState(false);
    const [teamId, setTeamId] = useState(null);
    const [teams, setTeams] = useState([]);
    const [scheduleOptions, setScheduleOptions] = useState([]);

    // Helper to show notifications (toast or console fallback)
    const notify = useCallback(
        (type, title, message) => {
            if (toast && toast[type]) {
                toast[type](title, message);
            } else {
                console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
            }
        },
        [toast],
    );

    const fetchWorkflows = useCallback(async () => {
        try {
            console.log("Fetching workflows...");
            setLoading(true);
            const response = await axios.get("/api/workflows");
            console.log("Workflows fetched:", response.data);
            setWorkflows(response.data);
        } catch (error) {
            console.error("Error fetching workflows:", error);
            notify("error", "Error", "Failed to fetch workflows");
        } finally {
            setLoading(false);
        }
    }, [notify]);

    const fetchTeams = useCallback(async () => {
        try {
            const response = await axios.get("/api/teams");
            setTeams(response.data);
            // Auto-select first team if none selected
            if (response.data.length > 0 && !teamId) {
                setTeamId(response.data[0].id);
            }
        } catch (error) {
            console.error("Error fetching teams:", error);
        }
    }, [teamId]);

    const fetchScheduleOptions = useCallback(
        async (forTeamId) => {
            if (!forTeamId) {
                setScheduleOptions([]);
                return;
            }
            try {
                const response = await axios.get(
                    `/api/schedule-options?team_id=${forTeamId}`,
                );
                setScheduleOptions(response.data);
                // Set default cron if available and current is not in options
                if (response.data.length > 0) {
                    const currentInOptions = response.data.some(
                        (opt) => opt.value === scheduleCron,
                    );
                    if (!currentInOptions) {
                        setScheduleCron(response.data[0].value);
                    }
                }
            } catch (error) {
                console.error("Error fetching schedule options:", error);
                setScheduleOptions([]);
            }
        },
        [scheduleCron],
    );

    const loadWorkflowForEdit = useCallback(
        async (workflowId) => {
            try {
                setLoading(true);
                const response = await axios.get(
                    `/api/workflows/${workflowId}`,
                );
                const workflow = response.data;
                setSelectedWorkflow(workflow);
                setWorkflowName(workflow.name);
                setWorkflowDescription(workflow.description || "");
                setIsScheduled(workflow.is_scheduled || false);
                setScheduleCron(workflow.schedule_cron || "*/5 * * * *");
                setTeamId(workflow.team_id || null);
                setIsCreating(true);
            } catch (error) {
                console.error("Error loading workflow:", error);
                notify(
                    "error",
                    "Error",
                    "Failed to load workflow: " +
                        (error.response?.data?.message || error.message),
                );
            } finally {
                setLoading(false);
            }
        },
        [notify],
    );

    useEffect(() => {
        console.log("AdminApp mounted");
        fetchWorkflows();
        fetchTeams();

        // Check URL for workflow ID
        const urlParams = new URLSearchParams(window.location.search);
        const workflowId = urlParams.get("workflow");
        if (workflowId) {
            loadWorkflowForEdit(workflowId);
        }
    }, [fetchWorkflows, fetchTeams, loadWorkflowForEdit]);

    // Fetch schedule options when team changes
    useEffect(() => {
        if (teamId) {
            fetchScheduleOptions(teamId);
        }
    }, [teamId, fetchScheduleOptions]);

    const handleSaveWorkflow = useCallback(
        async (workflowData) => {
            if (!workflowName.trim()) {
                notify("warning", "Validation", "Please enter a workflow name");
                return;
            }

            if (!teamId) {
                notify("warning", "Validation", "Please select a team");
                return;
            }

            try {
                setLoading(true);
                const payload = {
                    name: workflowName,
                    description: workflowDescription,
                    team_id: teamId,
                    nodes: workflowData.nodes,
                    connections: workflowData.connections,
                    is_active: true,
                    is_scheduled: isScheduled,
                    schedule_cron: isScheduled ? scheduleCron : null,
                };

                if (selectedWorkflow) {
                    await axios.put(
                        `/api/workflows/${selectedWorkflow.id}`,
                        payload,
                    );
                    notify("success", "Saved", "Workflow updated successfully");
                    const updatedWorkflow = await axios.get(
                        `/api/workflows/${selectedWorkflow.id}`,
                    );
                    setSelectedWorkflow(updatedWorkflow.data);
                } else {
                    const response = await axios.post(
                        "/api/workflows",
                        payload,
                    );
                    notify(
                        "success",
                        "Created",
                        "Workflow created successfully",
                    );
                    setSelectedWorkflow(response.data);
                    setWorkflowName(response.data.name);
                    setWorkflowDescription(response.data.description || "");
                    setIsScheduled(response.data.is_scheduled || false);
                    setScheduleCron(
                        response.data.schedule_cron || "*/5 * * * *",
                    );
                }

                fetchWorkflows();
            } catch (error) {
                console.error("Error saving workflow:", error);
                notify(
                    "error",
                    "Error",
                    "Failed to save workflow: " +
                        (error.response?.data?.message || error.message),
                );
            } finally {
                setLoading(false);
            }
        },
        [
            workflowName,
            workflowDescription,
            isScheduled,
            scheduleCron,
            selectedWorkflow,
            fetchWorkflows,
            notify,
        ],
    );

    const handleEditWorkflow = useCallback((workflow) => {
        setSelectedWorkflow(workflow);
        setWorkflowName(workflow.name);
        setWorkflowDescription(workflow.description || "");
        setIsScheduled(workflow.is_scheduled || false);
        setScheduleCron(workflow.schedule_cron || "*/5 * * * *");
        setTeamId(workflow.team_id || null);
        setIsCreating(true);
    }, []);

    const handleDeleteWorkflow = useCallback(
        async (id) => {
            if (!confirm("Are you sure you want to delete this workflow?"))
                return;

            try {
                setLoading(true);
                await axios.delete(`/api/workflows/${id}`);
                notify("success", "Deleted", "Workflow deleted successfully");
                fetchWorkflows();
            } catch (error) {
                console.error("Error deleting workflow:", error);
                notify("error", "Error", "Failed to delete workflow");
            } finally {
                setLoading(false);
            }
        },
        [fetchWorkflows, notify],
    );

    const handleNewWorkflow = useCallback(() => {
        setIsCreating(true);
        setSelectedWorkflow(null);
        setWorkflowName("");
        setWorkflowDescription("");
        setIsScheduled(false);
        setScheduleCron("*/5 * * * *");
    }, []);

    const handleCloseEditor = useCallback(() => {
        setIsCreating(false);
        setSelectedWorkflow(null);
        setWorkflowName("");
        setWorkflowDescription("");
        setIsScheduled(false);
        setScheduleCron("*/5 * * * *");
    }, []);

    return {
        workflows,
        selectedWorkflow,
        isCreating,
        workflowName,
        workflowDescription,
        isScheduled,
        scheduleCron,
        loading,
        teamId,
        teams,
        scheduleOptions,
        setWorkflowName,
        setWorkflowDescription,
        setIsScheduled,
        setScheduleCron,
        setTeamId,
        handleSaveWorkflow,
        handleEditWorkflow,
        handleDeleteWorkflow,
        handleNewWorkflow,
        handleCloseEditor,
    };
};
