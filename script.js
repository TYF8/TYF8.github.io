let currentMode = "encode"; // Default mode is encode
let matrix = [];
let key = "";

// Show Coding/Decoding Section
function setupCodingSection() {
  key = document.getElementById("key").value.toUpperCase(); // Ensure key is uppercase
  const matrixInput = document.getElementById("matrix").value;

  if (!key || !matrixInput) {
    alert("Please fill in all fields!");
    return;
  }

  if (key.length !== 6 || !/^[A-Z]+$/.test(key)) {
    alert("Key must be exactly 6 uppercase letters!");
    return;
  }

  try {
    matrix = JSON.parse(matrixInput);
    if (!Array.isArray(matrix) || matrix.length !== 36) {
      throw new Error("Invalid matrix format!");
    }
    document.querySelector(".coding-section").classList.add("visible");
  } catch (error) {
    alert("Invalid matrix format! Please check your input.");
  }
}

// Set Mode (Encode or Decode)
function setMode(mode) {
  currentMode = mode;
  const encodeButton = document.getElementById("encodeButton");
  const decodeButton = document.getElementById("decodeButton");

  if (mode === "encode") {
    encodeButton.classList.add("active");
    decodeButton.classList.remove("active");
  } else {
    decodeButton.classList.add("active");
    encodeButton.classList.remove("active");
  }

  // Clear input and output fields
  document.getElementById("inputText").value = "";
  document.getElementById("outputText").value = "";
}

// Encode Message
function encodeMessage() {
  const inputText = document.getElementById("inputText").value;

  if (!inputText) {
    alert("Please enter a message!");
    return;
  }

  let msgi = "";

  // Step 2: Generate intermediate message (msgi)
  for (let char of inputText) {
    if (char === " ") {
      msgi += " ";
      continue;
    }

    // Find the character in the matrix
    let found = false;
    for (let cell of matrix) {
      if (cell[2] === char) {
        // Convert row and column indices to letters (A=0, B=1, ..., Z=25)
        const rowChar = String.fromCharCode(65 + cell[0]);
        const colChar = String.fromCharCode(65 + cell[1]);
        msgi += rowChar + colChar;
        found = true;
        break;
      }
    }

    if (!found) {
      alert(`Character "${char}" not found in the matrix!`);
      return;
    }
  }

  // Step 3: Fill matrix M2
  const M2 = [];
  M2.push(key.split("")); // First row is the key

  // Fill the rest of M2 with msgi
  let msgiIndex = 0;
  const rows = Math.ceil(msgi.length / 6) + 1; // +1 for the key row

  for (let i = 1; i < rows; i++) {
    M2[i] = [];
    for (let j = 0; j < 6; j++) {
      if (msgiIndex < msgi.length) {
        M2[i][j] = msgi[msgiIndex];
        msgiIndex++;
      } else {
        M2[i][j] = " "; // Fill empty spaces with space
      }
    }
  }

  // Step 4: Create a mapping for sorting
  const keyChars = key.split("");
  const originalIndices = keyChars.map((_, index) => index);

  // Sort the indices based on the key characters
  const sortedIndices = [...originalIndices].sort((a, b) => {
    if (keyChars[a] < keyChars[b]) return -1;
    if (keyChars[a] > keyChars[b]) return 1;
    return 0;
  });

  // Create the mapping from sorted positions to original positions
  const columnMapping = sortedIndices.map((sortedIdx) => {
    return originalIndices.findIndex((origIdx) => sortedIdx === origIdx);
  });

  // Step 5: Concatenate the final message by reading from the sorted columns
  let finalMessage = "";
  for (let j = 0; j < 6; j++) {
    const originalCol = columnMapping[j];
    for (let i = 1; i < M2.length; i++) {
      if (M2[i] && M2[i][originalCol]) {
        finalMessage += M2[i][originalCol];
      }
    }
  }

  document.getElementById("outputText").value = finalMessage.trim();
}

// Decode Message
function decodeMessage() {
  const inputText = document.getElementById("inputText").value;

  if (!inputText) {
    alert("Please enter a message!");
    return;
  }

  // Step 1: Determine dimensions for the M2 matrix
  const cols = 6;
  const rows = Math.ceil(inputText.length / cols) + 1; // +1 for key row

  // Step 2: Create the original key mapping
  const keyChars = key.split("");
  const sortedKeyChars = [...keyChars].sort();

  // Create mapping from original positions to sorted positions
  const originalToSortedMap = keyChars.map((char) =>
    sortedKeyChars.indexOf(char)
  );

  // Create mapping from sorted positions to original positions
  const sortedToOriginalMap = originalToSortedMap.map((_, idx) => {
    return originalToSortedMap.indexOf(idx);
  });

  // Step 3: Distribute the message into columns according to the sorted order
  const columns = Array(cols)
    .fill()
    .map(() => []);

  let charIndex = 0;
  const charsPerColumn = Math.ceil(inputText.length / cols);

  for (let j = 0; j < cols; j++) {
    for (let i = 0; i < charsPerColumn; i++) {
      if (charIndex < inputText.length) {
        columns[j].push(inputText[charIndex]);
        charIndex++;
      } else {
        columns[j].push(" ");
      }
    }
  }

  // Step 4: Reconstruct the M2 matrix in original order
  const M2 = Array(rows)
    .fill()
    .map(() => Array(cols).fill(" "));
  M2[0] = keyChars; // First row is the key

  for (let j = 0; j < cols; j++) {
    const originalCol = sortedToOriginalMap[j];
    for (let i = 0; i < columns[j].length; i++) {
      M2[i + 1][originalCol] = columns[j][i];
    }
  }

  // Step 5: Extract msgi from M2 by reading row by row
  let msgi = "";
  for (let i = 1; i < M2.length; i++) {
    for (let j = 0; j < cols; j++) {
      if (M2[i][j]) {
        msgi += M2[i][j];
      }
    }
  }

  // Step 6: Convert msgi pairs to original characters
  let decodedMessage = "";
  for (let i = 0; i < msgi.length; i++) {
    if (msgi[i] === " ") {
      decodedMessage += " ";
      continue;
    }

    if (i + 1 < msgi.length) {
      const rowChar = msgi[i];
      const colChar = msgi[i + 1];

      if (rowChar === " " || colChar === " ") {
        i++; // Skip this pair if it contains a space
        continue;
      }

      const row = rowChar.charCodeAt(0) - 65; // A=0, B=1, ...
      const col = colChar.charCodeAt(0) - 65;

      // Find the character in the matrix
      let found = false;
      for (let cell of matrix) {
        if (cell[0] === row && cell[1] === col) {
          decodedMessage += cell[2];
          found = true;
          break;
        }
      }

      if (!found) {
        alert(`Unable to decode character pair "${rowChar}${colChar}"!`);
        return;
      }

      i++; // Move to the next pair
    }
  }

  document.getElementById("outputText").value = decodedMessage.trim();
}

// Generate Random Matrix
function generateRandomMatrix() {
  const matrix = [];
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 6; j++) {
      const randomChar =
        characters[Math.floor(Math.random() * characters.length)];
      matrix.push([i, j, randomChar]);
    }
  }

  document.getElementById("matrix").value = JSON.stringify(matrix);
}

// Copy Output to Clipboard
function copyOutput() {
  const outputText = document.getElementById("outputText");
  outputText.select();
  document.execCommand("copy");
  alert("Output copied to clipboard!");
}
