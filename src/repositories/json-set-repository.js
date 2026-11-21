export function createJsonSetRepository(fileRepository) {
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

    async function list() {
        const data = await readData();
        return data.quizzes;
    }

    async function getById(id) {
        const data = await readData();
        return data.quizzes.find((quiz) => quiz.id === id) ?? null;
    }

    async function create(set) {
        const data = await readData();

        data.quizzes.push(set);

        await writeData(data);

        return set;
    }

    async function update(id, changes) {
        const data = await readData();

        const set = data.quizzes.find((quiz) => quiz.id === id);

        if (!set) {
            return null;
        }

        if ("title" in changes) {
            set.title = changes.title;
        }

        if ("language" in changes) {
            set.language = changes.language;
        }

        await writeData(data);

        return set;
    }

    async function remove(id) {
        const data = await readData();

        const index = data.quizzes.findIndex(
            (quiz) => quiz.id === id
        );

        if (index === -1) {
            return null;
        }

        const [deletedSet] = data.quizzes.splice(index, 1);
    
        data.attempts = data.attempts.filter(
            (attempt) => attempt.quizId !== id
        );
    
        await writeData(data);

        return deletedSet;
    }

    async function listQuestions(setId) {
        const set = await getById(setId);

        return set ? set.questions : null;
    }
    
    async function createQuestion(setId, question) {
        const data = await readData();

        const set = data.quizzes.find(
            (quiz) => quiz.id === setId
        );

        if (!set) {
            return null;
        }

        set.questions.push(question);

        await writeData(data);

        return question;
    }

    async function updateQuestion(
        setId,
        questionId,
        changes
    ) {
        const data = await readData();

        const set = data.quizzes.find(
            (quiz) => quiz.id === setId
        );

        if (!set) {
            return null;
        }

        const question = set.questions.find(
            (item) => item.id === questionId
        );

        if (!question) {
            return null;
        }

        if ("prompt" in changes) {
            question.prompt = changes.prompt;
        }

        if ("answer" in changes) {
            question.answer = changes.answer;
        }

        if ("type" in changes) {
            question.type = changes.type;
        }

        await writeData(data);

        return question;       
    }

    async function deleteQuestion(
        setId,
        questionId
    ) {
        const data = await readData();

        const set = data.quizzes.find(
            (quiz) => quiz.id === setId
        );

        if (!set) {
            return null;
        }

        const index = set.questions.findIndex(
            (question) => question.id === questionId
        );

        if (index === -1) {
            return null;
        }

        const [deletedQuestion] =
            set.questions.splice(index, 1);

        await writeData(data);

        return deletedQuestion;
    }

    return {
        list,
        getById,
        create,
        update,
        delete: remove,
        listQuestions,
        createQuestion,
        updateQuestion,
        deleteQuestion
    };
}