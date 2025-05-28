import React from 'react';
import { motion } from 'framer-motion';
import { Star, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface Review {
  id: number;
  product_id: number;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface ReviewsListProps {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
}

const ReviewsList: React.FC<ReviewsListProps> = ({ reviews, averageRating, totalReviews }) => {
  return (
    <div className="space-y-6 mt-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold mb-2">Customer Reviews</h3>
          <div className="flex items-center mb-4">
            <div className="flex mr-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= Math.round(averageRating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm">
              <span className="font-medium">{averageRating.toFixed(1)}</span> out of 5 ({totalReviews} reviews)
            </span>
          </div>
        </div>
        
        <div className="space-y-1 mb-4 sm:mb-0">
          {[5, 4, 3, 2, 1].map((rating) => {
            const ratingCount = reviews.filter((review) => review.rating === rating).length;
            const percentage = totalReviews > 0 ? (ratingCount / totalReviews) * 100 : 0;
            
            return (
              <div key={rating} className="flex items-center text-sm">
                <span className="w-3">{rating}</span>
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mx-1" />
                <div className="w-36 h-2 bg-gray-200 rounded-full mx-2">
                  <div
                    className="h-2 bg-yellow-400 rounded-full"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <span className="text-xs text-muted-foreground">{ratingCount}</span>
              </div>
            );
          })}
        </div>
      </div>

      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="border-b border-border pb-4 last:border-0"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center mr-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{review.user_name}</p>
                    <div className="flex mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= review.rating
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="mt-3 text-sm">{review.comment}</p>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-8">No reviews yet. Be the first to share your experience!</p>
      )}
    </div>
  );
};

export default ReviewsList;
