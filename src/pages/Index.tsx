import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Home, Car, Smartphone, Home as HomeIcon, Utensils, Gamepad2, Headphones, Users, ShoppingCart, Briefcase, Baby, Palette, Apple, Heart, Star, Filter, Monitor, Laptop, Tablet, ChevronLeft, ChevronRight } from "lucide-react";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  status: string;
  category: string | null;
  subcategory: string | null;
  user_id: string;
  profiles: {
    username: string;
    full_name: string;
  };
}

const Index = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [productsByCategory, setProductsByCategory] = useState<Record<string, Product[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const productsPerPage = 8;
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadProducts();
  }, [currentPage, searchQuery]);

  useEffect(() => {
    getAllCategories();
  }, []);

  const loadProducts = async () => {
    try {
      // First, get the total count for pagination
      const { count, error: countError } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      if (countError) throw countError;
      
      if (count) {
        setTotalPages(Math.ceil(count / productsPerPage));
      }

      // Then, get the actual products for the current page
      let query = supabase
        .from("products")
        .select(`
          *,
          profiles(username, full_name)
        `)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .range((currentPage - 1) * productsPerPage, currentPage * productsPerPage - 1);

      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Update state
      const fetchedProducts = data || [];
      setProducts(fetchedProducts);

      // Group products by category
      const grouped: Record<string, Product[]> = {};
      const allCategories: Set<string> = new Set();
      
      fetchedProducts.forEach(product => {
        const category = product.category || 'Uncategorized';
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push(product);
        allCategories.add(category);
      });
      
      setProductsByCategory(grouped);
      setCategories(Array.from(allCategories));
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
    loadProducts();
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Function to get unique categories from all products
  const getAllCategories = async () => {
    try {
      let query = supabase
        .from("products")
        .select("category", { count: "exact" })
        .eq("status", "active")
        .not("category", "is", null);

      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      const uniqueCategories = Array.from(
        new Set(data?.map(item => item.category).filter(Boolean) as string[])
      );
      
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  // Load all categories on component mount
  useEffect(() => {
    getAllCategories();
  }, []);

  // Jiji categories based on your provided list
  const staticCategories = [
    { id: 1, name: "Cars for sale", icon: Car, color: "text-blue-600", count: 1245 },
    { id: 2, name: "Motorcycles & Scooters", icon: Gamepad2, color: "text-green-600", count: 892 },
    { id: 3, name: "Trucks & Commercial", icon: Car, color: "text-yellow-600", count: 567 },
    { id: 4, name: "Spare Parts", icon: Gamepad2, color: "text-red-600", count: 2350 },
    { id: 5, name: "Smartphones", icon: Smartphone, color: "text-purple-600", count: 1672 },
    { id: 6, name: "Tablets", icon: Tablet, color: "text-indigo-600", count: 789 },
    { id: 7, name: "Accessories", icon: Smartphone, color: "text-pink-600", count: 1456 },
    { id: 8, name: "Televisions", icon: Monitor, color: "text-blue-600", count: 987 },
    { id: 9, name: "Audio Equipment", icon: Headphones, color: "text-green-600", count: 890 },
    { id: 10, name: "Computers & Laptops", icon: Laptop, color: "text-purple-600", count: 1203 },
    { id: 11, name: "Furniture", icon: Home, color: "text-amber-600", count: 987 },
    { id: 12, name: "Home Decor", icon: Palette, color: "text-rose-600", count: 672 },
    { id: 13, name: "Women's Clothing", icon: Users, color: "text-pink-600", count: 1890 },
    { id: 14, name: "Men's Clothing", icon: Users, color: "text-blue-600", count: 1567 },
    { id: 15, name: "Jobs", icon: Briefcase, color: "text-green-600", count: 2109 },
    { id: 16, name: "Services", icon: Utensils, color: "text-indigo-600", count: 1345 },
    { id: 17, name: "Babies & Kids", icon: Baby, color: "text-yellow-600", count: 876 },
    { id: 18, name: "Food & Agriculture", icon: Apple, color: "text-green-600", count: 765 },
  ];

  // Popular categories for quick links
  const popularCategories = [
    { id: 1, name: "Vehicles", icon: Car, color: "bg-blue-100 text-blue-800", count: 3796 },
    { id: 2, name: "Property", icon: HomeIcon, color: "bg-green-100 text-green-800", count: 4223 },
    { id: 3, name: "Mobile Phones", icon: Smartphone, color: "bg-purple-100 text-purple-800", count: 4022 },
    { id: 4, name: "Electronics", icon: Headphones, color: "bg-red-100 text-red-800", count: 3564 },
    { id: 5, name: "Fashion", icon: Users, color: "bg-pink-100 text-pink-800", count: 4457 },
    { id: 6, name: "Services", icon: Utensils, color: "bg-amber-100 text-amber-800", count: 2912 },
  ];

  return (
    <div className="bg-background">
      {/* Search and Location Section */}
      <section className="bg-primary text-white py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-bold text-center mb-6">Find almost anything</h1>
            
            <div className="flex flex-col md:flex-row gap-3 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <form onSubmit={handleSearch} className="w-full">
                  <Input
                    type="text"
                    placeholder="What are you looking for?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 py-6 h-14 text-lg rounded-lg border-0 focus:ring-2 focus:ring-primary"
                  />
                </form>
              </div>
              <Button 
                variant="secondary" 
                className="py-6 h-14 text-lg rounded-lg flex items-center gap-2"
                onClick={() => {}}
              >
                <MapPin className="h-5 w-5" />
                {selectedLocation}
              </Button>
            </div>
            
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="outline" size="sm" className="text-white border-white hover:bg-white hover:text-primary">
                Lagos
              </Button>
              <Button variant="outline" size="sm" className="text-white border-white hover:bg-white hover:text-primary">
                Abuja
              </Button>
              <Button variant="outline" size="sm" className="text-white border-white hover:bg-white hover:text-primary">
                Port Harcourt
              </Button>
              <Button variant="outline" size="sm" className="text-white border-white hover:bg-white hover:text-primary">
                Ibadan
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-bold mb-6">Browse Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {staticCategories.slice(0, 12).map((category) => (
              <div 
                key={category.id}
                className="flex flex-col items-center p-4 bg-muted rounded-lg cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={() => navigate(`/category/${encodeURIComponent(category.name)}`)}
              >
                <div className={`p-3 bg-primary/10 rounded-full mb-2`}>
                  <category.icon className={`h-8 w-8 ${category.color}`} />
                </div>
                <span className="font-medium text-center text-sm">{category.name}</span>
                <span className="text-xs text-muted-foreground mt-1">{category.count} ads</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Categories Quick Links */}
      <section className="py-8 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-bold mb-6">Popular Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {popularCategories.map((category) => (
              <div 
                key={category.id}
                className="bg-white p-4 rounded-lg border cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/category/${encodeURIComponent(category.name)}`)}
              >
                <div className="flex items-center mb-2">
                  <div className={`${category.color} p-2 rounded-full mr-3`}>
                    <category.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-sm">{category.name}</h3>
                </div>
                <p className="text-xs text-muted-foreground">{category.count} ads</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section - Organized by Category */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">Top Ads by Category</h2>
            <Button variant="link" className="text-primary" onClick={() => navigate("/products")}>
              See all
            </Button>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="text-muted-foreground">Loading products...</div>
            </div>
          ) : Object.keys(productsByCategory).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products found. Try adjusting your search.</p>
            </div>
          ) : (
            <>
              {categories.map((category) => (
                <div key={category} className="mb-12">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-primary capitalize">{category}</h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigate(`/category/${encodeURIComponent(category)}`)}
                    >
                      View all
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {productsByCategory[category].slice(0, 8).map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </section>

      {/* Additional Categories Section */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-bold mb-6">More Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {staticCategories.slice(12).map((category) => (
              <div 
                key={category.id}
                className="flex flex-col items-center p-4 bg-muted rounded-lg cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={() => navigate(`/category/${encodeURIComponent(category.name)}`)}
              >
                <div className={`p-3 bg-primary/10 rounded-full mb-2`}>
                  <category.icon className={`h-8 w-8 ${category.color}`} />
                </div>
                <span className="font-medium text-center text-sm">{category.name}</span>
                <span className="text-xs text-muted-foreground mt-1">{category.count} ads</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Stats Section */}
      <section className="py-8 bg-muted">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-primary">2.5M+</div>
              <div className="text-muted-foreground">Active Ads</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">800K+</div>
              <div className="text-muted-foreground">Registered Users</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">95%</div>
              <div className="text-muted-foreground">Satisfaction Rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">500K+</div>
              <div className="text-muted-foreground">Happy Buyers</div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Are you selling something?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Join thousands of sellers on our platform. Post your ad for free in just a few clicks!
          </p>
          <Button size="lg" onClick={() => navigate("/products/new")}>
            Start Selling Now
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
