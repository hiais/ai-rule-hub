export type HubConfig = {
  version: string;
  storagePath: string;
  categories: Record<
    string,
    {
      enabled: boolean;
      fileExtensions: string[];
    }
  >;
  features: {
    autoRefresh: boolean;
    showFileCounts: boolean;
    enableSearch: boolean;
  };
};

export type FileMetadata = {
  path: string;
  size: number;
  hash?: string;
  lastUsedAt?: number;
  usedCount?: number;
  createdAt?: number;
  updatedAt?: number;
};

export type LibraryItem = {
  id: string;
  label: string;
  description?: string;
  collapsible?: boolean;
  type: 'category' | 'file';
  path?: string;
  icon?: string;
};
