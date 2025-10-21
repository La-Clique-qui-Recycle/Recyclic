import axiosClient from '../api/axiosClient';

// Types
export interface Permission {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  user_ids: string[];
  permission_ids: string[];
}

export interface GroupDetail {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  users: Array<{
    id: string;
    username?: string;
    first_name?: string;
    last_name?: string;
    role: string;
  }>;
  permissions: Permission[];
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
}

export interface AssignPermissionsRequest {
  permission_ids: string[];
}

export interface AssignUsersRequest {
  user_ids: string[];
}

export interface CreatePermissionRequest {
  name: string;
  description?: string;
}

export interface UpdatePermissionRequest {
  name?: string;
  description?: string;
}

class GroupService {
  // ============================================================================
  // Group Management
  // ============================================================================

  async listGroups(): Promise<Group[]> {
    const response = await axiosClient.get('/v1/admin/groups/');
    return response.data;
  }

  async getGroup(groupId: string): Promise<GroupDetail> {
    const response = await axiosClient.get(`/v1/admin/groups/${groupId}`);
    return response.data;
  }

  async createGroup(data: CreateGroupRequest): Promise<GroupDetail> {
    const response = await axiosClient.post('/v1/admin/groups/', data);
    return response.data;
  }

  async updateGroup(groupId: string, data: UpdateGroupRequest): Promise<GroupDetail> {
    const response = await axiosClient.put(`/v1/admin/groups/${groupId}`, data);
    return response.data;
  }

  async deleteGroup(groupId: string): Promise<void> {
    await axiosClient.delete(`/v1/admin/groups/${groupId}`);
  }

  // ============================================================================
  // Group Permissions Management
  // ============================================================================

  async assignPermissionsToGroup(
    groupId: string,
    data: AssignPermissionsRequest
  ): Promise<GroupDetail> {
    const response = await axiosClient.post(`/v1/admin/groups/${groupId}/permissions`, data);
    return response.data;
  }

  async removePermissionFromGroup(
    groupId: string,
    permissionId: string
  ): Promise<GroupDetail> {
    const response = await axiosClient.delete(
      `/v1/admin/groups/${groupId}/permissions/${permissionId}`
    );
    return response.data;
  }

  // ============================================================================
  // Group Users Management
  // ============================================================================

  async assignUsersToGroup(groupId: string, data: AssignUsersRequest): Promise<GroupDetail> {
    const response = await axiosClient.post(`/v1/admin/groups/${groupId}/users`, data);
    return response.data;
  }

  async removeUserFromGroup(groupId: string, userId: string): Promise<GroupDetail> {
    const response = await axiosClient.delete(`/v1/admin/groups/${groupId}/users/${userId}`);
    return response.data;
  }

  // ============================================================================
  // Permission Management
  // ============================================================================

  async listPermissions(): Promise<Permission[]> {
    const response = await axiosClient.get('/v1/admin/permissions/');
    return response.data;
  }

  async getPermission(permissionId: string): Promise<Permission> {
    const response = await axiosClient.get(`/v1/admin/permissions/${permissionId}`);
    return response.data;
  }

  async createPermission(data: CreatePermissionRequest): Promise<Permission> {
    const response = await axiosClient.post('/v1/admin/permissions/', data);
    return response.data;
  }

  async updatePermission(
    permissionId: string,
    data: UpdatePermissionRequest
  ): Promise<Permission> {
    const response = await axiosClient.put(`/v1/admin/permissions/${permissionId}`, data);
    return response.data;
  }

  async deletePermission(permissionId: string): Promise<void> {
    await axiosClient.delete(`/v1/admin/permissions/${permissionId}`);
  }
}

export const groupService = new GroupService();
export default groupService;
