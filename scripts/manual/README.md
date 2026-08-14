# Manual scripts

Throwaway scripts written while building the RAG pipeline, kept because they
show each stage in isolation. Run one and read the output — **they are not
tests**: there are no assertions and nothing here runs in CI. The project has
no automated test suite yet; see the known gaps in [SECURITY.md](../../SECURITY.md).

Run from the project root:

```bash
pnpm exec tsx scripts/manual/try-loader.ts
```

| Script | Stage it exercises |
|---|---|
| `try-loader.ts` | PDF/CSV/text extraction — `lib/document-loader.ts` |
| `try-splitter.ts` | Chunking the extracted text — `lib/text-splitter.ts` |
| `try-embedding.ts` | A single embedding call — `lib/openai.ts` |
| `try-context-builder.ts` | Assembling retrieved chunks into a prompt — `lib/context-builder.ts` |
| `try-rag-service.ts` | The whole retrieve-then-answer path — `lib/rag-service.ts` |

> **`try-embedding.ts` and `try-rag-service.ts` call the OpenAI API and cost
> money each time they run.** The other three are local only.
