import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { ExecutorService } from '../executor/executor.service';
import { Language } from '../executor/languages.config';

const executor = new ExecutorService();

export class SubmissionsService {
  async submit(data: {
    userAssessmentId: string;
    questionId: string;
    language: string;
    code: string;
  }) {
    const userAssessment = await prisma.userAssessment.findUnique({
      where: { id: data.userAssessmentId },
    });

    if (!userAssessment || userAssessment.status !== 'in_progress') {
      throw new AppError(400, 'INVALID_ASSESSMENT', 'Assessment not in progress');
    }

    const question = await prisma.question.findUnique({
      where: { id: data.questionId },
      include: { testCases: true },
    });

    if (!question) {
      throw new AppError(404, 'QUESTION_NOT_FOUND', 'Question not found');
    }

    const submission = await prisma.submission.create({
      data: {
        userAssessmentId: data.userAssessmentId,
        questionId: data.questionId,
        language: data.language,
        code: data.code,
        status: 'pending',
        totalTests: question.testCases.length,
        maxScore: question.testCases.reduce((sum, tc) => sum + tc.points, 0),
      },
    });

    this.evaluateSubmission(submission.id, question.testCases, data.language as Language, data.code);

    return submission;
  }

  private async evaluateSubmission(
    submissionId: string,
    testCases: any[],
    language: Language,
    code: string
  ) {
    try {
      await prisma.submission.update({
        where: { id: submissionId },
        data: { status: 'running' },
      });

      let totalScore = 0;
      let passedTests = 0;
      const results = [];

      for (const testCase of testCases) {
        const result = await executor.executeWithDocker(language, code, testCase.input);

        const passed = result.success && result.output.trim() === testCase.expectedOutput.trim();
        const pointsEarned = passed ? testCase.points : 0;

        if (passed) passedTests++;
        totalScore += pointsEarned;

        const submissionResult = await prisma.submissionResult.create({
          data: {
            submissionId,
            testCaseId: testCase.id,
            status: result.error ? 'error' : passed ? 'passed' : 'failed',
            actualOutput: result.output,
            executionTime: result.executionTime,
            errorMessage: result.error,
            pointsEarned,
          },
        });

        results.push(submissionResult);
      }

      await prisma.submission.update({
        where: { id: submissionId },
        data: {
          status: 'completed',
          score: totalScore,
          passedTests,
          evaluatedAt: new Date(),
        },
      });

      await this.updateUserAssessmentScore(submissionId);
    } catch (error) {
      await prisma.submission.update({
        where: { id: submissionId },
        data: {
          status: 'error',
          errorMessage: 'Evaluation failed',
        },
      });
    }
  }

  private async updateUserAssessmentScore(submissionId: string) {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      select: {
        userAssessmentId: true,
        questionId: true,
        score: true,
      },
    });

    if (!submission) return;

    const allSubmissions = await prisma.submission.findMany({
      where: {
        userAssessmentId: submission.userAssessmentId,
        status: 'completed',
      },
      select: {
        questionId: true,
        score: true,
      },
    });

    const bestScores = new Map<string, number>();
    allSubmissions.forEach(sub => {
      const current = bestScores.get(sub.questionId) || 0;
      if (sub.score > current) {
        bestScores.set(sub.questionId, sub.score);
      }
    });

    const totalScore = Array.from(bestScores.values()).reduce((sum, score) => sum + score, 0);

    await prisma.userAssessment.update({
      where: { id: submission.userAssessmentId },
      data: { score: totalScore },
    });
  }

  async getSubmission(id: string, userId: string, role: string) {
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        submissionResults: {
          include: {
            testCase: true,
          },
        },
        userAssessment: true,
      },
    });

    if (!submission) {
      throw new AppError(404, 'SUBMISSION_NOT_FOUND', 'Submission not found');
    }

    if (role !== 'admin' && submission.userAssessment.userId !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'Access denied');
    }

    if (role !== 'admin') {
      submission.submissionResults = submission.submissionResults.map(result => ({
        ...result,
        testCase: result.testCase.isHidden ? { ...result.testCase, input: '[Hidden]', expectedOutput: '[Hidden]' } : result.testCase,
      }));
    }

    return submission;
  }

  async getSubmissionHistory(userId: string) {
    const submissions = await prisma.submission.findMany({
      where: {
        userAssessment: {
          userId,
        },
      },
      include: {
        question: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
      take: 50,
    });

    return submissions;
  }

  async runCode(language: string, code: string, input: string) {
    const result = await executor.executeWithDocker(language as Language, code, input);
    return result;
  }
}
