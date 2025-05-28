import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, ShoppingBag, Edit, Trash2, Search, 
  CheckCircle, XCircle, Clock, Filter, Save, ImagePlus, RefreshCw
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';

// Define needed types
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  image_url: string | string[]; // Now can be a string or array of strings
  created_at: string;
  updated_at: string;
  b2b_price: number;
  b2b_minimum_quantity: number;
  is_b2b: boolean;
  type: string;
}

interface Order {
  id: number;
  user_id: string;
  status: 'pending' | 'processing' | 'delivered' | 'cancelled';
  total_amount: number;
  created_at: string;
  updated_at: string;
  shipping_address: string;
  payment_status: 'pending' | 'paid' | 'failed';
  items: OrderItem[];
  user_details?: {
    full_name: string;
    mobile_number: string;
  };
}

interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
  product_name: string;
  product_image?: string;
}

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState({
    products: false,
    orders: false,
    adminCheck: true
  });  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productTypeFilter, setProductTypeFilter] = useState('all');
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [isAdmin, setIsAdmin] = useState(false);  // New product state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    stock_quantity: 0,
    image_url: [] as string[], // Initialize as empty array for multiple images
    b2b_price: 0,
    b2b_minimum_quantity: 25,
    is_b2b: false,
    type: 'Fruits', // Default type
  });
  
  // State for handling image URL input
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  
  // Wrap fetch functions in useCallback to stabilize them for effect dependencies
  const fetchProducts = useCallback(async () => {
    setLoading(prev => ({...prev, products: true}));
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error fetching products",
        description: "There was an error loading products. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({...prev, products: false}));
    }
  }, [toast]);

  // Wrap fetchOrders in useCallback
  const fetchOrders = useCallback(async () => {
    setLoading(prev => ({...prev, orders: true}));
    try {
      // First get all orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
        // For each order, get order items and user details
      const completeOrders = await Promise.all((ordersData || []).map(async (order) => {
        try {
          // Get order items
          const { data: itemsData, error: itemsError } = await supabase
            .from('order_items')
            .select('*, product:product_id(name, image_url)')
            .eq('order_id', order.id);
            
          if (itemsError) {
            console.error('Error fetching order items:', itemsError);
            return {
              ...order,
              items: [],
              user_details: undefined
            };
          }          // Get user details - only select fields that exist in the table
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('full_name, mobile_number')
            .eq('id', order.user_id)
            .single();
          
          if (userError) {
            console.error('Error fetching user details:', userError);
            // Continue processing even if we can't get user details
          }
          // Transform items to include product name and image
          const items = (itemsData || []).map(item => ({
            id: item.id,
            order_id: item.order_id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            product_name: item.product ? item.product.name : 'Unknown Product',
            product_image: item.product ? item.product.image_url : undefined,
          }));
          return {
            ...order,
            items,
            user_details: userData || undefined
          };
        } catch (orderError) {
          console.error(`Error processing order ${order.id}:`, orderError);
          // Return the order with empty items rather than failing the entire process
          return {
            ...order,
            items: [],
            user_details: undefined
          };
        }
      }));
      
      setOrders(completeOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error fetching orders",
        description: "There was an error loading orders. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({...prev, orders: false}));
    }
  }, [toast]);
    // Check if user is admin - with added debugging
  useEffect(() => {
    console.log("Admin check effect running");
    let isMounted = true;
    setLoading(prev => ({...prev, adminCheck: true}));
    
    // Set timeout to ensure we don't get stuck in loading state
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        console.log("Admin check timed out, resetting loading state");
        setLoading(prev => ({...prev, adminCheck: false}));
        // Don't navigate on timeout, just update loading state
        toast({
          title: "Admin check taking longer than expected",
          description: "Please wait or try refreshing the page.",
          variant: "default"
        });
      }
    }, 8000); // Increased timeout for reliable testing

    const checkAdminStatus = async () => {
      if (!isAuthenticated || !user) {
        if (isMounted) {
          clearTimeout(timeoutId);
          setLoading(prev => ({...prev, adminCheck: false}));
          setIsAdmin(false);
          navigate('/auth');
        }
        return;
      }

      console.log("Checking user admin status:", user);

      // First check: Use the admin_or_not from the user object if available
      if (user.admin_or_not === true) {
        if (isMounted) {
          console.log("User is admin from auth context");
          clearTimeout(timeoutId);
          setIsAdmin(true);
          setLoading(prev => ({...prev, adminCheck: false}));
          fetchProducts();
          fetchOrders();
        }
        return;
      }
      
      try {
        // Second check: Verify with the database
        console.log("Verifying admin status from database for user ID:", user.id);
        const { data, error } = await supabase
          .from('users')
          .select('admin_or_not')
          .eq('id', user.id)
          .single();

        if (!isMounted) return;
        
        clearTimeout(timeoutId);
        
        if (error) {
          console.error("Database error checking admin status:", error);
          setIsAdmin(false);
          setLoading(prev => ({...prev, adminCheck: false}));
          navigate('/');
          toast({
            title: "Database Error",
            description: "Could not verify admin status. Please try again.",
            variant: "destructive"
          });
          return;
        }

        console.log("Admin check database result:", data);

        if (!data || data.admin_or_not !== true) {
          console.log("User is not an admin:", user.id);
          setIsAdmin(false);
          setLoading(prev => ({...prev, adminCheck: false}));
          navigate('/');
          toast({
            title: "Access Denied",
            description: "You don't have permission to access the admin area.",
            variant: "destructive"
          });
        } else {
          console.log("User confirmed as admin from database");
          setIsAdmin(true);
          setLoading(prev => ({...prev, adminCheck: false}));
          fetchProducts();
          fetchOrders();
        }
      } catch (error) {
        if (!isMounted) return;
        
        clearTimeout(timeoutId);
        console.error("Admin check error:", error);
        setIsAdmin(false);
        setLoading(prev => ({...prev, adminCheck: false}));
        navigate('/');
        toast({
          title: "Error",
          description: "An error occurred while checking admin status.",
          variant: "destructive"
        });
      }
    };

    checkAdminStatus();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [isAuthenticated, user, navigate, toast, fetchProducts, fetchOrders]);
  // These duplicate function declarations were removed to prevent issues

  // Handle product search and filtering
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(productSearchTerm.toLowerCase());
      
    const matchesTypeFilter = productTypeFilter === 'all' || product.type === productTypeFilter;
    
    return matchesSearch && matchesTypeFilter;
  });

  // Handle order filtering
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.user_details?.full_name?.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
      order.user_details?.mobile_number?.includes(orderSearchTerm) ||
      order.id.toString().includes(orderSearchTerm);
    
    const matchesStatus = orderStatusFilter === 'all' || order.status === orderStatusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Handle product save
  const handleSaveProduct = async () => {    try {
      // Form validation
      if (!newProduct.name || !newProduct.price || !newProduct.type) {
        toast({
          title: "Missing required fields",
          description: "Please fill in all required fields (Name, Type, and Price).",
          variant: "destructive"
        });
        return;
      }      // Validate image URLs
      if (Array.isArray(newProduct.image_url)) {
        // Check if at least one image is required
        if (newProduct.image_url.length === 0) {
          toast({
            title: "Image required",
            description: "Please add at least one product image.",
            variant: "destructive"
          });
          return;
        }
        
        // Check each URL for valid image extension
        const invalidUrls = newProduct.image_url.filter(url => !(/\.(jpeg|jpg|png|gif|webp|svg)$/i.test(url)));
        if (invalidUrls.length > 0) {
          toast({
            title: "Invalid image URL",
            description: "All image URLs must end with a valid image extension (.jpeg, .png, .webp, etc).",
            variant: "destructive"
          });
          return;
        }
      } else if (typeof newProduct.image_url === 'string' && !(/\.(jpeg|jpg|png|gif|webp|svg)$/i.test(newProduct.image_url))) {
        toast({
          title: "Invalid image URL",
          description: "Image URL must end with a valid image extension (.jpeg, .png, .webp, etc).",
          variant: "destructive"
        });
        return;
      }if (editingProduct) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update({
            name: newProduct.name,
            description: newProduct.description,
            price: newProduct.price,
            stock_quantity: newProduct.stock_quantity,
            image_url: newProduct.image_url,
            updated_at: new Date(),
            b2b_price: newProduct.b2b_price,
            b2b_minimum_quantity: newProduct.b2b_minimum_quantity,
            is_b2b: newProduct.is_b2b,
            type: newProduct.type
          })
          .eq('id', editingProduct.id)
          .select();

        if (error) throw error;
        
        toast({
          title: "Product updated",
          description: `${newProduct.name} has been successfully updated.`
        });      } else {        // Create new product
        const { error } = await supabase
          .from('products')
          .insert([{
            name: newProduct.name,
            description: newProduct.description,
            price: newProduct.price,
            stock_quantity: newProduct.stock_quantity,
            image_url: newProduct.image_url,
            b2b_price: newProduct.b2b_price,
            b2b_minimum_quantity: newProduct.b2b_minimum_quantity,
            is_b2b: newProduct.is_b2b,
            type: newProduct.type
          }])
          .select();

        if (error) throw error;
        
        toast({
          title: "Product created",
          description: `${newProduct.name} has been successfully created.`
        });
      }      // Reset form and refresh products
      setEditingProduct(null);
      setNewProduct({
        name: '',
        description: '',
        price: 0,
        stock_quantity: 0,
        image_url: [] as string[],
        b2b_price: 0,
        b2b_minimum_quantity: 25,
        is_b2b: false,
        type: 'Fruits', // Reset to default type
      });
      setCurrentImageUrl('');
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Error saving product",
        description: "There was an error saving the product. Please try again.",
        variant: "destructive"
      });
    }
  };
  // Handle product edit
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      description: product.description,
      price: product.price,
      stock_quantity: product.stock_quantity,
      image_url: product.image_url,
      b2b_price: product.b2b_price || 0,
      b2b_minimum_quantity: product.b2b_minimum_quantity || 25,
      is_b2b: product.is_b2b || false,
      type: product.type || 'Fruits', // Include type with default fallback
    });
  };

  // Handle product delete
  const handleDeleteProduct = async (productId: number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      
      toast({
        title: "Product deleted",
        description: "The product has been successfully deleted."
      });
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error deleting product",
        description: "There was an error deleting the product. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle order status update
  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status,
          updated_at: new Date()
        })
        .eq('id', orderId);

      if (error) throw error;
      
      toast({
        title: "Order status updated",
        description: `Order #${orderId} status changed to ${status}.`
      });
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error updating order",
        description: "There was an error updating the order status. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Loading state
  if (loading.adminCheck) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Access denied
  if (!isAdmin) {
    return null; // The useEffect will handle redirect
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-6">
        <h1 className="text-3xl font-bold mb-6 text-primary">Admin Dashboard</h1>
        
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="products" className="flex items-center">
              <Package className="mr-2 h-4 w-4" /> Products
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center">
              <ShoppingBag className="mr-2 h-4 w-4" /> Orders
            </TabsTrigger>
          </TabsList>
          
          {/* Products Tab */}
          <TabsContent value="products">
            <div className="bg-card rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Product Form Left Column */}
                <div className="space-y-4">                  <div>
                    <label className="block text-sm font-medium mb-1">Name *</label>
                    <input 
                      type="text" 
                      value={newProduct.name} 
                      onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:outline-none"
                      placeholder="Product name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Type *</label>
                    <select
                      value={newProduct.type}
                      onChange={(e) => setNewProduct({...newProduct, type: e.target.value})}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:outline-none"
                      required
                    >
                      <option value="Fruits">Fruits</option>
                      <option value="Vegetables">Vegetables</option>
                      <option value="Leaves">Leaves</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Price (₹) *</label>
                    <input 
                      type="number" 
                      value={newProduct.price} 
                      onChange={(e) => setNewProduct({...newProduct, price: parseFloat(e.target.value)})}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:outline-none"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Stock Quantity *</label>
                    <input 
                      type="number" 
                      value={newProduct.stock_quantity} 
                      onChange={(e) => setNewProduct({...newProduct, stock_quantity: parseInt(e.target.value)})}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:outline-none"
                      placeholder="0"
                      min="0"
                      required
                    />
                  </div>
                    <div>
                    <label className="block text-sm font-medium mb-1">Product Images *</label>
                    <div className="flex gap-2 mb-2">
                      <input 
                        type="text" 
                        value={currentImageUrl}
                        onChange={(e) => setCurrentImageUrl(e.target.value)}
                        className="flex-grow p-2 border rounded focus:ring-2 focus:ring-primary focus:outline-none"
                        placeholder="https://example.com/image.png"
                      />
                      <button 
                        className="bg-primary text-white p-2 rounded hover:bg-primary/80"
                        title="Add image"
                        type="button"
                        onClick={() => {
                          if (currentImageUrl && /\.(jpeg|jpg|png|gif|webp|svg)$/i.test(currentImageUrl)) {
                            const updatedUrls = Array.isArray(newProduct.image_url) 
                              ? [...newProduct.image_url, currentImageUrl]
                              : [currentImageUrl];
                            
                            setNewProduct({...newProduct, image_url: updatedUrls});
                            setCurrentImageUrl('');
                          } else {
                            toast({
                              title: "Invalid image URL",
                              description: "Image URL must end with a valid image extension (.jpeg, .png, .webp, etc).",
                              variant: "destructive"
                            });
                          }
                        }}
                      >
                        <ImagePlus size={20} />
                      </button>
                    </div>
                    
                    {/* Image Gallery */}
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {Array.isArray(newProduct.image_url) && newProduct.image_url.map((url, index) => (
                        <div key={index} className="relative group border rounded p-1">
                          <img 
                            src={url} 
                            alt={`Product image ${index + 1}`} 
                            className="h-16 w-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/static/images/product-placeholder.png';
                            }}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <button
                              type="button"
                              onClick={() => {
                                const updatedUrls = Array.isArray(newProduct.image_url) 
                                  ? newProduct.image_url.filter((_, i) => i !== index)
                                  : [];
                                setNewProduct({...newProduct, image_url: updatedUrls});
                              }}
                              className="p-1 bg-red-500 rounded-full"
                            >
                              <Trash2 size={16} className="text-white" />
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      {/* Empty state if no images */}
                      {(!Array.isArray(newProduct.image_url) || newProduct.image_url.length === 0) && (
                        <div className="border rounded p-4 col-span-2 flex flex-col items-center justify-center text-muted-foreground">
                          <ImagePlus size={24} className="mb-1" />
                          <p className="text-xs">No images added yet</p>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-1">
                      Add multiple images. First image will be the main product image.
                    </p>
                  </div>
                </div>
                
                {/* Product Form Right Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">B2B Price (₹) *</label>
                    <input 
                      type="number" 
                      value={newProduct.b2b_price} 
                      onChange={(e) => setNewProduct({...newProduct, b2b_price: parseFloat(e.target.value)})}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:outline-none"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">B2B Minimum Quantity *</label>
                    <input 
                      type="number" 
                      value={newProduct.b2b_minimum_quantity} 
                      onChange={(e) => setNewProduct({...newProduct, b2b_minimum_quantity: parseInt(e.target.value)})}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:outline-none"
                      placeholder="25"
                      min="1"
                      required
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="is_b2b" 
                      checked={newProduct.is_b2b} 
                      onChange={(e) => setNewProduct({...newProduct, is_b2b: e.target.checked})}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <label htmlFor="is_b2b" className="ml-2 block text-sm">
                      Available for B2B
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea 
                      value={newProduct.description || ''} 
                      onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:outline-none"
                      placeholder="Product description"
                      rows={5}
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3">                <button 
                  onClick={() => {
                    setEditingProduct(null);
                    setNewProduct({
                      name: '',
                      description: '',
                      price: 0,
                      stock_quantity: 0,
                      image_url: [] as string[],
                      b2b_price: 0,
                      b2b_minimum_quantity: 25,
                      is_b2b: false,
                      type: 'Fruits', // Reset to default type
                    });
                    setCurrentImageUrl('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveProduct}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 flex items-center"
                >
                  <Save size={18} className="mr-1" />
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </div>
            
            {/* Product List */}
            <div className="bg-card rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b flex flex-col md:flex-row items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">Products</h2>                <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                  <div className="relative flex-grow md:max-w-xs">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input 
                      type="text"
                      placeholder="Search products..."
                      className="w-full pl-10 pr-4 py-2 border rounded-md"
                      value={productSearchTerm}
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                    />
                  </div>
                  <select
                    value={productTypeFilter}
                    onChange={(e) => setProductTypeFilter(e.target.value)}
                    className="py-2 px-3 border rounded-md"
                    title="Filter by type"
                  >
                    <option value="all">All Types</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Vegetables">Vegetables</option>
                    <option value="Leaves">Leaves</option>
                  </select>
                  <button 
                    onClick={fetchProducts} 
                    className="p-2 border rounded-md hover:bg-gray-100"
                    title="Refresh products"
                  >
                    <RefreshCw size={20} className={loading.products ? "animate-spin" : ""} />
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">B2B Details</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">                    {loading.products ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                          Loading products...
                        </td>
                      </tr>
                    ) : filteredProducts.length > 0 ? (
                      filteredProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">                          <td className="px-6 py-4 whitespace-nowrap">
                            {product.image_url ? (
                              <div className="relative group">
                                <img                                  src={
                                    Array.isArray(product.image_url) && product.image_url.length > 0
                                      ? product.image_url[0]
                                      : typeof product.image_url === 'string'
                                        ? product.image_url
                                        : `/static/images/${product.type?.toLowerCase() || 'product'}-placeholder.jpg`
                                  }
                                  alt={product.name} 
                                  className="h-12 w-12 object-contain bg-white rounded"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/static/images/product-placeholder.png';
                                  }}
                                />
                                {Array.isArray(product.image_url) && product.image_url.length > 1 && (
                                  <span className="absolute -top-1 -right-1 bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                                    {product.image_url.length}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
                                <Package size={24} className="text-gray-400" />
                              </div>
                            )}
                          </td><td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {product.description?.substring(0, 50)}{product.description?.length > 50 ? '...' : ''}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {product.type || 'Unspecified'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">₹{product.price.toLocaleString('en-IN')}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span 
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                product.stock_quantity > 10 
                                  ? 'bg-green-100 text-green-800' 
                                  : product.stock_quantity > 0 
                                    ? 'bg-yellow-100 text-yellow-800' 
                                    : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {product.stock_quantity}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.is_b2b ? (
                              <>
                                <div>Price: ₹{product.b2b_price?.toLocaleString('en-IN') || 'N/A'}</div>
                                <div>Min Qty: {product.b2b_minimum_quantity || 'N/A'}</div>
                              </>
                            ) : (
                              <span className="text-gray-400">Not available for B2B</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button 
                              onClick={() => handleEditProduct(product)}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              <Edit size={18} />
                            </button>
                            <button 
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                          No products found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
          
          {/* Orders Tab */}
          <TabsContent value="orders">
            <div className="bg-card rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b flex flex-col md:flex-row items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">Orders</h2>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <div className="relative flex-grow md:max-w-xs">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input 
                      type="text"
                      placeholder="Search orders..."
                      className="w-full pl-10 pr-4 py-2 border rounded-md"
                      value={orderSearchTerm}
                      onChange={(e) => setOrderSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="relative flex-grow md:max-w-xs">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <select
                      className="w-full pl-10 pr-4 py-2 border rounded-md appearance-none"
                      value={orderStatusFilter}
                      onChange={(e) => setOrderStatusFilter(e.target.value)}
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <button 
                    onClick={fetchOrders} 
                    className="p-2 border rounded-md hover:bg-gray-100"
                    title="Refresh orders"
                  >
                    <RefreshCw size={20} className={loading.orders ? "animate-spin" : ""} />
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading.orders ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                          Loading orders...
                        </td>
                      </tr>
                    ) : filteredOrders.length > 0 ? (
                      filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">#{order.id}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {order.user_details?.full_name || 'Anonymous'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.user_details?.mobile_number || 'No phone'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(order.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(order.created_at).toLocaleTimeString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              ₹{order.total_amount.toLocaleString('en-IN')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {order.items.length} items
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              order.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                              order.status === 'processing' ? 'bg-blue-100 text-blue-800' : 
                              'bg-red-100 text-red-800'
                            }`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                            <div className="text-xs text-gray-500 mt-1">
                              Payment: {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <details className="relative inline-block text-left">
                              <summary className="cursor-pointer px-3 py-1 bg-gray-100 rounded-md hover:bg-gray-200">
                                Update Status
                              </summary>
                              <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                                <div className="py-1" role="menu">
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order.id, 'pending')}
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                    role="menuitem"
                                  >
                                    <Clock size={18} className="mr-2 text-yellow-500" />
                                    Pending
                                  </button>
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order.id, 'processing')}
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                    role="menuitem"
                                  >
                                    <RefreshCw size={18} className="mr-2 text-blue-500" />
                                    Processing
                                  </button>
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                    role="menuitem"
                                  >
                                    <CheckCircle size={18} className="mr-2 text-green-500" />
                                    Delivered
                                  </button>
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                    role="menuitem"
                                  >
                                    <XCircle size={18} className="mr-2 text-red-500" />
                                    Cancelled
                                  </button>
                                </div>
                              </div>
                            </details>
                            <div>
                              <button
                                onClick={() => alert('Order details: ' + JSON.stringify(order.items))}
                                className="text-xs text-blue-600 hover:text-blue-900 mt-1 block"
                              >
                                View Items
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                          No orders found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPage;
