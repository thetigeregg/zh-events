export interface GuidleOffer {
  id: number;
  title: string;
  imageUrl?: string;
  imageUri?: string;
  category: string;
  url: string;
  firstShow: string;
  textLine2?: string;
  advertisementOffer?: boolean;
  generatedId: string;
  lat?: string;
  lng?: string;
  schedule?: string;
}

export interface GuidleGroup {
  id: number;
  label: string;
  showGroup: boolean;
  offers: GuidleOffer[];
}

export interface GuidleSearchOffersResponse {
  groups: GuidleGroup[];
}

export interface GuidleOffersCountResponse {
  count: number;
}
