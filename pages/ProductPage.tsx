import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowLeft, Heart, Share2, Info, Star } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useCart } from '@/contexts/CartContext';
import LazyImage from '@/components/ui/LazyImage';
import { Product } from './ShopPage';

const ProductPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [images, setImages] = useState<string[]>([]);

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
          setProduct(data);
          
          // Parse images from JSON string or array
          let imageUrls: string[] = [];
          if (data.image_url) {
            try {
              // Try to parse as JSON array
              if (typeof data.image_url === 'string' && data.image_url.startsWith('[')) {
                imageUrls = JSON.parse(data.image_url);
              } else if (typeof data.image_url === 'object') {
                // Already an array
                imageUrls = data.image_url;
              } else {
                // Single image URL as string
                imageUrls = [data.image_url];
              }
            } catch (e) {
              // If parsing fails, treat as single image URL
              imageUrls = [data.image_url];
            }
          }
          
          setImages(imageUrls.length > 0 ? imageUrls : ['/static/images/product-placeholder.png']);
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
          >
            {/* Main Image */}
            <div className="bg-white rounded-xl overflow-hidden h-[400px] md:h-[500px] flex items-center justify-center">
              <LazyImage 
                src={images[selectedImageIndex]} 
                alt={product.name}
                className="w-full h-full object-contain"
                width={600}
                height={600}
              />
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
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">{product.name}</h1>
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className="h-5 w-5 text-yellow-400 fill-yellow-400" 
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">(25 reviews)</span>
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
                  <span>Rich in Vitamins and Nutrients</span>
                </li>
                <li className="flex items-start">
                  <Info className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                  <span>Long Shelf Life Without Refrigeration</span>
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
              
              <div className="flex space-x-4 w-full sm:w-auto">
                <button className="flex-1 p-3 border border-border rounded-lg hover:bg-accent transition-colors">
                  <Heart className="h-5 w-5 mx-auto" />
                </button>
                <button className="flex-1 p-3 border border-border rounded-lg hover:bg-accent transition-colors">
                  <Share2 className="h-5 w-5 mx-auto" />
                </button>
              </div>
            </div>
            
            {/* Shipping Information */}
            <div className="bg-accent/50 rounded-lg p-4 mt-6">
              <h4 className="font-semibold mb-2">Shipping Information</h4>
              <p className="text-sm text-muted-foreground">Free shipping on orders above ₹500. Usually ships within 1-2 business days.</p>
            </div>
          </motion.div>
        </div>
        
        {/* Related Products Section - To be implemented later */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold mb-8">You May Also Like</h2>
          <p className="text-center text-muted-foreground py-10">
            Related products will be displayed here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
