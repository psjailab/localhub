<template>
  <div class="chatbot">
    <div class="header">
      <h3>LocalHub Chatbot</h3>
    </div>

    <div class="messages">
      <div v-for="(m, i) in messages" :key="i" :class="['msg', m.role]">
        <div class="bubble">
          <div class="role">{{ m.role === 'user' ? 'You' : 'Assistant' }}</div>
          <div class="text">{{ m.content }}</div>
        </div>
      </div>
    </div>

    <div class="controls">
      <input v-model="apiKey" placeholder="OpenAI API Key (will be used in-browser)" />
      <textarea v-model="input" placeholder="Type your message..." @keydown.enter.prevent="send" />
      <div class="actions">
        <button @click="send" :disabled="loading || !input">Send</button>
        <button @click="clear">Clear</button>
      </div>
      <div v-if="error" class="error">{{ error }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const apiKey = ref('')
const input = ref('')
const messages = ref([
  { role: 'system', content: 'You are a helpful assistant for LocalHub.' }
])
const loading = ref(false)
const error = ref(null)
const OPENAI_KEY = import.meta.env.VITE_OPENAI_KEY


async function send() {
  if (!input.value) return
  error.value = null
  messages.value.push({ role: 'user', content: input.value })
  const userText = input.value
  input.value = ''
  loading.value = true

  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.value}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: messages.value.map(m => ({ role: m.role, content: m.content })),
        max_tokens: 512
      })
    })

    if (!resp.ok) {
      const text = await resp.text()
      throw new Error(`API error: ${resp.status} ${text}`)
    }

    const data = await resp.json()
    const assistant = data.choices?.[0]?.message?.content ?? '[No response]'
    messages.value.push({ role: 'assistant', content: assistant })
  } catch (err) {
    error.value = err.message || String(err)
    // 팝업 대신 messages에 에러를 넣을 수도 있음
  } finally {
    loading.value = false
  }
}

function clear() {
  messages.value = [{ role: 'system', content: 'You are a helpful assistant for LocalHub.' }]
  input.value = ''
  error.value = null
}
</script>

<style scoped>
.chatbot { max-width: 420px; border: 1px solid #ddd; padding: 12px; border-radius: 8px; background: #fffaf1; }
.header h3 { margin: 0 0 8px 0; font-size: 18px; }
.messages { max-height: 320px; overflow:auto; margin-bottom:8px; }
.msg { margin:6px 0; display:flex; }
.msg.user { justify-content:flex-end; }
.bubble { background:#fff; padding:8px 10px; border-radius:6px; max-width:80%; box-shadow:0 1px 2px rgba(0,0,0,0.05); }
.msg.user .bubble { background:#e6ffe6; }
.role { font-size:10px; color:#666; margin-bottom:4px; }
.controls input, .controls textarea { width:100%; margin-bottom:6px; padding:8px; border-radius:6px; border:1px solid #ccc; }
.actions { display:flex; gap:8px; }
.error { color:#b00020; margin-top:6px; }
</style>