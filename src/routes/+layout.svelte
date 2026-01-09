<script lang="ts">
	import type { LayoutData } from './$types';

	let { children }: { children: any } = $props();
</script>

<header>
	<h1>Iris</h1>
	<p>ILR Toolkit - CSV to ILR XML Conversion</p>
</header>

{@render children()}

<footer>
	<pre>Another needlessly complicated architecture from Jason Warren</pre>
</footer>
