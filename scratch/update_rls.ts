import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Updating PostgreSQL RLS Policies to PERMISSIVE...');

  await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS projects_bd_isolation ON "projects";`);
  await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS projects_engineer_isolation ON "projects";`);
  await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS projects_admin_all ON "projects";`);

  await prisma.$executeRawUnsafe(`
    CREATE POLICY projects_bd_isolation ON "projects"
    FOR ALL TO PUBLIC
    USING (
      current_setting('app.current_user_role', TRUE) = 'BD_AGENT'
      AND "bd_agent_id" = current_setting('app.current_user_id', TRUE)::UUID
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE POLICY projects_engineer_isolation ON "projects"
    FOR ALL TO PUBLIC
    USING (
      current_setting('app.current_user_role', TRUE) IN ('ESTIMATION_ENGINEER','DESIGN_ENGINEER')
      AND "assigned_to" = current_setting('app.current_user_id', TRUE)::UUID
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE POLICY projects_admin_all ON "projects"
    FOR ALL TO PUBLIC
    USING (
      current_setting('app.current_user_role', TRUE) = 'ADMIN'
    );
  `);

  await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS project_files_bd_isolation ON "project_files";`);
  await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS project_files_engineer_isolation ON "project_files";`);
  await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS project_files_admin_all ON "project_files";`);

  await prisma.$executeRawUnsafe(`
    CREATE POLICY project_files_bd_isolation ON "project_files"
    FOR ALL TO PUBLIC
    USING (
      current_setting('app.current_user_role', TRUE) = 'BD_AGENT'
      AND "project_id" IN (
        SELECT id FROM "projects"
        WHERE "bd_agent_id" = current_setting('app.current_user_id', TRUE)::UUID
      )
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE POLICY project_files_engineer_isolation ON "project_files"
    FOR ALL TO PUBLIC
    USING (
      current_setting('app.current_user_role', TRUE) IN ('ESTIMATION_ENGINEER','DESIGN_ENGINEER')
      AND "project_id" IN (
        SELECT id FROM "projects"
        WHERE "assigned_to" = current_setting('app.current_user_id', TRUE)::UUID
      )
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE POLICY project_files_admin_all ON "project_files"
    FOR ALL TO PUBLIC
    USING (current_setting('app.current_user_role', TRUE) = 'ADMIN');
  `);

  console.log('✓ Successfully applied PERMISSIVE RLS policies to PostgreSQL database!');
}

main()
  .catch((e) => {
    console.error('Error updating RLS:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
