import { generateRAGResponse } from "@/lib/rag-service"

async function main() {
  const question = "How to order products?"
  const response = await generateRAGResponse(question, [])
  
  console.log("Answer:", response.answer)
  console.log("Sources:", response.sources.map(s => s.metadata?.source))
}

main().catch(console.error)
