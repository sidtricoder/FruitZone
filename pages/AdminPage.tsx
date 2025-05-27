import React, { useState, useEffect } from 'react';
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
  image_url: string;
  created_at: string;
  updated_at: string;
  b2b_price: number;
  b2b_minimum_quantity: number;
  is_b2b: boolean;
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
    email: string;
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
  });
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [isAdmin, setIsAdmin] = useState(false);

  // New product state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    stock_quantity: 0,
    image_url: '',
    b2b_price: 0,
    b2b_minimum_quantity: 25,
    is_b2b: false,
  });

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!isAuthenticated || !user) {
        setLoading({...loading, adminCheck: false});
        setIsAdmin(false);
        navigate('/auth'); // Redirect to login if not authenticated
        return;
      }      try {
        // Check if user has admin role using the admin_or_not field
        const { data, error } = await supabase
          .from('users')
          .select('admin_or_not')
          .eq('id', user.id)
          .single();

        if (error || !data || !data.admin_or_not) {
          console.error("Not an admin user:", error);
          setIsAdmin(false);
          navigate('/'); // Redirect non-admin users to home
          toast({
            title: "Access Denied",
            description: "You don't have permission to access the admin area.",
            variant: "destructive"
          });
        } else {
          setIsAdmin(true);
          fetchProducts();
          fetchOrders();
        }
      } catch (error) {
        console.error("Admin check error:", error);
        setIsAdmin(false);
        navigate('/');
      } finally {
        setLoading({...loading, adminCheck: false});
      }
    };

    checkAdminStatus();
  }, [isAuthenticated, user]);

  // Fetch products
  const fetchProducts = async () => {
    setLoading({...loading, products: true});
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
      setLoading({...loading, products: false});
    }
  };

  // Fetch orders with items and user details
  const fetchOrders = async () => {
    setLoading({...loading, orders: true});
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
          }
          // Get user details
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('full_name, mobile_number, email')
          .eq('id', order.user_id)
          .single();
          
        if (userError) {
          console.error('Error fetching user details:', userError);
          // Continue processing even if we can't get user details
          // This prevents the entire orders fetch from failing
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
      setLoading({...loading, orders: false});
    }
  };

  // Handle product search
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(productSearchTerm.toLowerCase())
  );

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
  const handleSaveProduct = async () => {
    try {
      // Form validation
      if (!newProduct.name || !newProduct.price) {
        toast({
          title: "Missing required fields",
          description: "Please fill in all required fields.",
          variant: "destructive"
        });
        return;
      }

      // Validate image URL
      if (newProduct.image_url && 
          !(/\.(jpeg|jpg|png|gif|webp|svg)$/i.test(newProduct.image_url))) {
        toast({
          title: "Invalid image URL",
          description: "Image URL must end with a valid image extension (.jpeg, .png, .webp, etc).",
          variant: "destructive"
        });
        return;
      }      if (editingProduct) {
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
            is_b2b: newProduct.is_b2b
          })
          .eq('id', editingProduct.id)
          .select();

        if (error) throw error;
        
        toast({
          title: "Product updated",
          description: `${newProduct.name} has been successfully updated.`
        });      } else {
        // Create new product
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
            is_b2b: newProduct.is_b2b
          }])
          .select();

        if (error) throw error;
        
        toast({
          title: "Product created",
          description: `${newProduct.name} has been successfully created.`
        });
      }

      // Reset form and refresh products
      setEditingProduct(null);
      setNewProduct({
        name: '',
        description: '',
        price: 0,
        stock_quantity: 0,
        image_url: '',
        b2b_price: 0,
        b2b_minimum_quantity: 25,
        is_b2b: false,
      });
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
                <div className="space-y-4">
                  <div>
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
                    <label className="block text-sm font-medium mb-1">Image URL *</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newProduct.image_url} 
                        onChange={(e) => setNewProduct({...newProduct, image_url: e.target.value})}
                        className="flex-grow p-2 border rounded focus:ring-2 focus:ring-primary focus:outline-none"
                        placeholder="https://example.com/image.png"
                        required
                      />
                      <button 
                        className="bg-primary text-white p-2 rounded hover:bg-primary/80"
                        title="Preview image"
                        onClick={() => {
                          if (newProduct.image_url) {
                            window.open(newProduct.image_url, '_blank');
                          }
                        }}
                      >
                        <ImagePlus size={20} />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Must end with an image extension (.jpg, .png, .webp, etc)
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
              
              <div className="mt-6 flex justify-end gap-3">
                <button 
                  onClick={() => {
                    setEditingProduct(null);
                    setNewProduct({
                      name: '',
                      description: '',
                      price: 0,
                      stock_quantity: 0,
                      image_url: '',
                      b2b_price: 0,
                      b2b_minimum_quantity: 25,
                      is_b2b: false,
                    });
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
                <h2 className="text-xl font-semibold">Products</h2>
                <div className="flex items-center gap-2 w-full md:w-auto">
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
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">B2B Details</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading.products ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                          Loading products...
                        </td>
                      </tr>
                    ) : filteredProducts.length > 0 ? (
                      filteredProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            {product.image_url ? (
                              <img 
                                src={product.image_url} 
                                alt={product.name} 
                                className="h-12 w-12 object-cover rounded"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/static/images/product-placeholder.png';
                                }}
                              />
                            ) : (
                              <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
                                <Package size={24} className="text-gray-400" />
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {product.description?.substring(0, 50)}{product.description?.length > 50 ? '...' : ''}
                            </div>
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
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
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
                            <div className="text-xs text-gray-500">
                              {order.user_details?.email || 'No email'}
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
