const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    executablePath: "/usr/bin/google-chrome"
  });

  try {
    const [page] = await browser.pages();

    // Logging function từ browser
    await page.exposeFunction("_log", (msg) => console.log(msg));

    // Inject toàn bộ hook API vào trước khi trang tải
    await page.evaluateOnNewDocument(() => {
      const original = {
        showDirectoryPicker: window.showDirectoryPicker.bind(window),
        removeEntry: FileSystemDirectoryHandle.prototype.removeEntry,
        createWritable: FileSystemFileHandle.prototype.createWritable,
        write: FileSystemWritableFileStream.prototype.write,
        close: FileSystemWritableFileStream.prototype.close,
        getFile: FileSystemFileHandle.prototype.getFile,
      };

      let currentWritableFile = null;

      // Hook showDirectoryPicker
      window.showDirectoryPicker = async function () {
        const dirHandle = await original.showDirectoryPicker();
        window._log(`📂 Directory selected: ${dirHandle.name}`);
        window._selectedDirHandle = dirHandle;
        return dirHandle;
      };

      // Hook removeEntry
      FileSystemDirectoryHandle.prototype.removeEntry = async function (name, options) {
        window._log(`❌ removeEntry called: ${name}`);
        return original.removeEntry.call(this, name, options);
      };

      // ✅ Hook createWritable – có kiểm tra đuôi .bak để tránh lặp vô hạn
      FileSystemFileHandle.prototype.createWritable = async function (options) {
        const dirHandle = window._selectedDirHandle;
        const filename = this.name;

        if (!dirHandle) {
          window._log("⚠️ No directory handle found.");
          return await original.createWritable.call(this, options);
        }

        if (filename.endsWith(".bak")) {
          window._log(`⏭️ Skipping .bak file: ${filename}`);
          currentWritableFile = filename;
          return await original.createWritable.call(this, options);
        }

        try {
          const originalFile = await this.getFile();
          //const content = await originalFile.text();
          const buffer = await originalFile.arrayBuffer();
          //const backupName = filename + ".bak";
          //const backupHandle = await dirHandle.getFileHandle(backupName, { create: true });
          const backupHandle = await dirHandle.getFileHandle(filename + ".bak", { create: true });
          const writable = await backupHandle.createWritable();
          await writable.write(buffer);
          await writable.close();

          window._log(`✅ .bak created: ${backupName}.bak`);
        } catch (err) {
          window._log(`⚠️ Could not create .bak for ${filename}: ${err.message}`);
        }

        currentWritableFile = filename;
        return await original.createWritable.call(this, options);
      };

      // Hook write
      FileSystemWritableFileStream.prototype.write = async function (content) {
        window._log(`✍️ Writing to ${currentWritableFile}`);
        return await original.write.call(this, content);
      };

      // Hook close
      FileSystemWritableFileStream.prototype.close = async function () {
        window._log(`🧩 Close called for ${currentWritableFile}`);
        currentWritableFile = null;
        return await original.close.call(this);
      };

      // Hook getFile
      FileSystemFileHandle.prototype.getFile = async function (options) {
        const file = await original.getFile.call(this, options);
        window._log(`📄 getFile called: ${this.name}`);
        return file;
      };
    });

    // Mở URL truyền vào
    const url = process.argv[2];
    if (!url) {
      console.log("❌ Please provide a URL.");
      process.exit(1);
    }

    await page.goto(url);

  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await new Promise(resolve => setTimeout(resolve, 100000)); // giữ session để theo dõi
    await browser.close();
  }
})();
