<script lang="ts">
	import { onMount } from 'svelte';

	let mounted = $state(false);

	onMount(() => {
		mounted = true;
	});
</script>

<main>
	<h1>Iris</h1>
	<p>ILR Toolkit - CSV to ILR XML Conversion</p>

	{#if mounted}
		<p>Desktop app running</p>
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
