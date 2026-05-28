export interface Repository {
  id: string
  url: string
  branch?: string
  name?: string
  description?: string
  maxFileSizeBytes?: number
  active?: boolean
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
