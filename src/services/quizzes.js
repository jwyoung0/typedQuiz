import { HttpError } from "../errors.js";
import { normalizeQuestion } from "../domain/question-types.js";

export function createQuizService(repository) {
  return {
    async list() {
      const quizzes = await repository.list();
      
      return quizzes.map((quiz) => ({
        id: quiz.id,
        title: quiz.title,
        language: quiz.language,
        questions: quiz.questions.map((question) => {
          const { answer, ...publicQuestion } = normalizeQuestion(question);
          return publicQuestion;
        })
      }));
    },

    async listWithAnswers() {
      const quizzes = await repository.list();
      
      return quizzes.map((quiz) => ({
        ...quiz,
        questions: quiz.questions.map(normalizeQuestion)
      }));
    },

    async getExport() {
      const quizzes = await repository.list();
      
      return quizzes
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
