import { Router } from "express";
import { asyncRoute } from "../errors.js";

export function createAttemptRouter(attempts) {
  const router = Router();

  router.post(
    "/attempts",
    asyncRoute(async (req, res) => {
      await attempts.create(req.body ?? {});
      res.status(201).json({ message: "Attempt saved." });
    }, "Unable to save attempt.")
  );

  return router;
}
