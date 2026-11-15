import assert from "node:assert/strict";
import test from "node:test";
import { createQuizService } from "../src/services/quizzes.js";
import { createSetService } from "../src/services/sets.js";

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
  const repository = createMemoryRepository({ quizzes: [] });
  const sets = createSetService(repository);

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
  assert.deepEqual(repository.snapshot().quizzes, [created]);
});

test("deleting a set also removes its saved attempts", async () => {
  const repository = createMemoryRepository({
    quizzes: [{ id: "one", title: "One", language: "JS", questions: [] }],
    attempts: [
      { quizId: "one", score: 1, total: 1 },
      { quizId: "two", score: 0, total: 1 }
    ]
  });
  const sets = createSetService(repository);

  await sets.delete("one");

  assert.deepEqual(repository.snapshot().quizzes, []);
  assert.deepEqual(repository.snapshot().attempts, [
    { quizId: "two", score: 0, total: 1 }
  ]);
});

test("public quiz listings omit answer fields", async () => {
  const repository = createMemoryRepository({
    quizzes: [{
      id: "one",
      title: "One",
      language: "JS",
      questions: [{ id: "q1", prompt: "Question", answer: "Answer" }]
    }]
  });
  const quizzes = createQuizService(repository);

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
  const repository = createMemoryRepository({
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
  const quizzes = createQuizService(repository);

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
  const repository = createMemoryRepository({
    quizzes: [{
      id: "set1",
      title: "Basics",
      language: "JS",
      questions: []
    }]
  });

  const sets = createSetService(repository);

  const question = await sets.createQuestion("set1", {
    prompt: "What is const?",
    answer: "A constant binding"
  });

  assert.equal(question.type, "text-entry");
  assert.equal(
    repository.snapshot().quizzes[0].questions[0].type,
    "text-entry"
  );
});

test("questions without a stored type are normalized to text-entry", async () => {
  const repository = createMemoryRepository({
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

  const sets = createSetService(repository);
  const result = await sets.get("set1");

  assert.equal(
    result.questions[0].type,
    "text-entry"
  );
});

test("legacy typed questions are normalized to text-entry", async () => {
  const repository = createMemoryRepository({
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

  const sets = createSetService(repository);
  const result = await sets.get("set1");

  assert.equal(result.questions[0].type, "text-entry");
  assert.equal(repository.snapshot().quizzes[0].questions[0].type, "typed");
});

test("stored future question types remain unchanged", async () => {
  const repository = createMemoryRepository({
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
  const sets = createSetService(repository);

  assert.equal((await sets.get("set1")).questions[0].type, "multiple-choice");
});

test("question creation normalizes legacy type values", async () => {
  const repository = createMemoryRepository({
    quizzes: [{
      id: "set1",
      title: "Basics",
      language: "JS",
      questions: []
    }]
  });
  const sets = createSetService(repository);

  const question = await sets.createQuestion("set1", {
    type: "typed",
    prompt: "Question",
    answer: "Answer"
  });

  assert.equal(question.type, "text-entry");
  assert.equal(
    repository.snapshot().quizzes[0].questions[0].type,
    "text-entry"
  );
});

test("question creation rejects unsupported types", async () => {
  const repository = createMemoryRepository({
    quizzes: [{
      id: "set1",
      title: "Basics",
      language: "JS",
      questions: []
    }]
  });
  const sets = createSetService(repository);

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
  const repository = createMemoryRepository({
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

  const sets = createSetService(repository);

  const questions = await sets.listQuestions("set1");

  assert.equal(questions[0].type, "text-entry");
});