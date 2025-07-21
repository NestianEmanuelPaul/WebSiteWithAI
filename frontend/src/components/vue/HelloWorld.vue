<template>
  <div class="vue-component">
    <h2>{{ message }}</h2>
    <p>This is a Vue component rendered inside React!</p>
    <button @click="increment">Clicked {{ count }} times</button>
  </div>
</template>

<script>
import { ref } from 'vue';

export default {
  name: 'HelloWorld',
  props: {
    message: {
      type: String,
      default: 'Hello from Vue!'
    }
  },
  setup() {
    const count = ref(0);
    
    const increment = () => {
      count.value++;
    };
    
    return {
      count,
      increment
    };
  }
};
</script>

<style scoped>
.vue-component {
  padding: 1.5rem;
  margin: 1rem 0;
  border: 2px solid #42b983;
  border-radius: 8px;
  background-color: #f8f8f8;
}

h2 {
  color: #2c3e50;
  margin-top: 0;
}

button {
  background-color: #42b983;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  margin-top: 1rem;
}

button:hover {
  background-color: #3aa876;
}
</style>
