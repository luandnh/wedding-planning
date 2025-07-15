<script>
  import { onMount } from "svelte";
  import SkeletonBlock from "./SkeletonBlock.svelte"; // Import skeleton chung

  export let user;
  export let token;

  let workspaces = [];
  let isLoading = true;
  let error = null;

  let showCreateModal = false;
  let newWorkspaceName = "";

  const backendUrl =
    import.meta.env.PUBLIC_BACKEND_URL || "http://localhost:3001";

  async function fetchWorkspaces() {
    isLoading = true;
    error = null;
    try {
      const response = await fetch(`${backendUrl}/api/workspaces`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        // Lấy lỗi từ message của backend nếu có
        throw new Error(data.error || "Không thể tải danh sách dự án.");
      }
      workspaces = data;
    } catch (err) {
      error = err.message;
    } finally {
      isLoading = false;
    }
  }

  function handleSelectWorkspace(workspaceId) {
    // Lưu ID của workspace được chọn vào localStorage
    // Các trang khác sẽ đọc từ đây để biết đang làm việc với workspace nào
    localStorage.setItem("currentWorkspaceId", workspaceId);
    window.location.href = "/dashboard";
  }

  async function handleCreateWorkspace() {
    if (!newWorkspaceName.trim()) return;
    try {
      const response = await fetch(`${backendUrl}/api/workspaces`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newWorkspaceName }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Tạo dự án thất bại.");
      }
      // Tự động chọn workspace mới tạo và chuyển hướng
      handleSelectWorkspace(data.id);
    } catch (err) {
      alert(err.message);
    }
  }

  onMount(fetchWorkspaces);
</script>

<div class="bg-white p-6 rounded-2xl shadow-lg">
  <div class="text-center mb-6">
    <h1 class="text-2xl font-bold text-slate-800">Chọn dự án</h1>
    <p class="text-slate-500">Chọn một dự án để tiếp tục hoặc tạo mới.</p>
  </div>

  {#if isLoading}
    <!-- Cải tiến: Dùng Skeleton Loader -->
    <div class="space-y-3 mb-6">
      <SkeletonBlock className="h-[76px] w-full rounded-lg" />
      <SkeletonBlock className="h-[76px] w-full rounded-lg" />
    </div>
  {:else if error}
    <p class="text-center text-red-500 py-4">{error}</p>
  {:else}
    <div class="space-y-3 mb-6">
      {#each workspaces as ws (ws.id)}
        <button
          on:click={() => handleSelectWorkspace(ws.id)}
          class="w-full text-left p-4 border rounded-lg hover:bg-pink-50 hover:border-pink-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-400"
        >
          <p class="font-semibold text-slate-700">{ws.name}</p>
          <p class="text-sm text-slate-400">
            Tạo lúc: {new Date(ws.createdAt).toLocaleDateString("vi-VN")}
          </p>
        </button>
      {:else}
        <p class="text-center text-slate-500 py-4">Bạn chưa có dự án nào.</p>
      {/each}
    </div>
  {/if}

  <div class="border-t pt-4">
    <button
      on:click={() => (showCreateModal = true)}
      class="w-full bg-pink-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-pink-700 transition-all"
    >
      + Tạo dự án mới
    </button>
  </div>
</div>

<!-- Create Workspace Modal -->
{#if showCreateModal}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
    on:click={() => (showCreateModal = false)}
  >
    <div
      class="bg-white p-6 rounded-xl shadow-lg w-full max-w-sm"
      on:click|stopPropagation
    >
      <h3 class="text-lg font-bold mb-4">Tạo dự án mới</h3>
      <form on:submit|preventDefault={handleCreateWorkspace}>
        <div>
          <label for="ws-name" class="block text-sm font-medium text-slate-700"
            >Tên dự án (Vd: Đám cưới An & Bình)</label
          >
          <input
            type="text"
            id="ws-name"
            required
            bind:value={newWorkspaceName}
            class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"
          />
        </div>
        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            on:click={() => (showCreateModal = false)}
            class="px-4 py-2 bg-slate-200 rounded-lg hover:bg-slate-300"
            >Hủy</button
          >
          <button
            type="submit"
            class="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
            >Tạo</button
          >
        </div>
      </form>
    </div>
  </div>
{/if}
