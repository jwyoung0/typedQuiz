/**
 * @typedef {Object} AttemptRepository
 * @property {(attempt: {
 *   quizId: string,
 *   score: number,
 *   total: number,
 *   completedAt: string
 * }) => Promise<void>} create
 * @property {(quizId: string) => Promise<Array<{
 *   quizId: string,
 *   score: number,
 *   total: number,
 *   completedAt: string
 * }>>} listByQuizId
 */
export {};