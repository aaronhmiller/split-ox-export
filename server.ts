import { Hono } from "https://deno.land/x/hono/mod.ts";
import { serve } from "https://deno.land/std/http/mod.ts";
import { processJsonInMemory } from "./split.ts";

const app = new Hono();

// Simple ZIP creation function
function createZip(files: Record<string, string>): Uint8Array {
  const encoder = new TextEncoder();
  const zipParts: Uint8Array[] = [];

  for (const [filename, content] of Object.entries(files)) {
    const fileData = encoder.encode(content);
    const header = new Uint8Array([
      0x50, 0x4B, 0x03, 0x04, 0x0A, 0x00, 0x00, 0x00, 0x00, 0x00,
      ...new Uint8Array(new Uint32Array([Date.now()]).buffer),
      ...new Uint8Array(new Uint32Array([fileData.length]).buffer),
      ...new Uint8Array(new Uint32Array([fileData.length]).buffer),
      ...new Uint16Array([filename.length]).buffer,
      0x00, 0x00,
    ]);

    zipParts.push(header, encoder.encode(filename), fileData);
  }

  const centralDirectory = new Uint8Array([
    0x50, 0x4B, 0x05, 0x06, 0x00, 0x00, 0x00, 0x00,
    ...new Uint16Array([Object.keys(files).length]).buffer,
    ...new Uint16Array([Object.keys(files).length]).buffer,
    ...new Uint32Array([zipParts.reduce((acc, part) => acc + part.length, 0)]).buffer,
    0x00, 0x00, 0x00, 0x00,
  ]);

  return new Uint8Array([...zipParts.flat(), ...centralDirectory]);
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

  // Process the JSON in memory
  const splitFiles = await processJsonInMemory(fileContent);

  // Create a zip file in memory
  const zipContent = createZip(splitFiles);

  console.log(`Zip file created in memory, size: ${zipContent.length} bytes`);

  // Serve the zip file for download
  return c.body(zipContent, 200, {
    'Content-Type': 'application/zip',
    'Content-Disposition': 'attachment; filename="output.zip"',
  });
});

// Start the server
serve(app.fetch);
console.log("Server running on http://localhost:3000");
