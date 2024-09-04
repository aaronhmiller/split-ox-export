// Import necessary Deno modules
// Function to process the JSON file and write to a subdirectory
export async function processJsonInMemory(jsonContent: string): Promise<Record<string, string>> {
  let dataArray;
  try {
    dataArray = JSON.parse(jsonContent);
  } catch (error) {
    console.error("Error parsing JSON:", error);
    throw new Error("Invalid JSON content");
  }

  const splitFiles: Record<string, string> = {};

  if (Array.isArray(dataArray)) {
    for (let i = 0; i < dataArray.length; i++) {
      const bomObject = dataArray[i];
      const strippedSerialNumber = bomObject.serialNumber ? `${bomObject.serialNumber}`.slice(9) : '';
      
      // Create a filename (similar to what you did before)
      const fileName = `bom_${strippedSerialNumber || i}.json`;
      
      // Instead of writing to a file, we store the stringified object in our Record
      splitFiles[fileName] = JSON.stringify(bomObject, null, 2);
    }
  } else if (typeof dataArray === 'object' && dataArray !== null) {
    // If it's a single object, treat it as one file
    splitFiles['bom_0.json'] = JSON.stringify(dataArray, null, 2);
  } else {
    console.error("The JSON content is neither an array nor an object.");
    throw new Error("Invalid JSON structure");
  }

  if (Object.keys(splitFiles).length === 0) {
    throw new Error("No valid BOM objects found in the JSON content");
  }

  return splitFiles;
}

async function processJsonFileLocally(filePath: string, outputDir: string) {
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
  const filePath = prompt("Please enter the path to the JSON file:");
  const outputDir = "split-files";
  if (filePath) {
    await processJsonFileLocally(filePath, outputDir);
    console.log("JSON file split and saved to " + outputDir + " directory locally.");
  } else {
    console.error("No file path provided.");
  }
}