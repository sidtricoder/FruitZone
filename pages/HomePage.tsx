import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 text-gray-800 dark:from-slate-900 dark:via-slate-800 dark:to-gray-900 dark:text-gray-200">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="py-24 md:py-32 text-center relative overflow-hidden"
      >
        {/* Animated background shapes */}
        <div className="absolute inset-0 z-0 opacity-40">
          <motion.div 
            className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-300 rounded-full filter blur-2xl animate-pulse-slow"
            animate={{ scale: [1, 1.1, 1], rotate: [0, 45, 0]}}
            transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-red-300 rounded-full filter blur-2xl animate-pulse-medium"
            animate={{ scale: [1, 1.15, 1], rotate: [0, -60, 0]}}
            transition={{ duration: 35, repeat: Infinity, ease: "easeInOut", delay: 7 }}
          />
           <motion.div 
            className="absolute top-1/3 right-1/3 w-56 h-56 bg-orange-300 rounded-full filter blur-xl animate-pulse-fast"
            animate={{ scale: [1, 1.05, 1], rotate: [0, 30, 0]}}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          />
        </div>

        <div className="relative z-10 container mx-auto px-6 py-12 md:py-20 bg-white/60 backdrop-blur-lg rounded-xl shadow-2xl max-w-4xl dark:bg-slate-800/60 dark:shadow-slate-700/50">
          <motion.h1
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.3, type: "spring", stiffness: 120 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-600 to-red-700 mb-6 leading-tight tracking-tight dark:from-amber-400 dark:via-orange-400 dark:to-red-500"
          >
            Unlock Nature's <span className="block md:inline">Concentrated Essence</span>
          </motion.h1>
          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
            className="text-lg md:text-xl lg:text-2xl text-gray-700 dark:text-gray-300 mb-10 max-w-2xl mx-auto font-medium"
          >
            Experience the vibrant taste and potent nutrition of meticulously dehydrated fruits & vegetables – nature's goodness, intensified.
          </motion.p>
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
          >
            <Link
              to="/shop"
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-3 px-8 md:py-4 md:px-10 rounded-full text-base md:text-lg transition-all duration-300 ease-in-out transform hover:scale-105 inline-flex items-center shadow-lg hover:shadow-xl dark:shadow-red-500/50"
            >
              Explore the Collection <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24 bg-white dark:bg-slate-800">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-orange-700 dark:text-orange-400 mb-12 md:mb-16">The Art of Dehydration</h2>
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[{
              title: "Peak Flavor & Aroma",
              description: "Our gentle, slow dehydration process locks in the natural sugars and aromatic compounds, delivering an unparalleled taste experience.",
              icon: "🍓"
            }, {
              title: "Nutrient Powerhouses",
              description: "Concentrated vitamins, minerals, and antioxidants in every morsel, supporting your vibrant well-being from the inside out.",
              icon: "✨"
            }, {
              title: "Sustainable Indulgence",
              description: "Reduce food waste and savor seasonal flavors year-round with our eco-conscious preservation. Good for you, good for the planet.",
              icon: "🌿"
            }].map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2, ease: "easeOut" }}
                className="bg-orange-50 dark:bg-slate-700 p-8 rounded-xl shadow-lg hover:shadow-2xl dark:shadow-orange-500/30 transition-shadow duration-300 flex flex-col items-center text-center"
              >
                <div className="text-5xl mb-5 p-4 bg-white dark:bg-slate-600 rounded-full shadow-md inline-block">{benefit.icon}</div>
                <h3 className="text-2xl font-semibold text-orange-600 dark:text-orange-400 mb-3">{benefit.title}</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Usage Section */}
      <section className="py-16 md:py-24 bg-red-50 dark:bg-gray-800">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-red-700 dark:text-red-400 mb-12 md:mb-16">Unleash Culinary Creativity</h2>
          <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="overflow-hidden rounded-xl shadow-2xl dark:shadow-red-500/30"
            >
              <img 
                src="/static/images/home-usage-image.jpg" 
                alt="Artistic display of various dehydrated fruit and vegetable pieces in a bowl"
                className="rounded-xl object-cover w-full h-auto max-h-[450px] md:max-h-[500px] transform hover:scale-110 transition-transform duration-500 ease-out"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="space-y-6"
            >
              {[{
                title: "Elevated Snacking",
                description: "Transform your snack time from mundane to magical with wholesome, intensely flavorful crisps and chews."
              }, {
                title: "Culinary Alchemy",
                description: "Unleash concentrated flavors in your signature dishes, baked goods, or as sophisticated gourmet garnishes."
              }, {
                title: "Artisanal Infusions",
                description: "Craft bespoke infused oils, vinegars, spirits, or teas with vibrant, pure fruit and herb notes."
              }, {
                title: "Wellness Boosters",
                description: "Effortlessly add a potent dose of natural vitamins and fiber to smoothies, trail mixes, or homemade energy bars."
              }].map((use, index) => (
                <motion.div 
                  key={index} 
                  className="bg-white dark:bg-slate-700 p-6 rounded-lg shadow-md hover:shadow-lg dark:shadow-red-500/30 transition-shadow duration-300"
                  initial={{ opacity: 0, y: 20}}
                  whileInView={{ opacity:1, y: 0}}
                  viewport={{ once: true}}
                  transition={{ duration: 0.5, delay: index * 0.1 + 0.3}}
                >
                  <h3 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">{use.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{use.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Call to Action - Shop Now */}
      <section className="py-20 md:py-28 bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 dark:from-amber-600 dark:via-orange-600 dark:to-red-700">
        <div className="container mx-auto px-6 text-center">
          <motion.h2 
            initial={{ opacity:0, y:20}} 
            whileInView={{opacity:1, y:0}} 
            viewport={{once: true}}
            transition={{duration:0.7, ease: "easeOut"}}
            className="text-3xl md:text-4xl font-bold text-white dark:text-gray-100 mb-6"
          >
            Ready to Taste the Difference?
          </motion.h2>
          <motion.p 
            initial={{ opacity:0, y:20}} 
            whileInView={{opacity:1, y:0}} 
            viewport={{once: true}}
            transition={{duration:0.7, delay: 0.2, ease: "easeOut"}}
            className="text-lg md:text-xl text-red-100 dark:text-red-200 mb-10 max-w-2xl mx-auto"
          >
            Explore our curated selection of premium dehydrated fruits and vegetables. Uncompromising quality and extraordinary flavor, delivered.
          </motion.p>
          <motion.div
            initial={{ opacity:0, scale:0.8}} 
            whileInView={{opacity:1, scale:1}} 
            viewport={{once: true}}
            transition={{duration:0.7, delay: 0.4, type: "spring", stiffness: 150}}
          >
            <Link
              to="/shop"
              className="bg-white hover:bg-gray-100 text-orange-600 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-orange-500 font-bold py-3 px-8 md:py-4 md:px-10 rounded-full text-base md:text-lg transition-all duration-300 ease-in-out transform hover:scale-105 inline-flex items-center shadow-xl hover:shadow-2xl dark:shadow-orange-400/50"
            >
              Discover Our Products <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
