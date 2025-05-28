import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowLeft, Share2, Info, Star, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useCart } from '@/contexts/CartContext';
import LazyImage from '@/components/ui/LazyImage';
import { Product } from './ShopPage';
import ReviewForm from '@/components/ReviewForm';
import ReviewsList, { Review } from '@/components/ReviewsList';

interface RelatedProductsProps {
  productId: number;
  productType: string;
}

const RelatedProducts: React.FC<RelatedProductsProps> = ({ productId, productType }) => {
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toast } = useToast();

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

        setRelatedProducts(data || []);
      } catch (error) {
        console.error('Error fetching related products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedProducts();
  }, [productId, productType]);

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
      {relatedProducts.map(product => (
        <div 
          key={product.id}
          className="bg-card rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate(`/products/${product.id}`)}
        >
          <div className="h-40 bg-white overflow-hidden">
            <LazyImage 
              src={
                Array.isArray(product.image_url) && product.image_url.length > 0
                  ? product.image_url[0]
                  : typeof product.image_url === 'string'
                    ? product.image_url
                    : `/static/images/${product.type?.toLowerCase() || 'product'}-placeholder.jpg`
              } 
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
                className="text-xs bg-lime-500 hover:bg-lime-600 text-white py-1 px-2 rounded flex items-center"
              >
                <ShoppingBag size={12} className="mr-1" /> Add
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/products/${product.id}`);
                }}
                className="text-xs border border-primary text-primary hover:bg-primary hover:text-white py-1 px-2 rounded flex items-center"
              >
                <ExternalLink size={12} className="mr-1" /> View
              </button>
            </div>
          </div>
        </div>
      ))}
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
  // Add new state for reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(true);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [showReviewForm, setShowReviewForm] = useState<boolean>(false);

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
          console.log('Product data:', data);
          console.log('Image URL type:', typeof data.image_url);
          console.log('Image URL value:', data.image_url);
          
          setProduct(data);
          
          // Parse images from JSON string or array
          let imageUrls: string[] = [];
          if (data.image_url) {
            try {
              // Try to parse as JSON array
              if (typeof data.image_url === 'string' && data.image_url.startsWith('[')) {
                imageUrls = JSON.parse(data.image_url);
                console.log('Parsed JSON array:', imageUrls);
              } else if (Array.isArray(data.image_url)) {
                // Already an array
                imageUrls = data.image_url;
                console.log('Already an array:', imageUrls);
              } else {
                // Single image URL as string
                imageUrls = [data.image_url];
                console.log('Single URL string:', imageUrls);
              }
            } catch (e) {
              console.log('Error parsing image URL:', e);
              // If parsing fails, treat as single image URL
              imageUrls = [data.image_url];
            }
          }
          
          console.log('Final image URLs:', imageUrls);
          setImages(imageUrls.length > 0 ? imageUrls : [`/static/images/${data.type?.toLowerCase() || 'product'}-placeholder.jpg`]);

          // After fetching product, fetch its reviews
          fetchReviews(data.id);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        toast({
          title: "Error loading product",
          description: "We couldn't load the product details. Please try again later.",
          variant: "destructive"
        });
        navigate('/shop'); // Redirect back to shop on error
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, toast, navigate]);

  // Function to fetch reviews for the product
  const fetchReviews = async (productId: number) => {
    try {
      setLoadingReviews(true);
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setReviews(data || []);
      
      // Calculate average rating
      if (data && data.length > 0) {
        const totalRating = data.reduce((sum, review) => sum + review.rating, 0);
        setAverageRating(totalRating / data.length);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({
        title: "Error loading reviews",
        description: "We couldn't load the review data. You can still view the product details.",
        variant: "destructive"
      });
    } finally {      setLoadingReviews(false);
      
      // Show loading state in UI if needed
      console.log('Reviews loading complete:', !loadingReviews);
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
    navigate(-1); // Go back to previous page
  };
  // Review handling is now implemented in the ReviewForm component

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
              className="inline-flex items-center px-6 py-3 rounded-lg bg-primary text-white hover:bg-primary/90"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Shop
            </button>
          </div>
        </div>
      </div>
    );
  }

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
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images Section */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >            {/* Main Image with Zoom */}
            <div className="bg-white rounded-xl overflow-hidden h-[400px] md:h-[500px] flex items-center justify-center relative group">
              <LazyImage 
                src={images[selectedImageIndex]} 
                alt={product.name}
                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
                width={600}
                height={600}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="bg-white bg-opacity-75 rounded-full p-2">
                  <p className="text-xs font-medium text-gray-700">Hover to zoom</p>
                </div>
              </div>
            </div>
            
            {/* Thumbnail Images */}
            {images.length > 1 && (
              <div className="flex space-x-4 overflow-x-auto pb-2">
                {images.map((img, index) => (
                  <button 
                    key={index} 
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative rounded-lg overflow-hidden h-24 w-24 flex-shrink-0 border-2 transition-all ${
                      index === selectedImageIndex ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <LazyImage 
                      src={img} 
                      alt={`${product.name} - View ${index + 1}`}
                      className="w-full h-full object-contain"
                      width={96}
                      height={96}
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
          
          {/* Product Details Section */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                  {product.type || 'General'}
                </span>
                {product.stock_quantity && product.stock_quantity > 0 ? (
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                    In Stock
                  </span>
                ) : (
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                    Out of Stock
                  </span>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">{product.name}</h1>              <div className="flex items-center space-x-2 mb-4">                <div className="flex">
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
                <span className="text-sm text-muted-foreground">
                  {reviews.length > 0 
                    ? `${averageRating.toFixed(1)} (${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'})`
                    : 'No reviews yet'}
                </span>
              </div>
              
              <div className="flex items-baseline space-x-4 mb-4">
                <span className="text-3xl font-bold text-foreground">₹{product.price.toLocaleString('en-IN')}</span>
                {product.b2b_price && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">B2B Price: </span>
                    <span className="font-medium">₹{product.b2b_price.toLocaleString('en-IN')}</span>
                    <span className="text-xs text-muted-foreground ml-1">(Min. {product.b2b_minimum_quantity} units)</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="prose dark:prose-invert max-w-none">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-foreground">{product.description || 'No description available'}</p>
            </div>
              <div className="border-t border-border pt-6 space-y-4">
              <h3 className="text-lg font-semibold">Key Benefits</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <Info className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                  <span>100% Natural & Preservative-Free</span>
                </li>
                <li className="flex items-start">
                  <Info className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                  <span>
                    {product.type === 'Fruits' && 'Rich in Natural Fruit Sugars and Dietary Fiber'}
                    {product.type === 'Vegetables' && 'Excellent Source of Vitamins and Minerals'}
                    {product.type === 'Leaves' && 'High in Antioxidants and Micronutrients'}
                    {!['Fruits', 'Vegetables', 'Leaves'].includes(product.type || '') && 'Rich in Vitamins and Nutrients'}
                  </span>
                </li>
                <li className="flex items-start">
                  <Info className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                  <span>Long Shelf Life Without Refrigeration</span>
                </li>
                <li className="flex items-start">
                  <Info className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                  <span>Perfect for Healthy Snacking, Cooking and Baking</span>
                </li>
              </ul>
            </div>
              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 pt-6">
              <button 
                onClick={handleAddToCart}
                disabled={!product.stock_quantity || product.stock_quantity <= 0}
                className="w-full sm:w-auto px-8 py-3 bg-lime-500 hover:bg-lime-600 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors duration-300 flex items-center justify-center"
              >
                <ShoppingBag className="mr-2 h-5 w-5" /> 
                Add to Cart
              </button>
              
              <button 
                onClick={() => {
                  const productUrl = window.location.href;
                  navigator.clipboard.writeText(productUrl);
                  toast({
                    title: "Link copied!",
                    description: "Product link copied to clipboard.",
                    variant: "success"
                  });
                }}
                className="flex items-center justify-center p-3 border border-border rounded-lg hover:bg-accent transition-colors"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>
            
            {/* Shipping Information */}
            <div className="bg-accent/50 rounded-lg p-4 mt-6">
              <h4 className="font-semibold mb-2">Shipping Information</h4>
              <p className="text-sm text-muted-foreground">Free shipping on orders above ₹500. Usually ships within 1-2 business days.</p>
            </div>
          </motion.div>
        </div>
          {/* Related Products Section */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold mb-8">You May Also Like</h2>
          <RelatedProducts productId={product.id} productType={product.type || 'General'} />
        </div>        {/* Reviews Section */}
        <div className="mt-20 border-t border-border pt-12">
          {loadingReviews ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ReviewsList 
              reviews={reviews} 
              averageRating={averageRating} 
              totalReviews={reviews.length} 
            />
          )}
          
          {/* Toggle Review Form Button */}
          <div className="mt-8 text-center">
            <button
              onClick={() => setShowReviewForm(prev => !prev)}
              className="inline-flex items-center px-6 py-3 rounded-lg bg-primary/10 hover:bg-primary/15 text-primary transition-colors"
            >
              {showReviewForm ? 'Cancel Review' : 'Write a Review'}
            </button>
          </div>
          
          {/* Conditionally Render Review Form */}
          {showReviewForm && (
            <div className="mt-6">
              <ReviewForm 
                productId={product.id} 
                onReviewSubmitted={() => {
                  setShowReviewForm(false);
                  fetchReviews(product.id);
                }} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
