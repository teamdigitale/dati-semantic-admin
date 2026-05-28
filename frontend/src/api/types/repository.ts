export interface Repository {
  id: string
  url: string
  branch?: string
  name?: string
  description?: string
  owner?: string
  active?: boolean
  createdAt?: string
  createdBy?: string
  updatedAt?: string
  updatedBy?: string
}

export interface CreateRepositoryRequest {
  url: string
  branch?: string
  name?: string
  description?: string
  maxFileSizeBytes?: number
}

export interface UpdateRepositoryRequest extends Partial<CreateRepositoryRequest> {
  active?: boolean
}
