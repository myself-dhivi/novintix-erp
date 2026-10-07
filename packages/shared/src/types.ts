export type ApiSuccess<T> = { success: true; message?: string; data: T };
export type ApiFailure = { success: false; message: string; errors?: Record<string, string[]> };
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  role: string;
  permissions: string[];
};
