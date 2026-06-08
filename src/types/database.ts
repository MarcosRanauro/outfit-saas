// ⚠️ ARQUIVO GERADO AUTOMATICAMENTE
// Não editar manualmente — use: npx supabase gen types typescript --linked > src/types/database.ts
// Tipos manuais do projeto ficam em src/types/app.ts

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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      outfit_history: {
        Row: {
          created_at: string | null
          id: string
          occasion: string | null
          outfit_id: string | null
          user_id: string
          worn_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          occasion?: string | null
          outfit_id?: string | null
          user_id: string
          worn_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          occasion?: string | null
          outfit_id?: string | null
          user_id?: string
          worn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outfit_history_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outfit_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      outfits: {
        Row: {
          created_at: string | null
          id: string
          name: string
          notes: string | null
          occasion: string | null
          occasion_tags: string[] | null
          period: string | null
          pieces: string[] | null
          style_tags: string[] | null
          subtitle: string | null
          user_id: string
          why: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          notes?: string | null
          occasion?: string | null
          occasion_tags?: string[] | null
          period?: string | null
          pieces?: string[] | null
          style_tags?: string[] | null
          subtitle?: string | null
          user_id: string
          why?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          occasion?: string | null
          occasion_tags?: string[] | null
          period?: string | null
          pieces?: string[] | null
          style_tags?: string[] | null
          subtitle?: string | null
          user_id?: string
          why?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outfits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      piece_photos: {
        Row: {
          created_at: string | null
          id: string
          is_cover: boolean | null
          is_studio: boolean | null
          piece_id: string
          sort_order: number | null
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_cover?: boolean | null
          is_studio?: boolean | null
          piece_id: string
          sort_order?: number | null
          url: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_cover?: boolean | null
          is_studio?: boolean | null
          piece_id?: string
          sort_order?: number | null
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "piece_photos_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "pieces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "piece_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pieces: {
        Row: {
          brand: string | null
          category: string
          code: string
          color: string | null
          color_secondary: string | null
          created_at: string | null
          description: string | null
          fit: string | null
          id: string
          name: string
          notes: string | null
          photo_url: string | null
          season: string | null
          style_type: string | null
          user_id: string
        }
        Insert: {
          brand?: string | null
          category: string
          code: string
          color?: string | null
          color_secondary?: string | null
          created_at?: string | null
          description?: string | null
          fit?: string | null
          id?: string
          name: string
          notes?: string | null
          photo_url?: string | null
          season?: string | null
          style_type?: string | null
          user_id: string
        }
        Update: {
          brand?: string | null
          category?: string
          code?: string
          color?: string | null
          color_secondary?: string | null
          created_at?: string | null
          description?: string | null
          fit?: string | null
          id?: string
          name?: string
          notes?: string | null
          photo_url?: string | null
          season?: string | null
          style_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pieces_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          closet_tour_completed: boolean | null
          created_at: string | null
          height: number | null
          id: string
          name: string | null
          plan: string | null
          plan_expires_at: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          style: string | null
          trial_ends_at: string | null
          updated_at: string | null
          usage_mia_generations: number | null
          usage_outfit_generations: number | null
          usage_pieces_analyzed: number | null
          usage_reset_at: string | null
          usage_studio_generations: number | null
          usage_wishlist_generations: number | null
          weight: number | null
        }
        Insert: {
          avatar_url?: string | null
          closet_tour_completed?: boolean | null
          created_at?: string | null
          height?: number | null
          id: string
          name?: string | null
          plan?: string | null
          plan_expires_at?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          style?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          usage_mia_generations?: number | null
          usage_outfit_generations?: number | null
          usage_pieces_analyzed?: number | null
          usage_reset_at?: string | null
          usage_studio_generations?: number | null
          usage_wishlist_generations?: number | null
          weight?: number | null
        }
        Update: {
          avatar_url?: string | null
          closet_tour_completed?: boolean | null
          created_at?: string | null
          height?: number | null
          id?: string
          name?: string | null
          plan?: string | null
          plan_expires_at?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          style?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          usage_mia_generations?: number | null
          usage_outfit_generations?: number | null
          usage_pieces_analyzed?: number | null
          usage_reset_at?: string | null
          usage_studio_generations?: number | null
          usage_wishlist_generations?: number | null
          weight?: number | null
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          category: string
          color: string | null
          created_at: string | null
          id: string
          name: string
          priority: string | null
          purchased: boolean | null
          reason: string | null
          user_id: string
        }
        Insert: {
          category: string
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          priority?: string | null
          purchased?: boolean | null
          reason?: string | null
          user_id: string
        }
        Update: {
          category?: string
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          priority?: string | null
          purchased?: boolean | null
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_user_id_fkey"
            columns: ["user_id"]
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
      increment_usage: {
        Args: { column_name: string; user_id: string }
        Returns: undefined
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
