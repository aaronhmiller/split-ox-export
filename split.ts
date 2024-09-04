// Import necessary Deno modules
// Function to process the JSON file and write to a subdirectory
export async function processJsonFile(filePath: string, outputDir: string) {
  try {
    const jsonData = await Deno.readTextFile(filePath);
    const dataArray = JSON.parse(jsonData);

    if (Array.isArray(dataArray)) {
      await Deno.mkdir(outputDir); // Ensure output directory exists

      for (let i = 0; i < dataArray.length; i++) {
        const bomObject = dataArray[i];
        const strippedSerialNumber = `${bomObject.serialNumber}`.slice(9);      // Strip the first 9 characters from the serial num to remove pesky ":"
  
        const fileName = `${outputDir}/bom_${strippedSerialNumber || i}.json`;
        const fileContent = JSON.stringify(bomObject, null, 2);
        await Deno.writeTextFile(fileName, fileContent);
      }
    } else {
      console.error("The JSON file does not contain an array.");
    }
  } catch (error) {
    console.error("Error processing the JSON file:", error);
  }
}

// Prompt the user for the JSON file path
// Only run this block if the script is executed directly
if (import.meta.main) {
  const filePath = prompt("Please enter the path to the JSON file: ");
  const outputDir = "split-files";
  if (filePath) {
    await processJsonFile(filePath, outputDir);
  } else {
    console.error("No file path provided.");
  }
}