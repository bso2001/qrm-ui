<script lang="js">
	import { createEventDispatcher } from 'svelte'

	export let on = false
	export let label = ''

	const dispatch = createEventDispatcher()

	function toggle() 
	{
		on = !on
		dispatch('change', on)
	}
</script>

<div class="switch-container">
	<button
		class="switch"
		class:on
		on:click={toggle}
		role="switch"
		aria-checked={on}
		type="button"
	>
		<div class="switch-handle"></div>
	</button>
	{#if label}
		<span class="label" on:click={toggle}>{label}</span>
	{/if}
</div>

<style>
	.switch-container {
		display: flex;
		align-items: center;
		gap: 10px;
		margin: 8px 0;
		user-select: none;
	}

	.switch {
		width: 44px;
		height: 24px;
		background: var(--bg-hover, #e9ecef);
		border-radius: 12px;
		position: relative;
		cursor: pointer;
		border: 1px solid var(--border-input, #ced4da);
		padding: 0;
		transition:
			background-color 0.2s,
			border-color 0.2s;
		outline: none;
	}

	.switch:focus-visible {
		box-shadow: 0 0 0 2px rgba(77, 171, 247, 0.4);
	}

	.switch.on {
		background: var(--accent, #4dabf7);
		border-color: var(--accent, #4dabf7);
	}

	.switch-handle {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 18px;
		height: 18px;
		background: #ffffff;
		border-radius: 50%;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
		transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.switch.on .switch-handle {
		transform: translateX(20px);
	}

	.label {
		font-size: 0.85rem;
		color: var(--text-main, #333);
		font-weight: 500;
		cursor: pointer;
	}
</style>
