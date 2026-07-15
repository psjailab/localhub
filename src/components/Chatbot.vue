<template>
  <div class="chatbot-widget">
    <button class="chatbot-toggle" @click="visible = !visible" :aria-expanded="visible">
      <span v-if="!visible">💬</span>
      <span v-else>✕</span>
    </button>

    <div v-if="visible" class="chatbot-panel">
      <div class="chatbot-header">
        <h3>LocalHub 챗봇</h3>
        <button class="close-btn" @click="visible = false">✕</button>
      </div>

      <div class="messages">
        <div
          v-for="(m, i) in messages"
          :key="i"
          :class="['msg', m.role]"
        >
          <div class="bubble">
            <div class="role">{{ m.role === 'user' ? '사용자' : '챗봇' }}</div>
            <div class="text">{{ m.content }}</div>
          </div>
        </div>
      </div>

      <div class="controls">
        <textarea
          v-model="input"
          placeholder="메시지를 입력하세요..."
          @keydown.enter.prevent="send"
        />
        <div class="actions">
          <button @click="send" :disabled="loading || !input">전송</button>
          <button @click="clear">초기화</button>
        </div>
        <div v-if="error" class="error">{{ error }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const OPENAI_KEY = import.meta.env.VITE_OPENAI_KEY

const visible = ref(false)
const input = ref('')
const messages = ref([
  {
    role: 'system',
    content: 'Localhub 챗봇 서비스에 오신 걸 환영합니다. 무엇이 궁금하신가요?'
  }
])
const loading = ref(false)
const error = ref(null)

function extractAssistantTextFromResponse(data) {
  // 다양한 포맷에 대응하는 폴백 파서
  const fromChoicesMessage = data?.choices?.[0]?.message?.content
  if (fromChoicesMessage) return fromChoicesMessage

  const fromChoicesText = data?.choices?.[0]?.text
  if (fromChoicesText) return fromChoicesText

  if (typeof data?.output_text === 'string' && data.output_text.trim()) return data.output_text

  const fromOutput = data?.output?.flatMap(item => {
    if (Array.isArray(item.content)) {
      return item.content.map(c => c?.text).filter(Boolean)
    }
    return item?.text ? [item.text] : []
  }).filter(Boolean)
  if (fromOutput && fromOutput.length) return fromOutput.join('\n')

  return null
}

async function send() {
  if (!input.value) return
  if (!OPENAI_KEY) {
    error.value = 'OpenAI API 키가 설정되지 않았습니다.'
    return
  }

  error.value = null
  messages.value.push({ role: 'user', content: input.value })
  const userPrompt = input.value
  input.value = ''
  loading.value = true

  try {
    // 1) 먼저 chat/completions 시도 (gpt-5-mini에 맞춰)
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        messages: messages.value.map(m => ({ role: m.role, content: m.content })),
        max_completion_tokens: 512
      })
    })

    if (!resp.ok) {
      const errText = await resp.text()
      throw new Error(`[API Error ${resp.status}] ${errText}`)
    }

    const data = await resp.json()
    console.log('OpenAI response (chat/completions):', data)

    let assistant = extractAssistantTextFromResponse(data)

    // 2) 만약 chat/completions 응답에서 텍스트를 못 뽑았으면 responses 엔드포인트로 폴백 시도
    if (!assistant) {
      try {
        const resp2 = await fetch('https://api.openai.com/v1/responses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-5-mini',
            input: messages.value.map(m => ({ role: m.role, content: m.content })),
            max_output_tokens: 512
          })
        })

        if (resp2.ok) {
          const data2 = await resp2.json()
          console.log('OpenAI response (responses fallback):', data2)
          assistant = extractAssistantTextFromResponse(data2)
        } else {
          const errText2 = await resp2.text()
          console.warn('[responses fallback] non-ok:', resp2.status, errText2)
        }
      } catch (e) {
        console.warn('responses fallback failed:', e)
      }
    }

    if (assistant) {
      messages.value.push({ role: 'assistant', content: assistant })
    } else {
      messages.value.push({
        role: 'assistant',
        content: '🤖 응답을 받았으나 텍스트를 추출하지 못했습니다. 개발자 콘솔의 응답을 확인하세요.'
      })
      console.warn('응답 구조에서 텍스트를 찾을 수 없습니다.')
    }
  } catch (err) {
    error.value = `통신 실패: ${err.message || String(err)}`
    console.error('Chatbot API 통신 에러 로그:', err)
  } finally {
    loading.value = false
  }
}

function clear() {
  messages.value = [{ role: 'system', content: 'Localhub 챗봇 서비스에 오신 걸 환영합니다. 무엇이 궁금하신가요?' }]
  input.value = ''
  error.value = null
}
</script>

<style scoped>
.chatbot-widget {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 9999;
  font-family: inherit;
}

.chatbot-toggle {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  border: none;
  cursor: pointer;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.chatbot-panel {
  width: 360px;
  max-height: 520px;
  margin-top: 12px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.18);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.chatbot-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: #f7f7f7;
  border-bottom: 1px solid #ececec;
}

.chatbot-header h3 {
  margin: 0;
  font-size: 16px;
}

.close-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 18px;
}

.messages {
  padding: 12px;
  overflow-y: auto;
  flex: 1;
  background: #fbfaf8;
}

.msg {
  margin: 8px 0;
  display: flex;
}

.msg.user {
  justify-content: flex-end;
}

.bubble {
  background: #fff;
  padding: 10px 12px;
  border-radius: 16px;
  max-width: 80%;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

.msg.user .bubble {
  background: #dcfce7;
}

.role {
  font-size: 10px;
  color: #777;
  margin-bottom: 4px;
}

.text {
  white-space: pre-wrap;
}

.controls {
  padding: 12px 16px 16px;
  background: white;
  border-top: 1px solid #ececec;
}

.controls textarea {
  width: 100%;
  min-height: 72px;
  resize: vertical;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #ddd;
  margin-bottom: 10px;
  font-family: inherit;
}

.actions {
  display: flex;
  gap: 10px;
}

.actions button {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
}

.actions button:first-child {
  background: #3b82f6;
  color: white;
}

.actions button:last-child {
  background: #f3f4f6;
  color: #333;
}

.error {
  margin-top: 10px;
  color: #c92a2a;
  font-size: 13px;
}
</style>