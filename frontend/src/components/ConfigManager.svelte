<script>
  import { onMount } from "svelte";
  import Skeleton from "./Skeleton.svelte"; // Giữ nguyên skeleton của bạn

  export let token;
  let config = {
    groomName: "",
    brideName: "",
    venue: "",
    logoUrl: "",
    importantDates: [],
  };
  let isLoading = true;
  let error = null;
  let successMessage = "";
  let currentWorkspaceId = null;

  // --- API Helpers ---
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

  // --- Data Loading ---
  async function loadInitialData() {
    isLoading = true;
    error = null;
    try {
      const workspaces = await apiCall("/api/workspaces");
      if (workspaces.length === 0) {
        throw new Error("Không tìm thấy không gian làm việc nào.");
      }
      currentWorkspaceId = workspaces[0].id;
      const loadedConfig = await apiCall(
        `/api/workspaces/${currentWorkspaceId}/config`
      );
      // Đảm bảo importantDates luôn là một mảng để tránh lỗi
      config = {
        ...loadedConfig,
        importantDates: loadedConfig.importantDates || [],
      };
    } catch (err) {
      error = err.message;
    } finally {
      isLoading = false;
    }
  }

  // --- Form Submission ---
  async function handleConfigSubmit() {
    error = null;
    successMessage = "";
    try {
      await apiCall(
        `/api/workspaces/${currentWorkspaceId}/config`,
        "PUT",
        config
      );
      successMessage = "Cập nhật thông tin thành công!";
      // Tự động ẩn thông báo sau 3 giây
      setTimeout(() => (successMessage = ""), 3000);
    } catch (err) {
      error = err.message;
    }
  }

  // --- Logo Upload ---
  async function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const newMedia = await fetch(
        `${backendUrl}/api/workspaces/${currentWorkspaceId}/upload`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      ).then((res) => {
        if (!res.ok) throw new Error("Upload failed");
        return res.json();
      });
      config.logoUrl = newMedia.url;
      config = config; // Kích hoạt Svelte reactivity
    } catch (err) {
      error = "Lỗi tải ảnh lên: " + err.message;
    }
  }

  // --- Important Dates Management ---
  function addImportantDate() {
    config.importantDates = [...config.importantDates, { name: "", date: "" }];
  }

  function removeImportantDate(index) {
    config.importantDates = config.importantDates.filter((_, i) => i !== index);
  }

  onMount(loadInitialData);
</script>

{#if isLoading}
  <Skeleton />
{:else if error}
  <p class="text-center text-red-500 py-8">{error}</p>
{:else}
  <form on:submit|preventDefault={handleConfigSubmit} class="space-y-4">
    <!-- Card 1: Thông tin cơ bản -->
    <div class="bg-white p-4 rounded-lg shadow-sm">
      <h3 class="font-bold text-lg text-slate-800 mb-4 border-b pb-2">
        Thông tin cơ bản
      </h3>
      <div class="space-y-4">
        <div>
          <label
            for="groom-name"
            class="block text-sm font-medium text-slate-600">Tên chú rể</label
          >
          <input
            type="text"
            id="groom-name"
            bind:value={config.groomName}
            class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"
          />
        </div>
        <div>
          <label
            for="bride-name"
            class="block text-sm font-medium text-slate-600">Tên cô dâu</label
          >
          <input
            type="text"
            id="bride-name"
            bind:value={config.brideName}
            class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"
          />
        </div>
        <div>
          <label for="venue" class="block text-sm font-medium text-slate-600"
            >Địa điểm tổ chức</label
          >
          <input
            type="text"
            id="venue"
            bind:value={config.venue}
            class="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"
          />
        </div>
      </div>
    </div>

    <!-- Card 2: Logo -->
    <div class="bg-white p-4 rounded-lg shadow-sm">
      <h3 class="font-bold text-lg text-slate-800 mb-4 border-b pb-2">
        Logo đám cưới
      </h3>
      <div class="flex items-center gap-4">
        <img
          src={config.logoUrl
            ? `${backendUrl}${config.logoUrl}`
            : "https://placehold.co/150x150/f9a8d4/ffffff?text=Logo"}
          alt="Logo"
          class="w-20 h-20 rounded-full object-cover border-2 border-slate-200"
        />
        <label class="block">
          <span class="sr-only">Choose profile photo</span>
          <input
            type="file"
            on:change={handleLogoUpload}
            accept="image/*"
            class="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100 cursor-pointer"
          />
        </label>
      </div>
    </div>

    <!-- Card 3: Ngày quan trọng -->
    <div class="bg-white p-4 rounded-lg shadow-sm">
      <h3 class="font-bold text-lg text-slate-800 mb-4 border-b pb-2">
        Các ngày quan trọng
      </h3>
      <div class="space-y-3">
        {#each config.importantDates as dateItem, index (index)}
          <div class="grid grid-cols-[1fr,auto,auto] gap-2 items-center">
            <input
              type="text"
              bind:value={dateItem.name}
              placeholder="Tên sự kiện (Vd: Lễ ăn hỏi)"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"
            />

            <div class="relative">
              <input
                type="date"
                bind:value={dateItem.date}
                class="appearance-none w-full bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>

            <button
              type="button"
              on:click={() => removeImportantDate(index)}
              class="text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-slate-100"
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
        {/each}
      </div>
      <button
        type="button"
        on:click={addImportantDate}
        class="mt-4 text-sm text-pink-600 font-semibold hover:underline"
        >+ Thêm ngày</button
      >
    </div>

    <!-- Nút Lưu -->
    <div class="pt-2">
      {#if successMessage}
        <p class="text-green-600 text-sm text-center mb-2">{successMessage}</p>
      {/if}
      <button
        type="submit"
        class="w-full bg-pink-600 text-white font-semibold py-3 rounded-lg hover:bg-pink-700 transition-colors shadow-md hover:shadow-lg"
      >
        Lưu tất cả thay đổi
      </button>
    </div>
  </form>
{/if}
