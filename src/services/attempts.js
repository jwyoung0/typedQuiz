import { HttpError } from "../errors.js";

export function createAttemptService(
  attemptRepository,
  setRepository
) {
  return {
    async create({ quizId, score, total }) {
      if (
        !quizId || 
        !Number.isInteger(score) || 
        !Number.isInteger(total)
      ) {
        throw new HttpError(400, "Invalid attempt data.");
      }

      const quiz = await setRepository.getById(quizId);

      if (!quiz) {
        throw new HttpError(404, "Quiz not found.");
      }

      await attemptRepository.create({
        quizId,
        score,
        total,
        completedAt: new Date().toISOString()
      });
    }
  };
}
