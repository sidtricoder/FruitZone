import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ArrowLeft, Share2, Star } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useCart } from '@/contexts/CartContext';
import LazyImage from '@/components/ui/LazyImage';
import ReviewForm from '@/components/ReviewForm';
import ReviewsList, { Review } from '@/components/ReviewsList';

// NutrientInfo interface
export interface NutrientInfo {
  energy_kcal?: string;
  carbohydrates_g?: string;
  dietary_fiber_g?: string;
  saturated_fat_g?: string;
  protein_g?: string;
  total_fat_g?: string;
  [key: string]: string | undefined;
}

// Product interface
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number; 
  image_url: string | string[];
  type?: string;
  brand?: string;
  origin?: string;
  bbe?: string; 
  delivery_info?: string; 
  discount_percentage?: number | null; // Updated to allow null
  discount_reason?: string | null; // Updated to allow null
  nutrient_info?: NutrientInfo; 
  stock_quantity?: number; 
  created_at?: string;
  updated_at?: string;
  b2b_price?: number | null;
  b2b_minimum_quantity?: number | null;
  is_b2b?: boolean;
}

interface RelatedProductsProps {
  productId: number;
  productType: string;
}

const RelatedProducts: React.FC<RelatedProductsProps> = ({ productId, productType }) => {
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { addToCart } = useCart(); // Re-added
  const { toast } = useToast(); // Re-added

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        setLoading(true);
        
        // Fetch products with the same type, excluding current product
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('type', productType)
          .neq('id', productId)
          .limit(4);

        if (error) {
          throw error;
        }

        setRelatedProducts(data as Product[] || []);
      } catch (error: any) {
        console.error('Error fetching related products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedProducts();
  }, [productId, productType, supabase]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (relatedProducts.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-5">
        No related products found.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {relatedProducts.map(product => {
        // Robust image URL parsing for related products
        let displayImageUrl = `/static/images/${product.type?.toLowerCase() || 'product'}-placeholder.jpg`;
        if (product.image_url) {
          let parsedUrls: string[] = [];
          try {
            if (typeof product.image_url === 'string' && product.image_url.startsWith('[') && product.image_url.endsWith(']')) {
              parsedUrls = JSON.parse(product.image_url);
            } else if (Array.isArray(product.image_url)) {
              parsedUrls = product.image_url;
            } else if (typeof product.image_url === 'string') {
              // Ensure it's not an empty string before treating as a single URL
              if (product.image_url.trim() !== '') {
                parsedUrls = [product.image_url];
              }
            }
            // Filter out any non-string or empty string values from the parsed array
            parsedUrls = parsedUrls.filter(url => typeof url === 'string' && url.trim() !== '');
            if (parsedUrls.length > 0) {
              displayImageUrl = parsedUrls[0]; // Use the first valid URL
            }
          } catch (e) {
            console.error("Error parsing image_url for related product:", product.id, e);
            // Fallback for single string URL if parsing failed and it wasn't a JSON string
            if (typeof product.image_url === 'string' && !(product.image_url.startsWith('[') && product.image_url.endsWith(']')) && product.image_url.trim() !== '') {
                displayImageUrl = product.image_url;
            }
            // Otherwise, the placeholder set initially remains
          }
        }

        return (
          <div 
            key={product.id}
            className="bg-card rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/products/${product.id}`)}
          >
            <div className="h-40 bg-background rounded-t-lg overflow-hidden flex items-center justify-center"> {/* Ensure background matches main product image */}
              <LazyImage 
                src={displayImageUrl} 
                alt={product.name} 
                className="w-full h-full object-contain" 
                width={150}
                height={150}
              />
            </div>
            <div className="p-4">
              <h3 className="font-medium text-sm mb-1 line-clamp-1">{product.name}</h3>
              <p className="text-sm text-muted-foreground mb-2">₹{product.price.toLocaleString('en-IN')}</p>
              <div className="flex justify-between">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(product);
                    toast({
                      title: "Added to cart",
                      description: `${product.name} has been added to your cart.`,
                      variant: "default"
                    });
                  }}
                  className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground py-1 px-2 rounded flex items-center"
                >
                  <ShoppingBag size={12} className="mr-1" /> Add
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/products/${product.id}`);
                  }}
                  className="text-xs border border-primary text-primary hover:bg-primary hover:text-primary-foreground py-1 px-2 rounded flex items-center"
                >
                   View Details
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const ProductPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [images, setImages] = useState<string[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(true); // Re-added
  const [averageRating, setAverageRating] = useState<number>(0);
  const [showReviewForm, setShowReviewForm] = useState<boolean>(false); // Re-added
  const [selectedWeight, setSelectedWeight] = useState<string>('250gm'); // Added state for selected weight

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setProduct(data as Product);
          
          let imageUrls: string[] = [];
          if (data.image_url) {
            try {
              if (typeof data.image_url === 'string' && data.image_url.startsWith('[')) {
                imageUrls = JSON.parse(data.image_url);
              } else if (Array.isArray(data.image_url)) {
                imageUrls = data.image_url;
              } else {
                imageUrls = [data.image_url as string];
              }
            } catch (e) {
              imageUrls = [data.image_url as string];
            }
          }
          setImages(imageUrls.length > 0 ? imageUrls : [`/static/images/${(data as Product).type?.toLowerCase() || 'product'}-placeholder.jpg`]);

          fetchReviews((data as Product).id);
        }
      } catch (error: any) {
        console.error('Error fetching product:', error);
        toast({
          title: "Error loading product",
          description: "We couldn't load the product details. Please try again later.",
          variant: "destructive"
        });
        navigate('/shop');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, toast, navigate, supabase]);

  const fetchReviews = async (currentProductId: number) => {
    try {
      setLoadingReviews(true); // Re-added
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', currentProductId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setReviews(data as Review[] || []);
      
      if (data && data.length > 0) {
        const totalRating = (data as Review[]).reduce((sum, review) => sum + review.rating, 0);
        setAverageRating(totalRating / data.length);
      }
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
      toast({
        title: "Error loading reviews",
        description: "We couldn't load the review data.",
        variant: "destructive"
      });
    } finally {      
      setLoadingReviews(false); // Re-added
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product);
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`,
        variant: "default"
      });
    }
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleShare = async () => {
    try {
      const productUrl = `${window.location.origin}/products/${product?.id}`;
      await navigator.clipboard.writeText(productUrl);
      toast({
        title: "Link copied!",
        description: "Product link has been copied to your clipboard.",
        variant: "default"
      });
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast({
        title: "Copy failed",
        description: "Unable to copy link. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-12 flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-12">
        <div className="container mx-auto px-6">
          <div className="text-center py-20">
            <h2 className="text-2xl font-semibold mb-4">Product Not Found</h2>
            <p className="mb-8">The product you're looking for doesn't exist or has been removed.</p>
            <button 
              onClick={() => navigate('/shop')}
              className="inline-flex items-center px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Shop
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Price calculation for display
  const displayPriceX = product.price;
  const discountPercentageZ = product.discount_percentage || 0;
  const originalPriceY = discountPercentageZ > 0 && discountPercentageZ < 100 
    ? displayPriceX / (1 - (discountPercentageZ / 100)) 
    : displayPriceX;

  // Determine if nutrient_info has any actual values
  const hasNutrientInfo = product.nutrient_info && 
                          Object.values(product.nutrient_info).some(val => val != null && String(val).trim() !== '');

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Breadcrumb Navigation */}
        <div className="mb-8 flex items-center space-x-2 text-sm">
          <button 
            onClick={handleBackClick}
            className="flex items-center text-primary hover:text-primary/90"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </button>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground">{product.type || 'Products'}</span>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium truncate max-w-[200px]">{product.name}</span>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10">
          {/* Product Images Section */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
             <div className="bg-background rounded-xl overflow-hidden h-[400px] md:h-[500px] flex items-center justify-center relative group">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedImageIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full"
                >
                  <LazyImage 
                    src={images[selectedImageIndex]} 
                    alt={product.name}
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
                    width={600}
                    height={600}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
            
            {images.length > 1 && (
              <div className="flex space-x-3 sm:space-x-4 overflow-x-auto pt-4 pb-2">
                {images.map((img, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border-2 transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background
                      ${selectedImageIndex === index ? 'border-primary ring-2 ring-primary' : 'border-border hover:border-primary/70'}
                    `}
                  >
                    <LazyImage 
                      src={img} 
                      alt={`${product.name} thumbnail ${index + 1}`} 
                      className="w-full h-full object-cover"
                      width={96} // Corresponds to sm:w-24
                      height={96} // Corresponds to sm:h-24
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
          
          {/* Product Details Section - MODIFIED */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Product Name */}
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{product.name}</h1>

            {/* Star Rating */}
            {averageRating > 0 && (
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${i < Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                    fill={i < Math.round(averageRating) ? 'currentColor' : 'none'}
                  />
                ))}
                <span className="ml-2 text-sm text-muted-foreground">({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span>
              </div>
            )}

            {/* Product Meta Info: Brand, Origin, BBE, Delivery */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mt-4">
              {product.brand && <div className="bg-muted/10 dark:bg-muted/30 p-3 rounded-lg shadow-sm"><strong className="font-medium text-foreground/80">Brand:</strong> <span className="text-muted-foreground">{product.brand}</span></div>}
              {product.origin && <div className="bg-muted/10 dark:bg-muted/30 p-3 rounded-lg shadow-sm"><strong className="font-medium text-foreground/80">Origin:</strong> <span className="text-muted-foreground">{product.origin}</span></div>}
              {product.bbe && <div className="bg-muted/10 dark:bg-muted/30 p-3 rounded-lg shadow-sm"><strong className="font-medium text-foreground/80">BBE:</strong> <span className="text-muted-foreground">{product.bbe}</span></div>}
              {product.delivery_info && <div className="bg-muted/10 dark:bg-muted/30 p-3 rounded-lg shadow-sm"><strong className="font-medium text-foreground/80">Delivery:</strong> <span className="text-muted-foreground">{product.delivery_info}</span></div>}
            </div>

            {/* Price Section */}
            <div className="mt-5 space-y-2">
              <div className="flex items-baseline gap-x-2">
                <span className="text-3xl sm:text-4xl font-bold text-primary">
                  ₹{displayPriceX.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                {discountPercentageZ > 0 && discountPercentageZ < 100 && (
                  <span className="text-lg sm:text-xl line-through text-muted-foreground">
                    ₹{originalPriceY.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                )}
              </div>
              {discountPercentageZ > 0 && discountPercentageZ < 100 && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs sm:text-sm font-semibold text-green-700 bg-green-100 dark:text-green-100 dark:bg-green-700 px-2.5 py-1 rounded-full">
                    {discountPercentageZ}% OFF
                  </span>
                  {product.discount_reason && (
                    <span className="text-xs text-muted-foreground italic">({product.discount_reason})</span>
                  )}
                </div>
              )}
            </div>

            {/* Weight Selection */}
            <div className="mt-5 space-y-3">
              <label htmlFor="weight-selection" className="text-sm font-medium text-foreground">Select Weight:</label>
              <div id="weight-selection" className="flex flex-wrap gap-2 sm:gap-3">
                {['100gm', '250gm', '500gm', '1kg'].map(weight => (
                  <button
                    key={weight}
                    type="button"
                    onClick={() => setSelectedWeight(weight)}
                    className={`px-3.5 py-2 sm:px-4 sm:py-2.5 border rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background
                      ${selectedWeight === weight 
                        ? 'bg-primary text-primary-foreground border-primary shadow-md ring-2 ring-primary' 
                        : 'bg-card hover:bg-muted/70 border-border text-foreground hover:border-primary/50'
                      }`}
                  >
                    {weight}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity and Add to Cart */}
            <div className="mt-6 flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
              <button
                onClick={handleAddToCart}
                disabled={product.stock_quantity !== undefined && product.stock_quantity <= 0}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed px-6 py-3 rounded-lg text-sm sm:text-base font-semibold flex items-center justify-center transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
              >
                <ShoppingBag className="mr-2 h-4 w-4 sm:mr-2.5 sm:h-5 sm:w-5" /> 
                {product.stock_quantity !== undefined && product.stock_quantity <= 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button 
                type="button"
                onClick={handleShare}
                title="Share Product"
                className="p-3 rounded-lg border border-border text-muted-foreground hover:bg-muted/50 hover:text-primary transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background flex items-center justify-center sm:px-4"
              >
                <Share2 className="h-5 w-5" />
                <span className="ml-2 sm:hidden">Share</span>
              </button>
            </div>
            <AnimatePresence>
             {product.stock_quantity !== undefined && product.stock_quantity <= 0 && (
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="text-sm text-red-500 dark:text-red-400 mt-2"
                >
                  This product is currently out of stock.
                </motion.p>
            )}
            </AnimatePresence>
            <AnimatePresence>
            {product.stock_quantity !== undefined && product.stock_quantity > 0 && product.stock_quantity < 10 && (
                 <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="text-sm text-orange-500 dark:text-orange-400 mt-2"
                 >
                   Hurry! Only {product.stock_quantity} left in stock.
                 </motion.p>
            )}
            </AnimatePresence>


            {/* Product Description and Nutrient Information Container */}
            <div className="mt-6 border-t border-border pt-6 grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-6">
              {/* Left Column: Product Description */}
              <div className="lg:col-span-2">
                {product.description && (
                  <div> {/* Removed original mt-6 border-t pt-5 wrapper */}
                    <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 sm:mb-3">Product Description</h3>
                    <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground space-y-2 sm:space-y-3">
                      {product.description.split('\\\\n').map((paragraph, index) => (
                        <p key={index}>{paragraph.trim()}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Nutrient Information */}
              <div className="lg:col-span-1">
                {hasNutrientInfo && (
                  <div> {/* Removed original mt-6 border-t pt-5 wrapper */}
                    <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Nutritional Information</h3>
                    <div className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm"> {/* Changed from sm:grid-cols-2 to grid-cols-1 for better fit */}
                      {Object.entries(product.nutrient_info!) 
                        .filter(([_, value]) => value != null && String(value).trim() !== '') 
                        .map(([key, value]) => {
                          const formattedKey = key.replace(/_/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase()).replace(/ Kcal$/, " (kcal)").replace(/ G$/, " (g)");
                          return (
                            <div key={key} className="flex justify-between py-1 border-b border-border/30 last:border-b-0 sm:py-1.5">
                              <span className="text-muted-foreground">{formattedKey}:</span>
                              <span className="font-medium text-foreground">{String(value)}</span>
                            </div>
                          );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Reviews Section */}
            <div className="mt-10 border-t border-border pt-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Customer Reviews</h2>
                <button
                  onClick={() => setShowReviewForm((prev: boolean) => !prev)} // Toggle review form visibility and typed prev
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  {showReviewForm ? 'Cancel Review' : 'Write a Review'}
                </button>
              </div>

              <AnimatePresence>
                {showReviewForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden" // Added to prevent content spill during animation
                  >
                    <ReviewForm 
                      productId={product.id} 
                      onReviewSubmitted={() => {
                        fetchReviews(product.id);
                        setShowReviewForm(false);
                      }} 
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              
              {loadingReviews ? (
                 <div className="flex justify-center items-center py-8">
                   <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                 </div>
              ) : reviews.length > 0 ? (
                <ReviewsList reviews={reviews} averageRating={averageRating} totalReviews={reviews.length} />
              ) : (
                <p className="text-muted-foreground text-center py-4">No reviews yet. Be the first to review!</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Related Products Section */}
        {product.type && (
          <div className="mt-16 pt-10 border-t border-border">
            <h2 className="text-2xl font-semibold text-foreground mb-8 text-center sm:text-left">You Might Also Like</h2>
            <RelatedProducts productId={product.id} productType={product.type} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductPage;
