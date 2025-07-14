<script>
    // --- State Management ---
    let email = '';
    let password = '';
    let isLoading = false;
    let error = null;

    // --- Form Submission Handler ---
    async function handleSubmit() {
        isLoading = true;
        error = null;

        const backendUrl = import.meta.env.PUBLIC_BACKEND_URL || 'http://localhost:3001';

        try {
            const response = await fetch(`${backendUrl}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Đã có lỗi xảy ra.');
            }

            // --- Handle Successful Login ---
            // Lưu token vào cookie để server có thể đọc được
            // Token sẽ hết hạn sau 7 ngày (60 * 60 * 24 * 7 giây)
            document.cookie = `token=${data.token}; path=/; max-age=604800; samesite=lax`; 
            
            // Chuyển hướng đến trang tổng quan
            window.location.href = '/dashboard';

        } catch (err) {
            error = err.message;
            console.error('Lỗi đăng nhập:', err);
        } finally {
            isLoading = false;
        }
    }
</script>

<form on:submit|preventDefault={handleSubmit} class="bg-white p-8 rounded-2xl shadow-lg space-y-6">
    <!-- Email Input -->
    <div>
        <label for="email" class="block text-sm font-medium text-slate-700">Email (Tên đăng nhập)</label>
        <div class="mt-1">
            <input 
                type="email" 
                id="email" 
                required
                bind:value={email}
                class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition"
                placeholder="Mail"
                disabled={isLoading}
            >
        </div>
    </div>

    <!-- Password Input -->
    <div>
        <label for="password" class="block text-sm font-medium text-slate-700">Mật khẩu</label>
        <div class="mt-1">
            <input 
                type="password" 
                id="password" 
                required
                bind:value={password}
                class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition"
                placeholder="Mật khẩu"
                disabled={isLoading}
            >
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