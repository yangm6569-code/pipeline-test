<template>
  <div class="page-container">
    <div class="content" style="padding: 20px;">
      <h2 style="color: #2c3e50; margin-bottom: 20px;">AI Chat Assistant</h2>

      <el-card class="card-shadow chat-card">
        <div ref="messageListRef" class="message-list">
          <div v-if="messages.length === 0" class="empty-state">
            <p>Start a conversation with the AI assistant.</p>
          </div>

          <div
            v-for="item in messages"
            :key="item.id"
            :class="['message-row', item.role]"
          >
            <div class="message-bubble">
              <div class="message-role">{{ item.role === 'user' ? 'You' : 'AI Assistant' }}</div>
              <div class="message-text">
                {{ item.content }}
                <span v-if="typingMessageId === item.id" class="typing-cursor">|</span>
              </div>
              <div class="message-time">{{ item.time }}</div>
            </div>
          </div>

          <div v-if="waitingResponse" class="message-row assistant">
            <div class="message-bubble loading-bubble">
              <div class="message-role">AI Assistant</div>
              <div class="typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>

        <div class="input-area">
          <el-input
            v-model="inputText"
            type="textarea"
            :rows="4"
            resize="none"
            placeholder="Type your question, press Enter to send, Shift+Enter for a new line"
            @keydown="handleInputKeydown"
          />
          <div class="action-buttons">
            <el-button :disabled="sending || messages.length === 0" @click="clearMessages">
              Clear Chat
            </el-button>
            <el-button type="primary" :loading="sending" @click="sendMessage">
              Send
            </el-button>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { chatWithAiStream } from '@/api/ai'

const inputText = ref('')
const sending = ref(false)
const waitingResponse = ref(false)
const typingMessageId = ref('')
const messages = ref([])
const messageListRef = ref(null)

const EMPTY_REPLY_TEXT = 'No valid response content was returned for this message.'
const SERVICE_UNAVAILABLE_TEXT = 'Sorry, the AI service is temporarily unavailable. Please try again later.'
const STREAM_RENDER_DELAY = 12

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const formatNow = () => {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

const scrollToBottom = async () => {
  await nextTick()
  const container = messageListRef.value
  if (container) {
    container.scrollTop = container.scrollHeight
  }
}

const createMessage = (role, content = '') => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  role,
  content,
  time: formatNow()
})

const appendMessage = async (role, content) => {
  messages.value.push(createMessage(role, content))
  await scrollToBottom()
}

const handleInputKeydown = (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

const sendMessage = async () => {
  if (sending.value) return

  const question = inputText.value.trim()
  if (!question) {
    ElMessage.warning('Please enter your message.')
    return
  }

  inputText.value = ''
  await appendMessage('user', question)

  let assistantMessage = null

  const ensureAssistantMessage = async () => {
    if (assistantMessage) return assistantMessage

    assistantMessage = createMessage('assistant', '')
    messages.value.push(assistantMessage)
    typingMessageId.value = assistantMessage.id
    waitingResponse.value = false
    await scrollToBottom()
    return assistantMessage
  }

  try {
    sending.value = true
    waitingResponse.value = true

    const finalText = await chatWithAiStream(question, {
      onChunk: async (chunk) => {
        if (!chunk) return

        const targetMessage = await ensureAssistantMessage()
        targetMessage.content += chunk
        await scrollToBottom()
        await sleep(STREAM_RENDER_DELAY)
      }
    })

    waitingResponse.value = false

    if (!assistantMessage) {
      await appendMessage('assistant', finalText || EMPTY_REPLY_TEXT)
    } else if (!assistantMessage.content) {
      assistantMessage.content = finalText || EMPTY_REPLY_TEXT
      await scrollToBottom()
    }
  } catch (error) {
    console.error('AI chat failed:', error)
    waitingResponse.value = false

    if (!assistantMessage) {
      await appendMessage('assistant', SERVICE_UNAVAILABLE_TEXT)
    } else if (!assistantMessage.content) {
      assistantMessage.content = SERVICE_UNAVAILABLE_TEXT
      await scrollToBottom()
    }

    ElMessage.error(error.message || 'AI chat failed')
  } finally {
    sending.value = false
    waitingResponse.value = false
    typingMessageId.value = ''
  }
}

const clearMessages = async () => {
  try {
    await ElMessageBox.confirm('Are you sure you want to clear this conversation?', 'Confirm', {
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel',
      type: 'warning'
    })
    messages.value = []
    ElMessage.success('Conversation cleared.')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to clear conversation:', error)
    }
  }
}

onMounted(async () => {
  await appendMessage('assistant', 'Hi, I am your AI assistant. You can ask me anything.')
})
</script>

<style scoped>
.page-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.content {
  height: 100%;
  overflow-y: auto;
  background-color: #f5f7fa;
}

.card-shadow {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

.chat-card {
  min-height: 72vh;
  display: flex;
  flex-direction: column;
}

.message-list {
  height: 54vh;
  overflow-y: auto;
  padding: 4px 4px 0;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: linear-gradient(180deg, #f9fbff 0%, #f6f8fc 100%);
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
  font-size: 14px;
}

.message-row {
  display: flex;
  margin: 12px 0;
}

.message-row.user {
  justify-content: flex-end;
}

.message-row.assistant {
  justify-content: flex-start;
}

.message-bubble {
  max-width: 72%;
  padding: 10px 12px;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  white-space: pre-wrap;
  line-height: 1.6;
}

.message-row.user .message-bubble {
  background-color: #ecf5ff;
  border: 1px solid #d9ecff;
}

.message-row.assistant .message-bubble {
  background-color: #ffffff;
  border: 1px solid #ebeef5;
}

.message-role {
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
}

.message-text {
  color: #303133;
  font-size: 14px;
  word-break: break-word;
}

.message-time {
  margin-top: 8px;
  font-size: 12px;
  color: #c0c4cc;
  text-align: right;
}

.loading-bubble {
  min-width: 100px;
}

.typing {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 18px;
}

.typing span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #409eff;
  opacity: 0.3;
  animation: typing 1s infinite ease-in-out;
}

.typing span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing span:nth-child(3) {
  animation-delay: 0.4s;
}

.typing-cursor {
  display: inline-block;
  margin-left: 2px;
  color: #409eff;
  animation: cursor-blink 1s steps(1) infinite;
}

@keyframes typing {
  0%,
  80%,
  100% {
    transform: translateY(0);
    opacity: 0.3;
  }
  40% {
    transform: translateY(-3px);
    opacity: 1;
  }
}

@keyframes cursor-blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}

.input-area {
  margin-top: 14px;
}

.action-buttons {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
