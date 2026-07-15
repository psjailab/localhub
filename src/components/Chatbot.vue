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

// [수정] 화면 UI에 표시되는 대화 기록
// 사용자에게 보이는 첫인사는 챗봇 역할(assistant)로 지정해 둡니다.
const messages = ref([
  {
    role: 'assistant', 
    content: 'Localhub 챗봇 서비스에 오신 걸 환영합니다. 무엇이 궁금하신가요?'
  }
])
const loading = ref(false)
const error = ref(null)

async function send() {
  if (!input.value) return
  if (!OPENAI_KEY) {
    error.value = 'OpenAI API 키가 설정되지 않았습니다.'
    return
  }

  error.value = null
  
  // 1. 사용자의 메시지를 화면 UI에 추가
  messages.value.push({ role: 'user', content: input.value })
  const userPrompt = input.value
  input.value = ''
  loading.value = true

  try {
    // 2. OpenAI API에 보낼 대화 데이터 정제
    // API 서버에는 system 지침을 맨 앞에 명확하게 정의하고, 그 뒤로 주고받은 대화만 전달합니다.
    const apiMessages = [
      {
        role: 'system',
        content: '당신은 LocalHub의 친절한 AI 가이드 챗봇입니다. 사용자의 질문에 로컬 전문가의 관점에서 친절하고 명확하게 답변해 주세요.'
      },
      ...messages.value.map(m => ({
        role: m.role,
        content: m.content
      }))
    ]

    // 3. chat/completions 호출
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-5-mini', // 또는 'gpt-3.5-turbo' 등 범용적인 모델 사용 권장
        messages: apiMessages,
        max_completion_tokens: 1536,     // max_completion_tokens 대신 표준 max_tokens 사용
        temperature: 1
      })
    })

    if (!resp.ok) {
      const errText = await resp.text()
      throw new Error(`[API Error ${resp.status}] ${errText}`)
    }

    const data = await resp.json()
    console.log('OpenAI response:', data)

    // 4. 안전한 파싱
    const assistant = data?.choices?.[0]?.message?.content || null

    if (assistant && assistant.trim()) {
      messages.value.push({ role: 'assistant', content: assistant.trim() })
    } else {
      messages.value.push({
        role: 'assistant',
        content: '🤖 API 응답은 받았으나, 내용(Content)이 비어 있습니다. 질문을 다시 한번 입력해 주세요.'
      })
      console.warn('API 응답 구조 분석 실패:', data)
    }
  } catch (err) {
    error.value = `통신 실패: ${err.message || String(err)}`
    console.error('Chatbot API 통신 에러 로그:', err)
  } finally {
    loading.value = false
  }
}

function clear() {
  messages.value = [{ role: 'assistant', content: 'Localhub 챗봇 서비스에 오신 걸 환영합니다. 무엇이 궁금하신가요?' }]
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