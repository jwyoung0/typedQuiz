import test from "node:test";
import assert from "node:assert/strict";

import { getEvaluator }
    from "../public/js/evaluators/evaluator-registry.js";

test("returns text-entry evaluator", () => {
    const evaluator = getEvaluator("text-entry");

    assert.ok(evaluator);
    assert.equal(typeof evaluator.evaluate, "function");
});

test("text-entry evaluator can evaluate answers", () => {
    const evaluator = getEvaluator("text-entry");

    const result = evaluator.evaluate({
        question: {
            type: "text-entry",
            answer: "const x = 1",
        },
        answer: "const x = 1",
    });

    assert.equal(result.correct, true);
});

test("throws for unsupported types", () => {
    assert.throws(
        () => getEvaluator("unsupported-type"),
        /unsupported|unregistered|unknown/i,
    );
});