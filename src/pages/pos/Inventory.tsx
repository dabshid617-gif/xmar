import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/pos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PlusCircle, Edit, Trash2, LayoutGrid, List } from "lucide-react";
import { toast } from "sonner";
import InventoryDashboard from "@/components/pos/InventoryDashboard";
import PosProductCard from "@/components/pos/ProductCard";
import PosNavbar from "./components/PosNavbar";
import { useDebouncedValue } from "@/hooks/useDebounce";
import { useIsMobile } from "@/hooks/use-mobile";
import { Plus } from "lucide-react";
import ProductForm from "./components/ProductForm"; // Import the new ProductForm

const Inventory = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Product; direction: "ascending" | "descending" } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [stockFilter, setStockFilter] = useState<"all" | "outOfStock" | "lowStock">("all");
  const [grouping, setGrouping] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const isMobile = useIsMobile();
  const [locations, setLocations] = useState<any[]>([]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchLocations();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("products").select("*");
    if (error) {
      toast.error("Failed to fetch products");
      console.error(error);
    } else {
      setProducts(data as Product[]);
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase.from("categories").select("*");
    if (error) {
      toast.error("Failed to fetch categories");
      console.error(error);
    } else {
      setCategories(data);
    }
  };

  const fetchLocations = async () => {
    const { data, error } = await supabase.from("locations").select("*");
    if (error) {
      toast.error("Failed to fetch locations");
      console.error(error);
    } else {
      setLocations(data);
    }
  };

  const handleUpsertProduct = async (product: Omit<Product, "id"> | Product) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) {
      toast.error("You must be signed in to manage inventory");
      return;
    }

    const payload = {
      ...product,
      user_id: 'id' in product ? product.user_id || userId : userId,
    };

    const { data, error } = await supabase.from("products").upsert(payload).select().single();

    if (error) {
      toast.error(`Failed to ${'id' in product ? 'update' : 'create'} product`);
      console.error(error.message);
    } else {
      toast.success(`Product successfully ${'id' in product ? 'updated' : 'created'}`);
      fetchProducts();
      setIsDialogOpen(false);
      setEditingProduct(null);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete product");
      console.error(error);
    } else {
      toast.success("Product deleted successfully");
      fetchProducts();
    }
  };

  const filteredProducts = products.filter((product) => {
    const q = debouncedSearch.trim().toLowerCase();
    const nameMatch = product.title?.toLowerCase().includes(q) || false;
    const skuMatch = product.sku?.toLowerCase().includes(q) || false;
    const categoryMatch = !categoryFilter || product.category_id === categoryFilter;
    const stockMatch = stockFilter === "all" ||
      (stockFilter === "outOfStock" && product.stock === 0) ||
      (stockFilter === "lowStock" && product.stock > 0 && product.stock < 10);
    return (nameMatch || skuMatch) && categoryMatch && stockMatch;
  });

  const requestSort = (key: keyof Product) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const sortedProducts = useMemo(() => {
    let sortableProducts = [...filteredProducts];
    if (sortConfig !== null) {
      sortableProducts.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableProducts;
  }, [filteredProducts, sortConfig]);

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : "Uncategorized";
  };

  const groupedProducts = useMemo(() => {
    if (!grouping) return null;
    return sortedProducts.reduce((acc, product) => {
      const categoryName = getCategoryName(product.category_id || "");
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(product);
      return acc;
    }, {} as Record<string, Product[]>);
  }, [sortedProducts, grouping]);

  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const totalPages = Math.ceil(sortedProducts.length / rowsPerPage);

  const totalProducts = products.length;
  const totalStock = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const outOfStock = products.filter(p => p.stock === 0).length;
  const lowStock = products.filter(p => p.stock > 0 && p.stock < 10).length;

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  return (
    <div>
      <PosNavbar />
      <div className="p-4 md:p-6">
      <InventoryDashboard
        totalProducts={totalProducts}
        totalStock={totalStock}
        outOfStock={outOfStock}
        lowStock={lowStock}
      />
      <div className="flex items-center justify-between mb-4 sticky top-0 z-10 bg-background py-2">
        <h1 className="text-2xl font-bold">Products</h1>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <Select onValueChange={(value) => setCategoryFilter(value === "all" ? null : value)} value={categoryFilter || "all"}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select className="hidden md:block" value={rowsPerPage.toString()} onValueChange={(v) => setRowsPerPage(Number(v))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Rows per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12">12 rows</SelectItem>
              <SelectItem value="24">24 rows</SelectItem>
              <SelectItem value="48">48 rows</SelectItem>
            </SelectContent>
          </Select>
          <div className="hidden md:flex items-center space-x-2">
            <Switch id="group-by-category" checked={grouping} onCheckedChange={setGrouping} />
            <Label htmlFor="group-by-category">Group by Category</Label>
          </div>
          <div className="hidden md:flex items-center gap-1">
            <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('grid')}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === 'table' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('table')}>
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingProduct(null)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto overscroll-contain">
              <DialogHeader>
                <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
              </DialogHeader>
              <ProductForm
                product={editingProduct}
                onSubmit={handleUpsertProduct}
                onCancel={() => setIsDialogOpen(false)}
                categories={categories}
                locations={locations}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Button variant={stockFilter === "all" ? "secondary" : "outline"} onClick={() => setStockFilter("all")}>All</Button>
        <Button variant={stockFilter === "outOfStock" ? "secondary" : "outline"} onClick={() => setStockFilter("outOfStock")}>Out of Stock</Button>
        <Button variant={stockFilter === "lowStock" ? "secondary" : "outline"} onClick={() => setStockFilter("lowStock")}>Low Stock</Button>
      </div>

      {(isMobile || viewMode === "grid") ? (
        grouping && groupedProducts ? (
          <div className="space-y-4">
            {Object.entries(groupedProducts).map(([category, products]) => (
              <div key={category}>
                <h2 className="text-xl font-bold mb-2">{category}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {products.map((product) => (
                    <PosProductCard
                      key={product.id}
                      product={product}
                      onEdit={handleEdit}
                      onDelete={handleDeleteProduct}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {loading ? (
              <p>Loading...</p>
            ) : (
              paginatedProducts.map((product) => (
                <PosProductCard
                  key={product.id}
                  product={product}
                  onEdit={handleEdit}
                  onDelete={handleDeleteProduct}
                />
              ))
            )}
          </div>
        )
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => requestSort("title")} className="cursor-pointer">Name</TableHead>
                <TableHead onClick={() => requestSort("price")} className="cursor-pointer">Price</TableHead>
                <TableHead onClick={() => requestSort("stock")} className="cursor-pointer">Stock</TableHead>
                <TableHead onClick={() => requestSort("sku")} className="cursor-pointer">SKU</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.title}</TableCell>
                    <TableCell>${product.price.toFixed(2)}</TableCell>
                    <TableCell className={
                      product.stock === 0 ? "text-red-500" :
                      product.stock > 0 && product.stock < 10 ? "text-yellow-500" : ""
                    }>
                      {product.stock}
                    </TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {!grouping && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
      </div>
      {/* Mobile FAB for adding products */}
      {isMobile && (
        <Button
          className="fixed bottom-20 right-4 md:hidden rounded-full h-12 w-12 shadow-lg"
          onClick={() => {
            setEditingProduct(null);
            setIsDialogOpen(true);
          }}
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
};

export default Inventory;
