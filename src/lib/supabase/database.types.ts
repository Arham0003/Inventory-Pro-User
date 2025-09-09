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
      products: {
        Row: {
          id: string
          name: string
          sku: string | null
          category: string | null
          quantity: number
          purchase_price: number
          selling_price: number
          gst: number
          supplier: string | null
          low_stock_threshold: number
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          sku?: string | null
          category?: string | null
          quantity: number
          purchase_price: number
          selling_price: number
          gst: number
          supplier?: string | null
          low_stock_threshold: number
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          sku?: string | null
          category?: string | null
          quantity?: number
          purchase_price?: number
          selling_price?: number
          gst?: number
          supplier?: string | null
          low_stock_threshold?: number
          user_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          id: string
          product_id: string
          quantity: number
          unit_price: number
          total_price: number
          customer_name: string | null
          customer_phone: string | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          quantity: number
          unit_price: number
          total_price: number
          customer_name?: string | null
          customer_phone?: string | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
          total_price?: number
          customer_name?: string | null
          customer_phone?: string | null
          user_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          business_name: string | null
          business_address: string | null
          business_phone: string | null
          gst_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          business_name?: string | null
          business_address?: string | null
          business_phone?: string | null
          gst_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          business_name?: string | null
          business_address?: string | null
          business_phone?: string | null
          gst_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
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