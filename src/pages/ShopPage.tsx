import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Search, Filter } from 'lucide-react';

// Mock product data - replace with actual data fetching
interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  imageUrl: string;
  description: string;
}

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Dehydrated Apple Slices',
    category: 'Fruits',
    price: 5.99,
    imageUrl: 'https://images.unsplash.com/photo-1586999491929-e58d4f007133?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    description: 'Crisp and sweet, perfect for snacking or adding to oatmeal.'
  },
  {
    id: '2',
    name: 'Sun-Dried Tomatoes',
    category: 'Vegetables',
    price: 7.49,
    imageUrl: 'https://images.unsplash.com/photo-1590779031874-3435ac0130c3?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    description: 'Rich and flavorful, ideal for pasta, salads, and sauces.'
  },
  {
    id: '3',
    name: 'Dried Mango Cheeks',
    category: 'Fruits',
    price: 8.99,
    imageUrl: 'https://images.unsplash.com/photo-1600439026898-3ea879a05947?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    description: 'Sweet, chewy, and tropical. A delightful healthy treat.'
  },
  {
    id: '4',
    name: 'Dehydrated Carrot Chips',
    category: 'Vegetables',
    price: 4.99,
    imageUrl: 'https://images.unsplash.com/photo-1582515072091-f95970942cdc?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    description: 'Crunchy and naturally sweet, a great alternative to potato chips.'
  },
  {
    id: '5',
    name: 'Dried Strawberries',
    category: 'Fruits',
    price: 9.99,
    imageUrl: 'https://images.unsplash.com/photo-1628009887947-7a03f87a581a?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    description: 'Intensely flavorful and perfect for cereals, desserts, or snacking.'
  },
  {
    id: '6',
    name: 'Dehydrated Bell Peppers',
    category: 'Vegetables',
    price: 6.29,
    imageUrl: 'https://images.unsplash.com/photo-1518736312942-00ba36219570?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    description: 'Colorful and versatile, adds a sweet pepper flavor to any dish.'
  }
];

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  return (
    <motion.div 
      className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <img src={product.imageUrl} alt={product.name} className="w-full h-56 object-cover" />
      <div className="p-6">
        <h3 className="text-xl font-semibold text-green-700 mb-2">{product.name}</h3>
        <p className="text-sm text-gray-600 mb-1">{product.category}</p>
        <p className="text-gray-800 font-bold text-lg mb-3">${product.price.toFixed(2)}</p>
        <p className="text-gray-700 text-sm mb-4 h-16 overflow-hidden">{product.description}</p>
        <button className="w-full bg-lime-500 hover:bg-lime-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center">
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
