<script>
  export let features = [];
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
  {#each features as feature (feature.href)}
    <a
      href={feature.href}
      class="block bg-white p-4 rounded-lg shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200"
    >
      {@html feature.icon}
      <h3 class="font-bold text-slate-800">{feature.label}</h3>
      <p class="text-sm text-slate-500 mt-1">{feature.description}</p>
    </a>
  {/each}
</div>
