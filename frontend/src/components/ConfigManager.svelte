<script>
    import { onMount } from 'svelte';

    let config = { groomName: '', brideName: '', venue: '', logoUrl: '', importantDates: [] };
    let isLoading = true;
    let error = null;
    let successMessage = '';
    let currentWorkspaceId = null;

    // --- API Helpers ---
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

    // --- Data Loading ---
    async function loadInitialData() {
        isLoading = true;
        error = null;
        try {
            const workspaces = await apiCall('/api/workspaces');
            currentWorkspaceId = workspaces[0].id;
            const loadedConfig = await apiCall(`/api/workspaces/${currentWorkspaceId}/config`);
            // Đảm bảo importantDates luôn là một mảng
            config = { ...loadedConfig, importantDates: loadedConfig.importantDates || [] };
        } catch (err) {
            error = err.message;
        } finally {
            isLoading = false;
        }
    }

    // --- Form Submission ---
    async function handleConfigSubmit() {
        error = null;
        successMessage = '';
        try {
            await apiCall(`/api/workspaces/${currentWorkspaceId}/config`, 'PUT', config);
            successMessage = 'Cập nhật thông tin thành công!';
            setTimeout(() => successMessage = '', 3000);
        } catch (err) {
            error = err.message;
        }
    }
    
    // --- Logo Upload ---
    async function handleLogoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const newMedia = await fetch(`${backendUrl}/api/workspaces/${currentWorkspaceId}/upload`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${getToken()}` },
                body: formData,
            }).then(res => {
                if (!res.ok) throw new Error('Upload failed');
                return res.json();
            });
            config.logoUrl = newMedia.url; // Cập nhật trạng thái config
            config = config; // Kích hoạt Svelte reactivity
        } catch (err) {
            error = 'Lỗi tải ảnh lên: ' + err.message;
        }
    }

    // --- Important Dates Management ---
    function addImportantDate() {
        config.importantDates = [...config.importantDates, { name: '', date: '' }];
    }

    function removeImportantDate(index) {
        config.importantDates = config.importantDates.filter((_, i) => i !== index);
    }

    onMount(loadInitialData);
</script>

<div class="bg-white p-6 rounded-lg shadow-sm">
    {#if isLoading}
        <p class="text-center text-slate-500 py-8">Đang tải cấu hình...</p>
    {:else if error}
        <p class="text-center text-red-500 py-8">{error}</p>
    {:else}
        <form on:submit|preventDefault={handleConfigSubmit} class="space-y-6">
            <!-- Basic Info -->
            <div>
                <h3 class="font-bold text-lg text-slate-800 mb-2">Thông tin cơ bản</h3>
                <div class="space-y-4">
                    <div>
                        <label for="groom-name" class="block text-sm font-medium text-slate-700">Tên chú rể</label>
                        <input type="text" id="groom-name" bind:value={config.groomName} class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg">
                    </div>
                    <div>
                        <label for="bride-name" class="block text-sm font-medium text-slate-700">Tên cô dâu</label>
                        <input type="text" id="bride-name" bind:value={config.brideName} class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg">
                    </div>
                    <div>
                        <label for="venue" class="block text-sm font-medium text-slate-700">Địa điểm tổ chức</label>
                        <input type="text" id="venue" bind:value={config.venue} class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg">
                    </div>
                </div>
            </div>

            <!-- Logo Upload -->
            <div>
                <h3 class="font-bold text-lg text-slate-800 mb-2">Logo đám cưới</h3>
                <div class="flex items-center gap-4">
                    {#if config.logoUrl}
                        <img src="{backendUrl}{config.logoUrl}" alt="Logo" class="w-20 h-20 rounded-full object-cover border">
                    {/if}
                    <label class="block">
                        <span class="sr-only">Choose profile photo</span>
                        <input type="file" on:change={handleLogoUpload} accept="image/*" class="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"/>
                    </label>
                </div>
            </div>

            <!-- Important Dates -->
            <div>
                <h3 class="font-bold text-lg text-slate-800 mb-2">Các ngày quan trọng</h3>
                <div class="space-y-2">
                    {#each config.importantDates as dateItem, index (index)}
                        <div class="flex items-center gap-2">
                            <input type="text" bind:value={dateItem.name} placeholder="Tên sự kiện (Vd: Lễ ăn hỏi)" class="flex-grow px-3 py-2 border border-slate-300 rounded-lg">
                            <input type="date" bind:value={dateItem.date} class="px-3 py-2 border border-slate-300 rounded-lg">
                            <button type="button" on:click={() => removeImportantDate(index)} class="text-red-500 hover:text-red-700 p-2">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                    {/each}
                </div>
                <button type="button" on:click={addImportantDate} class="mt-2 text-sm text-pink-600 font-semibold hover:underline">+ Thêm ngày</button>
            </div>
            
            {#if successMessage}
                <p class="text-green-600 text-sm">{successMessage}</p>
            {/if}

            <div class="pt-4 border-t">
                <button type="submit" class="w-full bg-pink-600 text-white font-semibold py-3 rounded-lg hover:bg-pink-700 transition-colors">
                    Lưu tất cả thay đổi
                </button>
            </div>
        </form>
    {/if}
</div>