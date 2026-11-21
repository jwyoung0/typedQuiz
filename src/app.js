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
import { createJsonSetRepository } from "./repositories/json-set-repository.js";
import { createJsonAttemptRepository } from "./repositories/json-attempt-repository.js";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));

const fileRepository = createQuizFileRepository(
  path.join(projectRoot, "data", "quizzes.json")
);

const setRepository = createJsonSetRepository(fileRepository);
const attemptRepository = createJsonAttemptRepository(fileRepository);

const app = express();
app.use(express.json());
app.use(express.static(path.join(projectRoot, "public")));

app.use(
  "/api",
  createSetRouter({
    sets: createSetService(setRepository),
    exports: createExportService(setRepository)
  })
);
app.use("/api", createQuizRouter(createQuizService(setRepository)));
app.use("/api", createAttemptRouter(createAttemptService(attemptRepository, setRepository)));

export default app;
