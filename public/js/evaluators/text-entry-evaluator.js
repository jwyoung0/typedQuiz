/*
 Evaluates text-entry questions using the application's
 exact-match normalization rules and returns a standardized
 evaluation result ({ correct, score, feedback })
 */

function normalize(value) {
    return value
        .trim()                 // trim whitespace beginning and end
        .replace(/\s+/g, " ")   // multiple consecutive spaces to one
        .replace(/;$/, "");     // removes semicolon if at end
}

export const textEntryEvaluator = {
    evaluate({ question, answer }) {
        const correct =
            normalize(answer) === normalize(question.answer);
        
        return {
            correct,
            score: correct ? 1 : 0,
            feedback: null,
        };
    },
};