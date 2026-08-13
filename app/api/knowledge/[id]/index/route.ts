import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { ingestText } from "@/lib/ingestion";

// POST — Index document into Vector Database
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const document = await prisma.knowledgeDocument.findUnique({
    where: { id },
  });

  if (!document) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    // Delete old chunks first (prevents duplicate data upon re-indexing)
    await prisma.$executeRaw`
      DELETE FROM document
      WHERE metadata->>'documentId' = ${id}
    `;

    // Trigger Ingestion Pipeline
    // Splits content into chunks → generates embeddings → saves to pgVector
    await ingestText(document.content, {
      source: document.source || document.title,
      documentId: document.id,
    });

    // Update document status
    await prisma.knowledgeDocument.update({
      where: { id },
      data: { isIndexed: true },
    });

    return NextResponse.json({
      message: `Document "${document.title}" successfully indexed into Vector DB`,
    });
  } catch (error: any) {
    console.error("Indexing error:", error);
    return NextResponse.json(
      { error: error.message || "Indexing failed" },
      { status: 500 },
    );
  }
}
