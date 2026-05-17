/**
 * Role-Based Access Control (RBAC) System
 * Defines roles, permissions, and provides authorization checking
 * 
 * Roles:
 * - user: Standard user with personal workspace access
 * - admin: Full system access
 * - agent: Service accounts for agent execution
 * - service: Service-to-service authentication
 * 
 * Permissions: 12 granular permissions for fine-grained access control
 */

export type Role = 'user' | 'admin' | 'agent' | 'service';

export type Permission =
  | 'read:profile'
  | 'write:profile'
  | 'read:workflows'
  | 'write:workflows'
  | 'execute:workflows'
  | 'read:agents'
  | 'manage:agents'
  | 'read:users'
  | 'manage:users'
  | 'manage:system'
  | 'read:analytics'
  | 'write:analytics';

/**
 * Role-to-Permission mapping
 * Defines what each role can do
 */
const rolePermissions: Record<Role, Permission[]> = {
  user: [
    'read:profile',
    'write:profile',
    'read:workflows',
    'write:workflows',
    'execute:workflows',
    'read:agents',
    'read:analytics'
  ],
  admin: [
    // Admin has all permissions
    'read:profile',
    'write:profile',
    'read:workflows',
    'write:workflows',
    'execute:workflows',
    'read:agents',
    'manage:agents',
    'read:users',
    'manage:users',
    'manage:system',
    'read:analytics',
    'write:analytics'
  ],
  agent: [
    'execute:workflows',
    'read:workflows',
    'read:agents'
  ],
  service: [
    // Service-to-service has limited API-only permissions
    'read:workflows',
    'execute:workflows',
    'read:agents'
  ]
};

/**
 * RBAC Service
 * Handles authorization checks and permission validation
 */
export class RBACService {
  /**
   * Check if user has specific permission
   */
  static hasPermission(
    userRole: Role,
    requiredPermission: Permission
  ): boolean {
    const permissions = rolePermissions[userRole];
    return permissions.includes(requiredPermission);
  }

  /**
   * Check if user has any of multiple permissions
   */
  static hasAnyPermission(
    userRole: Role,
    requiredPermissions: Permission[]
  ): boolean {
    return requiredPermissions.some(permission =>
      this.hasPermission(userRole, permission)
    );
  }

  /**
   * Check if user has all of multiple permissions
   */
  static hasAllPermissions(
    userRole: Role,
    requiredPermissions: Permission[]
  ): boolean {
    return requiredPermissions.every(permission =>
      this.hasPermission(userRole, permission)
    );
  }

  /**
   * Get all permissions for a role
   */
  static getPermissions(userRole: Role): Permission[] {
    return [...rolePermissions[userRole]];
  }

  /**
   * Check if user can perform action on resource
   * Supports hierarchical resource ownership
   */
  static canAccessResource(
    userRole: Role,
    userId: string,
    resourceOwnerId: string,
    requiredPermission: Permission
  ): boolean {
    // Admins can access any resource
    if (userRole === 'admin') {
      return this.hasPermission(userRole, requiredPermission);
    }

    // Users can only access their own resources (for personal data)
    if (resourceOwnerId !== userId && this.isPersonalPermission(requiredPermission)) {
      return false;
    }

    // Check base permission
    return this.hasPermission(userRole, requiredPermission);
  }

  /**
   * Check if permission is for personal data
   */
  private static isPersonalPermission(permission: Permission): boolean {
    return [
      'read:profile',
      'write:profile'
    ].includes(permission);
  }

  /**
   * Get role description for UI/documentation
   */
  static getRoleDescription(role: Role): string {
    const descriptions: Record<Role, string> = {
      user: 'Standard user with personal workspace access',
      admin: 'Administrator with full system access',
      agent: 'Service account for agent execution',
      service: 'Service-to-service authentication'
    };
    return descriptions[role];
  }

  /**
   * Get permission description for UI/documentation
   */
  static getPermissionDescription(permission: Permission): string {
    const descriptions: Record<Permission, string> = {
      'read:profile': 'View user profile information',
      'write:profile': 'Update user profile information',
      'read:workflows': 'View workflows and their details',
      'write:workflows': 'Create and modify workflows',
      'execute:workflows': 'Execute and manage workflow runs',
      'read:agents': 'View agents and their status',
      'manage:agents': 'Create, configure, and manage agents',
      'read:users': 'View all users in the system',
      'manage:users': 'Create, modify, and delete user accounts',
      'manage:system': 'Configure system settings and security',
      'read:analytics': 'View analytics and reports',
      'write:analytics': 'Configure analytics and reporting'
    };
    return descriptions[permission];
  }

  /**
   * Validate role (useful for input validation)
   */
  static isValidRole(role: unknown): role is Role {
    return ['user', 'admin', 'agent', 'service'].includes(role as string);
  }

  /**
   * Validate permission (useful for input validation)
   */
  static isValidPermission(permission: unknown): permission is Permission {
    const validPermissions: Permission[] = [
      'read:profile',
      'write:profile',
      'read:workflows',
      'write:workflows',
      'execute:workflows',
      'read:agents',
      'manage:agents',
      'read:users',
      'manage:users',
      'manage:system',
      'read:analytics',
      'write:analytics'
    ];
    return validPermissions.includes(permission as Permission);
  }

  /**
   * Get all available roles (for UI dropdowns, etc)
   */
  static getAllRoles(): Role[] {
    return ['user', 'admin', 'agent', 'service'];
  }

  /**
   * Get all available permissions (for UI, documentation)
   */
  static getAllPermissions(): Permission[] {
    return [
      'read:profile',
      'write:profile',
      'read:workflows',
      'write:workflows',
      'execute:workflows',
      'read:agents',
      'manage:agents',
      'read:users',
      'manage:users',
      'manage:system',
      'read:analytics',
      'write:analytics'
    ];
  }

  /**
   * Check if a role can be assigned
   * (prevents privilege escalation if needed)
   */
  static canAssignRole(
    assignerRole: Role,
    targetRole: Role
  ): boolean {
    // Only admins can assign roles
    if (assignerRole !== 'admin') {
      return false;
    }

    // Admins cannot assign higher roles (prevent privilege escalation)
    // In this case, all roles are equivalent at admin level
    return true;
  }

  /**
   * Create custom permission set for specific use case
   * Example: create 'editor' role with specific permissions
   */
  static createCustomRole(
    roleName: string,
    permissions: Permission[]
  ): Record<string, Permission[]> {
    // Validate all permissions
    if (!permissions.every(p => this.isValidPermission(p))) {
      throw new Error('Invalid permission in custom role');
    }

    return {
      [roleName]: permissions
    };
  }
}

/**
 * Express middleware factory for permission checking
 */
export const checkPermission = (requiredPermission: Permission) => {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_FAILED',
          message: 'Authentication required',
          timestamp: new Date().toISOString(),
          requestId: req.id
        }
      });
    }

    if (!RBACService.hasPermission(req.user.role, requiredPermission)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: `Permission '${requiredPermission}' required`,
          timestamp: new Date().toISOString(),
          requestId: req.id
        }
      });
    }

    next();
  };
};

/**
 * Express middleware factory for resource ownership checking
 */
export const checkResourceAccess = (
  requiredPermission: Permission,
  getResourceOwnerId: (req: any) => string
) => {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_FAILED',
          message: 'Authentication required',
          timestamp: new Date().toISOString(),
          requestId: req.id
        }
      });
    }

    const resourceOwnerId = getResourceOwnerId(req);
    const hasAccess = RBACService.canAccessResource(
      req.user.role,
      req.user.id,
      resourceOwnerId,
      requiredPermission
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Access to this resource denied',
          timestamp: new Date().toISOString(),
          requestId: req.id
        }
      });
    }

    next();
  };
};

export default RBACService;
