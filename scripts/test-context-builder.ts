import { buildContext } from "@/lib/context-builder"

async function main() {
  const mockDocuments = [
    {
      id: "1",
      content: "How to order products? You can order via our website...",
      metadata: { source: "CustomerFAQ.pdf" },
      similarity: 0.82,
    },
    {
      id: "2",
      content: "Return policy? Customers can return products within 7 days...",
      metadata: { source: "CustomerFAQ.pdf" },
      similarity: 0.75,
    },
    {
      id: "3",
      content: "Store hours? The store is open Monday to Friday, 9:00 AM - 6:00 PM.",
      metadata: { source: "CustomerFAQ.pdf" },
      similarity: 0.65,
    },
  ]

  const context = buildContext(mockDocuments, {
    maxTokens: 100,
    minSimilarity: 0.7,
    maxDocuments: 2,
  })

  console.log("Generated Context:\n", context)
}

main().catch(console.error)
