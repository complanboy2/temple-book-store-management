export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      book_stalls: {
        Row: {
          createdat: string
          id: string
          instituteid: string
          location: string | null
          name: string
        }
        Insert: {
          createdat?: string
          id?: string
          instituteid: string
          location?: string | null
          name: string
        }
        Update: {
          createdat?: string
          id?: string
          instituteid?: string
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
      users: {
        Row: {
          canrestock: boolean
          cansell: boolean
          email: string
          id: string
          instituteid: string | null
          name: string
          phone: string | null
          role: string
        }
        Insert: {
          canrestock?: boolean
          cansell?: boolean
          email: string
          id?: string
          instituteid?: string | null
          name: string
          phone?: string | null
          role: string
        }
        Update: {
          canrestock?: boolean
          cansell?: boolean
          email?: string
          id?: string
          instituteid?: string | null
          name?: string
          phone?: string | null
          role?: string
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
