import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, ShoppingBag, Edit, Trash2, Search, 
  CheckCircle, XCircle, Filter, Save, ImagePlus, RefreshCw,
  Percent, Info // Added Percent and Info icons
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';

// Define NutrientInfo if not already available (e.g. from ShopPage or a global types file)
interface NutrientInfo {
  energy_kcal?: string;
  carbohydrates_g?: string;
  dietary_fiber_g?: string;
  saturated_fat_g?: string;
  protein_g?: string;
  total_fat_g?: string;
  [key: string]: string | undefined;
}

// Updated Product interface consistent with ShopPage.tsx
interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number; // This is 'x', the discounted price set by admin
  image_url: string | string[]; 
  type: string;
  // New fields from Product interface update
  brand?: string;
  origin?: string;
  bbe?: string; // Best Before End
  delivery_info?: string; // Delivery information
  discount_percentage?: number | null; // 'z', discount percentage
  discount_reason?: string | null; // Reason for the discount
  nutrient_info?: NutrientInfo | null; // Nutrient information object
  // Existing fields from AdminPage
  stock_quantity: number;
  created_at: string;
  updated_at: string;
  b2b_price?: number | null; // Changed to optional and allow null
  b2b_minimum_quantity?: number | null; // Changed to optional and allow null
  is_b2b?: boolean; // Changed to optional
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
  const [ordersState, setOrdersState] = useState<Order[]>([]); // Renamed orders to ordersState
  const [loading, setLoading] = useState({
    products: false,
    orders: false,
    adminCheck: true,
    discounts: false, // Added loading state for discounts
    nutrients: false, // Added loading state for nutrients
  });
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productTypeFilter, setProductTypeFilter] = useState('all');
  const [orderSearchTermState, setOrderSearchTermState] = useState(''); // Defined orderSearchTermState
  const [orderStatusFilterState, setOrderStatusFilterState] = useState('all'); // Defined orderStatusFilterState
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // State for managing nutrient info form for a selected product
  const [editingNutrientsForProduct, setEditingNutrientsForProduct] = useState<Product | null>(null);
  const [currentNutrientInfo, setCurrentNutrientInfo] = useState<NutrientInfo>({});

  // State for managing discount form for a selected product
  const [editingDiscountForProduct, setEditingDiscountForProduct] = useState<Product | null>(null);
  const [currentDiscountPercentage, setCurrentDiscountPercentage] = useState<number | string>('');
  const [currentDiscountReason, setCurrentDiscountReason] = useState<string>('');


  const initialNewProductState: Partial<Product> = {
    name: '',
    description: '',
    price: 0,
    stock_quantity: 0,
    image_url: [] as string[],
    b2b_price: null,
    b2b_minimum_quantity: 25,
    is_b2b: false,
    type: 'Fruits',
    brand: '',
    origin: '',
    bbe: '',
    delivery_info: '',
    discount_percentage: null,
    discount_reason: '',
    nutrient_info: { // Define default keys for nutrient_info
      energy_kcal: '',
      carbohydrates_g: '',
      dietary_fiber_g: '',
      saturated_fat_g: '',
      protein_g: '',
      total_fat_g: '',
    },
  };
  const [newProduct, setNewProduct] = useState<Partial<Product>>(initialNewProductState);
  
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  
  const fetchProducts = useCallback(async () => {
    setLoading(prev => ({...prev, products: true, discounts: true, nutrients: true})); // Also set discount/nutrient loading
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*') // Ensure all new fields are selected if they exist in DB
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setProducts(data as Product[] || []); // Cast to Product[]
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast({ title: "Error fetching products", description: "There was an error loading products.", variant: "destructive" });
    } finally {
      setLoading(prev => ({...prev, products: false, discounts: false, nutrients: false}));
    }
  }, [toast]);

  const fetchOrders = useCallback(async () => {
    setLoading(prev => ({...prev, orders: true}));
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (ordersError) throw ordersError;

      const completeOrders = await Promise.all((ordersData || []).map(async (order) => {
        try {
          const { data: itemsData, error: itemsError } = await supabase
            .from('order_items')
            .select('*, product:product_id(name, image_url)')
            .eq('order_id', order.id);
          if (itemsError) { console.error('Error fetching order items:', itemsError); return { ...order, items: [], user_details: undefined }; }
          
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('full_name, mobile_number')
            .eq('id', order.user_id)
            .single();
          if (userError) { console.error('Error fetching user details:', userError); }

          const items = (itemsData || []).map(item => ({
            id: item.id,
            order_id: item.order_id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            product_name: item.product ? item.product.name : 'Unknown Product',
            product_image: item.product ? (Array.isArray(item.product.image_url) ? item.product.image_url[0] : item.product.image_url) : undefined,
          }));
          return { ...order, items, user_details: userData || undefined };
        } catch (orderError) {
          console.error(`Error processing order ${order.id}:`, orderError);
          return { ...order, items: [], user_details: undefined };
        }
      }));
      setOrdersState(completeOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({ title: "Error fetching orders", description: "There was an error loading orders.", variant: "destructive" });
    } finally {
      setLoading(prev => ({...prev, orders: false}));
    }
  }, [toast]);

  useEffect(() => {
    let isMounted = true;
    setLoading(prev => ({...prev, adminCheck: true}));
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        setLoading(prev => ({...prev, adminCheck: false}));
        toast({ title: "Admin check taking longer than expected", description: "Please wait or try refreshing.", variant: "default" });
      }
    }, 8000);

    const checkAdminStatus = async () => {
      if (!isAuthenticated || !user) {
        if (isMounted) { clearTimeout(timeoutId); setLoading(prev => ({...prev, adminCheck: false})); setIsAdmin(false); navigate('/auth'); }
        return;
      }
      if (user.admin_or_not === true) {
        if (isMounted) { clearTimeout(timeoutId); setIsAdmin(true); setLoading(prev => ({...prev, adminCheck: false})); fetchProducts(); fetchOrders(); }
        return;
      }
      try {
        const { data, error } = await supabase.from('users').select('admin_or_not').eq('id', user.id).single();
        if (!isMounted) return;
        clearTimeout(timeoutId);
        if (error) {
          setIsAdmin(false); setLoading(prev => ({...prev, adminCheck: false})); navigate('/');
          toast({ title: "Database Error", description: "Could not verify admin status.", variant: "destructive" });
          return;
        }
        if (!data || data.admin_or_not !== true) {
          setIsAdmin(false); setLoading(prev => ({...prev, adminCheck: false})); navigate('/');
          toast({ title: "Access Denied", description: "You don't have permission.", variant: "destructive" });
        } else {
          setIsAdmin(true); setLoading(prev => ({...prev, adminCheck: false})); fetchProducts(); fetchOrders();
        }
      } catch (error) {
        if (!isMounted) return;
        clearTimeout(timeoutId); setIsAdmin(false); setLoading(prev => ({...prev, adminCheck: false})); navigate('/');
        toast({ title: "Error", description: "Error checking admin status.", variant: "destructive" });
      }
    };
    checkAdminStatus();
    return () => { isMounted = false; clearTimeout(timeoutId); };
  }, [isAuthenticated, user, navigate, toast, fetchProducts, fetchOrders]);

  // Helper to get the first image URL for display
  const getDisplayImageUrl = (imageUrl: string | string[] | null, productType?: string): string => {
    const type = productType?.toLowerCase() || 'product';
    const defaultPlaceholder = `/static/images/${type}-placeholder.jpg`;
    if (Array.isArray(imageUrl) && imageUrl.length > 0 && typeof imageUrl[0] === 'string') {
      return imageUrl[0];
    }
    if (typeof imageUrl === 'string') {
      if (imageUrl.startsWith('[') && imageUrl.endsWith(']')) {
        try {
          const parsed = JSON.parse(imageUrl);
          if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
            return parsed[0];
          }
        } catch (e) {
          console.error("Failed to parse image_url JSON string in getDisplayImageUrl:", e);
          return defaultPlaceholder;
        }
      } else if (imageUrl.trim() !== "") {
        return imageUrl;
      }
    }
    return defaultPlaceholder;
  };

  // Handle adding an image URL
  const handleAddImageUrl = () => {
    if (currentImageUrl.trim() !== "") {
      if (!(/\.(jpeg|jpg|png|gif|webp|svg)$/i.test(currentImageUrl))) {
        toast({ title: "Invalid Image URL", description: "URL must end with valid extension.", variant: "destructive" });
        return;
      }
      const currentImages = Array.isArray(newProduct.image_url) ? newProduct.image_url : [];
      setNewProduct(prev => ({ ...prev, image_url: [...currentImages, currentImageUrl.trim()] }));
      setCurrentImageUrl('');
    }
  };

  // Handle removing an image URL
  const handleRemoveImageUrl = (idx: number) => {
    if (Array.isArray(newProduct.image_url)) {
      const updatedImageUrls = newProduct.image_url.filter((_, i) => i !== idx);
      setNewProduct(prev => ({ ...prev, image_url: updatedImageUrls }));
    }
  };
  
  const filteredProducts = products.filter(product => 
    (product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    (product.description || '').toLowerCase().includes(productSearchTerm.toLowerCase())) &&
    (productTypeFilter === 'all' || product.type === productTypeFilter)
  );

  const filteredOrdersState = ordersState.filter(order => // Defined filteredOrdersState using ordersState
    (order.user_details?.full_name?.toLowerCase().includes(orderSearchTermState.toLowerCase()) ||
    order.user_details?.mobile_number?.includes(orderSearchTermState) ||
    order.id.toString().includes(orderSearchTermState)) &&
    (orderStatusFilterState === 'all' || order.status === orderStatusFilterState)
  );

  const handleSaveProduct = async () => {
    try {
      if (!newProduct.name || !newProduct.price || !newProduct.type) {
        toast({ title: "Missing required fields", description: "Name, Type, and Price are required.", variant: "destructive" });
        return;
      }
      if (!newProduct.image_url || (Array.isArray(newProduct.image_url) && newProduct.image_url.length === 0)) {
        toast({ title: "Image required", description: "Please add at least one product image.", variant: "destructive" });
        return;
      }
      if (Array.isArray(newProduct.image_url)) {
        const invalidUrls = newProduct.image_url.filter(url => !(/\.(jpeg|jpg|png|gif|webp|svg)$/i.test(url)));
        if (invalidUrls.length > 0) {
          toast({ title: "Invalid image URL", description: "All URLs must be valid image links.", variant: "destructive" });
          return;
        }
      }

      const productData = {
        name: newProduct.name,
        description: newProduct.description,
        price: newProduct.price,
        stock_quantity: newProduct.stock_quantity,
        image_url: newProduct.image_url,
        b2b_price: newProduct.b2b_price,
        b2b_minimum_quantity: newProduct.b2b_minimum_quantity,
        is_b2b: newProduct.is_b2b,
        type: newProduct.type,
        brand: newProduct.brand,
        origin: newProduct.origin,
        bbe: newProduct.bbe,
        delivery_info: newProduct.delivery_info,
        // discount_percentage and discount_reason are managed in their own section
        // nutrient_info is managed in its own section
        updated_at: new Date(),
      };

      if (editingProduct) {
        const { error } = await supabase.from('products').update(productData).eq('id', editingProduct.id).select();
        if (error) throw error;
        toast({ title: "Product updated", description: `${newProduct.name} updated.` });
      } else {
        // For new products, ensure discount and nutrient fields are initialized if needed, or handled post-creation
        const finalProductData = {
            ...productData,
            discount_percentage: newProduct.discount_percentage || null,
            discount_reason: newProduct.discount_reason || null,
            nutrient_info: newProduct.nutrient_info || {},
            created_at: new Date(), // Also add created_at for new products
        };
        const { error } = await supabase.from('products').insert([finalProductData]).select();
        if (error) throw error;
        toast({ title: "Product created", description: `${newProduct.name} created.` });
      }
      setEditingProduct(null);
      setNewProduct(initialNewProductState);
      setCurrentImageUrl('');
      fetchProducts();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast({ title: "Error saving product", description: error.message || "Please try again.", variant: "destructive" });
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      description: product.description,
      price: product.price,
      stock_quantity: product.stock_quantity,
      image_url: product.image_url,
      b2b_price: product.b2b_price,
      b2b_minimum_quantity: product.b2b_minimum_quantity,
      is_b2b: product.is_b2b,
      type: product.type,
      brand: product.brand,
      origin: product.origin,
      bbe: product.bbe,
      delivery_info: product.delivery_info,
      // discount_percentage, discount_reason, and nutrient_info are handled separately
      // So, we don't load them into the main product form here to avoid confusion.
      // They will be displayed in the product list and editable via their dedicated forms.
    });
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
      toast({ title: "Product deleted", description: "Product successfully deleted." });
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({ title: "Error deleting product", description: "Please try again.", variant: "destructive" });
    }
  };

  const handleUpdateOrderStatusState = async (orderId: number, status: string) => { // Defined handleUpdateOrderStatusState
    try {
      const { error } = await supabase.from('orders').update({ status, updated_at: new Date() }).eq('id', orderId);
      if (error) throw error;
      toast({ title: "Order status updated", description: `Order #${orderId} status changed to ${status}.` });
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({ title: "Error updating order", description: "Please try again.", variant: "destructive" });
    }
  };

  // Handle saving nutrient information
  const handleSaveNutrientInfo = async () => {
    if (!editingNutrientsForProduct) return;
    setLoading(prev => ({...prev, nutrients: true}));
    try {
      const { error } = await supabase
        .from('products')
        .update({ nutrient_info: currentNutrientInfo, updated_at: new Date() })
        .eq('id', editingNutrientsForProduct.id);
      if (error) throw error;
      toast({ title: "Nutrient Info Saved", description: `Nutrients for ${editingNutrientsForProduct.name} updated.` });
      setEditingNutrientsForProduct(null);
      setCurrentNutrientInfo({});
      fetchProducts(); // Refresh product list
    } catch (error: any) {
      console.error('Error saving nutrient info:', error);
      toast({ title: "Error Saving Nutrients", description: error.message || "Could not save nutrient information.", variant: "destructive" });
    } finally {
      setLoading(prev => ({...prev, nutrients: false}));
    }
  };

  // Handle opening nutrient edit modal/form
  const handleEditNutrients = (product: Product) => {
    setEditingNutrientsForProduct(product);
    // Ensure all default nutrient keys are present when initializing currentNutrientInfo
    const defaultNutrientKeys = initialNewProductState.nutrient_info || {};
    const existingNutrientInfo = product.nutrient_info || {};
    const mergedNutrientInfo = { ...defaultNutrientKeys, ...existingNutrientInfo };
    setCurrentNutrientInfo(mergedNutrientInfo);
  };

  // Handle saving discount information
  const handleSaveDiscountInfo = async () => {
    if (!editingDiscountForProduct) return;
    setLoading(prev => ({...prev, discounts: true}));
    try {
      const percentage = parseFloat(currentDiscountPercentage as string);
      if (isNaN(percentage) || percentage < 0 || percentage > 100) {
        toast({ title: "Invalid Discount", description: "Percentage must be between 0 and 100.", variant: "destructive" });
        setLoading(prev => ({...prev, discounts: false}));
        return;
      }
      const { error } = await supabase
        .from('products')
        .update({
          discount_percentage: percentage,
          discount_reason: currentDiscountReason,
          updated_at: new Date()
        })
        .eq('id', editingDiscountForProduct.id);
      if (error) throw error;
      toast({ title: "Discount Info Saved", description: `Discount for ${editingDiscountForProduct.name} updated.` });
      setEditingDiscountForProduct(null);
      setCurrentDiscountPercentage('');
      setCurrentDiscountReason('');
      fetchProducts(); // Refresh product list
    } catch (error: any) {
      console.error('Error saving discount info:', error);
      toast({ title: "Error Saving Discount", description: error.message || "Could not save discount information.", variant: "destructive" });
    } finally {
      setLoading(prev => ({...prev, discounts: false}));
    }
  };

  // Handle opening discount edit modal/form
  const handleEditDiscount = (product: Product) => {
    setEditingDiscountForProduct(product);
    setCurrentDiscountPercentage(product.discount_percentage?.toString() || '');
    setCurrentDiscountReason(product.discount_reason || '');
  };

  if (loading.adminCheck) {
    return <div className="flex items-center justify-center min-h-screen bg-background"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div><p className="ml-4 text-lg text-muted-foreground">Verifying access...</p></div>;
  }
  if (!isAdmin) {
    return <div className="flex items-center justify-center min-h-screen bg-background"><p className="text-lg text-destructive">Access Denied. Redirecting...</p></div>;
  }
  
  const productTypes = ['Fruits', 'Vegetables', 'Dairy', 'Bakery', 'Meat', 'Beverages', 'Snacks', 'Other'];
  // const orderStatuses = ['all', 'pending', 'processing', 'delivered', 'cancelled']; // Commented out as orderStatuses is unused

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 pt-20 md:pt-24">
      <header className="mb-8"><h1 className="text-3xl md:text-4xl font-bold text-primary text-center">Admin Dashboard</h1></header>
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6 bg-card shadow-sm">
          <TabsTrigger value="products" className="py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Package className="w-5 h-5 mr-2" /> Products</TabsTrigger>
          <TabsTrigger value="orders" className="py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><ShoppingBag className="w-5 h-5 mr-2" /> Orders</TabsTrigger>
          <TabsTrigger value="discounts" className="py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Percent className="w-5 h-5 mr-2" /> Discounts</TabsTrigger>
          <TabsTrigger value="nutrients" className="py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Info className="w-5 h-5 mr-2" /> Nutrients</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <div className="bg-card p-4 md:p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-primary mb-6">Product Management</h2>
            {/* Product Add/Edit Form - MODIFIED to include new fields */}
            <div className="mb-8 p-4 md:p-6 border border-border rounded-lg bg-muted/30">
              <h3 className="text-xl font-semibold text-foreground mb-4">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <form onSubmit={(e) => { e.preventDefault(); handleSaveProduct(); }} className="space-y-4">
                {/* Product Name and Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="productName" className="block text-sm font-medium mb-1 text-foreground">Product Name *</label>
                    <input id="productName" type="text" placeholder="e.g., Organic Apples" className="w-full p-2 border border-border rounded-md focus:ring-amber-500 focus:border-amber-500 bg-input text-foreground placeholder:text-muted-foreground" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} required />
                  </div>
                  <div>
                    <label htmlFor="productType" className="block text-sm font-medium mb-1 text-foreground">Product Type *</label>
                    <select id="productType" className="w-full p-2 border border-border rounded-md focus:ring-amber-500 focus:border-amber-500 bg-input text-foreground" value={newProduct.type} onChange={(e) => setNewProduct({...newProduct, type: e.target.value})} required>
                      {productTypes.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </div>
                </div>
                {/* Description */}
                <div>
                  <label htmlFor="productDescription" className="block text-sm font-medium mb-1 text-foreground">Description</label>
                  <textarea id="productDescription" placeholder="Detailed product description" className="w-full p-2 border border-border rounded-md focus:ring-amber-500 focus:border-amber-500 bg-input text-foreground placeholder:text-muted-foreground" rows={3} value={newProduct.description || ''} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}></textarea>
                </div>
                {/* Price and Stock */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="productPrice" className="block text-sm font-medium mb-1 text-foreground">Price (₹) *</label>
                    <input id="productPrice" type="number" placeholder="0.00" min="0" step="0.01" className="w-full p-2 border border-border rounded-md focus:ring-amber-500 focus:border-amber-500 bg-input text-foreground placeholder:text-muted-foreground" value={newProduct.price ?? ''} onChange={(e) => setNewProduct({...newProduct, price: parseFloat(e.target.value) || 0})} required />
                  </div>
                  <div>
                    <label htmlFor="productStock" className="block text-sm font-medium mb-1 text-foreground">Stock Quantity</label>
                    <input id="productStock" type="number" placeholder="0" min="0" className="w-full p-2 border border-border rounded-md focus:ring-amber-500 focus:border-amber-500 bg-input text-foreground placeholder:text-muted-foreground" value={newProduct.stock_quantity ?? ''} onChange={(e) => setNewProduct({...newProduct, stock_quantity: parseInt(e.target.value) || 0})} />
                  </div>
                </div>

                {/* Brand and Origin */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="productBrand" className="block text-sm font-medium mb-1 text-foreground">Brand</label>
                    <input id="productBrand" type="text" placeholder="e.g., FarmFresh" className="w-full p-2 border border-border rounded-md focus:ring-amber-500 focus:border-amber-500 bg-input text-foreground placeholder:text-muted-foreground" value={newProduct.brand || ''} onChange={(e) => setNewProduct({...newProduct, brand: e.target.value})} />
                  </div>
                  <div>
                    <label htmlFor="productOrigin" className="block text-sm font-medium mb-1 text-foreground">Origin</label>
                    <input id="productOrigin" type="text" placeholder="e.g., Local Farms, India" className="w-full p-2 border border-border rounded-md focus:ring-amber-500 focus:border-amber-500 bg-input text-foreground placeholder:text-muted-foreground" value={newProduct.origin || ''} onChange={(e) => setNewProduct({...newProduct, origin: e.target.value})} />
                  </div>
                </div>

                {/* BBE and Delivery Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="productBBE" className="block text-sm font-medium mb-1 text-foreground">Best Before End (BBE)</label>
                    <input id="productBBE" type="text" placeholder="e.g., 3 months, DD/MM/YYYY" className="w-full p-2 border border-border rounded-md focus:ring-amber-500 focus:border-amber-500 bg-input text-foreground placeholder:text-muted-foreground" value={newProduct.bbe || ''} onChange={(e) => setNewProduct({...newProduct, bbe: e.target.value})} />
                  </div>
                  <div>
                    <label htmlFor="productDeliveryInfo" className="block text-sm font-medium mb-1 text-foreground">Delivery Information</label>
                    <input id="productDeliveryInfo" type="text" placeholder="e.g., Ships in 2-3 days" className="w-full p-2 border border-border rounded-md focus:ring-amber-500 focus:border-amber-500 bg-input text-foreground placeholder:text-muted-foreground" value={newProduct.delivery_info || ''} onChange={(e) => setNewProduct({...newProduct, delivery_info: e.target.value})} />
                  </div>
                </div>
                
                {/* Image URL Management */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">Product Images *</label>
                  <div className="flex items-center mb-2">
                    <input type="url" placeholder="Enter image URL (.jpg, .png, .webp)" className="flex-grow p-2 border border-border rounded-l-md focus:ring-amber-500 focus:border-amber-500 bg-input text-foreground placeholder:text-muted-foreground" value={currentImageUrl} onChange={(e) => setCurrentImageUrl(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddImageUrl();}}} />
                    <button type="button" onClick={handleAddImageUrl} className="p-2 bg-amber-500 text-white rounded-r-md hover:bg-amber-600 transition-colors flex items-center justify-center h-[42px] w-[42px]"> <ImagePlus size={20} /> </button>
                  </div>
                  <div className="space-y-2 mb-2 max-h-32 overflow-y-auto pr-2">
                    {Array.isArray(newProduct.image_url) && newProduct.image_url.map((url, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded-md border border-border">
                        <span className="text-xs text-muted-foreground truncate flex-grow mr-2" title={url}>{url}</span>
                        <button type="button" onClick={() => handleRemoveImageUrl(idx)} className="text-red-500 hover:text-red-700 p-1"> <Trash2 size={16} /> </button>
                      </div>
                    ))}
                  </div>
                  {(!newProduct.image_url || (Array.isArray(newProduct.image_url) && newProduct.image_url.length === 0)) && (<p className="text-xs text-muted-foreground">No images added. Add at least one URL.</p>)}
                </div>
                {/* B2B Fields */}
                <div className="pt-4 border-t border-border">
                  <h4 className="text-md font-semibold text-foreground mb-2">B2B Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="b2bPrice" className="block text-sm font-medium mb-1 text-foreground">B2B Price (₹)</label>
                      <input id="b2bPrice" type="number" placeholder="0.00" min="0" step="0.01" className="w-full p-2 border border-border rounded-md focus:ring-amber-500 focus:border-amber-500 bg-input text-foreground placeholder:text-muted-foreground" value={newProduct.b2b_price ?? ''} onChange={(e) => setNewProduct({...newProduct, b2b_price: parseFloat(e.target.value) || null})} />
                    </div>
                    <div>
                      <label htmlFor="b2bMinQuantity" className="block text-sm font-medium mb-1 text-foreground">B2B Min. Quantity (kg)</label>
                      <input id="b2bMinQuantity" type="number" placeholder="25" min="0" className="w-full p-2 border border-border rounded-md focus:ring-amber-500 focus:border-amber-500 bg-input text-foreground placeholder:text-muted-foreground" value={newProduct.b2b_minimum_quantity ?? ''} onChange={(e) => setNewProduct({...newProduct, b2b_minimum_quantity: parseInt(e.target.value) || null})} />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center">
                    <input id="isB2B" type="checkbox" className="h-4 w-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500 mr-2" checked={newProduct.is_b2b || false} onChange={(e) => setNewProduct({...newProduct, is_b2b: e.target.checked})} />
                    <label htmlFor="isB2B" className="text-sm font-medium text-foreground">Enable for B2B</label>
                  </div>
                </div>
                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-4">
                  {editingProduct && (<button type="button" onClick={() => { setEditingProduct(null); setNewProduct(initialNewProductState); setCurrentImageUrl(''); }} className="px-4 py-2 border border-border text-sm font-medium rounded-md hover:bg-muted transition-colors">Cancel Edit</button>)}
                  <button type="submit" className="px-6 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors flex items-center"> <Save size={18} className="mr-2"/> {editingProduct ? 'Update Product' : 'Create Product'} </button>
                </div>
              </form>
            </div>
            {/* Product List - MODIFIED to show new fields and add edit buttons for nutrients/discounts */}
            <div className="mb-6 flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-grow w-full md:w-auto">
                <input type="text" placeholder="Search products..." className="w-full p-3 pl-10 border border-border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-shadow bg-input text-foreground placeholder:text-muted-foreground" value={productSearchTerm} onChange={(e) => setProductSearchTerm(e.target.value)} />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              </div>
              <div className="relative flex-grow w-full md:w-auto">
                <select className="w-full p-3 pl-10 border border-border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none appearance-none bg-input text-foreground transition-shadow" value={productTypeFilter} onChange={(e) => setProductTypeFilter(e.target.value)}>
                  <option value="all">All Types</option>
                  {productTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              </div>
              <button onClick={() => { fetchProducts(); toast({ title: "Products Refreshed" }) }} className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center" title="Refresh Product List"> <RefreshCw size={18} /> </button>
            </div>
            {loading.products ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                <p className="ml-3 text-muted-foreground">Loading products...</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="min-w-full divide-y divide-border bg-card">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Image</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name/Brand</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type/Origin</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Price (₹)</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Stock</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Discount (%)</th>
                      {/* <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Nutrients</th> Removed for brevity, manage in new tab */}
                      <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredProducts.length > 0 ? filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-2">
                          <img src={getDisplayImageUrl(product.image_url, product.type)} alt={product.name} className="w-12 h-12 object-contain rounded-md bg-white border border-border p-0.5" onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => { const target = e.target as HTMLImageElement; target.src = getDisplayImageUrl(null, product.type); target.onerror = null; }} />
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap"><div className="text-sm font-medium text-foreground truncate max-w-[200px]" title={product.name}>{product.name}</div><div className="text-xs text-muted-foreground">{product.brand || 'N/A'}</div></td>
                        <td className="px-3 py-2 whitespace-nowrap"><div className="text-sm text-muted-foreground">{product.type}</div><div className="text-xs text-muted-foreground">{product.origin || 'N/A'}</div></td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-foreground">{product.price.toFixed(2)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-muted-foreground">{product.stock_quantity}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-muted-foreground">{product.discount_percentage ? `${product.discount_percentage}%` : '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium space-x-1">
                          <button onClick={() => handleEditProduct(product)} className="text-amber-600 hover:text-amber-700 p-1" title="Edit Base Product Info"><Edit size={16}/></button>
                          <button onClick={() => handleDeleteProduct(product.id)} className="text-red-600 hover:text-red-700 p-1" title="Delete Product"><Trash2 size={16}/></button>
                          {/* Buttons to open nutrient/discount modals could be added here or in respective tabs */}
                        </td>
                      </tr>
                    )) : (<tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No products found.</td></tr>)}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <div className="bg-card p-4 md:p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-primary mb-6">Order Management</h2>
            <div className="mb-6 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-grow w-full md:w-auto">
                    <input type="text" placeholder="Search orders..." className="w-full p-3 pl-10 border border-border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-shadow bg-input text-foreground placeholder:text-muted-foreground" value={orderSearchTermState} onChange={(e) => setOrderSearchTermState(e.target.value)} /> {/* Renamed orderSearchTerm to orderSearchTermState */}
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                </div>
                <div className="relative flex-grow w-full md:w-auto">
                    <select className="w-full p-3 pl-10 border border-border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none appearance-none bg-input text-foreground transition-shadow" value={orderStatusFilterState} onChange={(e) => setOrderStatusFilterState(e.target.value)}> {/* Renamed orderStatusFilter to orderStatusFilterState */}
                        {['all', 'pending', 'processing', 'delivered', 'cancelled'].map(status => (<option key={status} value={status} className="capitalize">{status === 'all' ? 'All Statuses' : status}</option>))} {/* Used array directly */}
                    </select>
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                </div>
                <button onClick={() => { fetchOrders(); toast({ title: "Orders Refreshed" }) }} className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center" title="Refresh Order List"> <RefreshCw size={18} /> </button>
            </div>
            {loading.orders ? (<div className="flex justify-center items-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div><p className="ml-3 text-muted-foreground">Loading orders...</p></div>) : (
            <div className="overflow-x-auto rounded-lg border border-border">
                <table className="min-w-full divide-y divide-border bg-card">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Order ID</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Total (₹)</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Payment</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Items</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filteredOrdersState.length > 0 ? filteredOrdersState.map((order: Order) => (
                        <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-primary">#{order.id}</td>
                            <td className="px-4 py-3 whitespace-nowrap"><div className="text-sm text-foreground">{order.user_details?.full_name || 'N/A'}</div><div className="text-xs text-muted-foreground">{order.user_details?.mobile_number || order.user_id}</div></td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">{order.total_amount.toFixed(2)}</td>
                            <td className="px-4 py-3 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ order.status === 'delivered' ? 'bg-green-100 text-green-800' : order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : order.status === 'processing' ? 'bg-blue-100 text-blue-800' : order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800' }`}>{order.status}</span></td>
                            <td className="px-4 py-3 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : order.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800' }`}>{order.payment_status}</span></td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{order.items.length} item(s) <ul className="text-xs list-disc list-inside">{order.items.slice(0,2).map(item => ( <li key={item.id} className="truncate max-w-[150px]" title={item.product_name}>{item.quantity}x {item.product_name}</li>))}{order.items.length > 2 && <li>...and {order.items.length - 2} more</li>}</ul></td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium"><div className="flex flex-col md:flex-row md:items-center"><select value={order.status} onChange={(e) => handleUpdateOrderStatusState(order.id, e.target.value)} className="text-xs p-1 border border-border rounded-md focus:ring-amber-500 focus:border-amber-500 bg-input text-foreground mb-1 md:mb-0 md:mr-2 w-full md:w-auto"><option value="pending">Pending</option><option value="processing">Processing</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option></select></div></td> {/* Renamed handleUpdateOrderStatus to handleUpdateOrderStatusState */}
                        </tr>
                        )) : (<tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">No orders found.</td></tr>)}
                    </tbody>
                </table>
            </div>
            )}
          </div>
        </TabsContent>

        {/* NEW TAB: Manage Discounts */}
        <TabsContent value="discounts">
          <div className="bg-card p-4 md:p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-primary mb-6">Manage Product Discounts</h2>
            {editingDiscountForProduct ? (
              <div className="mb-8 p-4 md:p-6 border border-border rounded-lg bg-muted/30">
                <h3 className="text-xl font-semibold text-foreground mb-4">Edit Discount for: <span className="text-amber-600">{editingDiscountForProduct.name}</span></h3>
                <form onSubmit={(e) => { e.preventDefault(); handleSaveDiscountInfo(); }} className="space-y-4">
                  <div>
                    <label htmlFor="discountPercentage" className="block text-sm font-medium mb-1 text-foreground">Discount Percentage (%) *</label>
                    <input id="discountPercentage" type="number" placeholder="e.g., 10 for 10%" min="0" max="100" step="0.01" className="w-full p-2 border border-border rounded-md focus:ring-amber-500 focus:border-amber-500 bg-input text-foreground placeholder:text-muted-foreground" value={currentDiscountPercentage} onChange={(e) => setCurrentDiscountPercentage(e.target.value)} required />
                  </div>
                  <div>
                    <label htmlFor="discountReason" className="block text-sm font-medium mb-1 text-foreground">Discount Reason (Optional)</label>
                    <input id="discountReason" type="text" placeholder="e.g., Seasonal Sale, Clearance" className="w-full p-2 border border-border rounded-md focus:ring-amber-500 focus:border-amber-500 bg-input text-foreground placeholder:text-muted-foreground" value={currentDiscountReason} onChange={(e) => setCurrentDiscountReason(e.target.value)} />
                  </div>
                  <div className="flex items-center justify-end space-x-3 pt-4">
                    <button type="button" onClick={() => { setEditingDiscountForProduct(null); setCurrentDiscountPercentage(''); setCurrentDiscountReason(''); }} className="px-4 py-2 border border-border text-sm font-medium rounded-md hover:bg-muted transition-colors">Cancel</button>
                    <button type="submit" disabled={loading.discounts} className="px-6 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors flex items-center disabled:opacity-70"> <Save size={18} className="mr-2"/> {loading.discounts ? 'Saving...' : 'Save Discount'} </button>
                  </div>
                </form>
              </div>
            ) : (
              <p className="text-muted-foreground mb-4">Select a product from the list below to manage its discount.</p>
            )}
            {/* Product List for Discount Management */}
            {loading.products ? (<div className="flex justify-center items-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div><p className="ml-3 text-muted-foreground">Loading products...</p></div>) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="min-w-full divide-y divide-border bg-card">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Product Name</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Current Price (₹)</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Discount (%)</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Reason</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {products.length > 0 ? products.map((product) => (
                      <tr key={product.id} className={`hover:bg-muted/30 transition-colors ${editingDiscountForProduct?.id === product.id ? 'bg-amber-50 dark:bg-amber-900/20' : ''}`}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-foreground">{product.name}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-muted-foreground">{product.price.toFixed(2)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-muted-foreground">{product.discount_percentage ? `${product.discount_percentage}%` : '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-muted-foreground truncate max-w-[200px]" title={product.discount_reason || undefined}>{product.discount_reason || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                          <button onClick={() => handleEditDiscount(product)} className="text-amber-600 hover:text-amber-700 p-1 flex items-center text-xs"> <Edit size={14} className="mr-1"/> Manage Discount </button>
                        </td>
                      </tr>
                    )) : (<tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No products available.</td></tr>)}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* NEW TAB: Manage Nutrients */}
        <TabsContent value="nutrients">
          <div className="bg-card p-4 md:p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-primary mb-6">Manage Product Nutrient Information</h2>
            {editingNutrientsForProduct ? (
              <div className="mb-8 p-4 md:p-6 border border-border rounded-lg bg-muted/30">
                <h3 className="text-xl font-semibold text-foreground mb-4">Edit Nutrients for: <span className="text-amber-600">{editingNutrientsForProduct.name}</span></h3>
                <form onSubmit={(e) => { e.preventDefault(); handleSaveNutrientInfo(); }} className="space-y-4">
                  {/* Always render fields based on currentNutrientInfo, which is initialized with defaults by handleEditNutrients */}
                  {(Object.keys(currentNutrientInfo) as Array<keyof NutrientInfo>).map(key => (
                     <div key={key}>
                       <label htmlFor={`nutrient_${key}`} className="block text-sm font-medium mb-1 text-foreground capitalize">{String(key).replace(/_/g, ' ')}</label>
                       <input
                         id={`nutrient_${key}`}
                         type="text"
                         placeholder={`Value for ${String(key).replace(/_/g, ' ')}`}
                         className="w-full p-2 border border-border rounded-md focus:ring-amber-500 focus:border-amber-500 bg-input text-foreground placeholder:text-muted-foreground"
                         value={currentNutrientInfo[key] || ''}
                         onChange={(e) => setCurrentNutrientInfo(prev => ({...prev, [key]: e.target.value}))} />
                     </div>
                  ))}

                  {/* The following section for "Add/Update Nutrient Fields" is redundant
                      because currentNutrientInfo is initialized with all predefined keys from
                      initialNewProductState.nutrient_info through the handleEditNutrients function.
                      The loop above now handles displaying all necessary fields.
                  */}
                  {/*
                  <div className="pt-4 border-t border-border">
                    <h4 className="text-md font-semibold text-foreground mb-2">Add/Update Nutrient Fields</h4>
                    {Object.keys(initialNewProductState.nutrient_info || {}).map(key => (
                      <div key={`new_nutrient_${key}`} className="mb-2">
                        <label htmlFor={`new_nutrient_input_${key}`} className="block text-sm font-medium mb-1 text-foreground capitalize">{String(key).replace(/_/g, ' ')}</label>
                        <input
                          id={`new_nutrient_input_${key}`}
                          type="text"
                          placeholder={`Enter ${String(key).replace(/_/g, ' ')}`}
                          className="w-full p-2 border border-border rounded-md focus:ring-amber-500 focus:border-amber-500 bg-input text-foreground placeholder:text-muted-foreground"
                          value={currentNutrientInfo[key as keyof NutrientInfo] || ''}
                          onChange={(e) => setCurrentNutrientInfo(prev => ({...prev, [key]: e.target.value}))} />
                      </div>
                    ))}
                  </div>
                  */}

                  <div className="flex items-center justify-end space-x-3 pt-4">
                    <button type="button" onClick={() => { setEditingNutrientsForProduct(null); setCurrentNutrientInfo({}); }} className="px-4 py-2 border border-border text-sm font-medium rounded-md hover:bg-muted transition-colors">Cancel</button>
                    <button type="submit" disabled={loading.nutrients} className="px-6 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors flex items-center disabled:opacity-70"> <Save size={18} className="mr-2"/> {loading.nutrients ? 'Saving...' : 'Save Nutrients'} </button>
                  </div>
                </form>
              </div>
            ) : (
              <p className="text-muted-foreground mb-4">Select a product from the list below to manage its nutrient information.</p>
            )}
            {/* Product List for Nutrient Management */}
            {loading.products ? (<div className="flex justify-center items-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div><p className="ml-3 text-muted-foreground">Loading products...</p></div>) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="min-w-full divide-y divide-border bg-card">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Product Name</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Nutrients Set?</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {products.length > 0 ? products.map((product) => (
                      <tr key={product.id} className={`hover:bg-muted/30 transition-colors ${editingNutrientsForProduct?.id === product.id ? 'bg-amber-50 dark:bg-amber-900/20' : ''}`}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-foreground">{product.name}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-muted-foreground">
                          {product.nutrient_info && Object.values(product.nutrient_info).some(val => val && val.trim() !== '') 
                            ? <CheckCircle className="w-5 h-5 text-green-500" /> 
                            : <XCircle className="w-5 h-5 text-red-500" />}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                          <button onClick={() => handleEditNutrients(product)} className="text-amber-600 hover:text-amber-700 p-1 flex items-center text-xs"> <Edit size={14} className="mr-1"/> Manage Nutrients </button>
                        </td>
                      </tr>
                    )) : (<tr><td colSpan={3} className="px-4 py-10 text-center text-muted-foreground">No products available.</td></tr>)}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default AdminPage;
