import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkQuestion(id: string) {
  try {
    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        testCases: {
          include: {
            submissionResults: true
          }
        },
        submissions: true
      }
    });

    if (!question) {
      console.log('Question not found');
      return;
    }

    console.log(`Question: ${question.title}`);
    console.log(`Submissions: ${question.submissions.length}`);
    
    for (const tc of question.testCases) {
      console.log(`TestCase ${tc.id}: ${tc.submissionResults.length} results`);
    }

    // Try to simulate the deleteMany in a dry-run style (or just report)
    const linkedResults = question.testCases.reduce((acc, tc) => acc + tc.submissionResults.length, 0);
    if (linkedResults > 0) {
      console.log(`\nCRITICAL: Found ${linkedResults} submission results linked to these test cases.`);
      console.log('Deleting these test cases WILL fail because SubmissionResult -> TestCase relation is set to RESTRICT by default.');
    } else {
      console.log('\nNo submission results linked to these test cases. Deletion should work.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

const qId = process.argv[2];
if (!qId) {
  console.log('Please provide a question ID');
} else {
  checkQuestion(qId);
}
