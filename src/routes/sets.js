import { Router } from "express";
import { asyncRoute } from "../errors.js";

export function createSetRouter({ sets, exports }) {
  const router = Router();

  router.get(
    "/sets",
    asyncRoute(async (_req, res) => {
      res.json(await sets.list());
    }, "Unable to load sets.")
  );

  router.get(
    "/sets/:setId",
    asyncRoute(async (req, res) => {
      res.json(await sets.get(req.params.setId));
    }, "Unable to load set.")
  );

  router.post(
    "/sets",
    asyncRoute(async (req, res) => {
      res.status(201).json(await sets.create(req.body ?? {}));
    }, "Unable to create set.")
  );

  router.put(
    "/sets/:setId",
    asyncRoute(async (req, res) => {
      res.json(await sets.update(req.params.setId, req.body ?? {}));
    }, "Unable to update set.")
  );

  router.delete(
    "/sets/:setId",
    asyncRoute(async (req, res) => {
      const set = await sets.delete(req.params.setId);
      res.json({ message: "Set deleted.", set });
    }, "Unable to delete set.")
  );

  router.get(
    "/sets/:setId/questions",
    asyncRoute(async (req, res) => {
      res.json(await sets.listQuestions(req.params.setId));
    }, "Unable to load questions.")
  );

  router.post(
    "/sets/:setId/questions",
    asyncRoute(async (req, res) => {
      res
        .status(201)
        .json(await sets.createQuestion(req.params.setId, req.body ?? {}));
    }, "Unable to create question.")
  );

  router.put(
    "/sets/:setId/questions/:questionId",
    asyncRoute(async (req, res) => {
      res.json(
        await sets.updateQuestion(
          req.params.setId,
          req.params.questionId,
          req.body ?? {}
        )
      );
    }, "Unable to update question.")
  );

  router.delete(
    "/sets/:setId/questions/:questionId",
    asyncRoute(async (req, res) => {
      const question = await sets.deleteQuestion(
        req.params.setId,
        req.params.questionId
      );
      res.json({ message: "Question deleted.", question });
    }, "Unable to delete question.")
  );

  router.get(
    "/sets/:setId/export",
    asyncRoute(async (req, res) => {
      const contents = await exports.getSet(req.params.setId);
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="quiz-set.txt"'
      );
      res.send(contents);
    }, "Unable to export set.")
  );

  return router;
}
