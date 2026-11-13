import { createQuiz } from "./quiz.js";
import { initializeSetManagement } from "./sets.js";

const quiz = createQuiz();
initializeSetManagement({ onStartQuiz: quiz.start });
