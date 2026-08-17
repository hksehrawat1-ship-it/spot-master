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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      cases: {
        Row: {
          available_equipment: string[]
          available_products: string[]
          care_label_confidence: number | null
          care_label_information: string | null
          created_at: string
          damage_risks: string[]
          domestic_suitability_confidence: number | null
          fabric_confidence: number | null
          garment_information: Json
          garment_profile_id: string | null
          id: string
          organization_id: string | null
          previous_treatments: string | null
          product_document_confidence: number | null
          recommended_route: string | null
          risk_level: Database["public"]["Enums"]["risk_level"]
          stain_age: string | null
          stain_identification_confidence: number | null
          stain_source: string | null
          suspected_stains: string[]
          treatment_selection_confidence: number | null
          updated_at: string
          user_id: string | null
          user_type: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          available_equipment?: string[]
          available_products?: string[]
          care_label_confidence?: number | null
          care_label_information?: string | null
          created_at?: string
          damage_risks?: string[]
          domestic_suitability_confidence?: number | null
          fabric_confidence?: number | null
          garment_information?: Json
          garment_profile_id?: string | null
          id?: string
          organization_id?: string | null
          previous_treatments?: string | null
          product_document_confidence?: number | null
          recommended_route?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"]
          stain_age?: string | null
          stain_identification_confidence?: number | null
          stain_source?: string | null
          suspected_stains?: string[]
          treatment_selection_confidence?: number | null
          updated_at?: string
          user_id?: string | null
          user_type?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          available_equipment?: string[]
          available_products?: string[]
          care_label_confidence?: number | null
          care_label_information?: string | null
          created_at?: string
          damage_risks?: string[]
          domestic_suitability_confidence?: number | null
          fabric_confidence?: number | null
          garment_information?: Json
          garment_profile_id?: string | null
          id?: string
          organization_id?: string | null
          previous_treatments?: string | null
          product_document_confidence?: number | null
          recommended_route?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"]
          stain_age?: string | null
          stain_identification_confidence?: number | null
          stain_source?: string | null
          suspected_stains?: string[]
          treatment_selection_confidence?: number | null
          updated_at?: string
          user_id?: string | null
          user_type?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "cases_garment_profile_id_fkey"
            columns: ["garment_profile_id"]
            isOneToOne: false
            referencedRelation: "garment_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          company_name: string
          country: string | null
          created_at: string
          id: string
          legal_name: string | null
          manufacturer_or_distributor: string | null
          notes: string | null
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          website: string | null
        }
        Insert: {
          company_name: string
          country?: string | null
          created_at?: string
          id?: string
          legal_name?: string | null
          manufacturer_or_distributor?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          website?: string | null
        }
        Update: {
          company_name?: string
          country?: string | null
          created_at?: string
          id?: string
          legal_name?: string | null
          manufacturer_or_distributor?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          website?: string | null
        }
        Relationships: []
      }
      content_audit_log: {
        Row: {
          action: string
          changed_by: string | null
          created_at: string
          id: string
          new_data: Json | null
          note: string | null
          previous_data: Json | null
          record_id: string
          table_name: string
        }
        Insert: {
          action: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_data?: Json | null
          note?: string | null
          previous_data?: Json | null
          record_id: string
          table_name: string
        }
        Update: {
          action?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_data?: Json | null
          note?: string | null
          previous_data?: Json | null
          record_id?: string
          table_name?: string
        }
        Relationships: []
      }
      domestic_treatments: {
        Row: {
          actions_to_avoid: string[]
          approval_status: Database["public"]["Enums"]["content_status"]
          confidence_score: number
          country_applicability: string[]
          created_at: string
          eligible_colours: string[]
          eligible_fabrics: string[]
          escalation_point: string | null
          hidden_area_test: string | null
          id: string
          maximum_attempts: number
          method: string | null
          next_review_date: string | null
          prohibited_fabrics: string[]
          required_materials: string[]
          review_date: string | null
          reviewer: string | null
          source: string | null
          stain_id: string
          stop_conditions: string[]
          title: string | null
          updated_at: string
          version: number
        }
        Insert: {
          actions_to_avoid?: string[]
          approval_status?: Database["public"]["Enums"]["content_status"]
          confidence_score?: number
          country_applicability?: string[]
          created_at?: string
          eligible_colours?: string[]
          eligible_fabrics?: string[]
          escalation_point?: string | null
          hidden_area_test?: string | null
          id?: string
          maximum_attempts?: number
          method?: string | null
          next_review_date?: string | null
          prohibited_fabrics?: string[]
          required_materials?: string[]
          review_date?: string | null
          reviewer?: string | null
          source?: string | null
          stain_id: string
          stop_conditions?: string[]
          title?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          actions_to_avoid?: string[]
          approval_status?: Database["public"]["Enums"]["content_status"]
          confidence_score?: number
          country_applicability?: string[]
          created_at?: string
          eligible_colours?: string[]
          eligible_fabrics?: string[]
          escalation_point?: string | null
          hidden_area_test?: string | null
          id?: string
          maximum_attempts?: number
          method?: string | null
          next_review_date?: string | null
          prohibited_fabrics?: string[]
          required_materials?: string[]
          review_date?: string | null
          reviewer?: string | null
          source?: string | null
          stain_id?: string
          stop_conditions?: string[]
          title?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "domestic_treatments_stain_id_fkey"
            columns: ["stain_id"]
            isOneToOne: false
            referencedRelation: "stains"
            referencedColumns: ["id"]
          },
        ]
      }
      fabric_assessment_audit: {
        Row: {
          action: string
          assessment_id: string
          changed_by: string | null
          created_at: string
          id: string
          new_data: Json | null
          previous_data: Json | null
          reason: string | null
        }
        Insert: {
          action: string
          assessment_id: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_data?: Json | null
          previous_data?: Json | null
          reason?: string | null
        }
        Update: {
          action?: string
          assessment_id?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_data?: Json | null
          previous_data?: Json | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fabric_assessment_audit_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "fabric_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      fabric_assessment_events: {
        Row: {
          assessment_id: string | null
          created_at: string
          event_name: string
          id: string
          properties: Json
          stage: string | null
          user_id: string | null
        }
        Insert: {
          assessment_id?: string | null
          created_at?: string
          event_name: string
          id?: string
          properties?: Json
          stage?: string | null
          user_id?: string | null
        }
        Update: {
          assessment_id?: string | null
          created_at?: string
          event_name?: string
          id?: string
          properties?: Json
          stage?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fabric_assessment_events_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "fabric_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      fabric_assessment_photos: {
        Row: {
          assessment_id: string
          created_at: string
          extracted_text: string | null
          extraction_confidence: number | null
          id: string
          kind: Database["public"]["Enums"]["assessment_photo_kind"]
          quality_notes: string | null
          storage_path: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assessment_id: string
          created_at?: string
          extracted_text?: string | null
          extraction_confidence?: number | null
          id?: string
          kind: Database["public"]["Enums"]["assessment_photo_kind"]
          quality_notes?: string | null
          storage_path?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assessment_id?: string
          created_at?: string
          extracted_text?: string | null
          extraction_confidence?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["assessment_photo_kind"]
          quality_notes?: string | null
          storage_path?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fabric_assessment_photos_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "fabric_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      fabric_assessments: {
        Row: {
          admin_override_applied: boolean
          admin_override_reason: string | null
          assessment_version: number
          case_id: string | null
          cleaning_history: string[]
          cleaning_history_notes: Json
          colour_description: string[]
          colour_flags: Json
          completed_at: string | null
          confirmed_label: Json
          construction_features: string[]
          created_at: string
          current_stage: string | null
          damage_risks: string[]
          existing_damage: string[]
          extracted_label: Json
          fabric_appearance: string[]
          fabric_confidence: Database["public"]["Enums"]["fabric_confidence_level"]
          fabric_confidence_reason: string | null
          garment_importance: string[]
          garment_type: string | null
          garment_type_other: string | null
          id: string
          label_extraction_confidence: number | null
          label_language: string | null
          label_status: Database["public"]["Enums"]["label_status"]
          label_user_confirmed: boolean
          organization_id: string | null
          raw_label_text: string | null
          recommended_next_action: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          risk_factors: Json
          risk_group: Database["public"]["Enums"]["fabric_risk_group"] | null
          risk_level: Database["public"]["Enums"]["risk_level"]
          risk_reason: string | null
          risk_score: number
          rules_version: string
          safety_overrides: Json
          stain_touches_feature: boolean | null
          state: Database["public"]["Enums"]["assessment_state"]
          suspected_material_family: string | null
          treatment_gate: Database["public"]["Enums"]["treatment_gate_status"]
          unresolved_label_items: string[]
          updated_at: string
          user_id: string | null
          user_type: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          admin_override_applied?: boolean
          admin_override_reason?: string | null
          assessment_version?: number
          case_id?: string | null
          cleaning_history?: string[]
          cleaning_history_notes?: Json
          colour_description?: string[]
          colour_flags?: Json
          completed_at?: string | null
          confirmed_label?: Json
          construction_features?: string[]
          created_at?: string
          current_stage?: string | null
          damage_risks?: string[]
          existing_damage?: string[]
          extracted_label?: Json
          fabric_appearance?: string[]
          fabric_confidence?: Database["public"]["Enums"]["fabric_confidence_level"]
          fabric_confidence_reason?: string | null
          garment_importance?: string[]
          garment_type?: string | null
          garment_type_other?: string | null
          id?: string
          label_extraction_confidence?: number | null
          label_language?: string | null
          label_status?: Database["public"]["Enums"]["label_status"]
          label_user_confirmed?: boolean
          organization_id?: string | null
          raw_label_text?: string | null
          recommended_next_action?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_factors?: Json
          risk_group?: Database["public"]["Enums"]["fabric_risk_group"] | null
          risk_level?: Database["public"]["Enums"]["risk_level"]
          risk_reason?: string | null
          risk_score?: number
          rules_version?: string
          safety_overrides?: Json
          stain_touches_feature?: boolean | null
          state?: Database["public"]["Enums"]["assessment_state"]
          suspected_material_family?: string | null
          treatment_gate?: Database["public"]["Enums"]["treatment_gate_status"]
          unresolved_label_items?: string[]
          updated_at?: string
          user_id?: string | null
          user_type?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          admin_override_applied?: boolean
          admin_override_reason?: string | null
          assessment_version?: number
          case_id?: string | null
          cleaning_history?: string[]
          cleaning_history_notes?: Json
          colour_description?: string[]
          colour_flags?: Json
          completed_at?: string | null
          confirmed_label?: Json
          construction_features?: string[]
          created_at?: string
          current_stage?: string | null
          damage_risks?: string[]
          existing_damage?: string[]
          extracted_label?: Json
          fabric_appearance?: string[]
          fabric_confidence?: Database["public"]["Enums"]["fabric_confidence_level"]
          fabric_confidence_reason?: string | null
          garment_importance?: string[]
          garment_type?: string | null
          garment_type_other?: string | null
          id?: string
          label_extraction_confidence?: number | null
          label_language?: string | null
          label_status?: Database["public"]["Enums"]["label_status"]
          label_user_confirmed?: boolean
          organization_id?: string | null
          raw_label_text?: string | null
          recommended_next_action?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_factors?: Json
          risk_group?: Database["public"]["Enums"]["fabric_risk_group"] | null
          risk_level?: Database["public"]["Enums"]["risk_level"]
          risk_reason?: string | null
          risk_score?: number
          rules_version?: string
          safety_overrides?: Json
          stain_touches_feature?: boolean | null
          state?: Database["public"]["Enums"]["assessment_state"]
          suspected_material_family?: string | null
          treatment_gate?: Database["public"]["Enums"]["treatment_gate_status"]
          unresolved_label_items?: string[]
          updated_at?: string
          user_id?: string | null
          user_type?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "fabric_assessments_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fabric_assessments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      fabric_compatibility_tests: {
        Row: {
          assessment_id: string
          colour_transfer: string | null
          created_at: string
          decision: string | null
          distortion: string | null
          id: string
          medium_used: string | null
          method_source: string | null
          notes: string | null
          operator: string | null
          performed_at: string
          photo_path: string | null
          result: string | null
          ring_formation: string | null
          test_location: string | null
          test_type: string
          texture_change: string | null
          updated_at: string
        }
        Insert: {
          assessment_id: string
          colour_transfer?: string | null
          created_at?: string
          decision?: string | null
          distortion?: string | null
          id?: string
          medium_used?: string | null
          method_source?: string | null
          notes?: string | null
          operator?: string | null
          performed_at?: string
          photo_path?: string | null
          result?: string | null
          ring_formation?: string | null
          test_location?: string | null
          test_type: string
          texture_change?: string | null
          updated_at?: string
        }
        Update: {
          assessment_id?: string
          colour_transfer?: string | null
          created_at?: string
          decision?: string | null
          distortion?: string | null
          id?: string
          medium_used?: string | null
          method_source?: string | null
          notes?: string | null
          operator?: string | null
          performed_at?: string
          photo_path?: string | null
          result?: string | null
          ring_formation?: string | null
          test_location?: string | null
          test_type?: string
          texture_change?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fabric_compatibility_tests_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "fabric_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      fabric_risk_rules: {
        Row: {
          active: boolean
          category: string
          created_at: string
          description: string | null
          forces_risk: Database["public"]["Enums"]["risk_level"] | null
          id: string
          is_override: boolean
          label: string
          rule_key: string
          rules_version: string
          updated_at: string
          weight: number
        }
        Insert: {
          active?: boolean
          category?: string
          created_at?: string
          description?: string | null
          forces_risk?: Database["public"]["Enums"]["risk_level"] | null
          id?: string
          is_override?: boolean
          label: string
          rule_key: string
          rules_version: string
          updated_at?: string
          weight?: number
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          description?: string | null
          forces_risk?: Database["public"]["Enums"]["risk_level"] | null
          id?: string
          is_override?: boolean
          label?: string
          rule_key?: string
          rules_version?: string
          updated_at?: string
          weight?: number
        }
        Relationships: []
      }
      fabrics: {
        Row: {
          acid_sensitivity: Database["public"]["Enums"]["sensitivity_level"]
          alkali_sensitivity: Database["public"]["Enums"]["sensitivity_level"]
          colourfastness_concerns: string | null
          common_names: string[]
          created_at: string
          fabric_key: string
          general_properties: string | null
          heat_sensitivity: Database["public"]["Enums"]["sensitivity_level"]
          id: string
          material_family: string
          mechanical_action_sensitivity: Database["public"]["Enums"]["sensitivity_level"]
          name: string
          oxidation_sensitivity: Database["public"]["Enums"]["sensitivity_level"]
          professional_referral_notes: string | null
          reduction_sensitivity: Database["public"]["Enums"]["sensitivity_level"]
          solvent_sensitivity: Database["public"]["Enums"]["sensitivity_level"]
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
          water_sensitivity: Database["public"]["Enums"]["sensitivity_level"]
        }
        Insert: {
          acid_sensitivity?: Database["public"]["Enums"]["sensitivity_level"]
          alkali_sensitivity?: Database["public"]["Enums"]["sensitivity_level"]
          colourfastness_concerns?: string | null
          common_names?: string[]
          created_at?: string
          fabric_key: string
          general_properties?: string | null
          heat_sensitivity?: Database["public"]["Enums"]["sensitivity_level"]
          id?: string
          material_family: string
          mechanical_action_sensitivity?: Database["public"]["Enums"]["sensitivity_level"]
          name: string
          oxidation_sensitivity?: Database["public"]["Enums"]["sensitivity_level"]
          professional_referral_notes?: string | null
          reduction_sensitivity?: Database["public"]["Enums"]["sensitivity_level"]
          solvent_sensitivity?: Database["public"]["Enums"]["sensitivity_level"]
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
          water_sensitivity?: Database["public"]["Enums"]["sensitivity_level"]
        }
        Update: {
          acid_sensitivity?: Database["public"]["Enums"]["sensitivity_level"]
          alkali_sensitivity?: Database["public"]["Enums"]["sensitivity_level"]
          colourfastness_concerns?: string | null
          common_names?: string[]
          created_at?: string
          fabric_key?: string
          general_properties?: string | null
          heat_sensitivity?: Database["public"]["Enums"]["sensitivity_level"]
          id?: string
          material_family?: string
          mechanical_action_sensitivity?: Database["public"]["Enums"]["sensitivity_level"]
          name?: string
          oxidation_sensitivity?: Database["public"]["Enums"]["sensitivity_level"]
          professional_referral_notes?: string | null
          reduction_sensitivity?: Database["public"]["Enums"]["sensitivity_level"]
          solvent_sensitivity?: Database["public"]["Enums"]["sensitivity_level"]
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
          water_sensitivity?: Database["public"]["Enums"]["sensitivity_level"]
        }
        Relationships: []
      }
      garment_profiles: {
        Row: {
          adhesive_construction: boolean
          beads: boolean
          care_label_available: boolean | null
          coating: boolean
          colour_group: string | null
          created_at: string
          embroidery: boolean
          existing_damage: string | null
          garment_type: string | null
          garment_value: string | null
          id: string
          interlining: boolean
          known_fibre: string | null
          lamination: boolean
          leather_or_suede_components: boolean
          lining: boolean
          material_confidence: number | null
          metallic_thread: boolean
          multicoloured: boolean
          previous_successful_cleaning_method: string | null
          sentimental_value: boolean
          sequins: boolean
          surface_print: boolean
          suspected_material_family: string | null
          updated_at: string
          user_id: string | null
          waterproof_finish: boolean
        }
        Insert: {
          adhesive_construction?: boolean
          beads?: boolean
          care_label_available?: boolean | null
          coating?: boolean
          colour_group?: string | null
          created_at?: string
          embroidery?: boolean
          existing_damage?: string | null
          garment_type?: string | null
          garment_value?: string | null
          id?: string
          interlining?: boolean
          known_fibre?: string | null
          lamination?: boolean
          leather_or_suede_components?: boolean
          lining?: boolean
          material_confidence?: number | null
          metallic_thread?: boolean
          multicoloured?: boolean
          previous_successful_cleaning_method?: string | null
          sentimental_value?: boolean
          sequins?: boolean
          surface_print?: boolean
          suspected_material_family?: string | null
          updated_at?: string
          user_id?: string | null
          waterproof_finish?: boolean
        }
        Update: {
          adhesive_construction?: boolean
          beads?: boolean
          care_label_available?: boolean | null
          coating?: boolean
          colour_group?: string | null
          created_at?: string
          embroidery?: boolean
          existing_damage?: string | null
          garment_type?: string | null
          garment_value?: string | null
          id?: string
          interlining?: boolean
          known_fibre?: string | null
          lamination?: boolean
          leather_or_suede_components?: boolean
          lining?: boolean
          material_confidence?: number | null
          metallic_thread?: boolean
          multicoloured?: boolean
          previous_successful_cleaning_method?: string | null
          sentimental_value?: boolean
          sequins?: boolean
          surface_print?: boolean
          suspected_material_family?: string | null
          updated_at?: string
          user_id?: string | null
          waterproof_finish?: boolean
        }
        Relationships: []
      }
      organizations: {
        Row: {
          active_product_kits: Json
          country: string | null
          created_at: string
          id: string
          location: string | null
          organization_name: string
          organization_type: string | null
          preferred_language: string
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
        }
        Insert: {
          active_product_kits?: Json
          country?: string | null
          created_at?: string
          id?: string
          location?: string | null
          organization_name: string
          organization_type?: string | null
          preferred_language?: string
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Update: {
          active_product_kits?: Json
          country?: string | null
          created_at?: string
          id?: string
          location?: string | null
          organization_name?: string
          organization_type?: string | null
          preferred_language?: string
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Relationships: []
      }
      product_kits: {
        Row: {
          company_id: string
          country_availability: string[]
          created_at: string
          id: string
          intended_users: string[]
          kit_name: string
          kit_version: string | null
          number_of_products: number | null
          source_status: Database["public"]["Enums"]["verification_status"]
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
        }
        Insert: {
          company_id: string
          country_availability?: string[]
          created_at?: string
          id?: string
          intended_users?: string[]
          kit_name: string
          kit_version?: string | null
          number_of_products?: number | null
          source_status?: Database["public"]["Enums"]["verification_status"]
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Update: {
          company_id?: string
          country_availability?: string[]
          created_at?: string
          id?: string
          intended_users?: string[]
          kit_name?: string
          kit_version?: string | null
          number_of_products?: number | null
          source_status?: Database["public"]["Enums"]["verification_status"]
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_kits_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      product_mappings: {
        Row: {
          approval_status: Database["public"]["Enums"]["content_status"]
          colour_condition: string | null
          country: string | null
          created_at: string
          evidence_level: Database["public"]["Enums"]["evidence_level"]
          fabric_id: string | null
          garment_construction: string | null
          id: string
          last_reviewed_at: string | null
          material_family: string | null
          product_id: string
          restriction: string | null
          reviewer: string | null
          risk_level: Database["public"]["Enums"]["risk_level"]
          source_document_id: string | null
          stain_category_id: string | null
          stain_id: string | null
          suitability: Database["public"]["Enums"]["suitability_decision"]
          treatment_principle_id: string | null
          treatment_stage: string | null
          updated_at: string
          user_capability: Database["public"]["Enums"]["app_role"] | null
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["content_status"]
          colour_condition?: string | null
          country?: string | null
          created_at?: string
          evidence_level?: Database["public"]["Enums"]["evidence_level"]
          fabric_id?: string | null
          garment_construction?: string | null
          id?: string
          last_reviewed_at?: string | null
          material_family?: string | null
          product_id: string
          restriction?: string | null
          reviewer?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"]
          source_document_id?: string | null
          stain_category_id?: string | null
          stain_id?: string | null
          suitability?: Database["public"]["Enums"]["suitability_decision"]
          treatment_principle_id?: string | null
          treatment_stage?: string | null
          updated_at?: string
          user_capability?: Database["public"]["Enums"]["app_role"] | null
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["content_status"]
          colour_condition?: string | null
          country?: string | null
          created_at?: string
          evidence_level?: Database["public"]["Enums"]["evidence_level"]
          fabric_id?: string | null
          garment_construction?: string | null
          id?: string
          last_reviewed_at?: string | null
          material_family?: string | null
          product_id?: string
          restriction?: string | null
          reviewer?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"]
          source_document_id?: string | null
          stain_category_id?: string | null
          stain_id?: string | null
          suitability?: Database["public"]["Enums"]["suitability_decision"]
          treatment_principle_id?: string | null
          treatment_stage?: string | null
          updated_at?: string
          user_capability?: Database["public"]["Enums"]["app_role"] | null
        }
        Relationships: [
          {
            foreignKeyName: "product_mappings_fabric_id_fkey"
            columns: ["fabric_id"]
            isOneToOne: false
            referencedRelation: "fabrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_mappings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "professional_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_mappings_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "source_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_mappings_stain_category_id_fkey"
            columns: ["stain_category_id"]
            isOneToOne: false
            referencedRelation: "stain_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_mappings_stain_id_fkey"
            columns: ["stain_id"]
            isOneToOne: false
            referencedRelation: "stains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_mappings_treatment_principle_id_fkey"
            columns: ["treatment_principle_id"]
            isOneToOne: false
            referencedRelation: "treatment_principles"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_products: {
        Row: {
          active_chemistry: string
          applicable_colours: string[]
          application_method: string
          chemical_family: string
          company_id: string
          compatible_materials: string[]
          contact_time: string
          cost_per_use: number | null
          country_availability: string[]
          created_at: string
          dilution_instruction: string
          id: string
          incompatibilities: string | null
          intended_stain_categories: string[]
          intended_stains: string[]
          kit_id: string | null
          label_version: string | null
          manufacturer_claims: string | null
          neutralization_instruction: string
          pack_sizes: string[]
          ppe: string | null
          product_code: string | null
          product_colour: string | null
          product_name: string
          prohibited_materials: string[]
          record_state: Database["public"]["Enums"]["record_status"]
          rinsing_instruction: string
          safety_warnings: string | null
          sds_version: string | null
          status: Database["public"]["Enums"]["content_status"]
          storage: string | null
          tds_version: string | null
          temperature_limits: string
          training_requirement: string | null
          updated_at: string
          ventilation: string | null
          verification_status: Database["public"]["Enums"]["verification_status"]
          verified_performance_evidence: string | null
        }
        Insert: {
          active_chemistry?: string
          applicable_colours?: string[]
          application_method?: string
          chemical_family?: string
          company_id: string
          compatible_materials?: string[]
          contact_time?: string
          cost_per_use?: number | null
          country_availability?: string[]
          created_at?: string
          dilution_instruction?: string
          id?: string
          incompatibilities?: string | null
          intended_stain_categories?: string[]
          intended_stains?: string[]
          kit_id?: string | null
          label_version?: string | null
          manufacturer_claims?: string | null
          neutralization_instruction?: string
          pack_sizes?: string[]
          ppe?: string | null
          product_code?: string | null
          product_colour?: string | null
          product_name: string
          prohibited_materials?: string[]
          record_state?: Database["public"]["Enums"]["record_status"]
          rinsing_instruction?: string
          safety_warnings?: string | null
          sds_version?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          storage?: string | null
          tds_version?: string | null
          temperature_limits?: string
          training_requirement?: string | null
          updated_at?: string
          ventilation?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_performance_evidence?: string | null
        }
        Update: {
          active_chemistry?: string
          applicable_colours?: string[]
          application_method?: string
          chemical_family?: string
          company_id?: string
          compatible_materials?: string[]
          contact_time?: string
          cost_per_use?: number | null
          country_availability?: string[]
          created_at?: string
          dilution_instruction?: string
          id?: string
          incompatibilities?: string | null
          intended_stain_categories?: string[]
          intended_stains?: string[]
          kit_id?: string | null
          label_version?: string | null
          manufacturer_claims?: string | null
          neutralization_instruction?: string
          pack_sizes?: string[]
          ppe?: string | null
          product_code?: string | null
          product_colour?: string | null
          product_name?: string
          prohibited_materials?: string[]
          record_state?: Database["public"]["Enums"]["record_status"]
          rinsing_instruction?: string
          safety_warnings?: string | null
          sds_version?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          storage?: string | null
          tds_version?: string | null
          temperature_limits?: string
          training_requirement?: string | null
          updated_at?: string
          ventilation?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_performance_evidence?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_products_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "product_kits"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          country: string | null
          created_at: string
          display_name: string | null
          id: string
          organization_id: string | null
          preferred_language: string
          status: string
          training_level: string
          updated_at: string
          user_id: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          organization_id?: string | null
          preferred_language?: string
          status?: string
          training_level?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          country?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          organization_id?: string | null
          preferred_language?: string
          status?: string
          training_level?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      source_documents: {
        Row: {
          company_id: string | null
          country: string | null
          created_at: string
          document_title: string
          document_type: Database["public"]["Enums"]["document_type"]
          file_or_url: string | null
          id: string
          issuing_organization: string | null
          language: string
          notes: string | null
          product_id: string | null
          publication_date: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          revision_date: string | null
          supersedes_document_id: string | null
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          version: string | null
        }
        Insert: {
          company_id?: string | null
          country?: string | null
          created_at?: string
          document_title: string
          document_type: Database["public"]["Enums"]["document_type"]
          file_or_url?: string | null
          id?: string
          issuing_organization?: string | null
          language?: string
          notes?: string | null
          product_id?: string | null
          publication_date?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          revision_date?: string | null
          supersedes_document_id?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          version?: string | null
        }
        Update: {
          company_id?: string | null
          country?: string | null
          created_at?: string
          document_title?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          file_or_url?: string | null
          id?: string
          issuing_organization?: string | null
          language?: string
          notes?: string | null
          product_id?: string | null
          publication_date?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          revision_date?: string | null
          supersedes_document_id?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "source_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_documents_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "professional_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_documents_supersedes_document_id_fkey"
            columns: ["supersedes_document_id"]
            isOneToOne: false
            referencedRelation: "source_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      stain_categories: {
        Row: {
          category_key: string
          created_at: string
          description: string | null
          id: string
          name: string
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
        }
        Insert: {
          category_key: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Update: {
          category_key?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Relationships: []
      }
      stain_tags: {
        Row: {
          stain_id: string
          tag_id: string
        }
        Insert: {
          stain_id: string
          tag_id: string
        }
        Update: {
          stain_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stain_tags_stain_id_fkey"
            columns: ["stain_id"]
            isOneToOne: false
            referencedRelation: "stains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stain_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      stains: {
        Row: {
          alternative_names: string[]
          bonding_behavior: string | null
          common_name: string
          common_sources: string[]
          content_version: number
          created_at: string
          description: string | null
          effect_of_acidity: string | null
          effect_of_ageing: string | null
          effect_of_alkalinity: string | null
          effect_of_heat: string | null
          effect_of_oxidation: string | null
          escalation_rule: string | null
          expected_outcome: string | null
          first_response: string | null
          heat_warning: string | null
          id: string
          identification_notes: string | null
          likely_composition: string | null
          primary_category_id: string | null
          solubility: string | null
          stain_id: string
          status: Database["public"]["Enums"]["content_status"]
          treatment_principle_summary: string | null
          updated_at: string
        }
        Insert: {
          alternative_names?: string[]
          bonding_behavior?: string | null
          common_name: string
          common_sources?: string[]
          content_version?: number
          created_at?: string
          description?: string | null
          effect_of_acidity?: string | null
          effect_of_ageing?: string | null
          effect_of_alkalinity?: string | null
          effect_of_heat?: string | null
          effect_of_oxidation?: string | null
          escalation_rule?: string | null
          expected_outcome?: string | null
          first_response?: string | null
          heat_warning?: string | null
          id?: string
          identification_notes?: string | null
          likely_composition?: string | null
          primary_category_id?: string | null
          solubility?: string | null
          stain_id: string
          status?: Database["public"]["Enums"]["content_status"]
          treatment_principle_summary?: string | null
          updated_at?: string
        }
        Update: {
          alternative_names?: string[]
          bonding_behavior?: string | null
          common_name?: string
          common_sources?: string[]
          content_version?: number
          created_at?: string
          description?: string | null
          effect_of_acidity?: string | null
          effect_of_ageing?: string | null
          effect_of_alkalinity?: string | null
          effect_of_heat?: string | null
          effect_of_oxidation?: string | null
          escalation_rule?: string | null
          expected_outcome?: string | null
          first_response?: string | null
          heat_warning?: string | null
          id?: string
          identification_notes?: string | null
          likely_composition?: string | null
          primary_category_id?: string | null
          solubility?: string | null
          stain_id?: string
          status?: Database["public"]["Enums"]["content_status"]
          treatment_principle_summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stains_primary_category_id_fkey"
            columns: ["primary_category_id"]
            isOneToOne: false
            referencedRelation: "stain_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          description: string | null
          id: string
          label: string
          tag_group: string | null
          tag_key: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          label: string
          tag_group?: string | null
          tag_key: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          label?: string
          tag_group?: string | null
          tag_key?: string
        }
        Relationships: []
      }
      treatment_attempts: {
        Row: {
          actions_taken: string | null
          attempt_date: string
          case_id: string
          colour_change: string | null
          created_at: string
          fibre_damage: string | null
          id: string
          notes: string | null
          odour: string | null
          operator: string | null
          pre_test_result: string | null
          product_id: string | null
          product_or_method: string | null
          repeatability: string | null
          residue: string | null
          result: string | null
          result_after_drying: string | null
          reviewer: string | null
          ring_formation: string | null
          shrinkage: string | null
          stop_reason: string | null
          texture_change: string | null
          treatment_stage: string | null
          updated_at: string
        }
        Insert: {
          actions_taken?: string | null
          attempt_date?: string
          case_id: string
          colour_change?: string | null
          created_at?: string
          fibre_damage?: string | null
          id?: string
          notes?: string | null
          odour?: string | null
          operator?: string | null
          pre_test_result?: string | null
          product_id?: string | null
          product_or_method?: string | null
          repeatability?: string | null
          residue?: string | null
          result?: string | null
          result_after_drying?: string | null
          reviewer?: string | null
          ring_formation?: string | null
          shrinkage?: string | null
          stop_reason?: string | null
          texture_change?: string | null
          treatment_stage?: string | null
          updated_at?: string
        }
        Update: {
          actions_taken?: string | null
          attempt_date?: string
          case_id?: string
          colour_change?: string | null
          created_at?: string
          fibre_damage?: string | null
          id?: string
          notes?: string | null
          odour?: string | null
          operator?: string | null
          pre_test_result?: string | null
          product_id?: string | null
          product_or_method?: string | null
          repeatability?: string | null
          residue?: string | null
          result?: string | null
          result_after_drying?: string | null
          reviewer?: string | null
          ring_formation?: string | null
          shrinkage?: string | null
          stop_reason?: string | null
          texture_change?: string | null
          treatment_stage?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_attempts_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_attempts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "professional_products"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_principles: {
        Row: {
          applicable_stain_categories: string[]
          created_at: string
          description: string | null
          evidence_level: Database["public"]["Enums"]["evidence_level"]
          flushing_principle: string | null
          heat_rule: string | null
          id: string
          inspection_requirement: string | null
          mechanical_action_rule: string | null
          name: string
          neutralization_principle: string | null
          principle_key: string
          professional_skill_requirement: string | null
          prohibited_conditions: string[]
          required_conditions: string[]
          status: Database["public"]["Enums"]["content_status"]
          stop_conditions: string[]
          treatment_stage: string | null
          updated_at: string
        }
        Insert: {
          applicable_stain_categories?: string[]
          created_at?: string
          description?: string | null
          evidence_level?: Database["public"]["Enums"]["evidence_level"]
          flushing_principle?: string | null
          heat_rule?: string | null
          id?: string
          inspection_requirement?: string | null
          mechanical_action_rule?: string | null
          name: string
          neutralization_principle?: string | null
          principle_key: string
          professional_skill_requirement?: string | null
          prohibited_conditions?: string[]
          required_conditions?: string[]
          status?: Database["public"]["Enums"]["content_status"]
          stop_conditions?: string[]
          treatment_stage?: string | null
          updated_at?: string
        }
        Update: {
          applicable_stain_categories?: string[]
          created_at?: string
          description?: string | null
          evidence_level?: Database["public"]["Enums"]["evidence_level"]
          flushing_principle?: string | null
          heat_rule?: string | null
          id?: string
          inspection_requirement?: string | null
          mechanical_action_rule?: string | null
          name?: string
          neutralization_principle?: string | null
          principle_key?: string
          professional_skill_requirement?: string | null
          prohibited_conditions?: string[]
          required_conditions?: string[]
          status?: Database["public"]["Enums"]["content_status"]
          stop_conditions?: string[]
          treatment_stage?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_content_maintainer: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "domestic_user"
        | "laundry_employee"
        | "dry_cleaner"
        | "professional_spotter"
        | "trainer"
        | "learner"
        | "technical_reviewer"
        | "content_admin"
        | "system_admin"
      assessment_photo_kind:
        | "fibre_composition_label"
        | "care_symbol_label"
        | "garment_front"
        | "garment_back"
        | "existing_damage"
        | "stain_area"
        | "professional_test"
      assessment_state: "in_progress" | "completed" | "abandoned"
      content_status:
        | "draft"
        | "under_review"
        | "approved"
        | "published"
        | "needs_review"
        | "suspended"
        | "archived"
      document_type:
        | "product_label"
        | "sds"
        | "tds"
        | "manufacturer_instruction"
        | "spotting_chart"
        | "equipment_manual"
        | "textile_standard"
        | "internal_trial"
        | "credible_reference"
      evidence_level:
        | "manufacturer_claim"
        | "label_documented"
        | "sds_tds_documented"
        | "independent_trial"
        | "textile_standard"
        | "none"
      fabric_confidence_level: "high" | "moderate" | "low" | "unknown"
      fabric_risk_group: "group_a" | "group_b" | "group_c" | "group_d"
      label_status: "available" | "no_label" | "unclear" | "unconfirmed"
      record_status: "active" | "discontinued" | "archived"
      risk_level: "green" | "amber" | "red" | "black"
      sensitivity_level:
        | "none"
        | "low"
        | "moderate"
        | "high"
        | "critical"
        | "unknown"
      suitability_decision:
        | "recommended"
        | "recommended_after_testing"
        | "professional_use_only"
        | "domestic_use_suitable"
        | "not_recommended"
        | "insufficient_information"
      treatment_gate_status:
        | "proceed"
        | "proceed_with_testing"
        | "professional_only"
        | "blocked_pending_identification"
        | "blocked_existing_damage"
        | "specialist_material_route"
      verification_status:
        | "unverified"
        | "pending_review"
        | "verified"
        | "insufficient_information"
        | "disputed"
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
      app_role: [
        "domestic_user",
        "laundry_employee",
        "dry_cleaner",
        "professional_spotter",
        "trainer",
        "learner",
        "technical_reviewer",
        "content_admin",
        "system_admin",
      ],
      assessment_photo_kind: [
        "fibre_composition_label",
        "care_symbol_label",
        "garment_front",
        "garment_back",
        "existing_damage",
        "stain_area",
        "professional_test",
      ],
      assessment_state: ["in_progress", "completed", "abandoned"],
      content_status: [
        "draft",
        "under_review",
        "approved",
        "published",
        "needs_review",
        "suspended",
        "archived",
      ],
      document_type: [
        "product_label",
        "sds",
        "tds",
        "manufacturer_instruction",
        "spotting_chart",
        "equipment_manual",
        "textile_standard",
        "internal_trial",
        "credible_reference",
      ],
      evidence_level: [
        "manufacturer_claim",
        "label_documented",
        "sds_tds_documented",
        "independent_trial",
        "textile_standard",
        "none",
      ],
      fabric_confidence_level: ["high", "moderate", "low", "unknown"],
      fabric_risk_group: ["group_a", "group_b", "group_c", "group_d"],
      label_status: ["available", "no_label", "unclear", "unconfirmed"],
      record_status: ["active", "discontinued", "archived"],
      risk_level: ["green", "amber", "red", "black"],
      sensitivity_level: [
        "none",
        "low",
        "moderate",
        "high",
        "critical",
        "unknown",
      ],
      suitability_decision: [
        "recommended",
        "recommended_after_testing",
        "professional_use_only",
        "domestic_use_suitable",
        "not_recommended",
        "insufficient_information",
      ],
      treatment_gate_status: [
        "proceed",
        "proceed_with_testing",
        "professional_only",
        "blocked_pending_identification",
        "blocked_existing_damage",
        "specialist_material_route",
      ],
      verification_status: [
        "unverified",
        "pending_review",
        "verified",
        "insufficient_information",
        "disputed",
      ],
    },
  },
} as const
