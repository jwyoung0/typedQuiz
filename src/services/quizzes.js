import { HttpError } from "../errors.js";

export function createQuizService(repository) {
  return {
    async list() {
      const data = await repository.read();
      return data.quizzes.map((quiz) => ({
        id: quiz.id,
        title: quiz.title,
        language: quiz.language,
        questions: quiz.questions.map(({ answer, ...question }) => question)
      }));
    },

    async listWithAnswers() {
      const data = await repository.read();
      return data.quizzes;
    },

    async getExport() {
      const data = await repository.read();
      return data.quizzes
        .map((quiz) => {
          const questions = quiz.questions
            .map(
              (question, index) =>
                `Question ${index + 1}:\n${question.prompt}\nAnswer:\n${question.answer}`
            )
            .join("\n\n");

          return `${quiz.title} (${quiz.language})\n\n${questions}`;
        })
        .join("\n\n--------------------\n\n");
    }
  };
}
