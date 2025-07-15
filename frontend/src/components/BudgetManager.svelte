<script>
  import { onMount } from "svelte";
  // (MỚI) Import thêm các transition và easing function cần thiết
  import { slide, fly, fade } from "svelte/transition";
  import { quintOut } from "svelte/easing";
  import Skeleton from "./Skeleton.svelte";

  export let token;
  // --- State Management ---
  let budgetGroups = [];
  let isLoading = true;
  let error = null;
  let currentWorkspaceId = null;

  let openCategories = new Set();

  function toggleCategory(categoryId) {
    if (openCategories.has(categoryId)) {
      openCategories.delete(categoryId);
    } else {
      openCategories.add(categoryId);
    }
    openCategories = openCategories;
  }

  // Modal states
  let showCategoryModal = false;
  let showItemModal = false;

  // Data for modals
  let currentCategory = { id: null, category: "" };
  let currentItem = {
    id: null,
    budgetId: null,
    name: "",
    expectedAmount: 0,
    actualAmount: 0,
  };

  // --- Reactive Calculations ---
  $: totalExpected = budgetGroups.reduce(
    (sum, group) =>
      sum +
      group.items.reduce((itemSum, item) => itemSum + item.expectedAmount, 0),
    0
  );
  $: totalActual = budgetGroups.reduce(
    (sum, group) =>
      sum +
      group.items.reduce((itemSum, item) => itemSum + item.actualAmount, 0),
    0
  );
  $: totalPending = totalExpected - totalActual;
  $: percent =
    totalExpected > 0 ? Math.round((totalActual / totalExpected) * 100) : 0;

  // --- Helper & API Functions ---
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  const backendUrl =
    import.meta.env.PUBLIC_BACKEND_URL || "http://localhost:3001";

  async function apiCall(endpoint, method = "GET", body = null) {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    const options = {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    };
    const response = await fetch(`${backendUrl}${endpoint}`, options);
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || "API request failed.");
    }
    return response.status === 204 ? null : response.json();
  }
  async function loadInitialData() {
    isLoading = true;
    error = null;
    try {
      // Lấy workspaceId từ localStorage
      currentWorkspaceId = localStorage.getItem("currentWorkspaceId");
      if (!currentWorkspaceId) {
        window.location.href = "/select-workspace";
        throw new Error("Vui lòng chọn một dự án.");
      }
      budgetGroups = await apiCall(
        `/api/workspaces/${currentWorkspaceId}/budgets`
      );
    } catch (err) {
      error = err.message;
    } finally {
      isLoading = false;
    }
  }
  function handleOpenCategoryModal(category = null) {
    currentCategory = category ? { ...category } : { id: null, category: "" };
    showCategoryModal = true;
  }
  function handleOpenItemModal(budgetId, item = null) {
    currentItem = item
      ? { ...item }
      : { id: null, budgetId, name: "", expectedAmount: 0, actualAmount: 0 };
    showItemModal = true;
  }
  async function handleCategoryFormSubmit() {
    if (!currentCategory.category) return;
    const endpoint = currentCategory.id
      ? `/api/budgets/${currentCategory.id}`
      : `/api/workspaces/${currentWorkspaceId}/budgets`;
    const method = currentCategory.id ? "PUT" : "POST";
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
    const endpoint = currentItem.id
      ? `/api/budget-items/${currentItem.id}`
      : `/api/budgets/${currentItem.budgetId}/items`;
    const method = currentItem.id ? "PUT" : "POST";
    await apiCall(endpoint, method, payload);
    showItemModal = false;
    await loadInitialData();
  }
  async function handleDeleteCategory(event, categoryId) {
    event.stopPropagation();
    if (
      confirm(
        "Bạn có chắc muốn xóa hạng mục này và tất cả các khoản mục bên trong?"
      )
    ) {
      await apiCall(`/api/budgets/${categoryId}`, "DELETE");
      await loadInitialData();
    }
  }
  async function handleDeleteItem(event, itemId) {
    event.stopPropagation();
    if (confirm("Bạn có chắc muốn xóa khoản mục này?")) {
      await apiCall(`/api/budget-items/${itemId}`, "DELETE");
      await loadInitialData();
    }
  }
  onMount(loadInitialData);
</script>

{#if isLoading}
  <Skeleton />
{:else if error}
  <p class="text-center text-red-500 py-8">{error}</p>
{:else}
  <!-- (MỚI) Thêm hiệu ứng fade-in cho toàn bộ nội dung khi tải xong -->
  <div class="space-y-4" in:fade={{ duration: 300 }}>
    <!-- (MỚI) Thêm hiệu ứng fly-in cho thẻ tóm tắt -->
    <div
      class="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between"
      in:fly={{ y: -20, duration: 400, easing: quintOut }}
    >
      <div class="space-y-2">
        <div class="flex items-center gap-2">
          <div class="w-2.5 h-2.5 rounded-full bg-gray-400"></div>
          <div>
            <span class="text-sm text-slate-500">Tổng tiền</span>
            <p class="font-semibold text-slate-800 leading-tight">
              {formatCurrency(totalExpected)}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-2.5 h-2.5 rounded-full bg-pink-500"></div>
          <div>
            <span class="text-sm text-slate-500">Đã trả</span>
            <p class="font-semibold text-slate-800 leading-tight">
              {formatCurrency(totalActual)}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
          <div>
            <span class="text-sm text-slate-500">Đang chờ</span>
            <p class="font-semibold text-slate-800 leading-tight">
              {formatCurrency(totalPending)}
            </p>
          </div>
        </div>
      </div>
      <div
        class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center"
        style="background-image: conic-gradient(#ec4899 {percent}%, #e2e8f0 {percent}% 100%);"
      >
        <div
          class="w-16 h-16 bg-white rounded-full flex items-center justify-center"
        >
          <span class="text-xl font-bold text-slate-700">{percent}%</span>
        </div>
      </div>
    </div>

    <div class="space-y-2">
      <!-- (MỚI) Thêm hiệu ứng fly-in và delay cho từng hạng mục -->
      {#each budgetGroups as group, index (group.id)}
        {@const groupTotalExpected = group.items.reduce(
          (sum, i) => sum + i.expectedAmount,
          0
        )}
        {@const groupTotalActual = group.items.reduce(
          (sum, i) => sum + i.actualAmount,
          0
        )}

        <div
          class="bg-white rounded-lg overflow-hidden shadow-sm"
          in:fly={{ y: 20, duration: 300, delay: index * 80, easing: quintOut }}
        >
          <button
            on:click={() => toggleCategory(group.id)}
            class="w-full text-left bg-pink-600 text-white p-3 flex justify-between items-center"
          >
            <div>
              <h3 class="font-semibold">{group.category}</h3>
              <p class="text-xs text-pink-200">
                Dự kiến: {formatCurrency(groupTotalExpected)} / Thực tế: {formatCurrency(
                  groupTotalActual
                )}
              </p>
            </div>
            <svg
              class="w-5 h-5 transition-transform duration-300 {openCategories.has(
                group.id
              )
                ? 'rotate-180'
                : ''}"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
          </button>

          {#if openCategories.has(group.id)}
            <div class="p-2 space-y-1" transition:slide={{ duration: 300 }}>
              {#each group.items as item (item.id)}
                <div
                  class="flex justify-between items-center hover:bg-slate-50 rounded-md p-2"
                >
                  <div>
                    <p class="font-medium text-slate-700 text-sm">
                      {item.name}
                    </p>
                    <p class="text-xs text-slate-500">
                      Dự kiến: {formatCurrency(item.expectedAmount)} / Thực tế: {formatCurrency(
                        item.actualAmount
                      )}
                    </p>
                  </div>
                  <div class="flex items-center gap-3">
                    <button
                      on:click={() => handleOpenItemModal(group.id, item)}
                      class="text-slate-400 hover:text-blue-600"
                    >
                      <svg
                        class="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        ><path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        ></path></svg
                      >
                    </button>
                    <button
                      on:click={(e) => handleDeleteItem(e, item.id)}
                      class="text-slate-400 hover:text-red-500"
                    >
                      <svg
                        class="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        ><path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        ></path></svg
                      >
                    </button>
                  </div>
                </div>
              {/each}
              <div class="pt-1">
                <button
                  on:click={() => handleOpenItemModal(group.id)}
                  class="text-slate-500 font-semibold hover:text-pink-600 text-sm border-2 border-dashed border-slate-300 rounded-lg w-full py-1.5"
                >
                  + Thêm khoản mục
                </button>
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>

    <!-- (MỚI) Thêm hiệu ứng cho nút cuối cùng -->
    <div
      class="pt-2"
      in:fly={{
        y: 20,
        duration: 300,
        delay: budgetGroups.length * 80,
        easing: quintOut,
      }}
    >
      <button
        on:click={() => handleOpenCategoryModal()}
        class="w-full bg-white text-pink-600 font-semibold py-2.5 rounded-lg border border-pink-200 hover:bg-pink-50 transition-colors shadow-sm"
      >
        + Thêm hạng mục
      </button>
    </div>
  </div>
{/if}

<!-- (MỚI) Thêm hiệu ứng cho Modal -->
{#if showCategoryModal}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
    on:click={() => (showCategoryModal = false)}
    transition:fade={{ duration: 200 }}
  >
    <div
      class="bg-white p-6 rounded-xl shadow-lg w-full max-w-sm"
      on:click|stopPropagation
      in:fly={{ y: 20, duration: 300, easing: quintOut }}
      out:fade={{ duration: 200 }}
    >
      <h3 class="text-lg font-bold mb-4">
        {currentCategory.id ? "Sửa hạng mục" : "Thêm hạng mục mới"}
      </h3>
      <form on:submit|preventDefault={handleCategoryFormSubmit}>
        <div>
          <label
            for="category-name"
            class="block text-sm font-medium text-slate-700">Tên hạng mục</label
          >
          <input
            type="text"
            id="category-name"
            required
            bind:value={currentCategory.category}
            class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"
          />
        </div>
        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            on:click={() => (showCategoryModal = false)}
            class="px-4 py-2 bg-slate-200 rounded-lg hover:bg-slate-300"
            >Hủy</button
          >
          <button
            type="submit"
            class="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
            >Lưu</button
          >
        </div>
      </form>
    </div>
  </div>
{/if}

{#if showItemModal}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
    on:click={() => (showItemModal = false)}
    transition:fade={{ duration: 200 }}
  >
    <div
      class="bg-white p-6 rounded-xl shadow-lg w-full max-w-md"
      on:click|stopPropagation
      in:fly={{ y: 20, duration: 300, easing: quintOut }}
      out:fade={{ duration: 200 }}
    >
      <h3 class="text-lg font-bold mb-4">
        {currentItem.id ? "Sửa khoản mục" : "Thêm khoản mục"}
      </h3>
      <form on:submit|preventDefault={handleItemFormSubmit} class="space-y-4">
        <div>
          <label for="item-name" class="block text-sm font-medium"
            >Tên khoản mục</label
          >
          <input
            type="text"
            id="item-name"
            required
            bind:value={currentItem.name}
            class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="item-expected" class="block text-sm font-medium"
              >Dự kiến</label
            >
            <input
              type="number"
              id="item-expected"
              bind:value={currentItem.expectedAmount}
              class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"
              placeholder="0"
            />
          </div>
          <div>
            <label for="item-actual" class="block text-sm font-medium"
              >Thực tế</label
            >
            <input
              type="number"
              id="item-actual"
              bind:value={currentItem.actualAmount}
              class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"
              placeholder="0"
            />
          </div>
        </div>
        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            on:click={() => (showItemModal = false)}
            class="px-4 py-2 bg-slate-200 rounded-lg hover:bg-slate-300"
            >Hủy</button
          >
          <button
            type="submit"
            class="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
            >Lưu khoản mục</button
          >
        </div>
      </form>
    </div>
  </div>
{/if}
