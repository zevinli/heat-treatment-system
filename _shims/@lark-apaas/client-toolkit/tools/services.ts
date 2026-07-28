// Type and class exports for business service types

export interface UserInfo { id: string; name: string; avatar?: string; }
export interface SearchAvatar { url?: string; }
export interface DepartmentInfo {
  id: string;
  name: string;
  departmentID?: string;
  larkDepartmentID?: string;
  zh_cn?: string;
  en_us?: string;
}

// Department service - class
export class DepartmentService {
  static async search(params?: any): Promise<SearchDepartmentsResponse> {
    return { items: [], total: 0 };
  }
}

export interface SearchDepartmentsParams {
  keyword?: string;
  page?: number;
  pageSize?: number;
  query?: string;
}

export interface SearchDepartmentsResponse {
  items: DepartmentInfo[];
  total: number;
  data?: any[];
}

// User profile service - class
export class UserProfileService {
  static async get(id?: string): Promise<any> { return {}; }
  static async update(id?: string, data?: any): Promise<any> { return {}; }
}

export function getAssetsUrl(path: string): string { return path; }

export enum AccountType {
  PERSONAL = 'personal',
  ENTERPRISE = 'enterprise',
  APAAS = 'apaas',
}

export interface UserProfileData {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
}

// User service - class
export class UserService {
  static async search(params?: any): Promise<SearchUsersResponse> {
    return { items: [], total: 0 };
  }
  static async batchGet(ids?: string[]): Promise<BatchGetUsersResponse> {
    return { users: [] };
  }
}

export interface SearchUsersParams {
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface SearchUsersResponse {
  items: UserInfo[];
  total: number;
  data?: any[];
}

export interface BatchGetUsersResponse {
  users: UserInfo[];
  data?: UserInfo[];
}
