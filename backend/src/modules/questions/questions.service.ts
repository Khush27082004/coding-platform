import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export class QuestionsService {
  async create(data: any, userId: string) {
    const { testCases, ...questionData } = data;

    const question = await prisma.question.create({
      data: {
        ...questionData,
        createdById: userId,
        testCases: {
          create: testCases.map((tc: any, index: number) => ({
            ...tc,
            orderIndex: index + 1,
          })),
        },
      },
      include: {
        testCases: true,
      },
    });

    return question;
  }

  async findAll(filters: {
    page?: number;
    limit?: number;
    difficulty?: string;
    tags?: string[];
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };
    
    if (filters.difficulty) {
      where.difficulty = filters.difficulty;
    }
    
    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          difficulty: true,
          tags: true,
          createdAt: true,
        },
      }),
      prisma.question.count({ where }),
    ]);

    return {
      data: questions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, includeHidden = false) {
    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        testCases: {
          where: includeHidden ? {} : { isHidden: false },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!question) {
      throw new AppError(404, 'QUESTION_NOT_FOUND', 'Question not found');
    }

    // Performance optimization: fetch next/prev IDs in parallel
    const [nextQ, prevQ] = await Promise.all([
      prisma.question.findFirst({
        where: { isActive: true, createdAt: { lt: question.createdAt } },
        orderBy: { createdAt: 'desc' },
        select: { id: true }
      }),
      prisma.question.findFirst({
        where: { isActive: true, createdAt: { gt: question.createdAt } },
        orderBy: { createdAt: 'asc' },
        select: { id: true }
      })
    ]);

    return {
      ...question,
      nextId: nextQ?.id || null,
      prevId: prevQ?.id || null
    };
  }

  async update(id: string, data: any) {
    const { testCases, ...updateData } = data;

    // Update question fields
    const question = await prisma.question.update({
      where: { id },
      data: updateData,
      include: {
        testCases: true,
      },
    });

    // If testCases are provided, update them
    if (testCases && testCases.length > 0) {
      // Delete old test cases
      await prisma.testCase.deleteMany({
        where: { questionId: id },
      });

      // Create new test cases
      await prisma.testCase.createMany({
        data: testCases.map((tc: any, index: number) => ({
          questionId: id,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isHidden: tc.isHidden || false,
          points: tc.points || 10,
          orderIndex: index + 1,
        })),
      });
    }

    // Fetch updated question with test cases
    const updatedQuestion = await prisma.question.findUnique({
      where: { id },
      include: {
        testCases: true,
      },
    });

    return updatedQuestion;
  }

  async delete(id: string) {
    await prisma.question.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
