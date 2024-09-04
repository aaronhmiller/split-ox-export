import { Hono } from "https://deno.land/x/hono/mod.ts";
import { serve } from "https://deno.land/std/http/mod.ts";
import { processJsonInMemory } from "./split.ts";

const app = new Hono();

// Simple ZIP creation function
function createZip(files: Record<string, string>): Uint8Array {
  const encoder = new TextEncoder();
  const zipParts: Uint8Array[] = [];

  for (const [filename, content] of Object.entries(files || {})) {
    const fileData = encoder.encode(content);
    const header = new Uint8Array([
      0x50, 0x4B, 0x03, 0x04, 0x0A, 0x00, 0x00, 0x00, 0x00, 0x00,
      ...new Uint8Array(new Uint32Array([Date.now()]).buffer),
      ...new Uint8Array(new Uint32Array([fileData.length]).buffer),
      ...new Uint8Array(new Uint32Array([fileData.length]).buffer),
      ...new Uint8Array(new Uint16Array([filename.length]).buffer),
      0x00, 0x00,
    ]);

    zipParts.push(header, encoder.encode(filename), fileData);
  }

  const centralDirectorySize = zipParts.reduce((acc, part) => acc + part.length, 0);
  const centralDirectory = new Uint8Array([
    0x50, 0x4B, 0x05, 0x06, 0x00, 0x00, 0x00, 0x00,
    ...new Uint8Array(new Uint16Array([Object.keys(files || {}).length]).buffer),
    ...new Uint8Array(new Uint16Array([Object.keys(files || {}).length]).buffer),
    ...new Uint8Array(new Uint32Array([centralDirectorySize]).buffer),
    0x00, 0x00, 0x00, 0x00,
  ]);

  const totalLength = zipParts.reduce((acc, part) => acc + part.length, 0) + centralDirectory.length;
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of zipParts) {
    result.set(part, offset);
    offset += part.length;
  }
  result.set(centralDirectory, offset);

  return result;
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
