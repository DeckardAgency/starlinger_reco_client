export interface TaxType {
  id: number;
  name: string;
  percent: number;
  remoteId?: number;
  remoteCode?: string | null;
  selected?: boolean;
}

export interface TaxTypesCollection {
  totalItems: number;
  member: TaxType[];
}

