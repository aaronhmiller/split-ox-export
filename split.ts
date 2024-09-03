// Import necessary Deno modules
//import { readTextFile, writeTextFile } from "https://deno.land/std/fs/mod.ts";
//import { prompt } from "https://deno.land/std/io/mod.ts";

// Function to process the JSON file
async function processJsonFile(filePath: string) {
  try {
    // Read the content of the JSON file
    const jsonData = await readTextFile(filePath);
    
    // Parse the JSON content into an array of objects
    const dataArray = JSON.parse(jsonData);

    // Check if the data is an array
    if (Array.isArray(dataArray)) {
      // Loop through each object in the array
      for (let i = 0; i < dataArray.length; i++) {
        const bomObject = dataArray[i];
        
        // Construct a file name based on the serial number or index
        const fileName = `bom_${bomObject.serialNumber || i}.json`;

        // Convert the object to a JSON string with indentation
        const fileContent = JSON.stringify(bomObject, null, 2);

        // Write the JSON content to a new file
        await writeTextFile(fileName, fileContent);

        console.log(`Created file: ${fileName}`);
      }
    } else {
      console.error("The JSON file does not contain an array.");
    }
  } catch (error) {
    console.error("Error processing the JSON file:", error);
  }
}

// Prompt the user for the JSON file path
const filePath = prompt("Please enter the path to the JSON file: ");
if (filePath) {
  await processJsonFile(filePath);
} else {
  console.error("No file path provided.");
}
