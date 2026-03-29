import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export class AssessmentsService {
  async create(data: any, userId: string) {
    const { questions, ...assessmentData } = data;

    const totalScore = questions.reduce((sum: number, q: any) => sum + q.points, 0);

    const assessment = await prisma.assessment.create({
      data: {
        ...assessmentData,
        totalScore,
        createdById: userId,
        assessmentQuestions: {
          create: questions.map((q: any, index: number) => ({
            questionId: q.questionId,
            points: q.points,
            orderIndex: index + 1,
          })),
        },
      },
      include: {
        assessmentQuestions: {
          include: { question: true },
        },
      },
    });

    return assessment;
  }

  async findAll(userId?: string, role?: string) {
    const where: any = { isActive: true };

    if (role === 'candidate' && userId) {
      return prisma.assessment.findMany({
        where: { isActive: true },
        include: {
          userAssessments: {
            where: { userId },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return prisma.assessment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        assessmentQuestions: {
          include: {
            question: {
              select: {
                id: true,
                title: true,
                difficulty: true,
                timeLimit: true,
                memoryLimit: true,
              },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!assessment) {
      throw new AppError(404, 'ASSESSMENT_NOT_FOUND', 'Assessment not found');
    }

    return assessment;
  }

  async assignToUsers(assessmentId: string, userIds: string[]) {
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: { totalScore: true },
    });

    if (!assessment) {
      throw new AppError(404, 'ASSESSMENT_NOT_FOUND', 'Assessment not found');
    }

    const userAssessments = await prisma.userAssessment.createMany({
      data: userIds.map(userId => ({
        userId,
        assessmentId,
        maxScore: assessment.totalScore,
      })),
      skipDuplicates: true,
    });

    return userAssessments;
  }

  async startAssessment(assessmentId: string, userId: string) {
    let userAssessment = await prisma.userAssessment.findUnique({
      where: {
        userId_assessmentId: { userId, assessmentId },
      },
      include: {
        assessment: {
          include: {
            assessmentQuestions: {
              include: {
                question: {
                  include: {
                    testCases: {
                      where: { isHidden: false },
                    },
                  },
                },
              },
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
      },
    });

    if (!userAssessment) {
      const assessmentData = await prisma.assessment.findUnique({
        where: { id: assessmentId }
      });
      if (!assessmentData) {
        throw new AppError(404, 'ASSESSMENT_NOT_FOUND', 'Assessment not found');
      }

      await prisma.userAssessment.create({
        data: {
          userId,
          assessmentId,
          maxScore: assessmentData.totalScore || 0,
        }
      });

      // Refetch with all nesting
      userAssessment = (await prisma.userAssessment.findUnique({
        where: { userId_assessmentId: { userId, assessmentId } },
        include: {
          assessment: {
            include: {
              assessmentQuestions: {
                include: {
                  question: {
                    include: {
                      testCases: { where: { isHidden: false } }
                    }
                  }
                },
                orderBy: { orderIndex: 'asc' }
              }
            }
          }
        }
      }))!;
    }

    if (userAssessment.status !== 'not_started') {
      // Allow re-opening an already started/completed assessment session.
      // Frontend can use this for "continue" flows.
      return userAssessment;
    }

    const updated = await prisma.userAssessment.update({
      where: { id: userAssessment.id },
      data: {
        status: 'in_progress',
        startedAt: new Date(),
      },
      include: {
        assessment: {
          include: {
            assessmentQuestions: {
              include: {
                question: {
                  include: {
                    testCases: {
                      where: { isHidden: false },
                    },
                  },
                },
              },
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
      },
    });

    return updated;
  }

  async getResults(assessmentId: string) {
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: {
        id: true,
        title: true,
        passingScore: true,
        totalScore: true,
      },
    });

    if (!assessment) {
      throw new AppError(404, 'ASSESSMENT_NOT_FOUND', 'Assessment not found');
    }

    const userAssessments = await prisma.userAssessment.findMany({
      where: { assessmentId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: [
        { score: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    return {
      assessment,
      rows: userAssessments.map((ua) => ({
        userAssessmentId: ua.id,
        userId: ua.userId,
        candidateName: ua.user.fullName,
        candidateEmail: ua.user.email,
        status: ua.status,
        score: ua.score,
        maxScore: ua.maxScore || assessment.totalScore || 0,
        passed: ua.score >= assessment.passingScore,
        startedAt: ua.startedAt,
        completedAt: ua.completedAt,
      })),
    };
  }

  async updateTabSwitches(userAssessmentId: string, userId: string) {
    const userAssessment = await prisma.userAssessment.findUnique({
      where: { id: userAssessmentId },
    });

    if (!userAssessment || userAssessment.userId !== userId) {
      throw new AppError(404, 'ASSESSMENT_NOT_FOUND', 'Assessment not found');
    }

    const updated = await prisma.userAssessment.update({
      where: { id: userAssessmentId },
      data: {
        tabSwitches: { increment: 1 },
      },
    });

    return updated;
  }
}
