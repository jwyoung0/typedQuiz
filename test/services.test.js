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
    questions: [{ id: "q1", prompt: "Question" }]
  }]);
});

test("new questions default to type", async () => {
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

  assert.equal(question.type, "typed");  
});

test("questions without a stored type are normalized to typed", async () => {
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
    "typed"
  );
})

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

  assert.equal(questions[0].type, "typed");
});