<script setup lang="ts">
</script>

<template>
  <div :class="['fp-flake-frame', '-none']">
    <slot></slot>
  </div>
</template>

<style scoped lang="scss">
.fp-flake-frame {
  overflow: hidden;
  content-visibility: auto;

  position: relative;
  min-height: 2.5rem;
  max-height: 100%;
}
</style>
