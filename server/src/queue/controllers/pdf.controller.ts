// import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { QSource } from "../type";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { DialoqbaseVectorStore } from "../../utils/store";
import { embeddings } from "../../utils/embeddings";
import { DialoqbasePDFLoader } from "../../loader/pdf";
import { PrismaClient } from "@prisma/client";
import { getModelInfo } from "../../utils/get-model-info";

export const pdfQueueController = async (
  source: QSource,
  prisma: PrismaClient
) => {
  console.log("loading pdf");

  const location = source.location!;
  const loader = new DialoqbasePDFLoader(location);
  const docs = await loader.load();

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: source.chunkSize,
    chunkOverlap: source.chunkOverlap,
  });
  const chunks = await textSplitter.splitDocuments(docs);

  const embeddingInfo = await getModelInfo({
    model: source.embedding,
    prisma,
    type: "embedding",
  })

  if (!embeddingInfo) {
    throw new Error("Embedding not found. Please verify the embedding id");
  }

  await DialoqbaseVectorStore.fromDocuments(
    chunks,
    embeddings(
      embeddingInfo.model_provider!.toLowerCase(),
      embeddingInfo.model_id,
      embeddingInfo?.config
    ),
    {
      botId: source.botId,
      sourceId: source.id,
    }
  );
};
