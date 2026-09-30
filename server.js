import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;
const dataFile = path.join(__dirname, "data", "quizzes.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

async function readData() {
  const contents = await fs.readFile(dataFile, "utf8");
  return JSON.parse(contents);
}

async function writeData(data) {
  await fs.writeFile(dataFile, JSON.stringify(data, null, 2));
}

function findSet(data, setId) {
  return data.quizzes.find((quiz) => quiz.id === setId);
}

function findQuestion(set, questionId) {
  return set?.questions.find((question) => question.id === questionId);
}

/*
 * Sets
 */

// Read all sets without exposing answers
app.get("/api/sets", async (req, res) => {
  try {
    const data = await readData();

    res.json(
      data.quizzes.map(({ questions, ...quiz }) => ({
        ...quiz,
        questionCount: questions.length
      }))
    );
  } catch {
    res.status(500).json({ error: "Unable to load sets." });
  }
});

// Read one set, including its questions
app.get("/api/sets/:setId", async (req, res) => {
  try {
    const data = await readData();
    const set = findSet(data, req.params.setId);

    if (!set) {
      return res.status(404).json({ error: "Set not found." });
    }

    res.json(set);
  } catch {
    res.status(500).json({ error: "Unable to load set." });
  }
});

// Create a set
app.post("/api/sets", async (req, res) => {
  try {
    const { title, language } = req.body;

    if (!title?.trim() || !language?.trim()) {
      return res.status(400).json({
        error: "Title and language are required."
      });
    }

    const data = await readData();

    const newSet = {
      id: randomUUID(),
      title: title.trim(),
      language: language.trim(),
      questions: []
    };

    data.quizzes.push(newSet);
    await writeData(data);

    res.status(201).json(newSet);
  } catch {
    res.status(500).json({ error: "Unable to create set." });
  }
});

// Update a set
app.put("/api/sets/:setId", async (req, res) => {
  try {
    const data = await readData();
    const set = findSet(data, req.params.setId);

    if (!set) {
      return res.status(404).json({ error: "Set not found." });
    }

    const { title, language } = req.body;

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({ error: "Title cannot be empty." });
      }

      set.title = title.trim();
    }

    if (language !== undefined) {
      if (!language.trim()) {
        return res.status(400).json({ error: "Language cannot be empty." });
      }

      set.language = language.trim();
    }

    await writeData(data);
    res.json(set);
  } catch {
    res.status(500).json({ error: "Unable to update set." });
  }
});

// Delete a set
app.delete("/api/sets/:setId", async (req, res) => {
  try {
    const data = await readData();
    const index = data.quizzes.findIndex(
      (quiz) => quiz.id === req.params.setId
    );

    if (index === -1) {
      return res.status(404).json({ error: "Set not found." });
    }

    const [deletedSet] = data.quizzes.splice(index, 1);

    data.attempts = (data.attempts ?? []).filter(
      (attempt) => attempt.quizId !== req.params.setId
    );

    await writeData(data);

    res.json({
      message: "Set deleted.",
      set: deletedSet
    });
  } catch {
    res.status(500).json({ error: "Unable to delete set." });
  }
});

/*
 * Questions
 */

// Read all questions in a set
app.get("/api/sets/:setId/questions", async (req, res) => {
  try {
    const data = await readData();
    const set = findSet(data, req.params.setId);

    if (!set) {
      return res.status(404).json({ error: "Set not found." });
    }

    res.json(set.questions);
  } catch {
    res.status(500).json({ error: "Unable to load questions." });
  }
});

// Create a question
app.post("/api/sets/:setId/questions", async (req, res) => {
  try {
    const data = await readData();
    const set = findSet(data, req.params.setId);

    if (!set) {
      return res.status(404).json({ error: "Set not found." });
    }

    const { prompt, answer } = req.body;

    if (!prompt?.trim() || !answer?.trim()) {
      return res.status(400).json({
        error: "Prompt and answer are required."
      });
    }

    const question = {
      id: randomUUID(),
      prompt: prompt.trim(),
      answer: answer.trim()
    };

    set.questions.push(question);
    await writeData(data);

    res.status(201).json(question);
  } catch {
    res.status(500).json({ error: "Unable to create question." });
  }
});

// Update a question
app.put("/api/sets/:setId/questions/:questionId", async (req, res) => {
  try {
    const data = await readData();
    const set = findSet(data, req.params.setId);

    if (!set) {
      return res.status(404).json({ error: "Set not found." });
    }

    const question = findQuestion(set, req.params.questionId);

    if (!question) {
      return res.status(404).json({ error: "Question not found." });
    }

    const { prompt, answer } = req.body;

    if (prompt !== undefined) {
      if (!prompt.trim()) {
        return res.status(400).json({ error: "Prompt cannot be empty." });
      }

      question.prompt = prompt.trim();
    }

    if (answer !== undefined) {
      if (!answer.trim()) {
        return res.status(400).json({ error: "Answer cannot be empty." });
      }

      question.answer = answer.trim();
    }

    await writeData(data);
    res.json(question);
  } catch {
    res.status(500).json({ error: "Unable to update question." });
  }
});

// Delete a question
app.delete("/api/sets/:setId/questions/:questionId", async (req, res) => {
  try {
    const data = await readData();
    const set = findSet(data, req.params.setId);

    if (!set) {
      return res.status(404).json({ error: "Set not found." });
    }

    const index = set.questions.findIndex(
      (question) => question.id === req.params.questionId
    );

    if (index === -1) {
      return res.status(404).json({ error: "Question not found." });
    }

    const [deletedQuestion] = set.questions.splice(index, 1);

    await writeData(data);

    res.json({
      message: "Question deleted.",
      question: deletedQuestion
    });
  } catch {
    res.status(500).json({ error: "Unable to delete question." });
  }
});

/*
 * Existing quiz-compatible endpoints
 */

app.get("/api/quizzes", async (req, res) => {
  try {
    const data = await readData();

    const quizzes = data.quizzes.map((quiz) => ({
      id: quiz.id,
      title: quiz.title,
      language: quiz.language,
      questions: quiz.questions.map(({ answer, ...question }) => question)
    }));

    res.json(quizzes);
  } catch {
    res.status(500).json({ error: "Unable to load quizzes." });
  }
});

app.get("/api/quizzes-with-answers", async (req, res) => {
  try {
    const data = await readData();
    res.json(data.quizzes);
  } catch {
    res.status(500).json({ error: "Unable to load quiz answers." });
  }
});

app.post("/api/attempts", async (req, res) => {
  try {
    const { quizId, score, total } = req.body;

    if (!quizId || !Number.isInteger(score) || !Number.isInteger(total)) {
      return res.status(400).json({ error: "Invalid attempt data." });
    }

    const data = await readData();
    const quiz = data.quizzes.find((item) => item.id === quizId);

    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found." });
    }

    data.attempts ??= [];
    data.attempts.push({
      quizId,
      score,
      total,
      completedAt: new Date().toISOString()
    });

    await writeData(data);

    res.status(201).json({ message: "Attempt saved." });
  } catch {
    res.status(500).json({ error: "Unable to save attempt." });
  }
});

// Export all questions and answers as a text file
app.get("/api/export", async (req, res) => {
  try {
    const data = await readData();

    const contents = data.quizzes
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

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="quizzes.txt"');
    res.send(contents || "No quiz sets available.");
  } catch {
    res.status(500).json({ error: "Unable to export quizzes." });
  }
});

app.get("/api/sets/:setId/export", async (req, res) => {
  try {
    const data = await readData();
    const set = findSet(data, req.params.setId);

    if (!set) {
      return res.status(404).json({ error: "Set not found." });
    }

    const questions = set.questions
      .map(
        (question, index) =>
          `Question ${index + 1}:\n${question.prompt}\nAnswer:\n${question.answer}`
      )
      .join("\n\n");

    const contents = `${set.title} (${set.language})\n\n${questions}`;

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="quiz-set.txt"');
    res.send(contents);
  } catch {
    res.status(500).json({ error: "Unable to export set." });
  }
});

app.listen(port, () => {
  console.log(`Quiz app running at http://localhost:${port}`);
});