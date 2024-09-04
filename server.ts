import { Hono } from "https://deno.land/x/hono/mod.ts";
import { serve } from "https://deno.land/std/http/mod.ts";
import { processJsonInMemory } from "./split.ts";
import { zip } from "https://deno.land/x/zipjs/mod.ts";

const app = new Hono();

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
  const zipWriter = new zip.ZipWriter(new zip.Uint8ArrayWriter());

  for (const [filename, content] of Object.entries(splitFiles)) {
    await zipWriter.add(filename, new zip.TextReader(content));
  }

  // Generate the zip content
  const zipContent = await zipWriter.close();

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
