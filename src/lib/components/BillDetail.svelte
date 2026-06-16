<script lang="ts">
  import type { Bill } from '$lib/types';
  import { partyColor, partyFor, partyLabel } from '$lib/parties';

  let { bill, onclose }: { bill: Bill | null; onclose: () => void } = $props();

  function chipStyle(name: string) {
    const c = partyFor(name).color;
    return `background:${c}1a;color:${c};border:1px solid ${c}40`;
  }
</script>

<svelte:window
  on:keydown={(e) => {
    if (e.key === 'Escape' && bill) onclose();
  }}
/>

{#if bill}
  <!-- backdrop -->
  <button
    type="button"
    aria-label="閉じる"
    class="fixed inset-0 z-30 bg-ink/20 backdrop-blur-[1px]"
    onclick={onclose}
  ></button>

  <div
    class="fixed inset-y-0 right-0 z-40 flex w-full max-w-[460px] flex-col bg-surface shadow-drawer"
    role="dialog"
    aria-modal="true"
    aria-label={bill.title}
  >
    <header class="flex items-start gap-3 border-b border-line p-5">
      <div class="min-w-0 flex-1">
        <div class="mb-1.5 flex flex-wrap items-center gap-1.5">
          <span class="tag bg-canvas-deep text-ink-soft">{bill.billType}</span>
          <span class="tag bg-surface-2 text-ink-soft">{bill.category}</span>
          <span class="tag bg-accent-soft text-accent-deep">{bill.status}</span>
        </div>
        <h2 class="text-base font-bold leading-snug text-ink [overflow-wrap:anywhere]">{bill.title}</h2>
        <p class="mt-1 flex items-center gap-1.5 text-xs text-ink-faint">
          <span class="h-2 w-2 shrink-0 rounded-full" style="background:{partyColor(bill.submitterParty)}"></span>
          提出: {bill.submitter} · {partyLabel(bill.submitterParty)}
        </p>
      </div>
      <button
        type="button"
        onclick={onclose}
        class="shrink-0 rounded-pill px-2 py-1 text-ink-faint hover:bg-canvas-deep hover:text-ink"
        aria-label="閉じる">✕</button
      >
    </header>

    <div class="flex-1 space-y-6 overflow-y-auto p-5">
      <!-- Summary -->
      <section>
        <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">概要</h3>
        {#if bill.summary}
          <p class="rounded-card bg-amber-soft/60 p-3 text-sm leading-relaxed text-ink">
            {bill.summary}
          </p>
        {:else}
          <p class="text-sm text-ink-faint">
            自動要約は未生成です。下部の公式リンクから議案要旨・本文をご確認ください。
          </p>
        {/if}
      </section>

      <!-- Votes -->
      {#if bill.votes.length}
        <section>
          <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">採決</h3>
          <div class="space-y-3">
            {#each bill.votes as v}
              <div class="rounded-card border border-line bg-surface-2 p-3">
                <div class="mb-2 flex items-center justify-between text-xs text-ink-soft">
                  <span class="font-semibold text-ink">{v.house}議院</span>
                  <span>{[v.attitude, v.result, v.method].filter(Boolean).join(' · ')}</span>
                </div>

                {#if v.tally}
                  {@const total = v.tally.for + v.tally.against}
                  <div class="mb-1 flex h-2 overflow-hidden rounded-pill bg-canvas-deep">
                    <div class="bg-accent" style="width:{(v.tally.for / total) * 100}%"></div>
                    <div class="bg-amber" style="width:{(v.tally.against / total) * 100}%"></div>
                  </div>
                  <div class="flex justify-between text-[11px] text-ink-faint tabular-nums">
                    <span>賛成 {v.tally.for}</span><span>反対 {v.tally.against}</span>
                  </div>
                {/if}

                {#if v.forParties.length}
                  <p class="mt-2 mb-1 text-[11px] text-ink-faint">賛成会派</p>
                  <div class="flex flex-wrap gap-1">
                    {#each v.forParties as p}
                      <span class="tag" style={chipStyle(p)}>{p}</span>
                    {/each}
                  </div>
                {/if}
                {#if v.againstParties.length}
                  <p class="mt-2 mb-1 text-[11px] text-ink-faint">反対会派</p>
                  <div class="flex flex-wrap gap-1">
                    {#each v.againstParties as p}
                      <span class="tag" style={chipStyle(p)}>{p}</span>
                    {/each}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </section>
      {/if}

      <!-- Timeline -->
      {#if bill.timeline.length}
        <section>
          <h3 class="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">経過</h3>
          <ol class="relative ml-1 space-y-3 border-l border-line pl-4">
            {#each bill.timeline as ev}
              <li class="relative">
                <span
                  class="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-surface"
                  style="background:{ev.house === '参' ? '#2f6fb0' : '#e7c483'}"
                ></span>
                <div class="flex items-baseline justify-between gap-2">
                  <span class="text-sm text-ink">{ev.label}</span>
                  <time class="shrink-0 text-[11px] text-ink-faint tabular-nums">{ev.date}</time>
                </div>
                {#if ev.detail}
                  <span class="text-[11px] text-ink-faint">{ev.detail}</span>
                {/if}
              </li>
            {/each}
          </ol>
        </section>
      {/if}

      <!-- Links -->
      <section>
        <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">公式情報</h3>
        <div class="flex flex-wrap gap-2">
          {#if bill.links.detail}
            <a href={bill.links.detail} target="_blank" rel="noopener" class="pill hover:border-accent/40 hover:text-accent-deep">議案要旨（参）↗</a>
          {/if}
          {#if bill.links.progress}
            <a href={bill.links.progress} target="_blank" rel="noopener" class="pill hover:border-accent/40 hover:text-accent-deep">経過情報（衆）↗</a>
          {/if}
          {#if bill.links.fullText}
            <a href={bill.links.fullText} target="_blank" rel="noopener" class="pill hover:border-accent/40 hover:text-accent-deep">本文↗</a>
          {/if}
          {#if bill.links.outlinePdf}
            <a href={bill.links.outlinePdf} target="_blank" rel="noopener" class="pill hover:border-accent/40 hover:text-accent-deep">要旨PDF↗</a>
          {/if}
        </div>
      </section>
    </div>
  </div>
{/if}
