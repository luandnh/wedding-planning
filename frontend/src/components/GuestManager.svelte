<script>
    import { onMount } from 'svelte';

    let guests = [];
    let isLoading = true;
    let error = null;
    let currentWorkspaceId = null;
    let showGuestModal = false;
    let currentGuest = {};

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
            guests = await apiCall(`/api/workspaces/${currentWorkspaceId}/guests`);
        } catch (err) {
            error = err.message;
        } finally {
            isLoading = false;
        }
    }

    function handleOpenGuestModal(guest = null) {
        currentGuest = guest ? { ...guest } : { id: null, name: '', phone: '', side: 'groom', status: 'pending' };
        showGuestModal = true;
    }

    async function handleGuestFormSubmit() {
        if (!currentGuest.name || !currentGuest.side) return;
        const endpoint = currentGuest.id ? `/api/guests/${currentGuest.id}` : `/api/workspaces/${currentWorkspaceId}/guests`;
        const method = currentGuest.id ? 'PUT' : 'POST';
        await apiCall(endpoint, method, currentGuest);
        showGuestModal = false;
        await loadInitialData();
    }

    async function handleDeleteGuest(guestId) {
        if (confirm('Bạn có chắc muốn xóa khách mời này?')) {
            await apiCall(`/api/guests/${guestId}`, 'DELETE');
            await loadInitialData();
        }
    }

    onMount(loadInitialData);

    $: guestsGroom = guests.filter(g => g.side === 'groom');
    $: guestsBride = guests.filter(g => g.side === 'bride');
</script>

<div class="space-y-4">
    {#if isLoading}
        <p class="text-center text-slate-500 py-8">Đang tải danh sách khách mời...</p>
    {:else if error}
        <p class="text-center text-red-500 py-8">{error}</p>
    {:else}
        <div class="grid grid-cols-2 gap-4 text-center">
            <div class="bg-white p-4 rounded-lg shadow-sm">
                <p class="font-semibold">Nhà Trai</p>
                <p class="text-2xl font-bold text-pink-600">{guestsGroom.length}</p>
            </div>
            <div class="bg-white p-4 rounded-lg shadow-sm">
                <p class="font-semibold">Nhà Gái</p>
                <p class="text-2xl font-bold text-pink-600">{guestsBride.length}</p>
            </div>
        </div>
        {#each [{title: 'Khách nhà trai', list: guestsGroom}, {title: 'Khách nhà gái', list: guestsBride}] as side}
            {#if side.list.length > 0}
            <div class="bg-white p-4 rounded-lg shadow-sm">
                <h3 class="font-bold mb-2">{side.title}</h3>
                <ul class="divide-y divide-slate-100">
                    {#each side.list as guest (guest.id)}
                    <li class="py-2 flex justify-between items-center">
                        <div>
                            <p class="font-medium">{guest.name}</p>
                            <p class="text-sm text-slate-500">{guest.phone || 'Chưa có SĐT'}</p>
                        </div>
                        <div class="flex items-center gap-2">
                            <button on:click={() => handleOpenGuestModal(guest)} class="text-slate-400 hover:text-blue-600"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                            <button on:click={() => handleDeleteGuest(guest.id)} class="text-slate-400 hover:text-red-600"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                        </div>
                    </li>
                    {/each}
                </ul>
            </div>
            {/if}
        {/each}
    {/if}
</div>

<div class="fixed bottom-24 right-4 z-10">
    <button on:click={() => handleOpenGuestModal()} class="bg-pink-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-3xl font-light">+</button>
</div>

{#if showGuestModal}
<div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" on:click={() => showGuestModal = false}>
    <form on:submit|preventDefault={handleGuestFormSubmit} class="bg-white p-6 rounded-xl shadow-lg w-full max-w-md space-y-4" on:click|stopPropagation>
        <h3 class="text-lg font-bold">{currentGuest.id ? 'Sửa thông tin khách mời' : 'Thêm khách mời mới'}</h3>
        <div>
            <label for="guest-name" class="block text-sm font-medium">Họ và tên</label>
            <input type="text" id="guest-name" required bind:value={currentGuest.name} class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg">
        </div>
        <div>
            <label for="guest-phone" class="block text-sm font-medium">Số điện thoại</label>
            <input type="tel" id="guest-phone" bind:value={currentGuest.phone} class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg">
        </div>
        <div>
            <span class="block text-sm font-medium">Khách mời thuộc</span>
            <div class="mt-2 flex gap-4">
                <label class="flex items-center"><input type="radio" bind:group={currentGuest.side} value="groom" class="text-pink-600"> <span class="ml-2">Nhà trai</span></label>
                <label class="flex items-center"><input type="radio" bind:group={currentGuest.side} value="bride" class="text-pink-600"> <span class="ml-2">Nhà gái</span></label>
            </div>
        </div>
        <div class="mt-6 flex justify-end gap-3">
            <button type="button" on:click={() => showGuestModal = false} class="px-4 py-2 bg-slate-200 rounded-lg">Hủy</button>
            <button type="submit" class="px-4 py-2 bg-pink-600 text-white rounded-lg">Lưu khách mời</button>
        </div>
    </form>
</div>
{/if}
