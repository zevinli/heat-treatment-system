// Type and class exports for business service types

export interface LocalizedText { zh_cn: string; en_us: string; }
export interface UserInfo {
  id?: string;
  userID: string;
  larkUserID: string;
  name: LocalizedText;
  avatar: any;
  userType: '_employee' | '_externalUser' | '_anonymousUser';
  department: DepartmentInfo;
}
export interface SearchAvatar { avatar: { image?: { large?: string } }; }
export interface DepartmentInfo {
  id?: string;
  name: LocalizedText;
  departmentID: string;
  larkDepartmentID: string;
}

// Department service - class
export class DepartmentService {
  static async search(params?: any): Promise<SearchDepartmentsResponse> {
    return { items: [], total: 0 };
  }
  async searchDepartments(params?: SearchDepartmentsParams): Promise<SearchDepartmentsResponse> {
    return DepartmentService.search(params);
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
  data?: { departmentList: DepartmentInfo[] };
}

// User profile service - class
export class UserProfileService {
  static async get(id?: string): Promise<any> { return {}; }
  static async update(id?: string, data?: any): Promise<any> { return {}; }
  async getUserProfile(_id?: string, _accountType?: AccountType, _signal?: AbortSignal): Promise<UserProfileData> {
    return {
      id: _id || '',
      name: '',
      useLarkCard: false,
      userProfileInfo: { userStatus: 0, userType: '_employee' },
    };
  }
}

export function getAssetsUrl(path: string): string { return path; }

export type AccountType = 'apaas' | 'lark' | 'personal' | 'enterprise';

interface UserProfileBase {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
}
export type UserProfileData = UserProfileBase & ({
  useLarkCard: false;
  userProfileInfo: {
    name?: string;
    avatar?: string;
    email?: string;
    userStatus: 0 | 1 | 2 | 3 | 4;
    userType: '_employee' | '_externalUser';
  };
} | {
  useLarkCard: true;
  larkCardParam: {
    needRedirect?: boolean;
    redirectURL?: string;
    larkAppID: string;
    jsAPITicket: string;
    larkOpenID: string;
    targetLarkOpenID: string;
  };
});

// User service - class
export class UserService {
  static async search(params?: any): Promise<SearchUsersResponse> {
    return { items: [], total: 0 };
  }
  static async batchGet(ids?: string[]): Promise<BatchGetUsersResponse> {
    return { users: [], data: { userInfoMap: {} } };
  }
  async searchUsers(params?: SearchUsersParams): Promise<SearchUsersResponse> {
    return UserService.search(params);
  }
  async listUsersByIds(ids?: string[]): Promise<BatchGetUsersResponse> {
    return UserService.batchGet(ids);
  }
}

export interface SearchUsersParams {
  keyword?: string;
  page?: number;
  pageSize?: number;
  query?: string;
}

export interface SearchUsersResponse {
  items: UserInfo[];
  total: number;
  data?: { userList: Array<UserInfo & { avatar?: string }> };
}

export interface BatchGetUsersResponse {
  users: UserInfo[];
  data?: { userInfoMap: Record<string, UserInfo & SearchAvatar> };
}
