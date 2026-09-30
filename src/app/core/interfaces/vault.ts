export interface Vault {
  id: string;
  name: string;
  description?: string | null;
  isDefault: boolean;
}

export interface VaultCreate {
  name: string;
  description?: string;
}
