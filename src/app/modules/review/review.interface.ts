export interface IReviewCreate {
  targetUserId: string;
  bookingId: string;
  rating: number;
  comment?: string;
}

export interface IReviewUpdate {
  rating?: number;
  comment?: string;
}


export interface IReviewFilter {
  reviewerId?: string;
  targetUserId?: string;
  bookingId?: string;
  minRating?: number;
  maxRating?: number;
}
