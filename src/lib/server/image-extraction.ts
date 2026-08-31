import { readPrivate } from "./storage";

export type ExtractedImage = {
  page: number; // 1-indexed page number
  index: number; // order within page
  dataUrl: string; // base64 data URL for inline display
  width: number;
  height: number;
  x: number; // position from left (PDF points)
  y: number; // position from top (PDF points)
  caption?: string; // optional AI-generated caption (filled later)
};

/**
 * Extract all embedded images from a PDF file.
 * Uses pdfjs-dist operator list to identify image-drawing operators
 * and renders each image region to a canvas for capture.
 */
export async function extractImagesFromPdf(
  pdfKey: string,
  options: { minSize?: number; maxImages?: number } = {}
): Promise<ExtractedImage[]> {
  const { minSize = 20, maxImages = 100 } = options;

  const buffer = await readPrivate(pdfKey);
  const data = new Uint8Array(buffer);

  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjsLib.getDocument({
    data,
    isEvalSupported: false,
    useSystemFonts: false,
  });
  const pdfDoc = await loadingTask.promise;
  const totalPages = pdfDoc.numPages;

  const allImages: ExtractedImage[] = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    if (allImages.length >= maxImages) break;

    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });

    const images = await extractPageImages(page, viewport, pageNum, minSize);
    for (const img of images) {
      if (allImages.length < maxImages) {
        allImages.push(img);
      }
    }
  }

  await pdfDoc.destroy();
  return allImages;
}

/**
 * Extract images from a single PDF page using the operator list.
 * We scan for OPS painting commands and render their source images.
 */
async function extractPageImages(
  page: any,
  viewport: any,
  pageNum: number,
  minSize: number
): Promise<ExtractedImage[]> {
  const images: ExtractedImage[] = [];
  let imgIndex = 0;

  try {
    const opList = await page.getOperatorList();
    const pdfjsMod = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const fnMap = (pdfjsMod as any).OPS || {};

    // OPS codes we care about
    const OPS = {
      paintImageXObject: fnMap.paintImageXObject || 23,
      paintJpegXObject: fnMap.paintJpegXObject || 82,
      paintImageXObjectBegin: fnMap.paintImageXObjectBegin || 85,
    };

    const seenXObjects = new Set<string>();

    for (let i = 0; i < opList.fnArray.length; i++) {
      const fn = opList.fnArray[i];

      if (
        fn === OPS.paintImageXObject ||
        fn === OPS.paintJpegXObject ||
        fn === OPS.paintImageXObjectBegin
      ) {
        const args = opList.argsArray[i];
        if (!args || args.length < 1) continue;

        const objName = typeof args[0] === "string" ? args[0] : null;
        if (!objName || seenXObjects.has(objName)) continue;
        seenXObjects.add(objName);

        try {
          const imgData = await getXObjectImage(page, objName);
          if (!imgData) continue;

          const { data: imgBytes, width, height } = imgData;

          // Skip tiny images (icons, bullets, decorations)
          if (width < minSize || height < minSize) continue;

          // Determine image format
          const mime = detectImageMime(imgBytes);
          if (!mime) continue;

          const base64 = uint8ToBase64(imgBytes);
          const dataUrl = `data:${mime};base64,${base64}`;

          // Extract position from transform matrix
          const transform = getTransformAt(opList, i);
          const x = transform ? transform[4] : 0;
          const y = viewport.height - (transform ? transform[5] : 0) - height;

          images.push({
            page: pageNum,
            index: imgIndex++,
            dataUrl,
            width: Math.round(width),
            height: Math.round(height),
            x: Math.round(x),
            y: Math.round(y),
          });
        } catch {
          // Skip images that fail to extract
        }
      }
    }
  } catch {
    // Page operator list not available — skip silently
  }

  return images;
}

/**
 * Get image data from a page's XObject dictionary.
 */
async function getXObjectImage(
  page: any,
  objName: string
): Promise<{ data: Uint8Array; width: number; height: number } | null> {
  try {
    // Get the XObject from the page resources
    const xobjs = page.commonObjs?.get?.(objName);
    if (xobjs) {
      // It's already resolved
      return extractImageData(xobjs);
    }

    // Try via the PDF doc internal refs
    const pageResources = await page.getAnnotations();
    const stats = page.stats;

    // Use page.objs to resolve the XObject
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(null), 5000);

      page.objs.get(objName, (imgObj: any) => {
        clearTimeout(timeout);
        if (imgObj) {
          resolve(extractImageData(imgObj));
        } else {
          resolve(null);
        }
      });
    });
  } catch {
    return null;
  }
}

/**
 * Normalize image data from a PDF image object into a standard format.
 */
function extractImageData(
  imgObj: any
): { data: Uint8Array; width: number; height: number } | null {
  if (!imgObj) return null;

  const width = imgObj.width || imgObj.naturalWidth || 0;
  const height = imgObj.height || imgObj.naturalHeight || 0;

  if (width === 0 || height === 0) return null;

  // The image object might be an ImageData or have a data property
  let data: Uint8Array;

  if (imgObj.data instanceof Uint8Array) {
    data = imgObj.data;
  } else if (imgObj.data instanceof ArrayBuffer) {
    data = new Uint8Array(imgObj.data);
  } else if (Array.isArray(imgObj.data)) {
    data = new Uint8Array(imgObj.data);
  } else {
    return null;
  }

  // PDF images may have premultiplied alpha — RGBA format
  // Raw pixel data in PDF is typically RGB or RGBA
  return { data, width, height };
}

/**
 * Detect image MIME type from magic bytes.
 */
function detectImageMime(bytes: Uint8Array): string | null {
  if (bytes.length < 3) return null;

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }

  // TIFF: 49 49 2A 00 (little-endian) or 4D 4D 00 2A (big-endian)
  if (
    (bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2a) ||
    (bytes[0] === 0x4d && bytes[1] === 0x4d && bytes[2] === 0x00)
  ) {
    return "image/tiff";
  }

  // BMP: 42 4D
  if (bytes[0] === 0x42 && bytes[1] === 0x4d) {
    return "image/bmp";
  }

  return null;
}

/**
 * Convert raw pixel data (RGBA) to PNG using canvas rendering.
 * For JPEG/TIFF/BMP raw data from PDF, we need to encode it as PNG for web display.
 */
export async function pixelsToPngDataUrl(
  rgba: Uint8Array,
  width: number,
  height: number
): Promise<string> {
  // We'll use a simple approach: create an HTML canvas on the server
  // via a polyfill or just return raw data URLs for known formats.
  // For server-side, we detect the format and return appropriately.

  // If the data is already a known image format (JPEG, PNG), wrap it
  const mime = detectImageMime(rgba);
  if (mime) {
    const base64 = uint8ToBase64(rgba);
    return `data:${mime};base64,${base64}`;
  }

  // Raw RGBA pixel data — encode as PNG manually (minimal encoder)
  const pngData = rgbaToPng(rgba, width, height);
  const base64 = uint8ToBase64(pngData);
  return `data:image/png;base64,${base64}`;
}

/**
 * Convert RGBA pixel data to a PNG file (Uint8Array).
 * Minimal PNG encoder — no dependencies.
 */
function rgbaToPng(rgba: Uint8Array, width: number, height: number): Uint8Array {
  const pngSignature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = new Uint8Array(13);
  ihdrData.set([
    (width >> 24) & 0xff,
    (width >> 16) & 0xff,
    (width >> 8) & 0xff,
    width & 0xff,
    (height >> 24) & 0xff,
    (height >> 16) & 0xff,
    (height >> 8) & 0xff,
    height & 0xff,
    8, // bit depth
    6, // color type (RGBA)
    0, // compression
    0, // filter
    0, // interlace
  ]);
  const ihdr = makeChunk("IHDR", ihdrData);

  // IDAT chunk — zlib-compress the raw data with row filter bytes
  const rawSize = height * (1 + width * 4);
  const raw = new Uint8Array(rawSize);
  let pos = 0;
  for (let y = 0; y < height; y++) {
    raw[pos++] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      raw[pos++] = rgba[srcIdx]; // R
      raw[pos++] = rgba[srcIdx + 1]; // G
      raw[pos++] = rgba[srcIdx + 2]; // B
      raw[pos++] = rgba[srcIdx + 3]; // A
    }
  }
  // Use deflate-sync for compression
  const { deflateSync } = require("zlib") as typeof import("zlib");
  const compressed = deflateSync(raw, { level: 9 });
  const idat = makeChunk("IDAT", compressed);

  // IEND chunk
  const iend = makeChunk("IEND", new Uint8Array(0));

  return concat([pngSignature, ihdr, idat, iend]);
}

function makeChunk(type: string, data: Uint8Array): Uint8Array {
  const length = new Uint8Array(4);
  length[0] = (data.length >> 24) & 0xff;
  length[1] = (data.length >> 16) & 0xff;
  length[2] = (data.length >> 8) & 0xff;
  length[3] = data.length & 0xff;

  const typeBytes = new Uint8Array(
    type.split("").map((c) => c.charCodeAt(0))
  );

  // CRC32 over type + data
  const crcInput = concat([typeBytes, data]);
  const crc = crc32(crcInput);
  const crcBytes = new Uint8Array(4);
  crcBytes[0] = (crc >> 24) & 0xff;
  crcBytes[1] = (crc >> 16) & 0xff;
  crcBytes[2] = (crc >> 8) & 0xff;
  crcBytes[3] = crc & 0xff;

  return concat([length, typeBytes, data, crcBytes]);
}

function concat(arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((sum, a) => sum + a.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

// CRC32 lookup table
let crcTable: Uint32Array | null = null;
function makeCrcTable(): Uint32Array {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
}

function crc32(data: Uint8Array): number {
  if (!crcTable) crcTable = makeCrcTable();
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function getTransformAt(
  opList: any,
  index: number
): number[] | null {
  // Scan backwards for a transform matrix (6-element array) on the graphics state
  for (let i = index - 1; i >= Math.max(0, index - 10); i--) {
    const fn = opList.fnArray[i];
    // OPS.transform = 6, OPS.concatenate = 32
    const OPS_TRANSFORM = 6;
    const OPS_CONCATENATE = 32;
    if (fn === OPS_TRANSFORM || fn === OPS_CONCATENATE) {
      const args = opList.argsArray[i];
      if (args && args.length >= 6) {
        return args.slice(0, 6);
      }
    }
  }
  return null;
}

/**
 * Encode a Uint8Array to base64 string (Node.js safe).
 */
function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return Buffer.from(binary, "binary").toString("base64");
}

/**
 * Generate a brief caption for an image using AI.
 * Called after extraction to enrich image metadata.
 */
export async function captionImage(
  imageDataUrl: string,
  surroundingText: string
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return "";

  try {
    // Extract base64 data from data URL
    const base64Match = imageDataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!base64Match) return "";

    const [, mimeType, base64Data] = base64Match;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Sen rasm tahlilchisan. Berilgan rasmni qisqacha o'zbek tilida tavsiflab ber. 1-2 gap. Rasm kontekstga mos bo'lsa, kontekstdan foydalan.",
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: imageDataUrl },
              },
              {
                type: "text",
                text: `Atrofdagi matn: ${surroundingText.substring(0, 500)}\n\nRasmni qisqacha tavsifla.`,
              },
            ],
          },
        ],
        max_tokens: 200,
        temperature: 0.3,
      }),
    });

    if (!res.ok) return "";
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || "";
  } catch {
    return "";
  }
}
