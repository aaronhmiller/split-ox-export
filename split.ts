// Import necessary Deno modules
// Function to process the JSON file and write to a subdirectory
export async function processJsonFileInMemory(
  filePath: string,
) {
  try {
    const jsonData = await Deno.readTextFile(filePath);
    const dataArray = JSON.parse(jsonData);
    const splitFiles: Record<string, string> = {};

    if (Array.isArray(dataArray)) {
      for (let i = 0; i < dataArray.length; i++) {
        const bomObject = dataArray[i];
        const strippedSerialNumber = `${bomObject.serialNumber}`.slice(9); //chop off pesky ":"s

        // Create a filename (similar to what you did before)
        const fileName = `bom_${strippedSerialNumber || i}.json`;

        // Instead of writing to a file, we store the stringified object in our Record
        splitFiles[fileName] = JSON.stringify(bomObject, null, 2);
      }
    } else {
      console.error("The JSON content does not contain an array.");
    }
    return splitFiles;
  } catch (error) {
    console.error("Error processing the JSON file:", error);
  }
}

// Prompt the user for the JSON file path
// Only run this block if the script is executed directly
if (import.meta.main) {
  const filePath = prompt("Please enter the path to the JSON file: ");
  if (filePath) {
    await processJsonFileInMemory(filePath);
  } else {
    console.error("No file path provided.");
  }
}
