import { Hono } from "https://deno.land/x/hono/mod.ts";
import { serve } from "https://deno.land/std/http/mod.ts";
import { processJsonInMemory } from "./split.ts";

const app = new Hono();

function createZip(files: Record<string, string>): Uint8Array {
  const encoder = new TextEncoder();
  const zipParts: Uint8Array[] = [];
  const centralDirectory: Uint8Array[] = [];
  let offset = 0;

  for (const [filename, content] of Object.entries(files || {})) {
    const fileData = encoder.encode(content);
    const header = new Uint8Array([
      0x50, 0x4B, 0x03, 0x04, // Local file header signature
      0x14, 0x00, // Version needed to extract
      0x00, 0x00, // General purpose bit flag
      0x00, 0x00, // Compression method (0 = no compression)
      ...new Uint8Array(new Uint32Array([Math.floor(Date.now() / 1000)]).buffer), // Last mod file time and date
      ...new Uint8Array(new Uint32Array([crc32(fileData)]).buffer), // CRC-32
      ...new Uint8Array(new Uint32Array([fileData.length]).buffer), // Compressed size
      ...new Uint8Array(new Uint32Array([fileData.length]).buffer), // Uncompressed size
      ...new Uint8Array(new Uint16Array([filename.length]).buffer), // File name length
      0x00, 0x00, // Extra field length
    ]);

    zipParts.push(header, encoder.encode(filename), fileData);

    const centralDirHeader = new Uint8Array([
      0x50, 0x4B, 0x01, 0x02, // Central directory file header signature
      0x14, 0x00, // Version made by
      0x14, 0x00, // Version needed to extract
      0x00, 0x00, // General purpose bit flag
      0x00, 0x00, // Compression method
      ...new Uint8Array(new Uint32Array([Math.floor(Date.now() / 1000)]).buffer), // Last mod file time and date
      ...new Uint8Array(new Uint32Array([crc32(fileData)]).buffer), // CRC-32
      ...new Uint8Array(new Uint32Array([fileData.length]).buffer), // Compressed size
      ...new Uint8Array(new Uint32Array([fileData.length]).buffer), // Uncompressed size
      ...new Uint8Array(new Uint16Array([filename.length]).buffer), // File name length
      0x00, 0x00, // Extra field length
      0x00, 0x00, // File comment length
      0x00, 0x00, // Disk number start
      0x00, 0x00, // Internal file attributes
      0x00, 0x00, 0x00, 0x00, // External file attributes
      ...new Uint8Array(new Uint32Array([offset]).buffer), // Relative offset of local header
    ]);

    centralDirectory.push(centralDirHeader, encoder.encode(filename));
    offset += header.length + filename.length + fileData.length;
  }

  const endOfCentralDir = new Uint8Array([
    0x50, 0x4B, 0x05, 0x06, // End of central directory signature
    0x00, 0x00, // Number of this disk
    0x00, 0x00, // Disk where central directory starts
    ...new Uint8Array(new Uint16Array([centralDirectory.length / 2]).buffer), // Number of central directory records on this disk
    ...new Uint8Array(new Uint16Array([centralDirectory.length / 2]).buffer), // Total number of central directory records
    ...new Uint8Array(new Uint32Array([centralDirectory.reduce((acc, part) => acc + part.length, 0)]).buffer), // Size of central directory
    ...new Uint8Array(new Uint32Array([offset]).buffer), // Offset of start of central directory, relative to start of archive
    0x00, 0x00, // Comment length
  ]);

  const result = new Uint8Array(
    zipParts.reduce((acc, part) => acc + part.length, 0) +
    centralDirectory.reduce((acc, part) => acc + part.length, 0) +
    endOfCentralDir.length
  );

  let resultOffset = 0;
  for (const part of [...zipParts, ...centralDirectory, endOfCentralDir]) {
    result.set(part, resultOffset);
    resultOffset += part.length;
  }

  return result;
}

// CRC-32 function (you can use a more efficient implementation if needed)
function crc32(data: Uint8Array): number {
  let crc = -1;
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ crc32Table[(crc ^ data[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

// CRC-32 table
const crc32Table = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crc32Table[i] = c;
}

// Serve the upload form
app.get("/", async (c) => {
  const html = await Deno.readTextFile("./index.html");
  return c.html(html);
});

// Handle file upload
app.post("/upload", async (c) => {
  const formData = await c.req.parseBody();
  const uploadedFile = formData.file;

  if (!uploadedFile) {
    console.error("No file uploaded.");
    return c.text("No file uploaded", 400);
  }

  // Read the file content
  const fileContent = await uploadedFile.text();

  try {
    // Process the JSON in memory
    const splitFiles = await processJsonInMemory(fileContent);

    if (!splitFiles || Object.keys(splitFiles).length === 0) {
      console.error("No files were generated from the JSON content.");
      return c.text("Error processing the JSON file", 500);
    }

    // Create a zip file in memory
    const zipContent = createZip(splitFiles);

    console.log(`Zip file created in memory, size: ${zipContent.length} bytes`);

    // Serve the zip file for download
    return c.body(zipContent, 200, {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="output.zip"',
    });
  } catch (error) {
    console.error("Error processing the JSON file:", error);
    return c.text("Error processing the JSON file", 500);
  }
});

// Start the server
serve(app.fetch);
console.log("Server running on http://localhost:3000");
