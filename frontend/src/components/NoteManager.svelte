<script>
    import { onMount } from 'svelte';

    let notes = [];
    let isLoading = true;
    let error = null;
    let currentWorkspaceId = null;
    let showNoteModal = false;
    let currentNoteContent = '';
    let attachedFiles = []; // Files attached to the current note being edited/created

    const getToken = () => localStorage.getItem('authToken');
    const backendUrl = import.meta.env.PUBLIC_BACKEND_URL || 'http://localhost:3001';
    
    async function apiCall(endpoint, method = 'GET', body = null) {
        const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
        const options = { method, headers, body: body ? JSON.stringify(body) : null };
        const response = await fetch(`${backendUrl}${endpoint}`, options);
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'API request failed.');
        }
        return response.status === 204 ? null : response.json();
    }

    async function loadInitialData() {
        isLoading = true;
        error = null;
        try {
            const workspaces = await apiCall('/api/workspaces');
            currentWorkspaceId = workspaces[0].id;
            notes = await apiCall(`/api/workspaces/${currentWorkspaceId}/notes`);
        } catch (err) {
            error = err.message;
        } finally {
            isLoading = false;
        }
    }

    function handleOpenNoteModal() {
        currentNoteContent = '';
        attachedFiles = [];
        showNoteModal = true;
    }

    async function handleFileUpload(event) {
        const files = event.target.files;
        if (!files.length) return;

        const formData = new FormData();
        formData.append('file', files[0]);

        try {
            const response = await fetch(`${backendUrl}/api/workspaces/${currentWorkspaceId}/upload`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${getToken()}` },
                body: formData,
            });
            if (!response.ok) throw new Error('Upload failed');
            const newMedia = await response.json();
            attachedFiles = [...attachedFiles, newMedia];
        } catch (err) {
            alert('Lỗi tải file: ' + err.message);
        }
    }

    async function handleNoteFormSubmit() {
        if (!currentNoteContent) return;
        const mediaIds = attachedFiles.map(file => file.id);
        const payload = { content: currentNoteContent, mediaIds };
        
        await apiCall(`/api/workspaces/${currentWorkspaceId}/notes`, 'POST', payload);
        showNoteModal = false;
        await loadInitialData();
    }

    async function handleDeleteNote(noteId) {
        if (confirm('Bạn có chắc muốn xóa ghi chú này?')) {
            await apiCall(`/api/notes/${noteId}`, 'DELETE');
            await loadInitialData();
        }
    }

    onMount(loadInitialData);
</script>

<div class="space-y-4">
    {#if isLoading}
        <p class="text-center text-slate-500 py-8">Đang tải ghi chú...</p>
    {:else if error}
        <p class="text-center text-red-500 py-8">{error}</p>
    {:else if notes.length === 0}
        <div class="text-center py-12 bg-white rounded-lg shadow-sm">
            <p class="text-slate-500">Chưa có ghi chú nào.</p>
        </div>
    {:else}
        {#each notes as note (note.id)}
            <div class="bg-white p-4 rounded-lg shadow-sm">
                <p class="text-slate-700 whitespace-pre-wrap">{note.content}</p>
                {#if note.attachments && note.attachments.length > 0}
                    <div class="mt-4 grid grid-cols-3 gap-2">
                        {#each note.attachments as attachment}
                            <img src="{backendUrl}{attachment.url}" alt="Attachment" class="rounded-md object-cover h-24 w-full">
                        {/each}
                    </div>
                {/if}
                <div class="text-right mt-2">
                    <button on:click={() => handleDeleteNote(note.id)} class="text-xs text-red-500 hover:underline">Xóa</button>
                </div>
            </div>
        {/each}
    {/if}
</div>

<div class="fixed bottom-24 right-4 z-10">
    <button on:click={handleOpenNoteModal} class="bg-pink-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-3xl font-light">+</button>
</div>

{#if showNoteModal}
<div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" on:click={() => showNoteModal = false}>
    <form on:submit|preventDefault={handleNoteFormSubmit} class="bg-white p-6 rounded-xl shadow-lg w-full max-w-md space-y-4" on:click|stopPropagation>
        <h3 class="text-lg font-bold">Thêm ghi chú mới</h3>
        <div>
            <textarea rows="5" bind:value={currentNoteContent} placeholder="Nội dung ghi chú..." class="w-full px-3 py-2 border border-slate-300 rounded-lg"></textarea>
        </div>
        <div>
            <label class="block text-sm font-medium">Đính kèm ảnh</label>
            <input type="file" on:change={handleFileUpload} accept="image/*" class="mt-1 text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"/>
            <div class="mt-2 flex flex-wrap gap-2">
                {#each attachedFiles as file}
                    <img src="{backendUrl}{file.url}" alt="Preview" class="h-16 w-16 rounded-md object-cover">
                {/each}
            </div>
        </div>
        <div class="mt-6 flex justify-end gap-3">
            <button type="button" on:click={() => showNoteModal = false} class="px-4 py-2 bg-slate-200 rounded-lg">Hủy</button>
            <button type="submit" class="px-4 py-2 bg-pink-600 text-white rounded-lg">Lưu ghi chú</button>
        </div>
    </form>
</div>
{/if}