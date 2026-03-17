import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenAI } from '@google/genai'
import type { ModelConfig } from './types'

/* ------------------------------------------------------------------ */
/* Non-streaming: analyze                                               */
/* ------------------------------------------------------------------ */
export async function analyzeWithAI(prompt: string, config: ModelConfig): Promise<string> {
  if (config.provider === 'claude') {
    const client = new Anthropic()
    const message = await client.messages.create({
      model: config.modelId,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })
    const block = message.content[0]
    if (block.type !== 'text') throw new Error('예상치 못한 응답 형식')
    return block.text
  }

  // Gemini
  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! })
  const response = await ai.models.generateContent({
    model: config.modelId,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  })
  return response.text ?? ''
}

/* ------------------------------------------------------------------ */
/* Streaming: generate                                                  */
/* ------------------------------------------------------------------ */
export async function generateStreamWithAI(
  prompt: string,
  config: ModelConfig
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder()

  if (config.provider === 'claude') {
    const client = new Anthropic()
    const stream = await client.messages.stream({
      model: config.modelId,
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    })

    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(chunk.delta.text))
            }
          }
        } finally {
          controller.close()
        }
      },
    })
  }

  // Gemini streaming
  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! })
  const stream = await ai.models.generateContentStream({
    model: config.modelId,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  })

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.text
          if (text) {
            controller.enqueue(encoder.encode(text))
          }
        }
      } finally {
        controller.close()
      }
    },
  })
}
