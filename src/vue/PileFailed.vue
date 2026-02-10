<script setup lang="ts">
import { inject } from 'vue'
import type { FileInfo, Parsing } from '@/view'
import ObIcon from '@/components/ObIcon.vue'

const file = inject('file') as FileInfo
const parsing = inject('parsing') as Parsing
</script>

<template>
  <div class="flakepile-failed">
    <div class="failed-message">
      <p class="title">
        <ObIcon name="triangle-alert" />Error
      </p>
      <p>Cannot parse the flakepile "<b>{{ file.name }}</b>".</p>
      <p>Try fixing the error in the source JSON file with an external editor.</p>
    </div>

    <pre class="parsing-error">{{ parsing.error }}</pre>
  </div>
</template>

<style lang="scss" scoped>
.flakepile-failed {
  font-size: var(--font-ui-medium);
}

.failed-message {
  padding: 0 0.5em;
  margin-bottom: 0.5em;

  color: var(--text-error);
  background-color: color-mix(in srgb, var(--text-error) 2%, transparent);
  border: var(--border-width) solid var(--text-error);
  border-radius: var(--radius-m);

  &>p {
    margin: 0.5em 0;
    line-height: 1.5;
  }

  &>.title {
    display: flex;
    align-items: center;
    column-gap: 0.25em;
    font-weight: bold;
  }
}

.parsing-error {
  font-size: var(--font-ui-small);
  font-family: var(--font-monospace);

  line-height: 1.5;
  white-space: pre-wrap;
}
</style>
