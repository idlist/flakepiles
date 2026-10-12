<template>
  <div class="flake-frame">
    <slot></slot>
  </div>
</template>

<style scoped lang="scss">
.flake-frame {
  overflow: hidden;
  content-visibility: auto;

  position: relative;
  min-height: 0;
  max-height: 100%;

  --box-shadow: 0 0 4px var(--flake-shadow), 1px 1px 2px var(--flake-shadow);
  --box-shadow-heavy: 0 0 8px var(--flake-shadow-heavy), 1px 1px 4px var(--flake-shadow);

  border: var(--border-width) solid var(--flake-border);
  border-radius: var(--radius-m);
  box-shadow: var(--box-shadow);

  color: var(--flake-text);
  background-color: var(--flake-text-bg);
}
</style>
