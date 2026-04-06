import React, { useState } from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Quote, ChevronLeft, ChevronRight, Users, Award, ThumbsUp } from 'lucide-react';

interface Testimonial {
  id: number;
  name: string;
  location: string;
  plan: string;
  rating: number;
  title: string;
  content: string;
  avatar: string;
  verified: boolean;
  date: string;
  category: 'family' | 'sports' | 'international' | 'tech' | 'business';
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Sarah Johnson",
    location: "Los Angeles, CA",
    plan: "Premium Plan",
    rating: 5,
    title: "Perfect for Family Entertainment",
    content: "Kristal Streams has completely transformed our family's entertainment experience. With three kids, we needed something that could keep everyone happy. The variety of channels is incredible - from cartoons for the kids to sports for my husband and international shows for me. The 4K quality is stunning on our smart TV, and we've never experienced any buffering issues. The customer support team helped us set up everything perfectly. Highly recommend!",
    avatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150",
    verified: true,
    date: "2024-01-15",
    category: "family"
  },
  {
    id: 2,
    name: "Michael Chen",
    location: "New York, NY",
    plan: "Ultimate Plan",
    rating: 5,
    title: "Sports Fan's Dream Come True",
    content: "As a die-hard sports fan, I was skeptical about switching from cable. But Kristal Streams has exceeded all my expectations! I get every game I want to watch - NFL, NBA, MLB, soccer, you name it. The PPV events are included, which saves me hundreds of dollars. The stream quality is crystal clear even during peak times, and I love being able to watch on my phone when I'm traveling. This service is a game-changer!",
    avatar: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150",
    verified: true,
    date: "2024-01-10",
    category: "sports"
  },
  {
    id: 3,
    name: "Emma Rodriguez",
    location: "Miami, FL",
    plan: "Gold Plan",
    rating: 5,
    title: "Amazing International Content",
    content: "Being from Spain originally, I was thrilled to find Kristal Streams offers such an extensive selection of international channels. I can watch Spanish news, telenovelas, and even local programming from my hometown. The quality is excellent, and having 3 connections means my whole family can watch different content simultaneously. The setup was incredibly easy, and the price is unbeatable compared to other services.",
    avatar: "https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=150",
    verified: true,
    date: "2024-01-08",
    category: "international"
  },
  {
    id: 4,
    name: "David Thompson",
    location: "Austin, TX",
    plan: "Platinum Plan",
    rating: 5,
    title: "Tech Quality That Impresses",
    content: "I'm pretty picky about streaming quality and technical performance. Kristal Streams delivers on every front - the anti-freeze technology actually works, the EPG is comprehensive and accurate, and the multi-device compatibility is seamless. I've tested it on everything from my 75-inch OLED TV to my tablet, and the experience is consistently excellent. The 4K content looks phenomenal, and the interface is intuitive.",
    avatar: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150",
    verified: true,
    date: "2024-01-05",
    category: "tech"
  },
  {
    id: 5,
    name: "Jennifer Williams",
    location: "Chicago, IL",
    plan: "Silver Plan",
    rating: 5,
    title: "Great Value for Money",
    content: "After cutting the cord from expensive cable, I was looking for an affordable solution that didn't compromise on quality. Kristal Streams is exactly that! For a fraction of what I was paying before, I get more channels, better quality, and the flexibility to watch anywhere. The customer service is responsive, and they helped me through the entire setup process. My husband and I can watch different shows simultaneously with our 2 connections.",
    avatar: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150",
    verified: true,
    date: "2024-01-03",
    category: "family"
  },
  {
    id: 6,
    name: "Robert Kim",
    location: "Seattle, WA",
    plan: "Premium Plan",
    rating: 5,
    title: "Business Travel Made Better",
    content: "As someone who travels frequently for business, having access to my favorite shows and live sports on any device is invaluable. Kristal Streams works flawlessly on hotel WiFi, my laptop, and even my phone during flights with WiFi. The reliability is outstanding - I've never missed an important game or show because of service issues. The international news channels keep me connected to global events while I'm on the road.",
    avatar: "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150",
    verified: true,
    date: "2023-12-28",
    category: "business"
  },
  {
    id: 7,
    name: "Lisa Anderson",
    location: "Phoenix, AZ",
    plan: "Gold Plan",
    rating: 5,
    title: "Exceeded All Expectations",
    content: "I was hesitant to try another streaming service after bad experiences with others, but Kristal Streams has been absolutely fantastic. The channel selection is vast, the picture quality is crisp, and I love the variety of content available. From cooking shows to documentaries to live news, everything I want is here. The 36-hour free trial convinced me immediately, and I've been a happy customer for months now.",
    avatar: "https://images.pexels.com/photos/1181424/pexels-photo-1181424.jpeg?auto=compress&cs=tinysrgb&w=150",
    verified: true,
    date: "2023-12-25",
    category: "family"
  },
  {
    id: 8,
    name: "Carlos Martinez",
    location: "San Diego, CA",
    plan: "Ultimate Plan",
    rating: 5,
    title: "Perfect for Large Families",
    content: "With 4 kids and different viewing preferences, finding a streaming solution that works for everyone was challenging. Kristal Streams with 4 connections is perfect! Everyone can watch what they want, when they want. The parental controls give me peace of mind, and the variety ensures there's always something appropriate for each age group. The value compared to multiple streaming subscriptions is incredible.",
    avatar: "https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150",
    verified: true,
    date: "2023-12-20",
    category: "family"
  }
];

const categories = [
  { id: 'all', name: 'All Reviews', icon: <Users className="w-4 h-4" /> },
  { id: 'family', name: 'Family', icon: <Users className="w-4 h-4" /> },
  { id: 'sports', name: 'Sports', icon: <Award className="w-4 h-4" /> },
  { id: 'international', name: 'International', icon: <Users className="w-4 h-4" /> },
  { id: 'tech', name: 'Tech Quality', icon: <Users className="w-4 h-4" /> },
  { id: 'business', name: 'Business', icon: <Users className="w-4 h-4" /> }
];

const Testimonials: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const filteredTestimonials = selectedCategory === 'all' 
    ? testimonials 
    : testimonials.filter(t => t.category === selectedCategory);

  const currentTestimonial = filteredTestimonials[currentIndex];

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredTestimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + filteredTestimonials.length) % filteredTestimonials.length);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentIndex(0);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-600'}`}
      />
    ));
  };

  return (
    <div className="min-h-screen py-32 bg-dark-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-6">
              <ThumbsUp className="text-primary w-8 h-8 mr-4" />
              <h1 className="text-4xl md:text-5xl font-bold text-white">Customer Testimonials</h1>
            </div>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Hear from thousands of satisfied customers who have made Kristal Streams their entertainment destination.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">50,000+</div>
              <div className="text-gray-400">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">4.9/5</div>
              <div className="text-gray-400">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">99.9%</div>
              <div className="text-gray-400">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">24/7</div>
              <div className="text-gray-400">Support</div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  selectedCategory === category.id
                    ? 'bg-primary text-white'
                    : 'bg-dark-100 text-gray-400 hover:bg-dark-200 hover:text-white'
                }`}
              >
                {category.icon}
                <span className="ml-2">{category.name}</span>
              </button>
            ))}
          </div>

          {/* Featured Testimonial */}
          {currentTestimonial && (
            <div className="bg-dark-100 rounded-2xl p-8 border border-gray-800 mb-12 relative">
              <div className="absolute top-6 left-6">
                <Quote className="w-12 h-12 text-primary/20" />
              </div>
              
              <div className="flex flex-col lg:flex-row items-start gap-8">
                <div className="flex-shrink-0">
                  <img
                    src={currentTestimonial.avatar}
                    alt={currentTestimonial.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-primary/20"
                  />
                </div>
                
                <div className="flex-grow">
                  <div className="flex items-center mb-4">
                    <div className="flex mr-4">
                      {renderStars(currentTestimonial.rating)}
                    </div>
                    {currentTestimonial.verified && (
                      <span className="bg-green-500/20 text-green-500 px-3 py-1 rounded-full text-sm font-medium">
                        Verified Customer
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-2">{currentTestimonial.title}</h3>
                  
                  <p className="text-gray-300 text-lg leading-relaxed mb-6">
                    "{currentTestimonial.content}"
                  </p>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-semibold text-white">{currentTestimonial.name}</div>
                      <div className="text-gray-400 text-sm">{currentTestimonial.location}</div>
                      <div className="text-primary text-sm font-medium">{currentTestimonial.plan}</div>
                    </div>
                    <div className="text-gray-500 text-sm mt-2 sm:mt-0">
                      {new Date(currentTestimonial.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between items-center mt-8">
                <button
                  onClick={prevTestimonial}
                  className="bg-dark-200 hover:bg-primary text-white p-3 rounded-full transition-colors duration-200"
                  disabled={filteredTestimonials.length <= 1}
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                
                <div className="flex space-x-2">
                  {filteredTestimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                        index === currentIndex ? 'bg-primary' : 'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
                
                <button
                  onClick={nextTestimonial}
                  className="bg-dark-200 hover:bg-primary text-white p-3 rounded-full transition-colors duration-200"
                  disabled={filteredTestimonials.length <= 1}
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          )}

          {/* All Testimonials Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTestimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="bg-dark-100 rounded-xl p-6 border border-gray-800 hover:border-primary transition-all duration-300 cursor-pointer"
                onClick={() => setCurrentIndex(filteredTestimonials.indexOf(testimonial))}
              >
                <div className="flex items-center mb-4">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-gray-400 text-sm">{testimonial.location}</div>
                  </div>
                </div>
                
                <div className="flex items-center mb-3">
                  <div className="flex mr-3">
                    {renderStars(testimonial.rating)}
                  </div>
                  {testimonial.verified && (
                    <span className="bg-green-500/20 text-green-500 px-2 py-1 rounded text-xs">
                      Verified
                    </span>
                  )}
                </div>
                
                <h4 className="font-semibold text-white mb-2">{testimonial.title}</h4>
                <p className="text-gray-400 text-sm line-clamp-3">
                  "{testimonial.content}"
                </p>
                
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-primary font-medium">{testimonial.plan}</span>
                    <span className="text-gray-500">
                      {new Date(testimonial.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-16 bg-gradient-to-r from-primary/20 to-primary/10 rounded-2xl p-8 border border-primary/30 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Join Thousands of Satisfied Customers</h2>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Experience the difference with Kristal Streams. Start your 36-hour free trial today and see why 
              customers love our service.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => navigate('/free-trial')}
                className="bg-primary hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200"
              >
                Start Free Trial
              </button>
              <button 
                onClick={() => navigate('/pricing')}
                className="border border-primary text-primary hover:bg-primary hover:text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200"
              >
                View Pricing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Testimonials;