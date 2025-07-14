<script>
    import { onMount } from 'svelte';
    import { fly } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';

    // Nhận dữ liệu từ trang Astro thông qua props
    export let data; 
    export let user; 

    // State cục bộ của component
    let countdown = { days: 0, hours: 0, minutes: 0, seconds: 0 };
    let weddingDate = null;
    
    // Hàm xử lý đếm ngược
    function startCountdown() {
        if (!weddingDate || isNaN(weddingDate)) return;

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = weddingDate.getTime() - now;

            if (distance < 0) {
                clearInterval(interval);
                countdown = { days: 0, hours: 0, minutes: 0, seconds: 0 };
                return;
            }

            countdown.days = Math.floor(distance / (1000 * 60 * 60 * 24));
            countdown.hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            countdown.minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            countdown.seconds = Math.floor((distance % (1000 * 60)) / 1000);
        }, 1000);
    }
    
    // Chạy khi component được gắn vào DOM
    onMount(() => {
        const mainEventKeywords = ['cưới', 'vu quy', 'tân hôn', 'thành hôn'];
        if (data.config && data.config.importantDates) {
            const mainDate = data.config.importantDates.find(d => mainEventKeywords.some(k => d.name.toLowerCase().includes(k)));
            weddingDate = mainDate ? new Date(mainDate.date) : null;
        }
        startCountdown();
    });
    
    // Helper và các biến dẫn xuất (reactive)
    const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
    $: budgetPercent = data && data.budget.totalExpected > 0 ? (data.budget.totalActual / data.budget.totalExpected) * 100 : 0;
</script>

<div class="space-y-6">
    <!-- Welcome Header -->
    <div in:fly={{ y: -20, duration: 500, easing: quintOut }}>
        <h2 class="text-2xl font-bold text-slate-800">Chào mừng, {user.name}!</h2>
        <p class="text-slate-500">Đây là tổng quan kế hoạch cưới của bạn.</p>
    </div>

    <!-- Countdown Timer -->
    {#if weddingDate && !isNaN(weddingDate)}
        <div class="bg-gradient-to-r from-pink-500 to-rose-500 text-white p-6 rounded-xl shadow-lg text-center"
             in:fly={{ y: -20, duration: 500, delay: 100, easing: quintOut }}>
            <h3 class="font-semibold text-lg opacity-90">Đếm ngược đến ngày cưới</h3>
            <div class="grid grid-cols-4 gap-2 mt-4">
                <div><p class="text-3xl font-bold">{countdown.days}</p><p class="text-xs opacity-80">Ngày</p></div>
                <div><p class="text-3xl font-bold">{countdown.hours}</p><p class="text-xs opacity-80">Giờ</p></div>
                <div><p class="text-3xl font-bold">{countdown.minutes}</p><p class="text-xs opacity-80">Phút</p></div>
                <div><p class="text-3xl font-bold">{countdown.seconds}</p><p class="text-xs opacity-80">Giây</p></div>
            </div>
        </div>
    {/if}

    <!-- Main Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Left Column -->
        <div class="md:col-span-2 space-y-6">
            <!-- Budget Chart -->
            <div class="bg-white p-4 rounded-lg shadow-sm" in:fly={{ y: -20, duration: 500, delay: 200, easing: quintOut }}>
                <h3 class="font-bold text-slate-800 mb-3">Tổng quan ngân sách</h3>
                <div class="space-y-2">
                    <div>
                        <div class="flex justify-between text-sm mb-1">
                            <span class="font-medium">Thực tế</span>
                            <span class="font-bold text-pink-600">{formatCurrency(data.budget.totalActual)}</span>
                        </div>
                        <div class="w-full bg-slate-200 rounded-full h-2.5">
                            <div class="bg-pink-600 h-2.5 rounded-full transition-all duration-1000" style="width: {budgetPercent}%"></div>
                        </div>
                        <p class="text-right text-xs text-slate-500 mt-1">Dự kiến: {formatCurrency(data.budget.totalExpected)}</p>
                    </div>
                </div>
            </div>

            <!-- Upcoming Tasks -->
            <div class="bg-white p-4 rounded-lg shadow-sm" in:fly={{ y: -20, duration: 500, delay: 300, easing: quintOut }}>
                <div class="flex justify-between items-center mb-3">
                    <h3 class="font-bold text-slate-800">Công việc sắp tới</h3>
                    <a href="/tasks" class="text-sm text-pink-600 hover:underline font-medium">Xem tất cả</a>
                </div>
                {#if data.tasks.upcoming.length > 0}
                    <ul class="space-y-3">
                        {#each data.tasks.upcoming as task}
                            <li class="flex items-center gap-3 p-2 rounded-md hover:bg-slate-50">
                                 <span class="h-2.5 w-2.5 rounded-full {task.priority === 'high' ? 'bg-red-400' : task.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'}"></span>
                                <span class="text-slate-700 text-sm flex-1">{task.title}</span>
                            </li>
                        {/each}
                    </ul>
                {:else}
                    <p class="text-sm text-slate-500">Không có công việc nào sắp tới.</p>
                {/if}
            </div>
        </div>

        <!-- Right Column -->
        <div class="space-y-6">
             <div class="bg-white p-4 rounded-lg shadow-sm text-center" in:fly={{ y: -20, duration: 500, delay: 250, easing: quintOut }}>
                <p class="text-sm font-medium text-slate-500">Công việc</p>
                <p class="text-3xl font-bold text-slate-800 mt-1">{data.tasks.done} / {data.tasks.total}</p>
                 <p class="text-xs text-slate-400">hoàn thành</p>
            </div>
             <div class="bg-white p-4 rounded-lg shadow-sm text-center" in:fly={{ y: -20, duration: 500, delay: 350, easing: quintOut }}>
                <p class="text-sm font-medium text-slate-500">Khách mời</p>
                <p class="text-3xl font-bold text-slate-800 mt-1">{data.guests.total}</p>
                 <p class="text-xs text-slate-400">người</p>
            </div>
        </div>
    </div>
</div>