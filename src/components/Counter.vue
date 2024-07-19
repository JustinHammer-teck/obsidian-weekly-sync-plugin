<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  msg: number;
}>();

const count = ref(0);

const increment = () => {
  count.value++;
};
</script>

<template>
  <div class="counter">
    <h1>Counter</h1>
    <p>{{ msg }}</p>
    <button type="button" @click="increment">count is {{ count }}</button>
  </div>
</template>
