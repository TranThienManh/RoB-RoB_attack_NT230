const fs = require("fs");
const notifier = require("node-notifier");

const filePath = process.argv[2] || "prediction_results.csv";

if (!fs.existsSync(filePath)) {
  console.error(`❌ Cannot find file: ${filePath}`);
  process.exit(1);
}

const content = fs.readFileSync(filePath, "utf-8");
const lines = content.trim().split("\n").slice(1); // Bỏ dòng tiêu đề

const maliciousFiles = [];

for (const line of lines) {
  const cols = line.split(",");
  const filename = cols[0].trim();
  const predictedLabel = cols[1].trim();

  if (predictedLabel === "1") {
    maliciousFiles.push(filename);
  }
}

if (maliciousFiles.length > 0) {
  let message = `Ransomware detected in: ${maliciousFiles.join(", ")}`;
  if (message.length > 300) {
    message = message.substring(0, 300) + "...";
  }

  notifier.notify({
    title: "⚠️ RøBguard Alert",
    message: message,
    sound: true,
    wait: false,
    timeout: 10 // ⏱ Tự động tắt sau 10 giây
  });

  console.log(`🔔 Notified: ${message}`);
} else {
  console.log("✅ No ransomware detected.");
}
