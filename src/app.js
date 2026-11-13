import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createAttemptService } from "./services/attempts.js";
import { createExportService } from "./services/exports.js";
import { createQuizService } from "./services/quizzes.js";
import { createSetService } from "./services/sets.js";
import { createQuizFileRepository } from "./repositories/quiz-file.js";
import { createAttemptRouter } from "./routes/attempts.js";
import { createQuizRouter } from "./routes/quizzes.js";
import { createSetRouter } from "./routes/sets.js";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const repository = createQuizFileRepository(
  path.join(projectRoot, "data", "quizzes.json")
);

const app = express();
app.use(express.json());
app.use(express.static(path.join(projectRoot, "public")));

app.use(
  "/api",
  createSetRouter({
    sets: createSetService(repository),
    exports: createExportService(repository)
  })
);
app.use("/api", createQuizRouter(createQuizService(repository)));
app.use("/api", createAttemptRouter(createAttemptService(repository)));

export default app;
