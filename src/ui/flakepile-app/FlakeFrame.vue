<script setup lang="ts">
</script>

<template>
  <div :class="['fp-flake-frame', '-none']">
    <slot></slot>
  </div>
</template>

<style scoped lang="scss">
.fp-flake-frame {
  position: relative;
  overflow: hidden;
}
</style>
