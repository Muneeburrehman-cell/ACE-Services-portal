import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Run a callback inside a transaction that first sets the PostgreSQL
   * session variables used by Row-Level Security policies:
   *   app.current_user_id  — the authenticated user's UUID
   *   app.current_user_role — the authenticated user's role string
   *
   * This is the single place where RLS context is injected. Every
   * service method that queries role-isolated tables (projects,
   * project_files, deliverables, chat_messages, notifications) must
   * call this wrapper instead of using `this.prisma` directly.
   */
  async withRlsContext<T>(
    userId: string,
    userRole: string,
    fn: (tx: Omit<PrismaService, 'withRlsContext' | '$on' | '$transaction' | '$connect' | '$disconnect' | '$use' | '$extends'>) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `SET LOCAL app.current_user_id = '${userId.replace(/'/g, '')}'`,
      );
      await tx.$executeRawUnsafe(
        `SET LOCAL app.current_user_role = '${userRole.replace(/'/g, '')}'`,
      );
      return fn(tx as any);
    });
  }
}
