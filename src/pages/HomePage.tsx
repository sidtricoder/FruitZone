import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-100 via-green-50 to-emerald-100 text-gray-800">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="py-20 text-center bg-cover bg-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1519996529931-28324d5a630e?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')" }}
      >
        <div className="bg-black bg-opacity-50 py-20">
          <div className="container mx-auto px-6">
            <motion.h1
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
            >
              Discover the Power of <span className="text-lime-400">Dehydrated Delights</span>
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-xl md:text-2xl text-green-100 mb-10 max-w-3xl mx-auto"
            >
              Nutrient-packed, flavor-rich, and incredibly versatile dehydrated fruits and vegetables for a healthier lifestyle.
            </motion.p>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Link
                to="/shop"
                className="bg-lime-500 hover:bg-lime-600 text-white font-bold py-4 px-10 rounded-full text-lg transition-all duration-300 ease-in-out transform hover:scale-105 inline-flex items-center shadow-lg"
              >
                Shop Now <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-green-700 mb-12">Why Choose Dehydrated?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[{
              title: "Nutrient Retention",
              description: "Dehydration preserves vitamins and minerals, offering a concentrated source of nutrients.",
              icon: "🍎"
            }, {
              title: "Extended Shelf Life",
              description: "Enjoy your favorite fruits and veggies year-round with their significantly longer lifespan.",
              icon: "🗓️"
            }, {
              title: "Convenience & Versatility",
              description: "Perfect for on-the-go snacks, cooking, baking, or adding a flavor boost to any meal.",
              icon: "🎒"
            }].map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="bg-lime-50 p-8 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300"
              >
                <div className="text-4xl mb-4">{benefit.icon}</div>
                <h3 className="text-2xl font-semibold text-green-600 mb-3">{benefit.title}</h3>
                <p className="text-gray-700 leading-relaxed">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Usage Section */}
      <section className="py-16 bg-green-50">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-emerald-700 mb-12">How to Use Them</h2>
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <img 
                src="https://images.unsplash.com/photo-1600699891901-930760375153?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
                alt="Dehydrated fruits and vegetables usage"
                className="rounded-xl shadow-2xl object-cover w-full h-auto max-h-[500px]"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="space-y-6"
            >
              {[{
                title: "Healthy Snacking",
                description: "A guilt-free alternative to processed snacks, perfect for kids and adults."
              }, {
                title: "Meal Enhancements",
                description: "Add to cereals, yogurts, salads, soups, stews, or trail mixes for extra flavor and nutrition."
              }, {
                title: "Baking & Cooking",
                description: "Incorporate into breads, muffins, cakes, or rehydrate for use in various recipes."
              }, {
                title: "Infused Waters & Teas",
                description: "Create refreshing and flavorful drinks by adding dehydrated fruits to water or tea."
              }].map((use, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                  <h3 className="text-xl font-semibold text-emerald-600 mb-2">{use.title}</h3>
                  <p className="text-gray-600">{use.description}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Call to Action - Shop Now */}
      <section className="py-20 bg-gradient-to-r from-green-400 to-lime-500">
        <div className="container mx-auto px-6 text-center">
          <motion.h2 
            initial={{ opacity:0, y:20}} 
            whileInView={{opacity:1, y:0}} 
            viewport={{once: true}}
            transition={{duration:0.6}}
            className="text-4xl font-bold text-white mb-6"
          >
            Ready to Taste the Difference?
          </motion.h2>
          <motion.p 
            initial={{ opacity:0, y:20}} 
            whileInView={{opacity:1, y:0}} 
            viewport={{once: true}}
            transition={{duration:0.6, delay: 0.2}}
            className="text-xl text-green-100 mb-10 max-w-2xl mx-auto"
          >
            Explore our wide selection of premium dehydrated fruits and vegetables. Quality and flavor, guaranteed.
          </motion.p>
          <motion.div
            initial={{ opacity:0, scale:0.8}} 
            whileInView={{opacity:1, scale:1}} 
            viewport={{once: true}}
            transition={{duration:0.6, delay: 0.4}}
          >
            <Link
              to="/shop"
              className="bg-white hover:bg-gray-100 text-lime-600 font-bold py-4 px-10 rounded-full text-lg transition-all duration-300 ease-in-out transform hover:scale-105 inline-flex items-center shadow-lg"
            >
              Explore Our Products <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
