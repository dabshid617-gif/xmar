import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProductUploadProps {
  onUploadComplete: () => void;
}

export const ProductUpload = ({ onUploadComplete }: ProductUploadProps) => {
  const [productName, setProductName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!productName.trim()) {
      toast.error("Please enter a product name");
      return;
    }
    
    if (!selectedFile) {
      toast.error("Please select an image");
      return;
    }

    setIsUploading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to upload products");
        return;
      }

      // Upload image to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      // Insert product into database
      const { data: product, error: insertError } = await supabase
        .from('products')
        .insert({
          user_id: user.id,
          product_name: productName,
          image_url: publicUrl,
          analyzed: false
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success("Product uploaded! Starting AI analysis...");

      // Call edge function to analyze product
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-product', {
        body: {
          productId: product.id,
          productName: productName,
          imageUrl: publicUrl
        }
      });

      if (analysisError) {
        toast.error("Failed to analyze product. Please try again.");
        console.error('Analysis error:', analysisError);
      } else {
        toast.success("Product analyzed successfully!");
      }

      // Reset form
      setProductName("");
      setSelectedFile(null);
      setPreviewUrl(null);
      onUploadComplete();

    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || "Failed to upload product");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="p-6 bg-card shadow-elegant">
      <h2 className="text-2xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
        Upload New Product
      </h2>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="productName" className="text-foreground font-medium">Product Name</Label>
          <Input
            id="productName"
            placeholder="Enter product name"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="mt-2 border-border focus:ring-primary"
          />
        </div>

        <div>
          <Label htmlFor="productImage" className="text-foreground font-medium">Product Image</Label>
          <div className="mt-2">
            <label
              htmlFor="productImage"
              className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors bg-muted/30"
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="h-full w-full object-contain rounded-lg" />
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, WEBP (MAX. 10MB)</p>
                </div>
              )}
              <input
                id="productImage"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
              />
            </label>
          </div>
        </div>

        <Button
          onClick={handleUpload}
          disabled={isUploading}
          className="w-full bg-gradient-primary hover:opacity-90 shadow-glow transition-all"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Upload & Analyze"
          )}
        </Button>
      </div>
    </Card>
  );
};