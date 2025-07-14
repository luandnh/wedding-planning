<script>
    import { onMount } from 'svelte';

    let members = [];
    let isLoading = true;
    let error = null;
    let currentWorkspaceId = null;
    let inviteEmail = '';
    let inviteError = null;
    let inviteSuccess = null;

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
            members = await apiCall(`/api/workspaces/${currentWorkspaceId}/members`);
        } catch (err) {
            error = err.message;
        } finally {
            isLoading = false;
        }
    }

    async function handleInviteSubmit() {
        inviteError = null;
        inviteSuccess = null;
        if (!inviteEmail) return;
        try {
            await apiCall(`/api/workspaces/${currentWorkspaceId}/members`, 'POST', { email: inviteEmail });
            inviteSuccess = `Đã gửi lời mời tới ${inviteEmail}!`;
            inviteEmail = '';
            await loadInitialData();
        } catch (err) {
            inviteError = err.message;
        }
    }
    
    async function handleRemoveMember(userId) {
        if (confirm('Bạn có chắc muốn xóa thành viên này khỏi kế hoạch?')) {
            try {
                await apiCall(`/api/workspaces/${currentWorkspaceId}/members/${userId}`, 'DELETE');
                await loadInitialData();
            } catch (err) {
                alert(err.message);
            }
        }
    }

    onMount(loadInitialData);
</script>

<div class="space-y-6">
    <!-- Invite Form -->
    <div class="bg-white p-4 rounded-lg shadow-sm">
        <h3 class="font-bold text-slate-800 mb-2">Mời thành viên mới</h3>
        <form on:submit|preventDefault={handleInviteSubmit} class="flex gap-2">
            <input type="email" bind:value={inviteEmail} placeholder="Nhập email..." required class="flex-grow px-3 py-2 border border-slate-300 rounded-lg">
            <button type="submit" class="bg-pink-600 text-white font-semibold px-4 py-2 rounded-lg">Mời</button>
        </form>
        {#if inviteError} <p class="text-red-500 text-sm mt-2">{inviteError}</p> {/if}
        {#if inviteSuccess} <p class="text-green-600 text-sm mt-2">{inviteSuccess}</p> {/if}
    </div>

    <!-- Member List -->
    <div class="bg-white p-4 rounded-lg shadow-sm">
        <h3 class="font-bold text-slate-800 mb-2">Danh sách thành viên</h3>
        {#if isLoading}
            <p class="text-center text-slate-500 py-8">Đang tải...</p>
        {:else if error}
            <p class="text-center text-red-500 py-8">{error}</p>
        {:else}
            <ul class="divide-y divide-slate-100">
                {#each members as member (member.userId)}
                    <li class="py-3 flex justify-between items-center">
                        <div class="flex items-center gap-3">
                            <img src={member.user.avatarUrl || `https://i.pravatar.cc/150?u=${member.userId}`} alt="avatar" class="w-10 h-10 rounded-full">
                            <div>
                                <p class="font-medium text-slate-800">{member.user.name}</p>
                                <p class="text-sm text-slate-500">{member.role === 'owner' ? 'Chủ sở hữu' : 'Thành viên'}</p>
                            </div>
                        </div>
                        {#if member.role !== 'owner'}
                            <button on:click={() => handleRemoveMember(member.userId)} class="text-slate-400 hover:text-red-600">Xóa</button>
                        {/if}
                    </li>
                {/each}
            </ul>
        {/if}
    </div>
</div>