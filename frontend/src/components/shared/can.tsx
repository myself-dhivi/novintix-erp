'use client';
import { usePermission } from '@/features/auth/auth-provider';
export function Can({ permission, children }: { permission: string; children: React.ReactNode }) {
  return usePermission(permission) ? children : null;
}
