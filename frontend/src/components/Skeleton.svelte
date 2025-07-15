<script>
  import SkeletonBlock from "./SkeletonBlock.svelte";
</script>

<div class="space-y-6">
  <div class="space-y-2">
    <SkeletonBlock className="h-8 w-3/5" />
    <SkeletonBlock className="h-5 w-4/5" />
  </div>

  <SkeletonBlock className="w-full h-32 rounded-xl" />

  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div class="md:col-span-2 space-y-6">
      <SkeletonBlock className="w-full h-32 rounded-lg" />
      <SkeletonBlock className="w-full h-40 rounded-lg" />
    </div>

    <div class="space-y-6">
      <SkeletonBlock className="w-full h-24 rounded-lg" />
      <SkeletonBlock className="w-full h-24 rounded-lg" />
    </div>
  </div>
</div>
