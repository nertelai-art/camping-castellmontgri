
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "accommodation_categories": {
                  Row: {
                    "key": string,"media_id": string | null,"sort_order": number
                  }
                  Insert: {
                    "key": string,"media_id"?: string | null,"sort_order"?: number
                  }
                  Update: {
                    "key"?: string,"media_id"?: string | null,"sort_order"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "accommodation_categories_media_id_fkey"
      columns: ["media_id"]
isOneToOne: false
      referencedRelation: "media"
      referencedColumns: ["id"]
    }
                  ]
                },"accommodation_category_translations": {
                  Row: {
                    "category_key": string,"description": string | null,"locale": Database["public"]['Enums']["locale"],"name": string
                  }
                  Insert: {
                    "category_key": string,"description"?: string | null,"locale": Database["public"]['Enums']["locale"],"name": string
                  }
                  Update: {
                    "category_key"?: string,"description"?: string | null,"locale"?: Database["public"]['Enums']["locale"],"name"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "accommodation_category_translations_category_key_fkey"
      columns: ["category_key"]
isOneToOne: false
      referencedRelation: "accommodation_categories"
      referencedColumns: ["key"]
    }
                  ]
                },"accommodation_media": {
                  Row: {
                    "accommodation_id": string,"media_id": string,"sort_order": number
                  }
                  Insert: {
                    "accommodation_id": string,"media_id": string,"sort_order"?: number
                  }
                  Update: {
                    "accommodation_id"?: string,"media_id"?: string,"sort_order"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "accommodation_media_accommodation_id_fkey"
      columns: ["accommodation_id"]
isOneToOne: false
      referencedRelation: "accommodations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "accommodation_media_media_id_fkey"
      columns: ["media_id"]
isOneToOne: false
      referencedRelation: "media"
      referencedColumns: ["id"]
    }
                  ]
                },"accommodation_translations": {
                  Row: {
                    "accommodation_id": string,"description": string | null,"features": (string)[],"locale": Database["public"]['Enums']["locale"],"name": string
                  }
                  Insert: {
                    "accommodation_id": string,"description"?: string | null,"features"?: (string)[],"locale": Database["public"]['Enums']["locale"],"name": string
                  }
                  Update: {
                    "accommodation_id"?: string,"description"?: string | null,"features"?: (string)[],"locale"?: Database["public"]['Enums']["locale"],"name"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "accommodation_translations_accommodation_id_fkey"
      columns: ["accommodation_id"]
isOneToOne: false
      referencedRelation: "accommodations"
      referencedColumns: ["id"]
    }
                  ]
                },"accommodations": {
                  Row: {
                    "air_conditioning": boolean,"bathrooms": number | null,"bedrooms": number | null,"booking_category_id": number | null,"capacity_max": number | null,"category_key": string,"cover_media_id": string | null,"id": string,"is_accessible": boolean,"size_m2": number | null,"slug": string,"sort_order": number,"status": Database["public"]['Enums']["publish_status"],"updated_at": string
                  }
                  Insert: {
                    "air_conditioning"?: boolean,"bathrooms"?: number | null,"bedrooms"?: number | null,"booking_category_id"?: number | null,"capacity_max"?: number | null,"category_key": string,"cover_media_id"?: string | null,"id"?: string,"is_accessible"?: boolean,"size_m2"?: number | null,"slug": string,"sort_order"?: number,"status"?: Database["public"]['Enums']["publish_status"],"updated_at"?: string
                  }
                  Update: {
                    "air_conditioning"?: boolean,"bathrooms"?: number | null,"bedrooms"?: number | null,"booking_category_id"?: number | null,"capacity_max"?: number | null,"category_key"?: string,"cover_media_id"?: string | null,"id"?: string,"is_accessible"?: boolean,"size_m2"?: number | null,"slug"?: string,"sort_order"?: number,"status"?: Database["public"]['Enums']["publish_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "accommodations_category_key_fkey"
      columns: ["category_key"]
isOneToOne: false
      referencedRelation: "accommodation_categories"
      referencedColumns: ["key"]
    },{
      foreignKeyName: "accommodations_cover_media_id_fkey"
      columns: ["cover_media_id"]
isOneToOne: false
      referencedRelation: "media"
      referencedColumns: ["id"]
    }
                  ]
                },"activities": {
                  Row: {
                    "audience": string | null,"cover_media_id": string | null,"hours": string | null,"id": string,"slug": string,"sort_order": number,"status": Database["public"]['Enums']["publish_status"],"updated_at": string,"zone": string | null
                  }
                  Insert: {
                    "audience"?: string | null,"cover_media_id"?: string | null,"hours"?: string | null,"id"?: string,"slug": string,"sort_order"?: number,"status"?: Database["public"]['Enums']["publish_status"],"updated_at"?: string,"zone"?: string | null
                  }
                  Update: {
                    "audience"?: string | null,"cover_media_id"?: string | null,"hours"?: string | null,"id"?: string,"slug"?: string,"sort_order"?: number,"status"?: Database["public"]['Enums']["publish_status"],"updated_at"?: string,"zone"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "activities_cover_media_id_fkey"
      columns: ["cover_media_id"]
isOneToOne: false
      referencedRelation: "media"
      referencedColumns: ["id"]
    }
                  ]
                },"activity_translations": {
                  Row: {
                    "activity_id": string,"description": string | null,"locale": Database["public"]['Enums']["locale"],"name": string
                  }
                  Insert: {
                    "activity_id": string,"description"?: string | null,"locale": Database["public"]['Enums']["locale"],"name": string
                  }
                  Update: {
                    "activity_id"?: string,"description"?: string | null,"locale"?: Database["public"]['Enums']["locale"],"name"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "activity_translations_activity_id_fkey"
      columns: ["activity_id"]
isOneToOne: false
      referencedRelation: "activities"
      referencedColumns: ["id"]
    }
                  ]
                },"map_point_translations": {
                  Row: {
                    "label": string,"locale": Database["public"]['Enums']["locale"],"map_point_id": string
                  }
                  Insert: {
                    "label": string,"locale": Database["public"]['Enums']["locale"],"map_point_id": string
                  }
                  Update: {
                    "label"?: string,"locale"?: Database["public"]['Enums']["locale"],"map_point_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "map_point_translations_map_point_id_fkey"
      columns: ["map_point_id"]
isOneToOne: false
      referencedRelation: "map_points"
      referencedColumns: ["id"]
    }
                  ]
                },"map_points": {
                  Row: {
                    "accommodation_category_key": string | null,"activity_id": string | null,"id": string,"kind": string,"restaurant_id": string | null,"service_id": string | null,"sort_order": number,"status": Database["public"]['Enums']["publish_status"],"updated_at": string,"x": number,"y": number
                  }
                  Insert: {
                    "accommodation_category_key"?: string | null,"activity_id"?: string | null,"id"?: string,"kind": string,"restaurant_id"?: string | null,"service_id"?: string | null,"sort_order"?: number,"status"?: Database["public"]['Enums']["publish_status"],"updated_at"?: string,"x": number,"y": number
                  }
                  Update: {
                    "accommodation_category_key"?: string | null,"activity_id"?: string | null,"id"?: string,"kind"?: string,"restaurant_id"?: string | null,"service_id"?: string | null,"sort_order"?: number,"status"?: Database["public"]['Enums']["publish_status"],"updated_at"?: string,"x"?: number,"y"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "map_points_accommodation_category_key_fkey"
      columns: ["accommodation_category_key"]
isOneToOne: false
      referencedRelation: "accommodation_categories"
      referencedColumns: ["key"]
    },{
      foreignKeyName: "map_points_activity_id_fkey"
      columns: ["activity_id"]
isOneToOne: false
      referencedRelation: "activities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "map_points_restaurant_id_fkey"
      columns: ["restaurant_id"]
isOneToOne: false
      referencedRelation: "restaurants"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "map_points_service_id_fkey"
      columns: ["service_id"]
isOneToOne: false
      referencedRelation: "services"
      referencedColumns: ["id"]
    }
                  ]
                },"media": {
                  Row: {
                    "created_at": string,"height": number | null,"id": string,"mime_type": string,"path": string,"source_url": string | null,"updated_at": string,"width": number | null
                  }
                  Insert: {
                    "created_at"?: string,"height"?: number | null,"id"?: string,"mime_type": string,"path": string,"source_url"?: string | null,"updated_at"?: string,"width"?: number | null
                  }
                  Update: {
                    "created_at"?: string,"height"?: number | null,"id"?: string,"mime_type"?: string,"path"?: string,"source_url"?: string | null,"updated_at"?: string,"width"?: number | null
                  }
                  Relationships: [
                    
                  ]
                },"media_translations": {
                  Row: {
                    "alt": string,"locale": Database["public"]['Enums']["locale"],"media_id": string
                  }
                  Insert: {
                    "alt"?: string,"locale": Database["public"]['Enums']["locale"],"media_id": string
                  }
                  Update: {
                    "alt"?: string,"locale"?: Database["public"]['Enums']["locale"],"media_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "media_translations_media_id_fkey"
      columns: ["media_id"]
isOneToOne: false
      referencedRelation: "media"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"display_name": string | null,"id": string,"role": Database["public"]['Enums']["app_role"]
                  }
                  Insert: {
                    "created_at"?: string,"display_name"?: string | null,"id": string,"role"?: Database["public"]['Enums']["app_role"]
                  }
                  Update: {
                    "created_at"?: string,"display_name"?: string | null,"id"?: string,"role"?: Database["public"]['Enums']["app_role"]
                  }
                  Relationships: [
                    
                  ]
                },"restaurant_translations": {
                  Row: {
                    "description": string | null,"locale": Database["public"]['Enums']["locale"],"menu_url": string | null,"name": string,"restaurant_id": string
                  }
                  Insert: {
                    "description"?: string | null,"locale": Database["public"]['Enums']["locale"],"menu_url"?: string | null,"name": string,"restaurant_id": string
                  }
                  Update: {
                    "description"?: string | null,"locale"?: Database["public"]['Enums']["locale"],"menu_url"?: string | null,"name"?: string,"restaurant_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "restaurant_translations_restaurant_id_fkey"
      columns: ["restaurant_id"]
isOneToOne: false
      referencedRelation: "restaurants"
      referencedColumns: ["id"]
    }
                  ]
                },"restaurants": {
                  Row: {
                    "cover_media_id": string | null,"hours": string | null,"id": string,"slug": string,"sort_order": number,"status": Database["public"]['Enums']["publish_status"],"updated_at": string,"zone": string | null
                  }
                  Insert: {
                    "cover_media_id"?: string | null,"hours"?: string | null,"id"?: string,"slug": string,"sort_order"?: number,"status"?: Database["public"]['Enums']["publish_status"],"updated_at"?: string,"zone"?: string | null
                  }
                  Update: {
                    "cover_media_id"?: string | null,"hours"?: string | null,"id"?: string,"slug"?: string,"sort_order"?: number,"status"?: Database["public"]['Enums']["publish_status"],"updated_at"?: string,"zone"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "restaurants_cover_media_id_fkey"
      columns: ["cover_media_id"]
isOneToOne: false
      referencedRelation: "media"
      referencedColumns: ["id"]
    }
                  ]
                },"section_translations": {
                  Row: {
                    "body": string | null,"cta_label": string | null,"highlight": string | null,"locale": Database["public"]['Enums']["locale"],"section_key": string,"title": string
                  }
                  Insert: {
                    "body"?: string | null,"cta_label"?: string | null,"highlight"?: string | null,"locale": Database["public"]['Enums']["locale"],"section_key": string,"title": string
                  }
                  Update: {
                    "body"?: string | null,"cta_label"?: string | null,"highlight"?: string | null,"locale"?: Database["public"]['Enums']["locale"],"section_key"?: string,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "section_translations_section_key_fkey"
      columns: ["section_key"]
isOneToOne: false
      referencedRelation: "sections"
      referencedColumns: ["key"]
    }
                  ]
                },"sections": {
                  Row: {
                    "is_visible": boolean,"key": string,"media_id": string | null,"sort_order": number,"updated_at": string
                  }
                  Insert: {
                    "is_visible"?: boolean,"key": string,"media_id"?: string | null,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "is_visible"?: boolean,"key"?: string,"media_id"?: string | null,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "sections_media_id_fkey"
      columns: ["media_id"]
isOneToOne: false
      referencedRelation: "media"
      referencedColumns: ["id"]
    }
                  ]
                },"service_translations": {
                  Row: {
                    "description": string | null,"locale": Database["public"]['Enums']["locale"],"name": string,"service_id": string
                  }
                  Insert: {
                    "description"?: string | null,"locale": Database["public"]['Enums']["locale"],"name": string,"service_id": string
                  }
                  Update: {
                    "description"?: string | null,"locale"?: Database["public"]['Enums']["locale"],"name"?: string,"service_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "service_translations_service_id_fkey"
      columns: ["service_id"]
isOneToOne: false
      referencedRelation: "services"
      referencedColumns: ["id"]
    }
                  ]
                },"services": {
                  Row: {
                    "icon_media_id": string | null,"id": string,"legacy_anchor": string | null,"media_id": string | null,"slug": string,"sort_order": number,"status": Database["public"]['Enums']["publish_status"],"updated_at": string
                  }
                  Insert: {
                    "icon_media_id"?: string | null,"id"?: string,"legacy_anchor"?: string | null,"media_id"?: string | null,"slug": string,"sort_order"?: number,"status"?: Database["public"]['Enums']["publish_status"],"updated_at"?: string
                  }
                  Update: {
                    "icon_media_id"?: string | null,"id"?: string,"legacy_anchor"?: string | null,"media_id"?: string | null,"slug"?: string,"sort_order"?: number,"status"?: Database["public"]['Enums']["publish_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "services_icon_media_id_fkey"
      columns: ["icon_media_id"]
isOneToOne: false
      referencedRelation: "media"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "services_media_id_fkey"
      columns: ["media_id"]
isOneToOne: false
      referencedRelation: "media"
      referencedColumns: ["id"]
    }
                  ]
                },"site_settings": {
                  Row: {
                    "booking_url": string | null,"brand_name": string,"client_portal_url": string | null,"country": string | null,"email_events": string | null,"email_info": string | null,"email_jobs": string | null,"email_reservations": string | null,"email_whistleblowing": string | null,"id": boolean,"lat": number | null,"legal_name": string,"license_code": string | null,"lng": number | null,"locality": string | null,"logo_media_id": string | null,"phone_display": string | null,"phone_e164": string | null,"postal_code": string | null,"region": string | null,"season_close": string | null,"season_open": string | null,"street": string | null,"updated_at": string
                  }
                  Insert: {
                    "booking_url"?: string | null,"brand_name": string,"client_portal_url"?: string | null,"country"?: string | null,"email_events"?: string | null,"email_info"?: string | null,"email_jobs"?: string | null,"email_reservations"?: string | null,"email_whistleblowing"?: string | null,"id"?: boolean,"lat"?: number | null,"legal_name": string,"license_code"?: string | null,"lng"?: number | null,"locality"?: string | null,"logo_media_id"?: string | null,"phone_display"?: string | null,"phone_e164"?: string | null,"postal_code"?: string | null,"region"?: string | null,"season_close"?: string | null,"season_open"?: string | null,"street"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "booking_url"?: string | null,"brand_name"?: string,"client_portal_url"?: string | null,"country"?: string | null,"email_events"?: string | null,"email_info"?: string | null,"email_jobs"?: string | null,"email_reservations"?: string | null,"email_whistleblowing"?: string | null,"id"?: boolean,"lat"?: number | null,"legal_name"?: string,"license_code"?: string | null,"lng"?: number | null,"locality"?: string | null,"logo_media_id"?: string | null,"phone_display"?: string | null,"phone_e164"?: string | null,"postal_code"?: string | null,"region"?: string | null,"season_close"?: string | null,"season_open"?: string | null,"street"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "site_settings_logo_media_id_fkey"
      columns: ["logo_media_id"]
isOneToOne: false
      referencedRelation: "media"
      referencedColumns: ["id"]
    }
                  ]
                },"site_settings_translations": {
                  Row: {
                    "locale": Database["public"]['Enums']["locale"],"season_notice": string | null,"seo_description": string | null,"seo_title": string | null
                  }
                  Insert: {
                    "locale": Database["public"]['Enums']["locale"],"season_notice"?: string | null,"seo_description"?: string | null,"seo_title"?: string | null
                  }
                  Update: {
                    "locale"?: Database["public"]['Enums']["locale"],"season_notice"?: string | null,"seo_description"?: string | null,"seo_title"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"testimonials": {
                  Row: {
                    "author": string,"id": string,"locale": Database["public"]['Enums']["locale"],"quote": string,"rating": number | null,"sort_order": number,"source": string | null,"status": Database["public"]['Enums']["publish_status"],"title": string | null,"updated_at": string
                  }
                  Insert: {
                    "author": string,"id"?: string,"locale": Database["public"]['Enums']["locale"],"quote": string,"rating"?: number | null,"sort_order"?: number,"source"?: string | null,"status"?: Database["public"]['Enums']["publish_status"],"title"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "author"?: string,"id"?: string,"locale"?: Database["public"]['Enums']["locale"],"quote"?: string,"rating"?: number | null,"sort_order"?: number,"source"?: string | null,"status"?: Database["public"]['Enums']["publish_status"],"title"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
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
            "app_role": "admin"|"editor","locale": "es"|"ca"|"fr"|"en"|"nl","publish_status": "draft"|"published"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "app_role": ["admin", "editor"],"locale": ["es", "ca", "fr", "en", "nl"],"publish_status": ["draft", "published"]
          }
        }
} as const

