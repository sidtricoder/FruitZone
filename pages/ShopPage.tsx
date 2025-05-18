import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Search, Filter } from 'lucide-react';

// Mock product data - replace with actual data fetching
interface Product {
  id: string;
  name: string;
  category: string;
  price: number; // Price in INR
  imageUrl: string;
  description: string;
}

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Dehydrated Apple Slices',
    category: 'Fruits',
    price: 499, // Approx. 5.99 USD to INR (1 USD ~ 83.5 INR)
    imageUrl: '/static/images/product-apple.jpg',
    description: 'Crisp, sweet, and intensely apple-y. Perfect for healthy snacking or elevating your morning oatmeal.'
  },
  {
    id: '2',
    name: 'Sun-Kissed Tomato Halves',
    category: 'Vegetables',
    price: 625, // Approx. 7.49 USD to INR
    imageUrl: '/static/images/product-tomato.jpg',
    description: 'Rich, umami-packed flavor bombs. Ideal for artisanal pasta, vibrant salads, and gourmet sauces.'
  },
  {
    id: '3',
    name: 'Velvet Mango Cheeks',
    category: 'Fruits',
    price: 750, // Approx. 8.99 USD to INR
    imageUrl: '/static/images/product-mango.jpg',
    description: 'Sweet, chewy, and bursting with tropical sunshine. A delightful and guilt-free healthy indulgence.'
  },
  {
    id: '4',
    name: 'Sweet Carrot Ribbons',
    category: 'Vegetables',
    price: 415, // Approx. 4.99 USD to INR
    imageUrl: '/static/images/product-carrot.jpg',
    description: 'Naturally sweet with a satisfying crunch. A vibrant, nutrient-dense alternative to potato chips.'
  },
  {
    id: '5',
    name: 'Ruby Red Strawberry Slices',
    category: 'Fruits',
    price: 835, // Approx. 9.99 USD to INR
    imageUrl: '/static/images/product-strawberry.jpg',
    description: 'Intensely flavorful and aromatic. Perfect for cereals, desserts, or as a standalone gourmet snack.'
  },
  {
    id: '6',
    name: 'Rainbow Bell Pepper Confetti',
    category: 'Vegetables',
    price: 525, // Approx. 6.29 USD to INR
    imageUrl: '/static/images/product-pepper.jpg',
    description: 'A vibrant mix of sweet and colorful dehydrated peppers. Adds a pop of flavor and color to any dish.'
  }
];

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  return (
    <motion.div 
      className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="overflow-hidden">
        <img src={product.imageUrl} alt={product.name} className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500 ease-in-out" />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-semibold text-green-700 mb-2 truncate" title={product.name}>{product.name}</h3>
        <p className="text-sm text-gray-500 mb-1 capitalize">{product.category}</p>
        <p className="text-gray-800 font-bold text-2xl mb-3">₹{product.price.toLocaleString('en-IN')}</p>
        <p className="text-gray-700 text-sm mb-4 h-16 overflow-hidden text-ellipsis">{product.description}</p>
        <button className="w-full bg-lime-500 hover:bg-lime-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center shadow hover:shadow-md">
          <ShoppingBag size={18} className="mr-2" /> Add to Cart
        </button>
      </div>
    </motion.div>
  );
};

const ShopPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  // Simulate fetching products
  useEffect(() => {
    setProducts(mockProducts);
  }, []);

  const filteredProducts = products
    .filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(product => 
      filterCategory === 'All' || product.category === filterCategory
    );

  const categories = ['All', ...new Set(mockProducts.map(p => p.category))];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-6">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-bold text-center text-green-700 mb-10"
        >
          Our Dehydrated Treasures
        </motion.h1>

        {/* Search and Filter Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-10 p-6 bg-white rounded-xl shadow-md flex flex-col md:flex-row gap-4 items-center"
        >
          <div className="relative flex-grow w-full md:w-auto">
            <input 
              type="text"
              placeholder="Search products..."
              className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 outline-none transition-shadow"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          <div className="relative flex-grow w-full md:w-auto">
            <select 
              className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 outline-none appearance-none bg-white transition-shadow"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </motion.div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center text-xl text-gray-600 py-10"
          >
            No products found matching your criteria. Try adjusting your search or filters.
          </motion.p>
        )}
      </div>
    </div>
  );
};

export default ShopPage;
