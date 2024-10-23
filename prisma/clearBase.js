const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteAllQuestions() {
    await prisma.option.deleteMany({});
    await prisma.answer.deleteMany({});
    await prisma.question.deleteMany({});
    await prisma.survey.deleteMany({});
}

deleteAllQuestions()
    .then(() => console.log("All questions deleted"))
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
