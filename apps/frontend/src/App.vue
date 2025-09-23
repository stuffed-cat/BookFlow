<template>
  <main>
    <h1>BookFlow</h1>
    <section>
      <button @click="load">加载图书</button>
      <ul>
        <li v-for="b in books" :key="b.id">{{ b.title }} — {{ b.author }}</li>
      </ul>
    </section>
    <section>
      <h2>健康检查</h2>
      <pre>{{ health }}</pre>
    </section>
  </main>
  
</template>

<script setup lang="ts">
import { ref } from 'vue';

type Book = { id: number; title: string; author: string };

const books = ref<Book[]>([]);
const health = ref('');

async function load() {
  const res = await fetch('/api/books');
  books.value = await res.json();
  const h = await fetch('/api/health');
  health.value = JSON.stringify(await h.json(), null, 2);
}
</script>

<style>
body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; }
main { max-width: 720px; margin: 2rem auto; padding: 0 1rem; }
button { padding: 6px 12px; }
</style>
