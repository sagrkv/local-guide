import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Webhook } from 'svix';
import { prisma } from '../../lib/prisma.js';
import { auditService, AuditActions, AuditResources } from '../audit/audit.service.js';

// Clerk webhook event types
interface ClerkUserEvent {
  data: {
    id: string;
    email_addresses: Array<{
      id: string;
      email_address: string;
    }>;
    primary_email_address_id: string;
    first_name: string | null;
    last_name: string | null;
    image_url: string | null;
    created_at: number;
    updated_at: number;
  };
  object: 'event';
  type: 'user.created' | 'user.updated' | 'user.deleted';
}

/**
 * Verify Clerk webhook signature
 */
function verifyWebhookSignature(
  payload: string,
  headers: {
    'svix-id': string;
    'svix-timestamp': string;
    'svix-signature': string;
  }
): boolean {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('CLERK_WEBHOOK_SECRET is not set');
    return false;
  }

  try {
    const wh = new Webhook(webhookSecret);
    wh.verify(payload, {
      'svix-id': headers['svix-id'],
      'svix-timestamp': headers['svix-timestamp'],
      'svix-signature': headers['svix-signature'],
    });
    return true;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return false;
  }
}

/**
 * Get primary email from Clerk user data
 */
function getPrimaryEmail(userData: ClerkUserEvent['data']): string | null {
  const primaryEmailObj = userData.email_addresses.find(
    (email) => email.id === userData.primary_email_address_id
  );
  return primaryEmailObj?.email_address ?? null;
}

/**
 * Get full name from Clerk user data
 */
function getFullName(userData: ClerkUserEvent['data']): string {
  const parts = [userData.first_name, userData.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : 'User';
}

/**
 * Handle user.created event
 * Creates a new user in the local database or links to existing user by email
 */
async function handleUserCreated(event: ClerkUserEvent): Promise<void> {
  const { data } = event;
  const clerkId = data.id;
  const email = getPrimaryEmail(data);
  const name = getFullName(data);
  const imageUrl = data.image_url;

  if (!email) {
    console.error('User created without email:', clerkId);
    return;
  }

  // Check if user already exists by email (migration case)
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    // Link existing user to Clerk ID
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        clerkId,
        imageUrl,
        // Update name only if current name is generic
        ...(existingUser.name === 'User' ? { name } : {}),
      },
    });

    await auditService.logAction({
      userId: existingUser.id,
      action: AuditActions.USER_LINKED_TO_CLERK,
      resource: AuditResources.USER,
      resourceId: existingUser.id,
      details: { clerkId, email },
      success: true,
    });

    console.log(`Linked existing user ${existingUser.id} to Clerk ID ${clerkId}`);
    return;
  }

  // Create new user
  const newUser = await prisma.user.create({
    data: {
      clerkId,
      email,
      name,
      imageUrl,
      role: 'SALES_REP', // Default role for new users
      isActive: true,
      creditBalance: 0,
    },
  });

  await auditService.logAction({
    userId: newUser.id,
    action: AuditActions.USER_CREATED,
    resource: AuditResources.USER,
    resourceId: newUser.id,
    details: { clerkId, email, source: 'clerk_webhook' },
    success: true,
  });

  console.log(`Created new user ${newUser.id} from Clerk ID ${clerkId}`);
}

/**
 * Handle user.updated event
 * Syncs user data from Clerk to local database
 */
async function handleUserUpdated(event: ClerkUserEvent): Promise<void> {
  const { data } = event;
  const clerkId = data.id;
  const email = getPrimaryEmail(data);
  const name = getFullName(data);
  const imageUrl = data.image_url;

  // Find user by Clerk ID
  const user = await prisma.user.findUnique({
    where: { clerkId },
  });

  if (!user) {
    console.warn(`User with Clerk ID ${clerkId} not found for update`);
    // User might not exist yet, try to create
    await handleUserCreated(event);
    return;
  }

  // Update user data
  await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(email ? { email } : {}),
      name,
      imageUrl,
    },
  });

  await auditService.logAction({
    userId: user.id,
    action: AuditActions.USER_UPDATED,
    resource: AuditResources.USER,
    resourceId: user.id,
    details: { clerkId, updatedFields: ['email', 'name', 'imageUrl'] },
    success: true,
  });

  console.log(`Updated user ${user.id} from Clerk ID ${clerkId}`);
}

/**
 * Handle user.deleted event
 * Soft-deletes the user in the local database
 */
async function handleUserDeleted(event: ClerkUserEvent): Promise<void> {
  const { data } = event;
  const clerkId = data.id;

  // Find user by Clerk ID
  const user = await prisma.user.findUnique({
    where: { clerkId },
  });

  if (!user) {
    console.warn(`User with Clerk ID ${clerkId} not found for deletion`);
    return;
  }

  // Soft delete by deactivating the user
  await prisma.user.update({
    where: { id: user.id },
    data: {
      isActive: false,
      deletedAt: new Date(),
      deleteRequestedAt: new Date(),
    },
  });

  await auditService.logAction({
    userId: user.id,
    action: AuditActions.USER_DELETED,
    resource: AuditResources.USER,
    resourceId: user.id,
    details: { clerkId, source: 'clerk_webhook' },
    success: true,
  });

  console.log(`Soft-deleted user ${user.id} from Clerk ID ${clerkId}`);
}

/**
 * Register Clerk webhook routes
 */
export async function clerkWebhookRoutes(fastify: FastifyInstance) {
  // Clerk webhook endpoint
  fastify.post(
    '/clerk-webhook',
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Get raw body for signature verification
      const payload = JSON.stringify(request.body);

      // Get Svix headers
      const svixId = request.headers['svix-id'] as string;
      const svixTimestamp = request.headers['svix-timestamp'] as string;
      const svixSignature = request.headers['svix-signature'] as string;

      if (!svixId || !svixTimestamp || !svixSignature) {
        return reply.status(400).send({ error: 'Missing Svix headers' });
      }

      // Verify webhook signature
      const isValid = verifyWebhookSignature(payload, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      });

      if (!isValid) {
        return reply.status(401).send({ error: 'Invalid webhook signature' });
      }

      // Process the event
      const event = request.body as ClerkUserEvent;

      try {
        switch (event.type) {
          case 'user.created':
            await handleUserCreated(event);
            break;
          case 'user.updated':
            await handleUserUpdated(event);
            break;
          case 'user.deleted':
            await handleUserDeleted(event);
            break;
          default:
            console.log(`Unhandled Clerk event type: ${(event as any).type}`);
        }

        return { received: true };
      } catch (error) {
        console.error('Error processing Clerk webhook:', error);
        // Return 200 to prevent Clerk from retrying
        // Log the error for investigation
        return { received: true, error: 'Processing error logged' };
      }
    }
  );
}

// Add audit action types for Clerk events
declare module '../audit/audit.service.js' {
  interface AuditActionsType {
    USER_LINKED_TO_CLERK: string;
  }
}
