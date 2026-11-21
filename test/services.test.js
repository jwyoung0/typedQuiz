import assert from "node:assert/strict";
import test from "node:test";
import { createQuizService } from "../src/services/quizzes.js";
import { createSetService } from "../src/services/sets.js";
import { createAttemptService } from "../src/services/attempts.js"
import { createJsonSetRepository } from "../src/repositories/json-set-repository.js";
import { createJsonAttemptRepository } from "../src/repositories/json-attempt-repository.js";

function createMemoryRepository(initialData) {
  let data = structuredClone(initialData);

  return {
    async read() {
      return structuredClone(data);
    },
    async write(nextData) {
      data = structuredClone(nextData);
    },
    snapshot() {
      return structuredClone(data);
    }
  };
}


test("set creation validates input and persists a new empty set", async () => {
  const fileRepository = createMemoryRepository({ quizzes: [] });
  const setRepository = createJsonSetRepository(fileRepository);
  const sets = createSetService(setRepository);

  await assert.rejects(
    sets.create({ title: " ", language: "JavaScript" }),
    { status: 400, message: "Title and language are required." }
  );

  const created = await sets.create({
    title: "  Basics ",
    language: " JavaScript "
  });

  assert.equal(created.title, "Basics");
  assert.equal(created.language, "JavaScript");
  assert.deepEqual(fileRepository.snapshot().quizzes, [created]);
});

test("deleting a set also removes its saved attempts", async () => {
  const fileRepository = createMemoryRepository({
    quizzes: [{ id: "one", title: "One", language: "JS", questions: [] }],
    attempts: [
      { quizId: "one", score: 1, total: 1 },
      { quizId: "two", score: 0, total: 1 }
    ]
  });
  const setRepository = createJsonSetRepository(fileRepository);
  const sets = createSetService(setRepository);

  await sets.delete("one");

  assert.deepEqual(fileRepository.snapshot().quizzes, []);
  assert.deepEqual(fileRepository.snapshot().attempts, [
    { quizId: "two", score: 0, total: 1 }
  ]);
});

test("public quiz listings omit answer fields", async () => {
  const fileRepository = createMemoryRepository({
    quizzes: [{
      id: "one",
      title: "One",
      language: "JS",
      questions: [{ id: "q1", prompt: "Question", answer: "Answer" }]
    }]
  });
  const setRepository = createJsonSetRepository(fileRepository);
  const quizzes = createQuizService(setRepository);

  assert.deepEqual(await quizzes.list(), [{
    id: "one",
    title: "One",
    language: "JS",
    questions: [{
      id: "q1",
      prompt: "Question",
      type: "text-entry"
    }]
  }]);
});

test("quiz listings with answers normalize legacy question types", async () => {
  const fileRepository = createMemoryRepository({
    quizzes: [{
      id: "one",
      title: "One",
      language: "JS",
      questions: [{
        id: "q1",
        type: "typed",
        prompt: "Question",
        answer: "Answer"
      }]
    }]
  });
  const setRepository = createJsonSetRepository(fileRepository);
  const quizzes = createQuizService(setRepository);

  assert.deepEqual(await quizzes.listWithAnswers(), [{
    id: "one",
    title: "One",
    language: "JS",
    questions: [{
      id: "q1",
      type: "text-entry",
      prompt: "Question",
      answer: "Answer"
    }]
  }]);
});

test("new questions default to text-entry type", async () => {
  const fileRepository = createMemoryRepository({
    quizzes: [{
      id: "set1",
      title: "Basics",
      language: "JS",
      questions: []
    }]
  });

  const setRepository = createJsonSetRepository(fileRepository);
  const sets = createSetService(setRepository);

  const question = await sets.createQuestion("set1", {
    prompt: "What is const?",
    answer: "A constant binding"
  });

  assert.equal(question.type, "text-entry");
  assert.equal(
    fileRepository.snapshot().quizzes[0].questions[0].type,
    "text-entry"
  );
});

test("questions without a stored type are normalized to text-entry", async () => {
  const fileRepository = createMemoryRepository({
    quizzes: [{
      id: "set1",
      title: "Basics",
      language: "JS",
      questions: [{
        id: "q1",
        prompt: "What is const?",
        answer: "A constant binding"
      }]
    }]
  });

  const setRepository = createJsonSetRepository(fileRepository);
  const sets = createSetService(setRepository);
  const result = await sets.get("set1");

  assert.equal(
    result.questions[0].type,
    "text-entry"
  );
});

test("legacy typed questions are normalized to text-entry", async () => {
  const fileRepository = createMemoryRepository({
    quizzes: [{
      id: "set1",
      title: "Basics",
      language: "JS",
      questions: [{
        id: "q1",
        type: "typed",
        prompt: "What is const?",
        answer: "A constant binding"
      }]
    }]
  });

  const setRepository = createJsonSetRepository(fileRepository);
  const sets = createSetService(setRepository);
  const result = await sets.get("set1");

  assert.equal(result.questions[0].type, "text-entry");
  assert.equal(fileRepository.snapshot().quizzes[0].questions[0].type, "typed");
});

test("stored future question types remain unchanged", async () => {
  const fileRepository = createMemoryRepository({
    quizzes: [{
      id: "set1",
      title: "Basics",
      language: "JS",
      questions: [{
        id: "q1",
        type: "multiple-choice",
        prompt: "Question",
        answer: "Answer"
      }]
    }]
  });
  
  const setRepository = createJsonSetRepository(fileRepository);
  const sets = createSetService(setRepository);

  assert.equal((await sets.get("set1")).questions[0].type, "multiple-choice");
});

test("question creation normalizes legacy type values", async () => {
  const fileRepository = createMemoryRepository({
    quizzes: [{
      id: "set1",
      title: "Basics",
      language: "JS",
      questions: []
    }]
  });

  const setRepository = createJsonSetRepository(fileRepository);
  const sets = createSetService(setRepository);

  const question = await sets.createQuestion("set1", {
    type: "typed",
    prompt: "Question",
    answer: "Answer"
  });

  assert.equal(question.type, "text-entry");
  assert.equal(
    fileRepository.snapshot().quizzes[0].questions[0].type,
    "text-entry"
  );
});

test("question creation rejects unsupported types", async () => {
  const fileRepository = createMemoryRepository({
    quizzes: [{
      id: "set1",
      title: "Basics",
      language: "JS",
      questions: []
    }]
  });

  const setRepository = createJsonSetRepository(fileRepository);
  const sets = createSetService(setRepository);

  await assert.rejects(
    sets.createQuestion("set1", {
      type: "multiple-choice",
      prompt: "Question",
      answer: "Answer"
    }),
    { status: 400, message: "Invalid question type." }
  );
});

test("listQuestions returns normalized question types", async () => {
  const fileRepository = createMemoryRepository({
    quizzes: [{
      id: "set1",
      title: "Basics",
      language: "JS",
      questions: [{
        id: "q1",
        prompt: "Question",
        answer: "Answer"
      }]
    }]
  });

  const setRepository = createJsonSetRepository(fileRepository);
  const sets = createSetService(setRepository);

  const questions = await sets.listQuestions("set1");

  assert.equal(questions[0].type, "text-entry");
});

test("set updates persist through the JSON set repository", async () => {
  const fileRepository = createMemoryRepository({
    quizzes: [{
      id: "set1",
      title: "Basics",
      language: "JS",
      questions: []
    }]
  });

  const setRepository = createJsonSetRepository(fileRepository);
  const sets = createSetService(setRepository);

  const updated = await sets.update("set1", {
    title: "  Advanced ",
    language: " TypeScript "
  });

  assert.equal(updated.title, "Advanced");
  assert.equal(updated.language, "TypeScript");
  assert.deepEqual(
    fileRepository.snapshot().quizzes[0],
    {
      id: "set1",
      title: "Advanced",
      language: "TypeScript",
      questions: []
    }
  );
});

test("question updates and deletes persist through the JSON set repository", async () => {
  const fileRepository = createMemoryRepository({
    quizzes: [{
      id: "set1",
      title: "Basics",
      language: "JS",
      questions: [{
        id: "q1",
        prompt: "Old prompt",
        answer: "Old answer"
      }]
    }]
  });

  const setRepository = createJsonSetRepository(fileRepository);
  const sets = createSetService(setRepository);

  const updated = await sets.updateQuestion("set1", "q1", {
    prompt: "  New prompt ",
    answer: "  New answer "
  });

  assert.equal(updated.prompt, "New prompt");
  assert.equal(updated.answer, "New answer");
  assert.equal(updated.type, "text-entry");

  await sets.deleteQuestion("set1", "q1");

  assert.deepEqual(
    fileRepository.snapshot().quizzes[0].questions,
    []
  );
});

test("attempt creation persists a complete attempt record", async () => {
  const fileRepository = createMemoryRepository({
    quizzes: [{
      id: "set1",
      title: "Basics",
      language: "JS",
      questions: []
    }],
    attempts: []
  });

  const setRepository = createJsonSetRepository(fileRepository);
  const attemptRepository = createJsonAttemptRepository(fileRepository);
  const attempts = createAttemptService(attemptRepository, setRepository);

  await attempts.create({
    quizId: "set1",
    score: 2,
    total: 3
  });

  const [attempt] = fileRepository.snapshot().attempts;

  assert.equal(attempt.quizId, "set1");
  assert.equal(attempt.score, 2);
  assert.equal(attempt.total, 3);
  assert.equal(typeof attempt.completedAt, "string");
  assert.equal(Number.isNaN(Date.parse(attempt.completedAt)), false);
});

test("attempt creation rejects invalid attempt data", async () => {
  const fileRepository = createMemoryRepository({
    quizzes: [],
    attempts: []
  });

  const setRepository = createJsonSetRepository(fileRepository);
  const attemptRepository = createJsonAttemptRepository(fileRepository);
  const attempts = createAttemptService(attemptRepository, setRepository);

  await assert.rejects(
    attempts.create({ quizId: "set1", score: 1.5, total: 2 }),
    { status: 400, message: "Invalid attempt data." }
  );

  assert.deepEqual(fileRepository.snapshot().attempts, []);
});

test("attempt creation rejects a missing quiz", async () => {
  const fileRepository = createMemoryRepository({
    quizzes: [],
    attempts: []
  });

  const setRepository = createJsonSetRepository(fileRepository);
  const attemptRepository = createJsonAttemptRepository(fileRepository);
  const attempts = createAttemptService(attemptRepository, setRepository);

  await assert.rejects(
    attempts.create({ quizId: "missing", score: 1, total: 1 }),
    { status: 404, message: "Quiz not found." }
  );

  assert.deepEqual(fileRepository.snapshot().attempts, []);
});

test("attempt repository lists attempts only for the requested quiz", async () => {
  const fileRepository = createMemoryRepository({
    quizzes: [],
    attempts: [
      { quizId: "set1", score: 1, total: 1, completedAt: "2026-01-01T00:00:00.000Z" },
      { quizId: "set2", score: 0, total: 1, completedAt: "2026-01-02T00:00:00.000Z" }
    ]
  });

  const attemptRepository = createJsonAttemptRepository(fileRepository);
  const attempts = await attemptRepository.listByQuizId("set1");

  assert.deepEqual(attempts, [{
    quizId: "set1",
    score: 1,
    total: 1,
    completedAt: "2026-01-01T00:00:00.000Z"
  }]);
});