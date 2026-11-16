import test from "node:test";
import assert from "node:assert/strict";

import { textEntryEvaluator } from "../public/js/evaluators/text-entry-evaluator.js";

function evaluate(answer, expectedAnswer) {
    return textEntryEvaluator.evaluate({
        question: {
            type: "text-entry",
            answer: expectedAnswer,
        },
        answer,
    });
}

test("returns correct for exact match", () => {
    const result = evaluate(
        "const x = 1",
        "const x = 1",
    );

    assert.equal(result.correct, true);
    assert.equal(result.score, 1);
    assert.equal(result.feedback, null);
});

test("ignores leading and trailing whitespace", () => {
    const result = evaluate(
        "  const x = 1  ",
        "const x = 1",
    );

    assert.equal(result.correct, true);
});

test("collapses internal whitespace", () => {
    const result = evaluate(
        "const   x     =      1",
        "const x = 1",
    );

    assert.equal(result.correct, true);
});

test("ignores one trailing semicolon", () => {
    const result = evaluate(
        "const x = 1;",
        "const x = 1",
    );

    assert.equal(result.correct, true);
});

test("remains case sensitive", () => {
    const result = evaluate(
        "const X = 1",
        "const x = 1",
    );

    assert.equal(result.correct, false);
    assert.equal(result.score, 0);
});

test("removes only one trailing semicolon", () => {
    const result = evaluate(
        "const x = 1;;",
        "const x = 1",
    );

    assert.equal(result.correct, false);
});

test("returns incorrect for different answers", () => {
    const result = evaluate(
        "const y = 1", 
        "const x = 1",
    );

    assert.equal(result.correct, false);
    assert.equal(result.score, 0);
});

test("returns standardized result structure", () => {
    const result = evaluate(
        "wrong answer",
        "correct answer",
    );

    assert.deepEqual(result, {
        correct: false, 
        score: 0,
        feedback: null,
    });
});