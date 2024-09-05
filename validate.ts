// Import necessary Deno modules
import { expandGlob, move } from "https://deno.land/std/fs/mod.ts";
import { ensureDir } from "https://deno.land/std/fs/mod.ts";

// Function to run sbom-utility command on each file and move failing ones
async function runSbomUtility(outputDir: string) {
  const dirPath = outputDir;
  const errorDirPath = "erroring-split-files";

  // Ensure the error directory exists
  try {
    await ensureDir(errorDirPath);
  } catch (error) {
    console.error(`[ERROR]Error creating error directory: ${errorDirPath}`);
    throw error;
  }
  // Iterate over each file in the directory
  for await (const file of expandGlob(`${dirPath}/*.json`)) {
    if (file.isFile) {
      const filePath = file.path;

      // Run the sbom-utility command for each file
      const process = Deno.run({
        cmd: ["./sbom-utility", "-i", filePath, "validate"],
        stdout: "piped",
        stderr: "piped",
      });

      const { code } = await process.status();
      const rawOutput = await process.output();
      const rawError = await process.stderrOutput();
      process.close();

      if (code !== 0) {
        console.error(`Error validating ${filePath}:`);
        console.error(new TextDecoder().decode(rawError));
        console.log(new TextDecoder().decode(rawOutput));

        // Move the failing file to the erroring-split-files directory
        const destinationPath = `${errorDirPath}/${file.name}`;
        await Deno.rename(filePath, destinationPath);
        console.log(`Moved file to: ${destinationPath}`);
      } else {
        console.log(`${file.name} is valid`);
      }
    }
  }
}

// Execute the function
const outputDir = prompt(
  "Please enter the path to the directory containing the split files:",
);
await runSbomUtility(outputDir);
