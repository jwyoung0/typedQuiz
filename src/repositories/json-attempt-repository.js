export function createJsonAttemptRepository(
    fileRepository
) {
    async function readData() {
        const data = await fileRepository.read();

        return {
            quizzes: data.quizzes ?? [],
            attempts: data.attempts ?? []
        };
    }

    async function writeData(data) {
        await fileRepository.write(data);
    }

    async function create(attempt) {
        const data = await readData();

        data.attempts.push(attempt);

        await writeData(data);

        return attempt;
    }

    async function listByQuizId(quizId) {
        const data = await readData();

        return data.attempts.filter(
            (attempt) => attempt.quizId === quizId
        );
    }

    return {
        create,
        listByQuizId
    };
}