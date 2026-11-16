/*
Central registry for question evaluators.
Maps question types to evaluator implementations
and provides a single lookup point for quiz grading.
*/

import { textEntryEvaluator } from "./text-entry-evaluator.js";

const evaluators = {
    "text-entry": textEntryEvaluator,
};

export function getEvaluator(type) {
    const evaluator = evaluators[type];

    if (!evaluator) {
        throw new Error(`No evaluator registered for type: ${type}`);
    }

    return evaluator;
};