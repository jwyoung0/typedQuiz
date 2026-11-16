import { api, showError } from "./api.js";
import { getEvaluator } from "./evaluators/evaluator-registry.js";

export function createQuiz() {
  const managementScreen = document.querySelector("#management-screen");
  const quizScreen = document.querySelector("#quiz-screen");
  const resultsScreen = document.querySelector("#results");
  const quizTitle = document.querySelector("#quiz-title");
  const progress = document.querySelector("#progress");
  const questionElement = document.querySelector("#question");
  const answerElement = document.querySelector("#answer");
  const feedbackElement = document.querySelector("#feedback");
  const scoreElement = document.querySelector("#score");
  const submitButton = document.querySelector("#submit-answer");
  const exitQuizButton = document.querySelector("#exit-quiz");
  const restartButton = document.querySelector("#restart");

  let selectedSet = null;
  let quizQuestions = [];
  let currentQuestionIndex = 0;
  let score = 0;

  // function normalize(value) {
  //   return value.trim().replace(/\s+/g, " ").replace(/;$/, "");
  // }

  function showQuestion() {
    const currentQuestion = quizQuestions[currentQuestionIndex];

    quizTitle.textContent =
      `${selectedSet.title} (${selectedSet.language})`;
    progress.textContent =
      `Question ${currentQuestionIndex + 1} of ${quizQuestions.length}`;
    questionElement.textContent = currentQuestion.prompt;
    answerElement.value = "";
    feedbackElement.textContent = "";
    answerElement.focus();
  }

  async function finishQuiz() {
    await api("/api/attempts", {
      method: "POST",
      body: JSON.stringify({
        quizId: selectedSet.id,
        score,
        total: quizQuestions.length
      })
    });

    quizScreen.hidden = true;
    resultsScreen.hidden = false;
    scoreElement.textContent =
      `You scored ${score} out of ${quizQuestions.length}.`;
  }

  function exitQuiz() {
    quizScreen.hidden = true;
    resultsScreen.hidden = true;
    managementScreen.hidden = false;
  }

  submitButton.addEventListener("click", async () => {
    const currentQuestion = quizQuestions[currentQuestionIndex];
    // const correct =
    //   normalize(answerElement.value) === normalize(currentQuestion.answer);

    const evaluator = getEvaluator(currentQuestion.type);

    const result = evaluator.evaluate({
      question: currentQuestion,
      answer: userAnswer,
    });

    if (result.correct) {
      score++;
      feedbackElement.textContent = "Correct!";
      feedbackElement.className = "correct";
    } else {
      feedbackElement.textContent =
        `Incorrect. Expected: ${currentQuestion.answer}`;
      feedbackElement.className = "incorrect";
    }

    submitButton.disabled = true;

    setTimeout(async () => {
      currentQuestionIndex++;
      submitButton.disabled = false;

      if (currentQuestionIndex >= quizQuestions.length) {
        try {
          await finishQuiz();
        } catch (error) {
          showError(error);
        }
      } else {
        showQuestion();
      }
    }, 1200);
  });

  exitQuizButton.addEventListener("click", exitQuiz);
  restartButton.addEventListener("click", exitQuiz);
  answerElement.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.key === "Enter") {
      submitButton.click();
    }
  });

  return {
    start(set) {
      selectedSet = set;
      quizQuestions = [...set.questions];

      for (let index = quizQuestions.length - 1; index > 0; index--) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [quizQuestions[index], quizQuestions[randomIndex]] =
          [quizQuestions[randomIndex], quizQuestions[index]];
      }

      currentQuestionIndex = 0;
      score = 0;
      managementScreen.hidden = true;
      quizScreen.hidden = false;
      resultsScreen.hidden = true;
      showQuestion();
    }
  };
}
