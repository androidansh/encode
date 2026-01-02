const fs = require("fs");

// Read the original JSON file
const data = JSON.parse(fs.readFileSync("t.json", "utf8"));

// Extract only IDs
const ids = data.data.map(item => item.id);

// Save to new JSON file
fs.writeFileSync("ids.json", JSON.stringify(ids, null, 2));

console.log("ids.json created successfully!");
