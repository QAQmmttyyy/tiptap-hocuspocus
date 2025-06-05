import { createOpenAI } from "@ai-sdk/openai"
import { streamText } from "ai"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  const { messages } = await req.json()
  console.log(`Bearer ${process.env.OPENAI_API_KEY}`, "123")

  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
  })

  const result = streamText({
    model: openai("claude-sonnet-4-20250514"),
    messages,
  })
  // console.log(result)

  return result.toDataStreamResponse()
}
