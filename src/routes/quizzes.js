import { Router } from "express";
import { asyncRoute } from "../errors.js";

export function createQuizRouter(quizzes) {
  const router = Router();

  router.get(
    "/quizzes",
    asyncRoute(async (_req, res) => {
      res.json(await quizzes.list());
    }, "Unable to load quizzes.")
  );

  router.get(
    "/quizzes-with-answers",
    asyncRoute(async (_req, res) => {
      res.json(await quizzes.listWithAnswers());
    }, "Unable to load quiz answers.")
  );

  router.get(
    "/export",
    asyncRoute(async (_req, res) => {
      const contents = await quizzes.getExport();
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="quizzes.txt"'
      );
      res.send(contents || "No quiz sets available.");
    }, "Unable to export quizzes.")
  );

  return router;
}
