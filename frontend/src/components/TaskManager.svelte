<script>
    import { onMount } from 'svelte';
  export let token;
    // --- State ---
    let tasks = [];
    let isLoading = true;
    let error = null;
    let currentWorkspaceId = null;
    let showTaskModal = false;
    let currentTask = {};

    // --- Helpers & API ---
    const getToken = () => localStorage.getItem('authToken');
    const backendUrl = import.meta.env.PUBLIC_BACKEND_URL || 'http://localhost:3001';
    async function apiCall(endpoint, method = 'GET', body = null) {
        const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
        const options = { method, headers, body: body ? JSON.stringify(body) : null };
        const response = await fetch(`${backendUrl}${endpoint}`, options);
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'API request failed.');
        }
        return response.status === 204 ? null : response.json();
    }

    // --- Data Loading ---
    async function loadInitialData() {
        isLoading = true;
        error = null;
        try {
            const workspaces = await apiCall('/api/workspaces');
            currentWorkspaceId = workspaces[0].id;
            tasks = await apiCall(`/api/workspaces/${currentWorkspaceId}/tasks`);
        } catch (err) {
            error = err.message;
        } finally {
            isLoading = false;
        }
    }

    // --- Event Handlers ---
    function handleOpenTaskModal(task = null) {
        currentTask = task ? { ...task } : { id: null, title: '', description: '', status: 'todo', priority: 'medium' };
        showTaskModal = true;
    }

    async function handleTaskFormSubmit() {
        if (!currentTask.title) return;
        const endpoint = currentTask.id ? `/api/tasks/${currentTask.id}` : `/api/workspaces/${currentWorkspaceId}/tasks`;
        const method = currentTask.id ? 'PUT' : 'POST';
        await apiCall(endpoint, method, currentTask);
        showTaskModal = false;
        await loadInitialData();
    }

    async function handleDeleteTask(taskId) {
        if (confirm('Bạn có chắc muốn xóa công việc này?')) {
            await apiCall(`/api/tasks/${taskId}`, 'DELETE');
            await loadInitialData();
        }
    }

    onMount(loadInitialData);
</script>

<!-- Main Template -->
<div class="space-y-4">
    {#if isLoading}
        <p class="text-center text-slate-500 py-8">Đang tải công việc...</p>
    {:else if error}
        <p class="text-center text-red-500 py-8">{error}</p>
    {:else if tasks.length === 0}
        <div class="text-center py-12 bg-white rounded-lg shadow-sm">
            <p class="text-slate-500">Tuyệt vời! Chưa có công việc nào.</p>
            <button on:click={() => handleOpenTaskModal()} class="mt-4 bg-pink-600 text-white font-semibold py-2 px-4 rounded-lg">
                + Tạo công việc đầu tiên
            </button>
        </div>
    {:else}
        {#each tasks as task (task.id)}
            <div class="bg-white p-4 rounded-lg shadow-sm flex items-start gap-4">
                <input type="checkbox" class="mt-1 h-5 w-5 rounded border-gray-300 text-pink-600 focus:ring-pink-500">
                <div class="flex-1">
                    <p class="font-semibold text-slate-800">{task.title}</p>
                    {#if task.description}
                        <p class="text-sm text-slate-600">{task.description}</p>
                    {/if}
                </div>
                <div class="flex items-center gap-2">
                    <button on:click={() => handleOpenTaskModal(task)} class="text-slate-400 hover:text-blue-600"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                    <button on:click={() => handleDeleteTask(task.id)} class="text-slate-400 hover:text-red-600"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                </div>
            </div>
        {/each}
    {/if}
</div>

<!-- Add New Task Button -->
<div class="fixed bottom-24 right-4 z-10">
    <button on:click={() => handleOpenTaskModal()} class="bg-pink-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-3xl font-light">+</button>
</div>

<!-- Task Modal -->
{#if showTaskModal}
<div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" on:click={() => showTaskModal = false}>
    <div class="bg-white p-6 rounded-xl shadow-lg w-full max-w-md" on:click|stopPropagation>
        <h3 class="text-lg font-bold mb-4">{currentTask.id ? 'Sửa công việc' : 'Thêm công việc mới'}</h3>
        <form on:submit|preventDefault={handleTaskFormSubmit} class="space-y-4">
            <div>
                <label for="task-title" class="block text-sm font-medium">Tiêu đề</label>
                <input type="text" id="task-title" required bind:value={currentTask.title} class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg">
            </div>
            <div>
                <label for="task-desc" class="block text-sm font-medium">Mô tả (tùy chọn)</label>
                <textarea id="task-desc" bind:value={currentTask.description} rows="3" class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg"></textarea>
            </div>
            <div class="mt-6 flex justify-end gap-3">
                <button type="button" on:click={() => showTaskModal = false} class="px-4 py-2 bg-slate-200 rounded-lg hover:bg-slate-300">Hủy</button>
                <button type="submit" class="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700">Lưu công việc</button>
            </div>
        </form>
    </div>
</div>
{/if}