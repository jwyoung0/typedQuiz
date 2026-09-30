const selectionScreen = document.querySelector("#quiz-selection");
const quizScreen = document.querySelector("#quiz-screen");
const resultsScreen = document.querySelector("#results");
const quizList = document.querySelector("#quiz-list");
const quizTitle = document.querySelector("#quiz-title");
const progress = document.querySelector("#progress");
const questionElement = document.querySelector("#question");
const answerElement = document.querySelector("#answer");
const feedbackElement = document.querySelector("#feedback");
const scoreElement = document.querySelector("#score");
const submitButton = document.querySelector("#submit-answer");
const submitAnswerButton = submitButton;
const exitQuizButton = document.querySelector("#exit-quiz");
const restartButton = document.querySelector("#restart");

const managementScreen = document.querySelector("#management-screen");
const setForm = document.querySelector("#set-form");
const setList = document.querySelector("#set-list");
const setEditor = document.querySelector("#set-editor");
const editorTitle = document.querySelector("#editor-title");

const editSetForm = document.querySelector("#edit-set-form");
const editSetTitle = document.querySelector("#edit-set-title");
const editSetLanguage = document.querySelector("#edit-set-language");
const deleteSetButton = document.querySelector("#delete-set");

const questionForm = document.querySelector("#question-form");
const questionPrompt = document.querySelector("#question-prompt");
const questionAnswer = document.querySelector("#question-answer");
const questionSubmit = document.querySelector("#question-submit");
const cancelQuestion = document.querySelector("#cancel-question");
const questionList = document.querySelector("#question-list");

const startQuizButton = document.querySelector("#start-quiz");

document.querySelector("#export-set").addEventListener("click", () => {
  if (!selectedSet) {
    return;
  }

  window.location.href =
    `/api/sets/${encodeURIComponent(selectedSet.id)}/export`;
});

document.querySelector("#export-quizzes").addEventListener("click", () => {
  if (selectedSet) {
    window.location.href = `/api/sets/${encodeURIComponent(selectedSet.id)}/export`;
  }
});

let selectedSet = null;
let editingQuestionId = null;
let currentQuestionIndex = 0;
let score = 0;

async function api(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json"
    },
    ...options
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }

  return data;
}

function showError(error) {
  alert(error.message);
}

async function loadSets() {
  try {
    const sets = await api("/api/sets");
    setList.replaceChildren();

    if (sets.length === 0) {
      setList.textContent = "No sets created yet.";
      return;
    }

    for (const set of sets) {
      const card = document.createElement("div");
      card.className = "set-card";

      const title = document.createElement("strong");
      title.textContent = set.title;

      const details = document.createElement("span");
      details.textContent =
        `${set.language} • ${set.questionCount} question(s)`;

      const editButton = document.createElement("button");
      editButton.textContent = "Manage";
      editButton.addEventListener("click", () => selectSet(set.id));

      card.append(title, details, editButton);
      setList.appendChild(card);
    }
  } catch (error) {
    showError(error);
  }
}

async function selectSet(setId) {
  try {
    selectedSet = await api(`/api/sets/${setId}`);

    setEditor.hidden = false;
    editorTitle.textContent = `Manage: ${selectedSet.title}`;
    editSetTitle.value = selectedSet.title;
    editSetLanguage.value = selectedSet.language;

    resetQuestionForm();
    renderQuestions();
  } catch (error) {
    showError(error);
  }
}

function renderQuestions() {
  questionList.replaceChildren();

  if (selectedSet.questions.length === 0) {
    questionList.textContent = "No questions in this set.";
    return;
  }

  for (const question of selectedSet.questions) {
    const item = document.createElement("div");
    item.className = "question-card";

    const prompt = document.createElement("p");
    prompt.textContent = question.prompt;

    const answer = document.createElement("code");
    answer.textContent = question.answer;

    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => editQuestion(question));

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.className = "danger";
    deleteButton.addEventListener("click", () => deleteQuestion(question.id));

    item.append(prompt, answer, editButton, deleteButton);
    questionList.appendChild(item);
  }
}

setForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const title = document.querySelector("#set-title").value;
    const language = document.querySelector("#set-language").value;

    await api("/api/sets", {
      method: "POST",
      body: JSON.stringify({ title, language })
    });

    setForm.reset();
    await loadSets();
  } catch (error) {
    showError(error);
  }
});

editSetForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    await api(`/api/sets/${selectedSet.id}`, {
      method: "PUT",
      body: JSON.stringify({
        title: editSetTitle.value,
        language: editSetLanguage.value
      })
    });

    await loadSets();
    await selectSet(selectedSet.id);
  } catch (error) {
    showError(error);
  }
});

deleteSetButton.addEventListener("click", async () => {
  if (!confirm(`Delete "${selectedSet.title}"?`)) {
    return;
  }

  try {
    await api(`/api/sets/${selectedSet.id}`, {
      method: "DELETE"
    });

    selectedSet = null;
    setEditor.hidden = true;
    await loadSets();
  } catch (error) {
    showError(error);
  }
});

questionForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const payload = {
      prompt: questionPrompt.value,
      answer: questionAnswer.value
    };

    if (editingQuestionId) {
      await api(
        `/api/sets/${selectedSet.id}/questions/${editingQuestionId}`,
        {
          method: "PUT",
          body: JSON.stringify(payload)
        }
      );
    } else {
      await api(`/api/sets/${selectedSet.id}/questions`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
    }

    await selectSet(selectedSet.id);
  } catch (error) {
    showError(error);
  }
});

function editQuestion(question) {
  editingQuestionId = question.id;
  questionPrompt.value = question.prompt;
  questionAnswer.value = question.answer;
  questionSubmit.textContent = "Save Question";
  cancelQuestion.hidden = false;
}

function resetQuestionForm() {
  editingQuestionId = null;
  questionForm.reset();
  questionSubmit.textContent = "Add Question";
  cancelQuestion.hidden = true;
}

cancelQuestion.addEventListener("click", resetQuestionForm);

async function deleteQuestion(questionId) {
  if (!confirm("Delete this question?")) {
    return;
  }

  try {
    await api(
      `/api/sets/${selectedSet.id}/questions/${questionId}`,
      {
        method: "DELETE"
      }
    );

    await selectSet(selectedSet.id);
  } catch (error) {
    showError(error);
  }
}

startQuizButton.addEventListener("click", () => {
  if (!selectedSet || selectedSet.questions.length === 0) {
    alert("Add at least one question before starting.");
    return;
  }

  currentQuestionIndex = 0;
  score = 0;

  managementScreen.hidden = true;
  quizScreen.hidden = false;
  resultsScreen.hidden = true;

  showQuestion();
});

function normalize(value) {
  return value.trim().replace(/\s+/g, " ").replace(/;$/, "");
}

function showQuestion() {
  const currentQuestion = selectedSet.questions[currentQuestionIndex];

  quizTitle.textContent =
    `${selectedSet.title} (${selectedSet.language})`;

  progress.textContent =
    `Question ${currentQuestionIndex + 1} of ${selectedSet.questions.length}`;

  questionElement.textContent = currentQuestion.prompt;
  answerElement.value = "";
  feedbackElement.textContent = "";
  answerElement.focus();
}

submitAnswerButton.addEventListener("click", async () => {
  const currentQuestion = selectedSet.questions[currentQuestionIndex];
  const correct =
    normalize(answerElement.value) === normalize(currentQuestion.answer);

  if (correct) {
    score++;
    feedbackElement.textContent = "Correct!";
    feedbackElement.className = "correct";
  } else {
    feedbackElement.textContent =
      `Incorrect. Expected: ${currentQuestion.answer}`;
    feedbackElement.className = "incorrect";
  }

  submitAnswerButton.disabled = true;

  setTimeout(async () => {
    currentQuestionIndex++;
    submitAnswerButton.disabled = false;

    if (currentQuestionIndex >= selectedSet.questions.length) {
      await finishQuiz();
    } else {
      showQuestion();
    }
  }, 1200);
});

async function finishQuiz() {
  await api("/api/attempts", {
    method: "POST",
    body: JSON.stringify({
      quizId: selectedSet.id,
      score,
      total: selectedSet.questions.length
    })
  });

  quizScreen.hidden = true;
  resultsScreen.hidden = false;
  scoreElement.textContent =
    `You scored ${score} out of ${selectedSet.questions.length}.`;
}

function exitQuiz() {
  quizScreen.hidden = true;
  resultsScreen.hidden = true;
  managementScreen.hidden = false;
}

exitQuizButton.addEventListener("click", exitQuiz);

restartButton.addEventListener("click", exitQuiz);

answerElement.addEventListener("keydown", (event) => {
  if (event.ctrlKey && event.key === "Enter") {
    submitAnswerButton.click();
  }
});

loadSets();