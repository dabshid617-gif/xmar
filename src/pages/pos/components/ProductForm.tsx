import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/pos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProductFormProps {
  product: Product | null;
  onSubmit: (product: Omit<Product, "id"> | Product) => void;
  onCancel: () => void;
  categories: any[];
  locations: any[];
}

const ProductForm = ({ product, onSubmit, onCancel, categories, locations }: ProductFormProps) => {
  const [formData, setFormData] = useState({
    title: product?.title || "",
    price: product?.price || 0,
    stock: product?.stock || 0,
    sku: product?.sku || "",
    category_id: product?.category_id || "",
    location_id: product?.location_id || "",
    barcode: product?.barcode || "",
    image_url: product?.image_url || "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(product?.image_url || "");

  useEffect(() => {
    setPreviewUrl(product?.image_url || "");
  }, [product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from("product-images").upload(fileName, file, {
        upsert: true,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error) {
      console.error("Upload error", error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let imageUrl = formData.image_url;
    if (imageFile) {
      const uploaded = await uploadImage(imageFile);
      if (uploaded) {
        imageUrl = uploaded;
      }
    }

    const submission = {
      ...formData,
      price: Number(formData.price),
      stock: Number(formData.stock),
      category_id: formData.category_id || null,
      location_id: formData.location_id || null,
      image_url: imageUrl,
    };

    if (product) {
      onSubmit({ ...product, ...submission });
    } else {
      onSubmit(submission);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input name="title" value={formData.title} onChange={handleChange} placeholder="Product Name" required />
      <Input name="price" type="number" value={formData.price} onChange={handleChange} placeholder="Price" required />
      <Input name="stock" type="number" value={formData.stock} onChange={handleChange} placeholder="Stock" required />
      <Input name="sku" value={formData.sku} onChange={handleChange} placeholder="SKU" />
      <Select onValueChange={(value) => handleSelectChange("category_id", value)} value={formData.category_id}>
        <SelectTrigger>
          <SelectValue placeholder="Select a category" />
        </SelectTrigger>
        <SelectContent>
          {categories.map(category => (
            <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select onValueChange={(value) => handleSelectChange("location_id", value)} value={formData.location_id}>
        <SelectTrigger>
          <SelectValue placeholder="Select a location" />
        </SelectTrigger>
        <SelectContent>
          {locations.map(location => (
            <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input name="barcode" value={formData.barcode} onChange={handleChange} placeholder="Barcode" />
      <Input name="image_url" value={formData.image_url} onChange={handleChange} placeholder="Image URL" />
      <div className="space-y-2">
        <Label>Image</Label>
        <Input
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0];
            setImageFile(file || null);
            if (file) {
              setPreviewUrl(URL.createObjectURL(file));
            } else {
              setPreviewUrl(product?.image_url || "");
            }
          }}
        />
        {previewUrl && (
          <div className="mt-2">
            <img src={previewUrl} alt="Preview" className="w-full max-h-40 object-cover rounded-lg" />
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
};

export default ProductForm;
