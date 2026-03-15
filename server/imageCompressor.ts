import sharp from "sharp";

const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 70;

export async function compressImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(MAX_DIMENSION, MAX_DIMENSION, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer();
}
