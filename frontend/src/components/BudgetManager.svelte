<script>
    import { onMount } from 'svelte';

    export let token;
    // --- State Management ---
    let budgetGroups = [];
    let isLoading = true;
    let error = null;
    let currentWorkspaceId = null;

    // Modal states
    let showCategoryModal = false;
    let showItemModal = false;
    
    // Data for modals
    let currentCategory = { id: null, category: '' };
    let currentItem = { id: null, budgetId: null, name: '', expectedAmount: 0, actualAmount: 0 };

    // --- Reactive Calculations ---
    $: totalExpected = budgetGroups.reduce((sum, group) => sum + group.items.reduce((itemSum, item) => itemSum + item.expectedAmount, 0), 0);
    $: totalActual = budgetGroups.reduce((sum, group) => sum + group.items.reduce((itemSum, item) => itemSum + item.actualAmount, 0), 0);
    $: percent = totalExpected > 0 ? Math.round((totalActual / totalExpected) * 100) : 0;

    // --- Helper & API Functions ---
    const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
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
            if (workspaces.length === 0) throw new Error('Không tìm thấy workspace nào.');
            currentWorkspaceId = workspaces[0].id;
            budgetGroups = await apiCall(`/api/workspaces/${currentWorkspaceId}/budgets`);
        } catch (err) {
            error = err.message;
        } finally {
            isLoading = false;
        }
    }

    // --- Event Handlers ---
    function handleOpenCategoryModal(category = null) {
        currentCategory = category ? { ...category } : { id: null, category: '' };
        showCategoryModal = true;
    }

    function handleOpenItemModal(budgetId, item = null) {
        currentItem = item ? { ...item } : { id: null, budgetId, name: '', expectedAmount: 0, actualAmount: 0 };
        showItemModal = true;
    }

    async function handleCategoryFormSubmit() {
        if (!currentCategory.category) return;
        const endpoint = currentCategory.id ? `/api/budgets/${currentCategory.id}` : `/api/workspaces/${currentWorkspaceId}/budgets`;
        const method = currentCategory.id ? 'PUT' : 'POST';
        await apiCall(endpoint, method, { category: currentCategory.category });
        showCategoryModal = false;
        await loadInitialData();
    }

    async function handleItemFormSubmit() {
        if (!currentItem.name) return;
        const payload = {
            name: currentItem.name,
            expectedAmount: parseFloat(currentItem.expectedAmount) || 0,
            actualAmount: parseFloat(currentItem.actualAmount) || 0,
        };
        const endpoint = currentItem.id ? `/api/budget-items/${currentItem.id}` : `/api/budgets/${currentItem.budgetId}/items`;
        const method = currentItem.id ? 'PUT' : 'POST';
        await apiCall(endpoint, method, payload);
        showItemModal = false;
        await loadInitialData();
    }

    async function handleDeleteCategory(categoryId) {
        if (confirm('Bạn có chắc muốn xóa hạng mục này và tất cả các khoản mục bên trong?')) {
            await apiCall(`/api/budgets/${categoryId}`, 'DELETE');
            await loadInitialData();
        }
    }

    async function handleDeleteItem(itemId) {
        if (confirm('Bạn có chắc muốn xóa khoản mục này?')) {
            await apiCall(`/api/budget-items/${itemId}`, 'DELETE');
            await loadInitialData();
        }
    }

    onMount(loadInitialData);
</script>

<!-- Main Component Template -->
<!-- Overall Budget Summary -->
<div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex items-center justify-between">
    <div class="space-y-1">
        <div class="flex items-center gap-3">
            <div class="w-2 h-2 rounded-full bg-gray-400"></div>
            <div>
                <span class="text-xs text-slate-500">Tổng dự kiến</span>
                <p class="font-bold text-slate-800">{formatCurrency(totalExpected)}</p>
            </div>
        </div>
        <div class="flex items-center gap-3">
            <div class="w-2 h-2 rounded-full" style="background-color: #ec4899;"></div>
            <div>
                <span class="text-xs text-slate-500">Tổng thực tế</span>
                <p class="font-bold text-slate-800">{formatCurrency(totalActual)}</p>
            </div>
        </div>
    </div>
    <div class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center" 
         style="background-image: conic-gradient(#ec4899 {percent}%, #e2e8f0 {percent}% 100%);">
        <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center">
            <span class="text-xl font-bold text-slate-700">{percent}%</span>
        </div>
    </div>
</div>

<!-- Budget List Section -->
<div class="space-y-4">
    {#if isLoading}
        <p class="text-center text-slate-500 py-8">Đang tải dữ liệu ngân sách...</p>
    {:else if error}
        <p class="text-center text-red-500 py-8">{error}</p>
    {:else if budgetGroups.length === 0}
        <p class="text-center text-slate-500 py-8">Chưa có hạng mục ngân sách nào.</p>
    {:else}
        {#each budgetGroups as group (group.id)}
            <div class="bg-white rounded-xl overflow-hidden">
                <div class="bg-pink-600 text-white p-3 flex justify-between items-center">
                    <h3 class="font-semibold">{group.category}</h3>
                    <div class="flex items-center gap-2">
                        <button on:click={() => handleDeleteCategory(group.id)} class="p-1 hover:bg-pink-700 rounded-full"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                    </div>
                </div>
                <div class="p-4 space-y-3">
                    {#each group.items as item (item.id)}
                        <div class="flex justify-between items-center border-b border-slate-100 pb-3">
                            <div>
                                <p class="font-medium text-slate-700">{item.name}</p>
                                <p class="text-sm text-slate-500">Dự kiến: {formatCurrency(item.expectedAmount)} / Thực tế: {formatCurrency(item.actualAmount)}</p>
                            </div>
                            <div class="flex items-center gap-3">
                                <button on:click={() => handleOpenItemModal(group.id, item)} class="text-slate-400 hover:text-blue-600"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                                <button on:click={() => handleDeleteItem(item.id)} class="text-slate-400 hover:text-red-600"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                            </div>
                        </div>
                    {/each}
                    <div class="pt-2 text-center">
                        <button on:click={() => handleOpenItemModal(group.id)} class="text-slate-500 font-semibold hover:text-pink-600 text-sm border-2 border-dashed border-slate-300 rounded-lg w-full py-2">+ Thêm khoản mục</button>
                    </div>
                </div>
            </div>
        {/each}
    {/if}
</div>

<!-- Add New Category Button -->
<div class="mt-6">
    <button on:click={() => handleOpenCategoryModal()} class="w-full bg-white text-pink-600 font-semibold py-3 rounded-lg border-2 border-pink-200 hover:bg-pink-50 transition-colors">
        + Thêm hạng mục
    </button>
</div>

<!-- Modals -->
{#if showCategoryModal}
<div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" on:click={() => showCategoryModal = false}>
    <div class="bg-white p-6 rounded-xl shadow-lg w-full max-w-sm" on:click|stopPropagation>
        <h3 class="text-lg font-bold mb-4">{currentCategory.id ? 'Sửa hạng mục' : 'Thêm hạng mục mới'}</h3>
        <form on:submit|preventDefault={handleCategoryFormSubmit}>
            <div>
                <label for="category-name" class="block text-sm font-medium text-slate-700">Tên hạng mục</label>
                <input type="text" id="category-name" required bind:value={currentCategory.category} class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-pink-500 focus:border-pink-500">
            </div>
            <div class="mt-6 flex justify-end gap-3">
                <button type="button" on:click={() => showCategoryModal = false} class="px-4 py-2 bg-slate-200 rounded-lg hover:bg-slate-300">Hủy</button>
                <button type="submit" class="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700">Lưu</button>
            </div>
        </form>
    </div>
</div>
{/if}

{#if showItemModal}
<div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" on:click={() => showItemModal = false}>
    <div class="bg-white p-6 rounded-xl shadow-lg w-full max-w-md" on:click|stopPropagation>
        <h3 class="text-lg font-bold mb-4">{currentItem.id ? 'Sửa khoản mục' : 'Thêm khoản mục'}</h3>
        <form on:submit|preventDefault={handleItemFormSubmit} class="space-y-4">
            <div>
                <label for="item-name" class="block text-sm font-medium">Tên khoản mục</label>
                <input type="text" id="item-name" required bind:value={currentItem.name} class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-pink-500 focus:border-pink-500">
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label for="item-expected" class="block text-sm font-medium">Dự kiến</label>
                    <input type="number" id="item-expected" bind:value={currentItem.expectedAmount} class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-pink-500 focus:border-pink-500" placeholder="0">
                </div>
                 <div>
                    <label for="item-actual" class="block text-sm font-medium">Thực tế</label>
                    <input type="number" id="item-actual" bind:value={currentItem.actualAmount} class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-pink-500 focus:border-pink-500" placeholder="0">
                </div>
            </div>
            <div class="mt-6 flex justify-end gap-3">
                <button type="button" on:click={() => showItemModal = false} class="px-4 py-2 bg-slate-200 rounded-lg hover:bg-slate-300">Hủy</button>
                <button type="submit" class="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700">Lưu khoản mục</button>
            </div>
        </form>
    </div>
</div>
{/if}