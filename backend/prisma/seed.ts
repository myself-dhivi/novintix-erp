import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { PERMISSIONS } from '@novintix/shared';

const prisma = new PrismaClient();

async function main() {
  const permissions = await Promise.all(
    PERMISSIONS.map((name) =>
      prisma.permission.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  );
  const rolePolicies: Record<string, (name: string) => boolean> = {
    SUPER_ADMIN: () => true,
    ADMIN: (name) => !name.startsWith('role.'),
    SALES_MANAGER: (name) =>
      name === 'dashboard.view' ||
      name.startsWith('lead.') ||
      name.startsWith('followup.') ||
      name.startsWith('file.'),
    SALES_EXECUTIVE: (name) =>
      [
        'dashboard.view',
        'lead.view',
        'lead.create',
        'lead.update',
        'followup.view',
        'followup.create',
        'followup.update',
        'file.view',
        'file.upload',
        'file.download',
      ].includes(name),
    HR_MANAGER: (name) =>
      name === 'dashboard.view' ||
      name.startsWith('recruitment.') ||
      name.startsWith('candidate.') ||
      name.startsWith('file.'),
    RECRUITER: (name) =>
      [
        'dashboard.view',
        'recruitment.view',
        'candidate.create',
        'candidate.update',
        'candidate.move_stage',
        'file.view',
        'file.upload',
        'file.download',
      ].includes(name),
    FINANCE_MANAGER: (name) =>
      name === 'dashboard.view' || name.startsWith('finance.') || name.startsWith('file.'),
    ACCOUNTANT: (name) =>
      [
        'dashboard.view',
        'finance.view',
        'finance.create',
        'finance.update',
        'file.view',
        'file.upload',
        'file.download',
      ].includes(name),
    VIEWER: (name) => name.endsWith('.view') || name === 'file.download',
  };
  const roles = new Map<string, { id: string }>();
  for (const [name, policy] of Object.entries(rolePolicies)) {
    const role = await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name, description: `${name.replaceAll('_', ' ')} access` },
    });
    roles.set(name, role);
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: permissions
        .filter((permission) => policy(permission.name))
        .map((permission) => ({ roleId: role.id, permissionId: permission.id })),
    });
  }
  const role = roles.get('SUPER_ADMIN')!;
  const passwordHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!', 12);
  await prisma.user.upsert({
    where: { email: process.env.SEED_ADMIN_EMAIL ?? 'admin@novintix.local' },
    update: { roleId: role.id },
    create: {
      email: process.env.SEED_ADMIN_EMAIL ?? 'admin@novintix.local',
      passwordHash,
      firstName: 'System',
      lastName: 'Administrator',
      roleId: role.id,
    },
  });
}

main().finally(() => prisma.$disconnect());
