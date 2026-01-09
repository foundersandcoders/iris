<script lang="ts">
	import { onMount } from 'svelte';

	let mounted = $state(false);

	onMount(() => { mounted = true });
</script>

<main>
	{#if mounted}
	  <p>App is mounted</p>
	{:else}
	  <p>Be patient, my child...</p>
	{/if}
</main>

<style>
	main {
		padding: 2rem;
		font-family: system-ui, -apple-system, sans-serif;
	}

	h1 {
		font-size: 2rem;
		margin-bottom: 0.5rem;
	}

	p {
		color: #666;
	}
</style>
