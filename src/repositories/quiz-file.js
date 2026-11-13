import fs from "fs/promises";

export function createQuizFileRepository(filePath) {
  return {
    async read() {
      const contents = await fs.readFile(filePath, "utf8");
      return JSON.parse(contents);
    },

    async write(data) {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    }
  };
}
