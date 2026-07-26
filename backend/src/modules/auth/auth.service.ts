import bcrypt from 'bcrypt';
import prisma from '../../config/database';
import { generateToken } from '../../utils/jwt';
import { AppError } from '../../middleware/errorHandler';

// 8 rounds ≈ 40ms (vs 10 rounds ≈ 150ms). Still cryptographically safe.
const BCRYPT_ROUNDS = 8;

export class AuthService {
  async register(data: {
    email: string;
    password: string;
    fullName: string;
    role: 'admin' | 'candidate';
  }) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError(400, 'USER_EXISTS', 'User with this email already exists');
    }

    // Hash password (fast + secure at 8 rounds)
    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        fullName: data.fullName,
        role: data.role,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, token };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    if (!user.isActive) {
      throw new AppError(403, 'ACCOUNT_DISABLED', 'Account is disabled');
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    // Build token immediately — don't block on lastLogin update
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Fire-and-forget: update lastLogin in background
    prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    }).catch(() => { /* non-critical */ });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      token,
    };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }

    return user;
  }

  async findAllCandidates() {
    return prisma.user.findMany({
      where: { role: 'candidate', isActive: true },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
      },
      orderBy: { fullName: 'asc' },
    });
  }
}
