<script>
  import { onMount } from "svelte";
  import SkeletonBlock from "./SkeletonBlock.svelte";

  export let token;

  let members = [];
  let isLoading = true;
  let error = null;
  let currentWorkspaceId = null;

  let showInviteModal = false;
  let emailToInvite = "";

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

  async function loadMembers() {
    isLoading = true;
    error = null;
    currentWorkspaceId = localStorage.getItem("currentWorkspaceId");
    if (!currentWorkspaceId) {
      error = "Vui lòng chọn một dự án.";
      isLoading = false;
      return;
    }
    try {
      members = await apiCall(`/api/workspaces/${currentWorkspaceId}/members`);
    } catch (err) {
      error = err.message;
    } finally {
      isLoading = false;
    }
  }

  async function handleInvite() {
    if (!emailToInvite.trim()) return;
    try {
      await apiCall(`/api/workspaces/${currentWorkspaceId}/members`, "POST", {
        email: emailToInvite,
      });
      showInviteModal = false;
      emailToInvite = "";
      await loadMembers(); // Tải lại danh sách
    } catch (err) {
      alert(`Lỗi: ${err.message}`);
    }
  }

  async function handleRemove(userId) {
    if (!confirm("Bạn có chắc muốn xóa thành viên này?")) return;
    try {
      await apiCall(
        `/api/workspaces/${currentWorkspaceId}/members/${userId}`,
        "DELETE"
      );
      await loadMembers(); // Tải lại danh sách
    } catch (err) {
      alert(`Lỗi: ${err.message}`);
    }
  }

  onMount(loadMembers);
</script>

{#if isLoading}
  <div class="space-y-2">
    {#each Array(3) as _}
      <SkeletonBlock className="h-16 w-full" />
    {/each}
  </div>
{:else if error}
  <p class="text-center text-red-500 py-8">{error}</p>
{:else}
  <div class="space-y-3">
    {#each members as member (member.userId)}
      <div
        class="bg-white p-3 rounded-lg shadow-sm flex items-center justify-between"
      >
        <div class="flex items-center gap-3">
          <img
            src={member.user.avatarUrl ||
              `https://i.pravatar.cc/150?u=${member.user.email}`}
            alt={member.user.name}
            class="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <p class="font-semibold text-slate-700">{member.user.name}</p>
            <p class="text-sm text-slate-500">{member.user.email}</p>
          </div>
        </div>
        {#if member.role !== "owner"}
          <button
            on:click={() => handleRemove(member.userId)}
            class="text-slate-400 hover:text-red-500 p-2"
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
        {:else}
          <span
            class="text-xs font-semibold text-pink-600 bg-pink-100 px-2 py-1 rounded-full"
            >Chủ sở hữu</span
          >
        {/if}
      </div>
    {/each}
  </div>
{/if}

<div class="mt-6">
  <button
    on:click={() => (showInviteModal = true)}
    class="w-full bg-pink-600 text-white font-semibold py-3 rounded-lg hover:bg-pink-700 transition-colors"
  >
    + Mời thành viên mới
  </button>
</div>

<!-- Invite Modal -->
{#if showInviteModal}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
    on:click={() => (showInviteModal = false)}
  >
    <div
      class="bg-white p-6 rounded-xl shadow-lg w-full max-w-sm"
      on:click|stopPropagation
    >
      <h3 class="text-lg font-bold mb-4">Mời thành viên mới</h3>
      <form on:submit|preventDefault={handleInvite}>
        <div>
          <label
            for="invite-email"
            class="block text-sm font-medium text-slate-700"
            >Email của người được mời</label
          >
          <input
            type="email"
            id="invite-email"
            required
            bind:value={emailToInvite}
            class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"
          />
        </div>
        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            on:click={() => (showInviteModal = false)}
            class="px-4 py-2 bg-slate-200 rounded-lg hover:bg-slate-300"
            >Hủy</button
          >
          <button
            type="submit"
            class="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
            >Gửi lời mời</button
          >
        </div>
      </form>
    </div>
  </div>
{/if}
