<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  msg: int
}>();

const count = ref<number>(0);

const increment = () => {
  count++;
};

</script>

<template>
  <div class="counter">
    <h1>Counter</h1>
    <p>Count : {{ count }}</p>
    <button v-on:click="increment"></button>
  </div>
</template>
