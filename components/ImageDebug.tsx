import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Product } from '@/pages/ShopPage';

// Debug component to show the structure of products in the database
const ImageDebug = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*');
          
        if (error) {
          throw error;
        }
        
        setProducts(data || []);      } catch (err: any) {
        console.error('Error fetching products:', err);
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) return <div>Loading product data...</div>;
  if (error) return <div>Error: {error}</div>;
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Product Data Debug</h2>
      
      {products.map((product) => (
        <div key={product.id} className="mb-8 p-4 border rounded-md">
          <h3 className="font-bold text-xl">{product.name}</h3>
          <p>ID: {product.id}</p>
          <p>Type: {product.type || 'No type'}</p>
          <p>Image URL type: {typeof product.image_url}</p>
          <p>Raw value: {JSON.stringify(product.image_url)}</p>
          
          {Array.isArray(product.image_url) && product.image_url.length > 0 && (
            <div>
              <p>Array length: {product.image_url.length}</p>
              <div className="mt-4 grid grid-cols-2 gap-4">
                {product.image_url.map((url, idx) => (
                  <div key={idx} className="border p-2">
                    <p>Image {idx + 1}: {url}</p>
                    <img 
                      src={url} 
                      alt={`${product.name} ${idx + 1}`} 
                      className="w-full h-40 object-contain bg-white mt-2"
                      onError={(e) => {
                        console.log('Image load error');
                        (e.target as HTMLImageElement).src = `/static/images/${product.type?.toLowerCase() || 'product'}-placeholder.jpg`;
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {typeof product.image_url === 'string' && (
            <div className="mt-4 border p-2">
              <p>Single image URL:</p>
              <img 
                src={product.image_url} 
                alt={product.name} 
                className="w-full h-40 object-contain bg-white mt-2"
                onError={(e) => {
                  console.log('Image load error');
                  (e.target as HTMLImageElement).src = `/static/images/${product.type?.toLowerCase() || 'product'}-placeholder.jpg`;
                }}
              />
            </div>
          )}
          
          {!product.image_url && (
            <p className="mt-4">No image URL provided</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default ImageDebug;
