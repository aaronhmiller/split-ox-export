import { Hono } from "https://deno.land/x/hono/mod.ts";
import { serve } from "https://deno.land/std/http/mod.ts"; // Deno's serve function
import { join } from "https://deno.land/std/path/mod.ts";
import { processJsonFile } from "./split.ts";
import { ensureDir } from "https://deno.land/std/fs/mod.ts";

const app = new Hono();

// Serve the upload form
app.get("/", async (c) => {
  const html = await Deno.readTextFile("./index.html");
  return c.html(html);
});

// Handle file upload
app.post("/upload", async (c) => {
  const formData = await c.req.parseBody(); // Parse the form data directly with Hono
  const uploadedFile = formData.file; // Access the uploaded file

  if (!uploadedFile) {
    console.error("No file uploaded.");
    return c.text("No file uploaded", 400);
  }

  // Create directories for the output files
  const outputDir = "./output";
  const splitDir = join(outputDir, "split-files");
  await ensureDir(outputDir);

  // Save the uploaded file temporarily
  const uploadedFilePath = join(outputDir, uploadedFile.name);
  const fileContent = await uploadedFile.arrayBuffer(); // Read file content
  await Deno.writeFile(uploadedFilePath, new Uint8Array(fileContent)); // Save it to disk

  // Call the `split.ts` logic to split the file and save the output in the `splitDir`
  await processJsonFile(uploadedFilePath, splitDir);
  // Create a zip file using the zip command-line tool
  const zipFilePath =  "../output.zip";
  const zipProcess = Deno.run({
    cmd: ["zip", "-r", zipFilePath, "."],
    cwd: splitDir,
  });

  const status = await zipProcess.status();
  
  if (!status.success) {
    console.error("Error creating zip file");
    return c.text("Error creating zip file", 500);
  }

  console.log(`Zip file created at ${zipFilePath}`);

  // Serve the zip file for download
  try {
    const downloadFilePath = join(outputDir, "output.zip");
    const zipFile = await Deno.readFile(downloadFilePath);
    console.log(`Zip file read from disk, size: ${zipFile.length} bytes`);
    return c.body(zipFile, 200, {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="output.zip"',
    });
  } catch (error) {
    console.error("Error reading zip file for download:", error);
    return c.text("Error preparing zip file for download", 500);
  }
});

// Start the server
serve(app.fetch, { port: 3000 });
console.log("Server running on http://localhost:3000");
