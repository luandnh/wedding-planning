<script>
  // --- State Management ---
  let email = "";
  let password = "";
  let isLoading = false;
  let error = null;

  // --- Form Submission Handler ---
  async function handleSubmit() {
    isLoading = true;
    error = null;

    try {
      // Gọi đến API Route của Astro mà chúng ta đã tạo
      const response = await fetch(`/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Đã có lỗi xảy ra.");
      }

      // Nếu API trả về thành công, client sẽ tự thực hiện chuyển hướng.
      // Điều này đảm bảo trình duyệt có đủ thời gian để xử lý cookie.
      if (data.success) {
        console.log("Đăng nhập thành công:", data.user);

        window.location.href = "/dashboard";
      } else {
        // Trường hợp dự phòng nếu API không trả về lỗi nhưng cũng không thành công
        throw new Error("Đăng nhập không thành công.");
      }
    } catch (err) {
      error = err.message;
      console.error("Lỗi đăng nhập:", err);
    } finally {
      isLoading = false;
    }
  }
</script>

<!-- Form này sẽ được xử lý bởi hàm handleSubmit ở trên -->
<form
  on:submit|preventDefault={handleSubmit}
  class="bg-white p-8 rounded-2xl shadow-lg space-y-6"
>
  <!-- Email Input -->
  <div>
    <label for="email" class="block text-sm font-medium text-slate-700"
      >Email (Tên đăng nhập)</label
    >
    <div class="mt-1">
      <input
        type="email"
        id="email"
        name="email"
        required
        bind:value={email}
        class="w-full px-4 py-3 border border-slate-300 rounded-lg"
        placeholder="Mail"
        disabled={isLoading}
      />
    </div>
  </div>

  <!-- Password Input -->
  <div>
    <label for="password" class="block text-sm font-medium text-slate-700"
      >Mật khẩu</label
    >
    <div class="mt-1">
      <input
        type="password"
        id="password"
        name="password"
        required
        bind:value={password}
        class="w-full px-4 py-3 border border-slate-300 rounded-lg"
        placeholder="Mật khẩu"
        disabled={isLoading}
      />
    </div>
  </div>

  <!-- Error Message Display -->
  {#if error}
    <div class="text-red-500 text-sm text-center">{error}</div>
  {/if}

  <!-- Submit Button -->
  <div>
    <button
      type="submit"
      disabled={isLoading}
      class="w-full bg-pink-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-pink-700 transition-all duration-300 flex items-center justify-center disabled:opacity-75"
    >
      {#if isLoading}
        Đang xử lý...
      {:else}
        Đăng Nhập
      {/if}
    </button>
  </div>
</form>
