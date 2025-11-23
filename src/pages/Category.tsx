import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, MapPin, Star, ChevronDown } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectItem, SelectContent } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { X } from "lucide-react";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  status: string;
  user_id: string;
  location?: string;
  profiles: {
    username: string;
    full_name: string;
  };
}

// We'll load subcategories from the database dynamically based on the current category

const Category = () => {
  const { categoryName } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [selectedLocationName, setSelectedLocationName] = useState("All Locations");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSubcategories, setShowSubcategories] = useState(false);
  const [showLocationFilter, setShowLocationFilter] = useState(false);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState("created_at:desc");
  const [locations, setLocations] = useState<Array<{ id: string; name: string }>>([]);

  const category = categoryName ? decodeURIComponent(categoryName) : searchParams.get("category") || "";

  useEffect(() => {
    loadProducts();
    loadLocations();
    if (category) {
      loadSubcategories();
    }
  }, [category, selectedSubcategory, selectedLocationId, searchQuery, sortOrder]);

  const loadLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name')
        .order('name', { ascending: true });
      if (error) throw error;
      setLocations((data || []) as Array<{ id: string; name: string }>);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const loadSubcategories = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("subcategory")
        .eq("category", category)
        .not("subcategory", "is", null)
        .order("subcategory", { ascending: true });

      if (error) throw error;

      const uniqueSubcategories = Array.from(
        new Set(data?.map(item => item.subcategory).filter(Boolean) as string[])
      );
      
      setSubcategories(uniqueSubcategories);
    } catch (error) {
      console.error("Error loading subcategories:", error);
    }
  };

  const loadProducts = async () => {
    try {
      const [sortField, sortDirection] = sortOrder.split(':');

      let query = supabase
        .from("products")
        .select(`
          *,
          profiles(username, full_name),
          locations(name)
        `)
        .eq("status", "active")
        .order(sortField, { ascending: sortDirection === 'asc' });

      // Filter by category if provided
      if (category) {
        query = query.ilike("category", `%${category}%`);
      }

      // Additional filters if needed
      if (selectedSubcategory) {
        query = query.ilike("subcategory", `%${selectedSubcategory}%`);
      }

      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`);
      }

      if (selectedLocationId) {
        query = query.eq('location_id', selectedLocationId);
      }

      const { data, error } = await query;

      if (error) throw error;
      const mapped = (data || []).map((p: any) => ({ ...p, location: p.locations?.name || undefined }));
      setProducts(mapped);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The useEffect hook will automatically trigger a reload of products
    // when the searchQuery state changes, so we don't need to call it here.
  };

  // Using the state variable subcategories that is loaded dynamically

  return (
    <>
      <Navbar />
      <div className="bg-background min-h-screen">
        {/* Search and Filter Section */}
        <section className="relative overflow-hidden text-white py-8 bg-gradient-to-br from-primary to-primary/80">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(50%_50%_at_100%_0%,_#ffffff_0%,_rgba(255,255,255,0)_60%)]" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl md:text-3xl font-extrabold drop-shadow-sm">{category}</h1>
              </div>
              
              <div className="flex flex-col md:flex-row gap-3 mb-4">
                <div className="flex-[2] relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                  <form onSubmit={handleSearch} className="w-full flex gap-2">
                    <Input
                      type="text"
                      placeholder={`Search in ${category}...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 py-4 h-12 text-base rounded-lg border-0 focus:ring-2 focus:ring-primary text-black"
                    />
                    <Button type="submit" className="py-4 h-12 text-base rounded-lg bg-secondary hover:bg-secondary/80">
                      Search
                    </Button>
                  </form>
                </div>
                <div className="flex-[1]">
                  <Button 
                    variant="secondary" 
                    className="py-4 h-12 text-base rounded-lg flex items-center gap-2"
                    onClick={() => setShowLocationFilter(!showLocationFilter)}
                  >
                    <MapPin className="h-4 w-4" />
                    {selectedLocationName}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-primary border-primary hover:bg-primary hover:text-white flex items-center gap-1"
                  onClick={() => setShowSubcategories(!showSubcategories)}
                >
                  <Filter className="h-4 w-4" />
                  Filter
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Subcategories Filter */}
        {showSubcategories && (
          <section className="bg-white py-4 border-b">
            <div className="container mx-auto px-4">
              <h3 className="font-semibold mb-3">Subcategories</h3>
              <div className="flex flex-wrap gap-2">
                {subcategories.map((subcategory, index) => (
                  <Badge 
                    key={index}
                    variant={selectedSubcategory === subcategory ? "default" : "outline"}
                    className={`cursor-pointer ${selectedSubcategory === subcategory ? 'bg-primary hover:bg-primary' : ''}`}
                    onClick={() => setSelectedSubcategory(selectedSubcategory === subcategory ? "" : subcategory)}
                  >
                    {subcategory}
                  </Badge>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Location Filter */}
        {showLocationFilter && (
          <section className="bg-white py-4 border-b">
            <div className="container mx-auto px-4">
              <h3 className="font-semibold mb-3">Select Location</h3>
              <div className="flex flex-wrap gap-2">
                <Button 
                  key={'all'}
                  variant={selectedLocationId === null ? "default" : "outline"}
                  size="sm"
                  className={`cursor-pointer ${selectedLocationId === null ? 'bg-primary hover:bg-primary' : ''}`}
                  onClick={() => {
                    setSelectedLocationId(null);
                    setSelectedLocationName('All Locations');
                    setShowLocationFilter(false);
                  }}
                >
                  All Locations
                </Button>
                {locations.map((location) => (
                  <Badge 
                    key={location.id}
                    variant={selectedLocationId === location.id ? "default" : "outline"}
                    className={`cursor-pointer ${selectedLocationId === location.id ? 'bg-primary hover:bg-primary' : ''}`}
                    onClick={() => {
                      setSelectedLocationId(location.id);
                      setSelectedLocationName(location.name);
                      setShowLocationFilter(false);
                    }}
                  >
                    {location.name}
                  </Badge>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Products Section */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                {selectedSubcategory ? selectedSubcategory : category} 
                <span className="text-muted-foreground text-sm font-normal ml-2">({products.length} ads)</span>
              </h2>
              <div className="flex gap-2">
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at:desc">Most Recent</SelectItem>
                    <SelectItem value="price:asc">Price: Low to High</SelectItem>
                    <SelectItem value="price:desc">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Active filters */}
            {(selectedSubcategory || selectedLocationId || searchQuery) && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {searchQuery && (
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-sm">
                    Search: "{searchQuery}"
                    <button className="hover:text-destructive" onClick={() => setSearchQuery("")}> <X className="h-4 w-4" /> </button>
                  </span>
                )}
                {selectedSubcategory && (
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-sm">
                    Subcategory: {selectedSubcategory}
                    <button className="hover:text-destructive" onClick={() => setSelectedSubcategory("")}> <X className="h-4 w-4" /> </button>
                  </span>
                )}
                {selectedLocationId && (
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-sm">
                    Location: {selectedLocationName}
                    <button className="hover:text-destructive" onClick={() => { setSelectedLocationId(null); setSelectedLocationName('All Locations'); }}> <X className="h-4 w-4" /> </button>
                  </span>
                )}
                <button
                  className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
                  onClick={() => { setSearchQuery(""); setSelectedSubcategory(""); setSelectedLocationId(null); setSelectedLocationName('All Locations'); }}
                >
                  Clear all
                </button>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 py-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No products found. Try broadening your search criteria.</p>
                <Button className="mt-4" onClick={() => navigate("/products/new/edit")}>
                  Post a Product
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Additional Info Section */}
        <section className="py-8 bg-muted">
          <div className="container mx-auto px-4">
            <h2 className="text-xl font-bold mb-4">About {category}</h2>
            <p className="text-muted-foreground max-w-3xl">
              Explore the best {category.toLowerCase()} in Nigeria. Find great deals and connect with sellers directly. 
              Post your {category.toLowerCase()} for free and reach thousands of potential buyers.
            </p>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default Category;
