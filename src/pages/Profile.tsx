import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Plus, MessageSquare, Eye, Star as StarIcon, Package, MapPin } from "lucide-react";
import StatsCard from "@/components/StatsCard";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  company_name: string | null;
  contact_number: string | null;
  full_name_changed_at: string | null;
  display_location?: boolean | null;
  location_name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  status: string;
}

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ratingSummary, setRatingSummary] = useState<{ avg: number; count: number } | null>(null);
  const [recentReviews, setRecentReviews] = useState<any[]>([]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    company_name: "",
    contact_number: "",
    avatar_url: "",
    bio: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [nameCooldownEnds, setNameCooldownEnds] = useState<number | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string>("");
  const avatarPreviewRef = useRef<string | null>(null);
  const cooldownDate = nameCooldownEnds ? new Date(nameCooldownEnds) : null;
  const canChangeFullName = !nameCooldownEnds || Date.now() >= nameCooldownEnds;
  const [profileViewCount, setProfileViewCount] = useState<number>(0);

  useEffect(() => {
    loadProfile();
    checkCurrentUser();
  }, [userId]);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || "",
        company_name: profile.company_name || "",
        contact_number: profile.contact_number || "",
        avatar_url: profile.avatar_url || "",
        bio: profile.bio || "",
      });

      if (!avatarFile) {
        setAvatarPreviewUrl(profile.avatar_url || "");
      }

      if (profile.full_name_changed_at) {
        setNameCooldownEnds(
          new Date(profile.full_name_changed_at).getTime() + 7 * 24 * 60 * 60 * 1000
        );
      } else {
        setNameCooldownEnds(null);
      }
    }
  }, [profile, avatarFile]);

  const checkCurrentUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setCurrentUser(session?.user ?? null);
  };

  const loadProfile = async () => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);
      setAvatarFile(null);

      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (productsError) throw productsError;
      setProducts(productsData || []);

      // Load rating summary from view
      const { data: summary } = await supabase
        .from('profile_reviews')
        .select('*')
        .eq('profile_id', userId)
        .maybeSingle();
      if (summary) {
        setRatingSummary({ avg: Number(summary.avg_rating), count: Number(summary.review_count) });
      } else {
        setRatingSummary({ avg: 0, count: 0 });
      }

      // Load profile view count
      const { count: viewCount } = await supabase
        .from('profile_views')
        .select('id', { count: 'exact', head: true })
        .eq('profile_id', userId);
      setProfileViewCount(viewCount || 0);

      // Load recent reviews across all seller products
      if ((productsData || []).length > 0) {
        const ids = (productsData || []).map((p: any) => p.id);
        const { data: revs } = await supabase
          .from('reviews')
          .select('*, reviewer:profiles(id,username,full_name,avatar_url)')
          .in('product_id', ids)
          .order('created_at', { ascending: false })
          .limit(5);
        setRecentReviews(revs || []);
      } else {
        setRecentReviews([]);
      }
    } catch (error: any) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  // Track a view when someone else opens this profile
  useEffect(() => {
    const trackView = async () => {
      try {
        if (!userId) return;
        const { data: { session } } = await supabase.auth.getSession();
        const viewerId = session?.user?.id || null;
        if (viewerId === userId) return; // don't count self-views
        await supabase.from('profile_views').insert([{ profile_id: userId, viewer_id: viewerId }]);
      } catch (e) {
        // ignore analytics errors
      }
    };
    trackView();
  }, [userId]);

  useEffect(() => {
    return () => {
      if (avatarPreviewRef.current) {
        URL.revokeObjectURL(avatarPreviewRef.current);
      }
    };
  }, []);

  const startChat = async () => {
    if (!currentUser) {
      toast.error("Please sign in to start a chat");
      navigate("/auth");
      return;
    }

    navigate(`/chat/${userId}`);
  };

  const handleProfileSave = async () => {
    if (!profile) return;
    if (!canChangeFullName && profileForm.full_name !== profile.full_name) {
      toast.error("You can only change your profile name once every 7 days.");
      return;
    }
    setSavingProfile(true);
    try {
      let avatarUrl = profileForm.avatar_url;
      if (avatarFile) {
        const uploaded = await uploadAvatar(avatarFile);
        if (uploaded) {
          avatarUrl = uploaded;
        }
      }

      const payload: any = {
        full_name: profileForm.full_name,
        bio: profileForm.bio,
        avatar_url: avatarUrl || null,
        company_name: profileForm.company_name || null,
        contact_number: profileForm.contact_number || null,
      };

      if (profileForm.full_name !== profile.full_name) {
        payload.full_name_changed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", profile.id);
      if (error) throw error;
      toast.success("Profile updated");
      await loadProfile();
      setIsEditOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from("product-images").upload(fileName, file, {
        upsert: true,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error) {
      console.error("Avatar upload failed:", error);
      toast.error("Failed to upload avatar");
      return null;
    }
  };

  const handleFormChange = (field: keyof typeof profileForm, value: string) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
    if (field === "avatar_url" && !avatarFile) {
      setAvatarPreviewUrl(value);
    }
  };

  const handleAvatarFileChange = (file: File | null) => {
    setAvatarFile(file);
    if (avatarPreviewRef.current) {
      URL.revokeObjectURL(avatarPreviewRef.current);
      avatarPreviewRef.current = null;
    }
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      avatarPreviewRef.current = previewUrl;
      setAvatarPreviewUrl(previewUrl);
    } else {
      setAvatarPreviewUrl(profileForm.avatar_url || "");
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">Loading...</div>
        </div>
        <Footer />
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">Profile not found</div>
        </div>
        <Footer />
      </>
    );
  }

  const isOwnProfile = currentUser?.id === userId;

  return (
    <>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card className="mb-8 overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <Avatar className="h-24 w-24 ring-2 ring-primary ring-offset-2 ring-offset-background">
                  {profile.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt={profile.username} />
                  ) : (
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {profile.username ? profile.username[0].toUpperCase() : "U"}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold mb-1">{profile.full_name || profile.username}</h1>
                    <Badge variant="secondary" className="text-xs">
                      @{profile.username}
                    </Badge>
                    <Badge variant="outline" className="text-xs ml-1">{profileViewCount} views</Badge>
                    {ratingSummary && (
                      <Badge variant="success" className="text-xs ml-2">
                        {ratingSummary.avg.toFixed(1)}★ ({ratingSummary.count})
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs ml-2">{products.length} products</Badge>
                  </div>
                  {profile.company_name && (
                    <p className="text-sm font-medium text-foreground mb-1">Company: {profile.company_name}</p>
                  )}
                  {profile.contact_number && (
                    <p className="text-sm text-muted-foreground mb-2">Contact: {profile.contact_number}</p>
                  )}
                  {profile.display_location && profile.location_name && (
                    <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      Location: {profile.location_name}
                    </p>
                  )}
                  {profile.bio && <p className="text-sm mb-4">{profile.bio}</p>}
                  <div className="flex flex-wrap gap-2">
                    {isOwnProfile ? (
                      <>
                        <Button onClick={() => setIsEditOpen(true)}>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Edit Profile
                        </Button>
                        <Button variant="outline" onClick={() => navigate('/settings')}>
                          Business Settings
                        </Button>
                        <Button onClick={() => navigate("/products/new/edit")}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Product
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" onClick={startChat}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Chat
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <StatsCard
              icon={<Eye className="h-5 w-5" />}
              label="Profile Views"
              value={profileViewCount}
            />
            <StatsCard
              icon={<StarIcon className="h-5 w-5" />}
              label="Average Rating"
              value={ratingSummary ? ratingSummary.avg.toFixed(1) : '0.0'}
              subtle={ratingSummary ? `${ratingSummary.count} reviews` : undefined}
            />
            <StatsCard
              icon={<Package className="h-5 w-5" />}
              label="Active Products"
              value={products.length}
            />
          </div>

          {recentReviews.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Recent Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentReviews.map((r) => (
                    <div key={r.id} className="border rounded-lg p-3">
                      <div className="flex items-center gap-3 mb-1">
                        <Avatar className="h-8 w-8">
                          {r.reviewer?.avatar_url ? (
                            <AvatarImage src={r.reviewer.avatar_url} alt={r.reviewer.username} />
                          ) : (
                            <AvatarFallback>{r.reviewer?.username ? r.reviewer.username[0].toUpperCase() : 'U'}</AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{r.reviewer?.full_name || r.reviewer?.username || 'User'}</p>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <svg key={i} className={`h-4 w-4 ${i < r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} viewBox="0 0 24 24"></svg>
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                      {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <h2 className="text-2xl font-bold mb-4">Products</h2>
          {products.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No products yet
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
                  {product.image_url && (
                    <div className="h-48 bg-muted flex items-center justify-center">
                      <img
                        src={product.image_url}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{product.title}</CardTitle>
                      <Badge variant={product.status === "active" ? "default" : "secondary"}>
                        {product.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    {product.description ? (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {product.description}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic mb-4 line-clamp-3">
                        No description available
                      </p>
                    )}
                    <div className="flex justify-between items-center mt-auto">
                      <span className="text-2xl font-bold text-primary">
                        ${product.price.toFixed(2)}
                      </span>
                      {isOwnProfile && (
                        <Button size="sm" variant="outline" onClick={() => navigate(`/products/${product.id}/edit`)}>
                          Edit
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-xl sm:max-w-2xl max-h-[85vh] overflow-y-auto overscroll-contain">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(e) => {
            e.preventDefault();
            handleProfileSave();
          }}>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={profileForm.full_name}
                onChange={(event) => handleFormChange("full_name", event.target.value)}
                required
                disabled={!canChangeFullName}
              />
              {!canChangeFullName && cooldownDate && (
                <p className="text-xs text-muted-foreground">
                  Next full name change available on {cooldownDate.toLocaleDateString()}.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input
                value={profileForm.company_name}
                onChange={(event) => handleFormChange("company_name", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Contact Number</Label>
              <Input
                value={profileForm.contact_number}
                onChange={(event) => handleFormChange("contact_number", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Avatar URL</Label>
              <Input
                value={profileForm.avatar_url}
                onChange={(event) => handleFormChange("avatar_url", event.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Upload Avatar</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(event) => handleAvatarFileChange(event.target.files?.[0] || null)}
              />
              {avatarPreviewUrl && (
                <div className="mt-2 w-24 h-24 overflow-hidden rounded-full border border-border">
                  <img src={avatarPreviewUrl} alt="Avatar preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea
                value={profileForm.bio}
                onChange={(event) => handleFormChange("bio", event.target.value)}
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={savingProfile}>
                Cancel
              </Button>
              <Button type="submit" disabled={savingProfile}>
                {savingProfile ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Footer />
    </>
  );
};

export default Profile;
