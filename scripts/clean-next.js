const fs = require("fs");
const path = require("path");

async function main() {
  const target = path.join(process.cwd(), ".next");
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      await fs.promises.rm(target, {
        recursive: true,
        force: true,
        maxRetries: 15,
        retryDelay: 150,
      });
      return;
    } catch (err) {
      if (attempt === 9) {
        console.error(err.message);
        console.error(
          "No se pudo borrar .next (suele pasar con next dev abierto). Detené el servidor y ejecutá npm run clean otra vez."
        );
        process.exit(1);
      }
      await delay(350);
    }
  }
}

main();
