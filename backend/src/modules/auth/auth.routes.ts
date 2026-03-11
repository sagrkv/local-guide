import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import { prisma } from '../../lib/prisma.js';

export async function authRoutes(fastify: FastifyInstance) {
  // POST /api/v1/auth/login
  fastify.post('/login', async (request, reply) => {
    const { email, password } = request.body as { email: string; password: string };

    if (!email || !password) {
      return reply.status(400).send({
        error: { message: 'Email and password are required' },
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        password: true,
        imageUrl: true,
      },
    });

    if (!user || !user.password) {
      return reply.status(401).send({
        error: { message: 'Invalid email or password' },
      });
    }

    if (!user.isActive) {
      return reply.status(403).send({
        error: { message: 'Account is deactivated' },
      });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return reply.status(401).send({
        error: { message: 'Invalid email or password' },
      });
    }

    // Sign JWT token
    const token = (fastify as any).jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      { expiresIn: '7d' }
    );

    return {
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          imageUrl: user.imageUrl,
        },
      },
    };
  });

  // POST /api/v1/auth/register (only if no users exist - initial setup)
  fastify.post('/register', async (request, reply) => {
    const { email, password, name } = request.body as {
      email: string;
      password: string;
      name: string;
    };

    if (!email || !password || !name) {
      return reply.status(400).send({
        error: { message: 'Email, password, and name are required' },
      });
    }

    // Only allow registration if no users exist (initial setup)
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      return reply.status(403).send({
        error: { message: 'Registration is disabled. Contact an admin.' },
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'ADMIN',
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        imageUrl: true,
      },
    });

    const token = (fastify as any).jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      { expiresIn: '7d' }
    );

    return {
      data: {
        token,
        user,
      },
    };
  });

  // GET /api/v1/auth/me
  fastify.get('/me', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const userRequest = request as any;

    const user = await prisma.user.findUnique({
      where: { id: userRequest.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        imageUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    return { data: { user } };
  });
}
