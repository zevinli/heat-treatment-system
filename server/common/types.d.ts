// Extend Express Request to include properties set by tenant middleware
declare namespace Express {
  interface Request {
    userContext?: {
      userId?: string;
      userName?: string;
      orgCode?: string;
      orgRole?: string;
      accountRole?: string;
      businessRole?: string;
      userRole?: string;
      permissions?: string[];
      tokenId?: string;
    };
    organizationId?: string;
    __platform_data__?: Record<string, any>;
  }
}
