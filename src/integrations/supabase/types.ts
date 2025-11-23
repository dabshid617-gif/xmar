export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      chat_conversations: {
        Row: {
          created_at: string | null
          id: string
          updated_at: string | null
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user1_id?: string
          user2_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_conversations_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ,
      reviews: {
        Row: {
          id: string
          product_id: string
          reviewer_id: string
          rating: number
          comment: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          product_id: string
          reviewer_id: string
          rating: number
          comment?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          product_id?: string
          reviewer_id?: string
          rating?: number
          comment?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          conversation_id: string
          created_at: string | null
          id: string
          message: string
          sender_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          id?: string
          message: string
          sender_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          id?: string
          message?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          price: number
          image_url: string | null
          status: string | null
          created_at: string | null
          category: string | null
          subcategory: string | null
          location: string | null
          barcode: string | null
          sku: string | null
          stock: number | null
          location_id: string | null
          category_id: string | null
          variant_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          price: number
          image_url?: string | null
          status?: string | null
          created_at?: string | null
          category?: string | null
          subcategory?: string | null
          location?: string | null
          barcode?: string | null
          sku?: string | null
          stock?: number | null
          location_id?: string | null
          category_id?: string | null
          variant_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          price?: number
          image_url?: string | null
          status?: string | null
          created_at?: string | null
          category?: string | null
          subcategory?: string | null
          location?: string | null
          barcode?: string | null
          sku?: string | null
          stock?: number | null
          location_id?: string | null
          category_id?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "variants"
            referencedColumns: ["id"]
          },
        ]
      }
      ,
      categories: {
        Row: {
          id: string
          name: string
          parent_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          parent_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          parent_id?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      ,
      locations: {
        Row: {
          id: string
          name: string
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          created_at?: string | null
        }
        Relationships: []
      }
      ,
      variants: {
        Row: {
          id: string
          product_id: string
          name: string
          price: number
          stock: number
          created_at: string | null
        }
        Insert: {
          id?: string
          product_id: string
          name: string
          price: number
          stock: number
          created_at?: string | null
        }
        Update: {
          id?: string
          product_id?: string
          name?: string
          price?: number
          stock?: number
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
      avatar_url: string | null
      bio: string | null
      created_at: string | null
      full_name: string | null
      company_name: string | null
      contact_number: string | null
      full_name_changed_at: string | null
      id: string
      username: string
        }
        Insert: {
      avatar_url?: string | null
      bio?: string | null
      created_at?: string | null
      full_name?: string | null
      company_name?: string | null
      contact_number?: string | null
      full_name_changed_at?: string | null
      id: string
      username: string
        }
        Update: {
      avatar_url?: string | null
      bio?: string | null
      created_at?: string | null
      full_name?: string | null
      company_name?: string | null
      contact_number?: string | null
      full_name_changed_at?: string | null
      id?: string
      username?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          amount: number
          buyer_id: string
          created_at: string | null
          id: string
          product_id: string
          seller_id: string
        }
        Insert: {
          amount: number
          buyer_id: string
          created_at?: string | null
          id?: string
          product_id: string
          seller_id: string
        }
        Update: {
          amount?: number
          buyer_id?: string
          created_at?: string | null
          id?: string
          product_id?: string
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ,
      receipt_settings: {
        Row: {
          profile_id: string
          business_name: string | null
          logo_url: string | null
          address: string | null
          phone: string | null
          footer_note: string | null
          show_order_number: boolean | null
          theme: string | null
          accent_color: string | null
          include_tax: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          profile_id: string
          business_name?: string | null
          logo_url?: string | null
          address?: string | null
          phone?: string | null
          footer_note?: string | null
          show_order_number?: boolean | null
          theme?: string | null
          accent_color?: string | null
          include_tax?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          profile_id?: string
          business_name?: string | null
          logo_url?: string | null
          address?: string | null
          phone?: string | null
          footer_note?: string | null
          show_order_number?: boolean | null
          theme?: string | null
          accent_color?: string | null
          include_tax?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receipt_settings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ,
      profile_views: {
        Row: {
          id: string
          profile_id: string
          viewer_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          profile_id: string
          viewer_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          profile_id?: string
          viewer_id?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_views_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ,
      product_cart_adds: {
        Row: {
          id: string
          product_id: string
          user_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          product_id: string
          user_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_cart_adds_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_cart_adds_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ,
      product_views: {
        Row: {
          id: string
          product_id: string
          viewer_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          product_id: string
          viewer_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          product_id?: string
          viewer_id?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_views_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
