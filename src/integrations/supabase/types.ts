export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          institute_id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          institute_id: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          institute_id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      activity_slots: {
        Row: {
          activity_id: string
          created_at: string
          created_by: string | null
          display_name: string
          id: string
          institute_id: string
          scheduled_date: string
          updated_at: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          created_by?: string | null
          display_name: string
          id?: string
          institute_id: string
          scheduled_date: string
          updated_at?: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          created_by?: string | null
          display_name?: string
          id?: string
          institute_id?: string
          scheduled_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_slots_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      book_images: {
        Row: {
          created_at: string
          hash: string
          id: string
          url: string
        }
        Insert: {
          created_at?: string
          hash: string
          id?: string
          url: string
        }
        Update: {
          created_at?: string
          hash?: string
          id?: string
          url?: string
        }
        Relationships: []
      }
      book_stalls: {
        Row: {
          admin_id: string
          createdat: string
          id: string
          instituteid: string
          is_default: boolean | null
          location: string | null
          name: string
        }
        Insert: {
          admin_id?: string
          createdat?: string
          id?: string
          instituteid: string
          is_default?: boolean | null
          location?: string | null
          name: string
        }
        Update: {
          admin_id?: string
          createdat?: string
          id?: string
          instituteid?: string
          is_default?: boolean | null
          location?: string | null
          name?: string
        }
        Relationships: []
      }
      books: {
        Row: {
          author: string
          barcode: string | null
          category: string | null
          createdat: string
          id: string
          imageurl: string | null
          language: string | null
          name: string
          originalprice: number
          printinginstitute: string | null
          quantity: number
          saleprice: number
          stallid: string
          updatedat: string
        }
        Insert: {
          author: string
          barcode?: string | null
          category?: string | null
          createdat?: string
          id?: string
          imageurl?: string | null
          language?: string | null
          name: string
          originalprice: number
          printinginstitute?: string | null
          quantity: number
          saleprice: number
          stallid: string
          updatedat?: string
        }
        Update: {
          author?: string
          barcode?: string | null
          category?: string | null
          createdat?: string
          id?: string
          imageurl?: string | null
          language?: string | null
          name?: string
          originalprice?: number
          printinginstitute?: string | null
          quantity?: number
          saleprice?: number
          stallid?: string
          updatedat?: string
        }
        Relationships: []
      }
      institutes: {
        Row: {
          address: string | null
          adminid: string
          createdat: string
          id: string
          name: string
        }
        Insert: {
          address?: string | null
          adminid: string
          createdat?: string
          id?: string
          name: string
        }
        Update: {
          address?: string | null
          adminid?: string
          createdat?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          bookid: string
          fulfilled: number
          id: string
          orderid: string
          priceatorder: number
          quantity: number
        }
        Insert: {
          bookid: string
          fulfilled?: number
          id?: string
          orderid: string
          priceatorder: number
          quantity: number
        }
        Update: {
          bookid?: string
          fulfilled?: number
          id?: string
          orderid?: string
          priceatorder?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_orderid_fkey"
            columns: ["orderid"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          adminid: string
          createdat: string
          customeremail: string | null
          customername: string
          customerphone: string | null
          deliverydate: string | null
          id: string
          notes: string | null
          orderdate: string
          paymentmethod: string | null
          paymentstatus: string
          stallid: string
          status: string
          synced: boolean
          totalamount: number
          updatedat: string
        }
        Insert: {
          adminid: string
          createdat?: string
          customeremail?: string | null
          customername: string
          customerphone?: string | null
          deliverydate?: string | null
          id?: string
          notes?: string | null
          orderdate?: string
          paymentmethod?: string | null
          paymentstatus: string
          stallid: string
          status: string
          synced?: boolean
          totalamount: number
          updatedat?: string
        }
        Update: {
          adminid?: string
          createdat?: string
          customeremail?: string | null
          customername?: string
          customerphone?: string | null
          deliverydate?: string | null
          id?: string
          notes?: string | null
          orderdate?: string
          paymentmethod?: string | null
          paymentstatus?: string
          stallid?: string
          status?: string
          synced?: boolean
          totalamount?: number
          updatedat?: string
        }
        Relationships: []
      }
      restock_entries: {
        Row: {
          adminid: string
          bookid: string
          cost: number
          createdat: string
          id: string
          quantity: number
          stallid: string
          synced: boolean
        }
        Insert: {
          adminid: string
          bookid: string
          cost: number
          createdat?: string
          id?: string
          quantity: number
          stallid: string
          synced?: boolean
        }
        Update: {
          adminid?: string
          bookid?: string
          cost?: number
          createdat?: string
          id?: string
          quantity?: number
          stallid?: string
          synced?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "restock_entries_bookid_fkey"
            columns: ["bookid"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          bookid: string
          buyername: string | null
          buyerphone: string | null
          createdat: string
          id: string
          paymentmethod: string
          personnelid: string
          quantity: number
          stallid: string
          synced: boolean
          totalamount: number
        }
        Insert: {
          bookid: string
          buyername?: string | null
          buyerphone?: string | null
          createdat?: string
          id?: string
          paymentmethod: string
          personnelid: string
          quantity: number
          stallid: string
          synced?: boolean
          totalamount: number
        }
        Update: {
          bookid?: string
          buyername?: string | null
          buyerphone?: string | null
          createdat?: string
          id?: string
          paymentmethod?: string
          personnelid?: string
          quantity?: number
          stallid?: string
          synced?: boolean
          totalamount?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_bookid_fkey"
            columns: ["bookid"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_bookings: {
        Row: {
          activity_slot_id: string
          booking_date: string
          created_by: string | null
          id: string
          institute_id: string
          notes: string | null
          user_metadata_id: string
        }
        Insert: {
          activity_slot_id: string
          booking_date?: string
          created_by?: string | null
          id?: string
          institute_id: string
          notes?: string | null
          user_metadata_id: string
        }
        Update: {
          activity_slot_id?: string
          booking_date?: string
          created_by?: string | null
          id?: string
          institute_id?: string
          notes?: string | null
          user_metadata_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_bookings_activity_slot_id_fkey"
            columns: ["activity_slot_id"]
            isOneToOne: false
            referencedRelation: "activity_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activity_bookings_user_metadata_id_fkey"
            columns: ["user_metadata_id"]
            isOneToOne: false
            referencedRelation: "user_metadata"
            referencedColumns: ["id"]
          },
        ]
      }
      user_metadata: {
        Row: {
          address: string | null
          created_at: string
          created_by: string | null
          family_members: string | null
          gothram: string | null
          id: string
          institute_id: string
          mobile_number: string
          name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          family_members?: string | null
          gothram?: string | null
          id?: string
          institute_id: string
          mobile_number: string
          name: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          family_members?: string | null
          gothram?: string | null
          id?: string
          institute_id?: string
          mobile_number?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          canrestock: boolean
          cansell: boolean
          created_by_admin: string | null
          email: string
          id: string
          instituteid: string | null
          name: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
        }
        Insert: {
          canrestock?: boolean
          cansell?: boolean
          created_by_admin?: string | null
          email: string
          id?: string
          instituteid?: string | null
          name: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Update: {
          canrestock?: boolean
          cansell?: boolean
          created_by_admin?: string | null
          email?: string
          id?: string
          instituteid?: string | null
          name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Relationships: [
          {
            foreignKeyName: "users_instituteid_fkey"
            columns: ["instituteid"]
            isOneToOne: false
            referencedRelation: "institutes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      user_role: "super_admin" | "admin" | "personnel"
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
    Enums: {
      user_role: ["super_admin", "admin", "personnel"],
    },
  },
} as const
