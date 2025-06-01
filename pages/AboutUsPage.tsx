import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import LazyImage from '@/components/ui/LazyImage'; // Assuming you have this
import { useLenis } from '@/hooks/useLenis'; // Optional, if you use Lenis

const AboutUsPage: React.FC = () => {
  useLenis(); // Optional

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 text-gray-800 dark:from-slate-900 dark:via-slate-800 dark:to-gray-900 dark:text-gray-200 py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        
        {/* Section 1: Who Dis? */}
        <section className="text-center mb-20 md:mb-32">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-600 to-red-700 mb-6 leading-tight tracking-tight dark:from-amber-400 dark:via-orange-400 dark:to-red-500">
            DryDaddy? Who Dis?
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-gray-700 dark:text-gray-300 mb-8 max-w-3xl mx-auto font-medium">
            Alright, pull up a chair, grab a handful of something deliciously dehydrated, and let's talk about the legend, the myth, the... well, the Daddy.
          </p>
          <div className="w-32 h-1 bg-orange-500 mx-auto rounded-full"></div>
        </section>

        {/* Section 2: The Origin Story (Kinda) */}
        <section className="mb-20 md:mb-32 flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          <div className="lg:w-1/2 order-2 lg:order-1">
            <h2 className="text-3xl sm:text-4xl font-bold text-orange-700 dark:text-orange-400 mb-6">
              The Spark. The Idea. The Slightly Overripe Mango.
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
              Legend has it, DryDaddy wasn't always DryDaddy. Shocking, we know. He was just a regular dad with an irregular disdain for food waste and a particular fondness for fruit that, let's be honest, sometimes went from 'perfectly ripe' to 'science experiment' a tad too quickly.
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
              One fateful afternoon, staring at a mango that was more 'mush' than 'magnificent', a thought struck him (not the mango, that would be messy). "What if," he mused, probably to a nearby squirrel, "I could capture this sun-kissed perfection? Lock in the flavor? Make it... eternal?"
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-semibold">
              Okay, maybe not eternal. But definitely long-lasting and ridiculously tasty. And so, the quest began.
            </p>
          </div>
          <div className="lg:w-1/2 order-1 lg:order-2 relative">
            {/* Placeholder for an image - maybe a quirky illustration or a stylized photo */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
              <LazyImage 
                src="/static/images/Dry_Daddy.png" // Replace with an actual image
                alt="DryDaddy pondering a mango" 
                className="rounded-lg object-cover w-full h-auto max-h-[400px]"
                width={500}
                height={500}
              />
            </div>
            <div className="absolute -top-4 -left-4 w-20 h-20 bg-amber-400 rounded-full opacity-50 filter blur-lg animate-pulse-slow -z-10"></div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-red-400 rounded-full opacity-50 filter blur-lg animate-pulse-medium -z-10"></div>
          </div>
        </section>

        {/* Section 3: The Dry Commandments */}
        <section className="mb-20 md:mb-32 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-orange-700 dark:text-orange-400 mb-12">
            Our Not-So-Secret Scrolls: The Dry Commandments
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: "Thou Shalt Not Suffer Soggy Snacks.", icon: "🚫💧" },
              { title: "Thou Shalt Honour True Flavour.", icon: "🍓✨" },
              { title: "Thou Shalt Waste Not, Want Not.", icon: "🌍❤️" },
              { title: "Thou Shalt Snack Boldly & Often.", icon: "💪😋" },
            ].map((command, index) => (
              <div key={index} className="bg-orange-50 dark:bg-slate-700 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="text-4xl mb-4">{command.icon}</div>
                <h3 className="text-xl font-semibold text-orange-600 dark:text-orange-300">{command.title}</h3>
              </div>
            ))}
          </div>
        </section>
        
        {/* Section 4: What We're REALLY About */}
        <section className="mb-20 md:mb-32 flex flex-col lg:flex-row-reverse items-center gap-10 lg:gap-16">
          <div className="lg:w-1/2">
            <h2 className="text-3xl sm:text-4xl font-bold text-orange-700 dark:text-orange-400 mb-6">
              The Serious Bit (Kinda. We Still Like Puns.)
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
              Look, DryDaddy might be a bit of a character, but behind the playful name, we're dead serious about a few things:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 mb-6">
              <li><span className="font-semibold text-primary">Peak Produce Only:</span> We source the best, most flavorful fruits and veggies. No sad, tasteless stuff allowed.</li>
              <li><span className="font-semibold text-primary">The Art of Dry-dration:</span> Our gentle, slow process isn't just drying; it's flavor concentration wizardry.</li>
              <li><span className="font-semibold text-primary">Snacktivism:</span> Making healthy, natural snacks that are actually exciting to eat. Yes, 'snacktivism' is a word. We just made it up.</li>
              <li><span className="font-semibold text-primary">Planet-Friendly Portions:</span> Less waste, more taste. We're all about that sustainable goodness.</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              So yeah, we're here to make snacking better – for you, for your taste buds, and for that mango that dreamed of a greater destiny.
            </p>
          </div>
          <div className="lg:w-1/2 relative">
             {/* Placeholder for another image */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-2xl transform -rotate-2 hover:rotate-0 transition-transform duration-300">
              <LazyImage 
                src="/static/images/packet-kiwi.png" // Replace with an actual image
                alt="A vibrant array of DryDaddy products" 
                className="rounded-lg object-cover w-full h-auto max-h-[400px]"
                width={500}
                height={500}
              />
            </div>
          </div>
        </section>

        {/* Section 5: Join the Fam */}
        <section className="text-center py-12 md:py-16 bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 dark:from-amber-600 dark:via-orange-600 dark:to-red-700 rounded-xl shadow-2xl">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Enough About Us. Let's Talk About YOU.
          </h2>
          <p className="text-lg md:text-xl text-red-100 dark:text-red-200 mb-10 max-w-2xl mx-auto">
            Ready to ditch the dull and embrace the dehydrated? Your taste buds will thank you. Your snack drawer will thank you. The squirrels DryDaddy talks to will probably also thank you.
          </p>
          <Link
            to="/shop"
            className="bg-white hover:bg-gray-100 text-orange-600 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-orange-500 font-bold py-3 px-8 md:py-4 md:px-10 rounded-full text-base md:text-lg transition-all duration-300 ease-in-out transform hover:scale-105 inline-flex items-center shadow-xl hover:shadow-2xl"
          >
            Explore the Goodness <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </section>

      </div>
    </div>
  );
};

export default AboutUsPage;
