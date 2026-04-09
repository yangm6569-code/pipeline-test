import request from './request'
import { useUserStore } from '@/stores/user'

function safeParseJson(text) {
  if (!text || typeof text !== 'string') return null
  try {
    return JSON.parse(text)
  } catch (error) {
    return null
  }
}

function extractContent(payload) {
  if (payload == null) return ''

  if (typeof payload === 'string') {
    return payload.trim()
  }

  if (Array.isArray(payload)) {
    return payload
      .map(item => extractContent(item))
      .filter(Boolean)
      .join('\n')
      .trim()
  }

  if (typeof payload === 'object') {
    const keys = ['reply', 'answer', 'content', 'result', 'message', 'text', 'output']
    for (const key of keys) {
      const value = payload[key]
      if (typeof value === 'string' && value.trim()) {
        return value.trim()
      }
    }

    if (Array.isArray(payload.choices) && payload.choices.length > 0) {
      const firstChoice = payload.choices[0]
      const choiceContent = firstChoice?.message?.content ?? firstChoice?.text
      if (typeof choiceContent === 'string' && choiceContent.trim()) {
        return choiceContent.trim()
      }
    }
  }

  return ''
}

function parseChatResponse(rawText) {
  const parsed = safeParseJson(rawText)

  if (!parsed) {
    return rawText?.trim() || ''
  }

  if (typeof parsed.code !== 'undefined') {
    if (parsed.code !== 200 && parsed.code !== 0) {
      throw new Error(parsed.message || 'AI chat request failed')
    }
    const dataContent = extractContent(parsed.data)
    if (dataContent) return dataContent
    return extractContent(parsed) || ''
  }

  return extractContent(parsed) || rawText?.trim() || ''
}

function extractStreamContent(payload) {
  if (payload == null) return ''

  if (typeof payload === 'string') {
    return payload
  }

  if (Array.isArray(payload)) {
    return payload.map(item => extractStreamContent(item)).join('')
  }

  if (typeof payload === 'object') {
    if (typeof payload.code !== 'undefined') {
      if (payload.code !== 200 && payload.code !== 0) {
        throw new Error(payload.message || 'AI chat request failed')
      }

      const wrappedContent = extractStreamContent(payload.data)
      if (wrappedContent) return wrappedContent
    }

    const keys = ['delta', 'content', 'result', 'reply', 'answer', 'message', 'text', 'output', 'token']
    for (const key of keys) {
      const value = payload[key]
      if (typeof value === 'string') {
        return value
      }
    }

    if (Array.isArray(payload.choices) && payload.choices.length > 0) {
      const firstChoice = payload.choices[0]
      const deltaContent = firstChoice?.delta?.content
      const messageContent = firstChoice?.message?.content
      const textContent = firstChoice?.text
      const choiceContent = deltaContent ?? messageContent ?? textContent

      if (typeof choiceContent === 'string') {
        return choiceContent
      }

      if (Array.isArray(choiceContent)) {
        return choiceContent
          .map((item) => {
            if (typeof item === 'string') return item
            if (item && typeof item.text === 'string') return item.text
            return ''
          })
          .join('')
      }
    }
  }

  return ''
}

async function parseSseChunkLines(lines, onChunk) {
  let mergedText = ''

  for (const line of lines) {
    const trimmedLine = line.trim()
    if (!trimmedLine || trimmedLine.startsWith(':')) continue
    if (!trimmedLine.startsWith('data:')) continue

    const dataText = trimmedLine.slice(5).trim()
    if (!dataText || dataText === '[DONE]') continue

    const parsed = safeParseJson(dataText)
    const piece = parsed
      ? (typeof parsed.content === 'string' ? parsed.content : extractStreamContent(parsed))
      : dataText

    if (piece) {
      mergedText += piece
      if (typeof onChunk === 'function') {
        await onChunk(piece)
      }
    }
  }

  return mergedText
}

export async function chatWithAi(message) {
  const blob = await request({
    url: '/ai/chat',
    method: 'post',
    data: { message },
    responseType: 'blob'
  })

  const rawText = await blob.text()
  return parseChatResponse(rawText)
}

export async function chatWithAiStream(message, options = {}) {
  const { onChunk } = options
  const userStore = useUserStore()

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream'
  }

  if (userStore.token) {
    headers.Authorization = `Bearer ${userStore.token}`
  }

  const response = await fetch('/api/ai/chat/stream', {
    method: 'POST',
    headers,
    body: JSON.stringify({ message })
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    const parsed = safeParseJson(errorText)
    const errorMessage =
      parsed?.message ||
      extractContent(parsed?.data) ||
      parseChatResponse(errorText) ||
      `AI chat request failed (${response.status})`
    throw new Error(errorMessage)
  }

  const contentType = response.headers.get('content-type') || ''
  const isSse = contentType.includes('text/event-stream')
  const maybeJson = contentType.includes('application/json')

  const reader = response.body?.getReader()
  if (!reader) {
    const fallbackText = await response.text()
    const finalText = parseChatResponse(fallbackText)
    if (finalText && typeof onChunk === 'function') {
      await onChunk(finalText)
    }
    return finalText
  }

  const decoder = new TextDecoder('utf-8')
  let rawText = ''
  let fullText = ''
  let lineBuffer = ''
  let emittedByChunks = false
  let detectedSse = isSse

  while (true) {
    const { value, done } = await reader.read()
    if (done) break

    const chunkText = decoder.decode(value, { stream: true })
    if (!chunkText) continue

    rawText += chunkText

    if (detectedSse || chunkText.includes('data:')) {
      detectedSse = true
      lineBuffer += chunkText
      const lines = lineBuffer.split(/\r?\n/)
      lineBuffer = lines.pop() || ''
      const merged = await parseSseChunkLines(lines, onChunk)
      if (merged) {
        emittedByChunks = true
        fullText += merged
      }
      continue
    }

    if (!maybeJson) {
      emittedByChunks = true
      fullText += chunkText
      if (typeof onChunk === 'function') {
        await onChunk(chunkText)
      }
    }
  }

  const tailChunk = decoder.decode()
  if (tailChunk) {
    rawText += tailChunk

    if (detectedSse || tailChunk.includes('data:')) {
      detectedSse = true
      lineBuffer += tailChunk
    } else {
      if (!maybeJson) {
        emittedByChunks = true
        fullText += tailChunk
        if (typeof onChunk === 'function') {
          await onChunk(tailChunk)
        }
      }
    }
  }

  if (lineBuffer) {
    if (detectedSse) {
      const lines = lineBuffer.split(/\r?\n/)
      const merged = await parseSseChunkLines(lines, onChunk)
      if (merged) {
        emittedByChunks = true
        fullText += merged
      }
    } else if (!maybeJson) {
      emittedByChunks = true
      fullText += lineBuffer
      if (typeof onChunk === 'function') {
        await onChunk(lineBuffer)
      }
    }
  }

  if (maybeJson && !detectedSse) {
    const finalText = parseChatResponse(rawText)
    if (finalText && !emittedByChunks && typeof onChunk === 'function') {
      await onChunk(finalText)
    }
    return finalText
  }

  if (!emittedByChunks) {
    const fallbackText = parseChatResponse(rawText || fullText)
    if (fallbackText && typeof onChunk === 'function') {
      await onChunk(fallbackText)
    }
    return fallbackText
  }

  return fullText
}
