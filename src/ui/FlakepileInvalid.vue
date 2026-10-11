<script setup lang="ts">
import type { FlakepilePlugin } from '@/custom-view'
import ObIcon from '@/wrappers/ObIcon.vue'
import { inject } from 'vue'

const plugin = inject('plugin') as FlakepilePlugin
</script>

<template>
  <div class="flakepile-invalid">
    <div class="content">
      <div class="invalid-message">
        <p class="title"><ObIcon name="triangle-alert" /><span>Oops...</span></p>
        <p>"<b>{{ plugin.meta.filename }}</b>" cannot be loaded.</p>
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

  font-size: var(--font-ui-medium);

  > .content {
    max-width: 400px;
  }
}

.invalid-message {
  padding: 0.25em 0.5em;
  margin-bottom: 0.5em;

  color: var(--text-error);
  background-color: color-mix(in srgb, var(--text-error) 1%, transparent);
  border: var(--border-width) solid var(--text-error);
  border-radius: var(--radius-m);

  & > p {
    margin: 0.25em 0;
    line-height: 1.5;
  }

  & > .title {
    display: flex;
    align-items: center;
    column-gap: 0.25em;
    font-weight: bold;
  }
}

.loading-error {
  font-size: var(--font-ui-small);
  font-family: var(--font-monospace);

  line-height: 1.5;
  white-space: pre-wrap;
  user-select: text;
}
</style>
