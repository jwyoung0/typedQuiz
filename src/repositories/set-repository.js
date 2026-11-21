/**
 * @typedef {Object} SetRepository
 * @property {() => Promise<Array<Object>>} list
 * @property {(id: string) => Promise<Object | undefined>} getById
 * @property {(set: Object) => Promise<Object>} create
 * @property {(id: string, changes: Object) => Promise<Object | undefined>} update
 * @property {(id: string) => Promise<Object | undefined>} delete
 * @property {(setId: string) => Promise<Array<Object> | undefined>} listQuestions
 * @property {(setId: string, question: Object) => Promise<Object | undefined>} createQuestion
 * @property {(setId: string, questionId: string, changes: Object) => Promise<Object | undefined>} updateQuestion
 * @property {(setId: string, questionId: string) => Promise<Object | undefined>} deleteQuestion
 */
export {};