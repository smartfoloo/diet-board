<script>
  /**
   * @type {{
   *   value: string,
   *   placeholder?: string,
   *   class?: string
   * }}
   */
  let { value = $bindable(), placeholder = '法案名で検索…', class: klass = '' } = $props();
</script>

<div class="relative {klass}">
  <svg
    class="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <circle cx="7" cy="7" r="4.5" stroke="currentColor" stroke-width="1.5" />
    <path d="M11 11l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
  </svg>
  <input
    type="search"
    bind:value
    {placeholder}
    class="h-9 w-full rounded-control border border-line bg-surface pl-8 pr-3 text-sm text-ink transition-colors placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
  />
</div>
