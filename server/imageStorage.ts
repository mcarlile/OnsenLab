import { objectStorageClient, ObjectStorageService } from "./replit_integrations/object_storage";

const BUCKET_ID = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID || "";
const objectStorageService = new ObjectStorageService();

export async function uploadAuditImage(
  readingId: string,
  imageBuffer: Buffer,
  mimeType: string,
  part: "top" | "bottom"
): Promise<string> {
  const fileName = `audits/${readingId}_${part}.jpg`;
  const objectName = `public/${fileName}`;

  const bucket = objectStorageClient.bucket(BUCKET_ID);
  const file = bucket.file(objectName);

  await file.save(imageBuffer, {
    metadata: {
      contentType: mimeType,
    },
  });

  return `/api/audit-images/${fileName}`;
}

export { objectStorageService };
