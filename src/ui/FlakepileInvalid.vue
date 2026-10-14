<script setup lang="ts">
import type { FlakepilePluginRef } from '@/custom-view'
import ObIcon from '@/wrappers/ObIcon.vue'
import { inject } from 'vue'

const plugin = inject('plugin') as FlakepilePluginRef
</script>

<template>
  <div class="flakepile-invalid">
    <div class="content">
      <div class="invalid-message">
        <p class="title"><ObIcon name="triangle-alert" /><span>Oops...</span></p>
        <p><b>{{ plugin.meta.filename }}</b> cannot be loaded.</p>
        <p>Please fix the error in the source file (as JSON) with an external editor.</p>
      </div>

      <pre class="loading-error">{{ plugin.meta.loadingError }}</pre>
    </div>
  </div>
</template>

<style scoped lang="scss">
.flakepile-invalid {
  position: fixed;
  inset: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: var(--size-4-2);
  font-size: var(--font-ui-small);

  > .content {
    max-width: 400px;
  }
}

.invalid-message {
  padding: var(--size-4-1) var(--size-4-2);
  margin: var(--size-4-1) 0;

  color: var(--text-error);
  background-color: color-mix(in srgb, var(--text-error) 1%, transparent);
  border: var(--border-width) solid var(--text-error);
  border-radius: var(--radius-m);

  & > p {
    margin: var(--size-4-1);
    line-height: var(--line-height-normal);
  }

  & > .title {
    display: flex;
    align-items: center;
    column-gap: var(--size-4-1);
    font-weight: bold;
  }
}

.loading-error {
  font-size: var(--font-ui-smaller);
  font-family: var(--font-monospace);

  margin: var(--size-4-2);
  line-height: var(--line-height-normal);
  white-space: pre-wrap;
  user-select: text;
}
</style>
