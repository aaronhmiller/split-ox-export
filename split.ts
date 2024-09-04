// Import necessary Deno modules
// Function to process the JSON file and write to a subdirectory
async function processJsonFile(filePath: string) {
  try {
    // Read the content of the JSON file
    const jsonData = await Deno.readTextFile(filePath);

    // Parse the JSON content into an array of objects
    const dataArray = JSON.parse(jsonData);

    // Check if the data is an array
    if (Array.isArray(dataArray)) {
      const dirPath = "split-files";
      //check if dir there and if not, create it
      try {
        const status = await Deno.stat(dirPath);
        if (status.isDirectory) {
          console.log(`[INFO] ${dirPath} directory already exists`);
        } else {
          await Deno.mkdir(dirPath);
        }
      } catch (error) {
        throw error;
      }

      // Loop through each object in the array
      for (let i = 0; i < dataArray.length; i++) {
        const bomObject = dataArray[i];

        // Construct a file name based on the serial number or index
        const fileName = `${dirPath}/bom_${bomObject.serialNumber || i}.json`;

        // Convert the object to a JSON string with indentation
        const fileContent = JSON.stringify(bomObject, null, 2);

        // Write the JSON content to a new file in the "split-files" directory
        await Deno.writeTextFile(fileName, fileContent);

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
const filePath = prompt("Please enter the path to the JSON file:");
if (filePath) {
  await processJsonFile(filePath);
} else {
  console.error("No file path provided.");
}
