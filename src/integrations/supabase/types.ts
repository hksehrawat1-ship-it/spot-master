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
      admin_audit_log: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          id: string
          metadata: Json
          reason: string | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          id?: string
          metadata?: Json
          reason?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          reason?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      applied_product_history: {
        Row: {
          assessment_id: string
          company: string | null
          contact_time_minutes: number | null
          created_at: string
          diluted: string | null
          heat_after: string | null
          id: string
          label_photo_path: string | null
          linked_product_id: string | null
          neutralized: string | null
          observed_result: string | null
          product_name: string | null
          product_photo_path: string | null
          product_type: string
          reported_amount: string | null
          reported_dilution: string | null
          reported_unverified: boolean
          rinsed: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assessment_id: string
          company?: string | null
          contact_time_minutes?: number | null
          created_at?: string
          diluted?: string | null
          heat_after?: string | null
          id?: string
          label_photo_path?: string | null
          linked_product_id?: string | null
          neutralized?: string | null
          observed_result?: string | null
          product_name?: string | null
          product_photo_path?: string | null
          product_type: string
          reported_amount?: string | null
          reported_dilution?: string | null
          reported_unverified?: boolean
          rinsed?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assessment_id?: string
          company?: string | null
          contact_time_minutes?: number | null
          created_at?: string
          diluted?: string | null
          heat_after?: string | null
          id?: string
          label_photo_path?: string | null
          linked_product_id?: string | null
          neutralized?: string | null
          observed_result?: string | null
          product_name?: string | null
          product_photo_path?: string | null
          product_type?: string
          reported_amount?: string | null
          reported_dilution?: string | null
          reported_unverified?: boolean
          rinsed?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applied_product_history_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "case_condition_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applied_product_history_linked_product_id_fkey"
            columns: ["linked_product_id"]
            isOneToOne: false
            referencedRelation: "professional_products"
            referencedColumns: ["id"]
          },
        ]
      }
      case_classifications: {
        Row: {
          block_reason: string | null
          blocked: boolean
          case_components: Json
          case_id: string | null
          classification_version: number
          component_confidence: number
          condition_assessment_id: string | null
          condition_tags: string[]
          created_at: string
          damage_confidence: number
          damage_keys: string[]
          evidence_level: Database["public"]["Enums"]["classification_evidence"]
          gate_status: string | null
          id: string
          identification_id: string | null
          library_stain_key: string | null
          organization_id: string | null
          plain_explanation: string | null
          primary_category_confidence: number
          primary_category_key: string | null
          primary_category_reason: string | null
          readiness_status: string | null
          risk_after: Database["public"]["Enums"]["risk_level"]
          risk_before: Database["public"]["Enums"]["risk_level"]
          risk_tags: string[]
          source_confidence: number
          source_keys: string[]
          taxonomy_version: string
          technical_explanation: string | null
          unresolved_questions: string[]
          updated_at: string
          user_confirmation: string | null
          user_correction: string | null
          user_id: string | null
        }
        Insert: {
          block_reason?: string | null
          blocked?: boolean
          case_components?: Json
          case_id?: string | null
          classification_version?: number
          component_confidence?: number
          condition_assessment_id?: string | null
          condition_tags?: string[]
          created_at?: string
          damage_confidence?: number
          damage_keys?: string[]
          evidence_level?: Database["public"]["Enums"]["classification_evidence"]
          gate_status?: string | null
          id?: string
          identification_id?: string | null
          library_stain_key?: string | null
          organization_id?: string | null
          plain_explanation?: string | null
          primary_category_confidence?: number
          primary_category_key?: string | null
          primary_category_reason?: string | null
          readiness_status?: string | null
          risk_after?: Database["public"]["Enums"]["risk_level"]
          risk_before?: Database["public"]["Enums"]["risk_level"]
          risk_tags?: string[]
          source_confidence?: number
          source_keys?: string[]
          taxonomy_version?: string
          technical_explanation?: string | null
          unresolved_questions?: string[]
          updated_at?: string
          user_confirmation?: string | null
          user_correction?: string | null
          user_id?: string | null
        }
        Update: {
          block_reason?: string | null
          blocked?: boolean
          case_components?: Json
          case_id?: string | null
          classification_version?: number
          component_confidence?: number
          condition_assessment_id?: string | null
          condition_tags?: string[]
          created_at?: string
          damage_confidence?: number
          damage_keys?: string[]
          evidence_level?: Database["public"]["Enums"]["classification_evidence"]
          gate_status?: string | null
          id?: string
          identification_id?: string | null
          library_stain_key?: string | null
          organization_id?: string | null
          plain_explanation?: string | null
          primary_category_confidence?: number
          primary_category_key?: string | null
          primary_category_reason?: string | null
          readiness_status?: string | null
          risk_after?: Database["public"]["Enums"]["risk_level"]
          risk_before?: Database["public"]["Enums"]["risk_level"]
          risk_tags?: string[]
          source_confidence?: number
          source_keys?: string[]
          taxonomy_version?: string
          technical_explanation?: string | null
          unresolved_questions?: string[]
          updated_at?: string
          user_confirmation?: string | null
          user_correction?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_classifications_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_classifications_condition_assessment_id_fkey"
            columns: ["condition_assessment_id"]
            isOneToOne: false
            referencedRelation: "case_condition_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_classifications_identification_id_fkey"
            columns: ["identification_id"]
            isOneToOne: false
            referencedRelation: "stain_identifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_classifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_classifications_primary_category_key_fkey"
            columns: ["primary_category_key"]
            isOneToOne: false
            referencedRelation: "stain_primary_categories"
            referencedColumns: ["category_key"]
          },
        ]
      }
      case_condition_assessments: {
        Row: {
          affected_components: string[]
          assessment_version: string
          available_equipment: string[]
          blockers: string[]
          buildup: string | null
          can_document_results: boolean
          can_run_tests: boolean
          capability_context: string | null
          case_id: string | null
          chemical_mixing: string | null
          chemical_mixing_products: string | null
          chemical_mixing_reaction: string[]
          colour_changed_after_treatment: string | null
          colour_group: string | null
          colourfastness_status: string
          completed_at: string | null
          completed_test: Json
          country: string | null
          created_at: string
          current_condition: string[]
          dye_transferring: string | null
          experience_level: string | null
          fabric_assessment_id: string | null
          has_print: string | null
          heat_exposure: string[]
          heat_result: string[]
          heat_set_suspected: boolean
          id: string
          identification_id: string | null
          language: string | null
          local_case_ref: string | null
          missing_answers: string[]
          most_sensitive_component: string | null
          next_action: string | null
          notes: Json
          organization_id: string | null
          organization_location: string | null
          penetration: string[]
          previous_treatment_result: string[]
          product_kits: string[]
          product_market_country: string | null
          readiness: Database["public"]["Enums"]["readiness_status"]
          readiness_reason: string | null
          risk_after: Database["public"]["Enums"]["risk_level"]
          risk_before: Database["public"]["Enums"]["risk_level"]
          risk_explanation: string | null
          stain_age: string | null
          stain_age_is_approximate: boolean
          stain_crosses_colours: string | null
          stain_size: string | null
          summary_confirmed: string | null
          supervision_available: string | null
          test_feasible: string | null
          training_completed: string | null
          treatment_changing_factors: string[]
          updated_at: string
          user_id: string | null
          version: number
        }
        Insert: {
          affected_components?: string[]
          assessment_version?: string
          available_equipment?: string[]
          blockers?: string[]
          buildup?: string | null
          can_document_results?: boolean
          can_run_tests?: boolean
          capability_context?: string | null
          case_id?: string | null
          chemical_mixing?: string | null
          chemical_mixing_products?: string | null
          chemical_mixing_reaction?: string[]
          colour_changed_after_treatment?: string | null
          colour_group?: string | null
          colourfastness_status?: string
          completed_at?: string | null
          completed_test?: Json
          country?: string | null
          created_at?: string
          current_condition?: string[]
          dye_transferring?: string | null
          experience_level?: string | null
          fabric_assessment_id?: string | null
          has_print?: string | null
          heat_exposure?: string[]
          heat_result?: string[]
          heat_set_suspected?: boolean
          id?: string
          identification_id?: string | null
          language?: string | null
          local_case_ref?: string | null
          missing_answers?: string[]
          most_sensitive_component?: string | null
          next_action?: string | null
          notes?: Json
          organization_id?: string | null
          organization_location?: string | null
          penetration?: string[]
          previous_treatment_result?: string[]
          product_kits?: string[]
          product_market_country?: string | null
          readiness?: Database["public"]["Enums"]["readiness_status"]
          readiness_reason?: string | null
          risk_after?: Database["public"]["Enums"]["risk_level"]
          risk_before?: Database["public"]["Enums"]["risk_level"]
          risk_explanation?: string | null
          stain_age?: string | null
          stain_age_is_approximate?: boolean
          stain_crosses_colours?: string | null
          stain_size?: string | null
          summary_confirmed?: string | null
          supervision_available?: string | null
          test_feasible?: string | null
          training_completed?: string | null
          treatment_changing_factors?: string[]
          updated_at?: string
          user_id?: string | null
          version?: number
        }
        Update: {
          affected_components?: string[]
          assessment_version?: string
          available_equipment?: string[]
          blockers?: string[]
          buildup?: string | null
          can_document_results?: boolean
          can_run_tests?: boolean
          capability_context?: string | null
          case_id?: string | null
          chemical_mixing?: string | null
          chemical_mixing_products?: string | null
          chemical_mixing_reaction?: string[]
          colour_changed_after_treatment?: string | null
          colour_group?: string | null
          colourfastness_status?: string
          completed_at?: string | null
          completed_test?: Json
          country?: string | null
          created_at?: string
          current_condition?: string[]
          dye_transferring?: string | null
          experience_level?: string | null
          fabric_assessment_id?: string | null
          has_print?: string | null
          heat_exposure?: string[]
          heat_result?: string[]
          heat_set_suspected?: boolean
          id?: string
          identification_id?: string | null
          language?: string | null
          local_case_ref?: string | null
          missing_answers?: string[]
          most_sensitive_component?: string | null
          next_action?: string | null
          notes?: Json
          organization_id?: string | null
          organization_location?: string | null
          penetration?: string[]
          previous_treatment_result?: string[]
          product_kits?: string[]
          product_market_country?: string | null
          readiness?: Database["public"]["Enums"]["readiness_status"]
          readiness_reason?: string | null
          risk_after?: Database["public"]["Enums"]["risk_level"]
          risk_before?: Database["public"]["Enums"]["risk_level"]
          risk_explanation?: string | null
          stain_age?: string | null
          stain_age_is_approximate?: boolean
          stain_crosses_colours?: string | null
          stain_size?: string | null
          summary_confirmed?: string | null
          supervision_available?: string | null
          test_feasible?: string | null
          training_completed?: string | null
          treatment_changing_factors?: string[]
          updated_at?: string
          user_id?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "case_condition_assessments_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_condition_assessments_fabric_assessment_id_fkey"
            columns: ["fabric_assessment_id"]
            isOneToOne: false
            referencedRelation: "fabric_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_condition_assessments_identification_id_fkey"
            columns: ["identification_id"]
            isOneToOne: false
            referencedRelation: "stain_identifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_condition_assessments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
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
      category_migration_map: {
        Row: {
          created_at: string
          id: string
          legacy_category: string
          new_category_key: string | null
          reason: string | null
          records_migrated: number
          records_needing_review: number
          records_not_migrated: number
          records_total: number
          reviewer_status: string
          routed_to_damage: boolean
          split_category_keys: string[]
          tags_added: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          legacy_category: string
          new_category_key?: string | null
          reason?: string | null
          records_migrated?: number
          records_needing_review?: number
          records_not_migrated?: number
          records_total?: number
          reviewer_status?: string
          routed_to_damage?: boolean
          split_category_keys?: string[]
          tags_added?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          legacy_category?: string
          new_category_key?: string | null
          reason?: string | null
          records_migrated?: number
          records_needing_review?: number
          records_not_migrated?: number
          records_total?: number
          reviewer_status?: string
          routed_to_damage?: boolean
          split_category_keys?: string[]
          tags_added?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_migration_map_new_category_key_fkey"
            columns: ["new_category_key"]
            isOneToOne: false
            referencedRelation: "stain_primary_categories"
            referencedColumns: ["category_key"]
          },
        ]
      }
      category_relationships: {
        Row: {
          created_at: string
          from_category_id: string
          id: string
          note: string | null
          relationship_type: string
          status: string
          to_category_id: string | null
          to_category_number: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          from_category_id: string
          id?: string
          note?: string | null
          relationship_type?: string
          status?: string
          to_category_id?: string | null
          to_category_number: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          from_category_id?: string
          id?: string
          note?: string | null
          relationship_type?: string
          status?: string
          to_category_id?: string | null
          to_category_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_relationships_from_category_id_fkey"
            columns: ["from_category_id"]
            isOneToOne: false
            referencedRelation: "stain_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_relationships_to_category_id_fkey"
            columns: ["to_category_id"]
            isOneToOne: false
            referencedRelation: "stain_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      classification_tags: {
        Row: {
          archived: boolean
          created_at: string
          description: string | null
          id: string
          kind: Database["public"]["Enums"]["classification_tag_kind"]
          label: string
          raises_risk: Database["public"]["Enums"]["risk_level"] | null
          tag_key: string
          updated_at: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          description?: string | null
          id?: string
          kind: Database["public"]["Enums"]["classification_tag_kind"]
          label: string
          raises_risk?: Database["public"]["Enums"]["risk_level"] | null
          tag_key: string
          updated_at?: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          description?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["classification_tag_kind"]
          label?: string
          raises_risk?: Database["public"]["Enums"]["risk_level"] | null
          tag_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      classification_versions: {
        Row: {
          action: string
          case_classification_id: string | null
          changed_by: string | null
          classification_id: string | null
          created_at: string
          id: string
          justification: string | null
          new_primary_category: string | null
          previous_primary_category: string | null
          snapshot: Json
          version: number
        }
        Insert: {
          action: string
          case_classification_id?: string | null
          changed_by?: string | null
          classification_id?: string | null
          created_at?: string
          id?: string
          justification?: string | null
          new_primary_category?: string | null
          previous_primary_category?: string | null
          snapshot?: Json
          version: number
        }
        Update: {
          action?: string
          case_classification_id?: string | null
          changed_by?: string | null
          classification_id?: string | null
          created_at?: string
          id?: string
          justification?: string | null
          new_primary_category?: string | null
          previous_primary_category?: string | null
          snapshot?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "classification_versions_case_classification_id_fkey"
            columns: ["case_classification_id"]
            isOneToOne: false
            referencedRelation: "case_classifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classification_versions_classification_id_fkey"
            columns: ["classification_id"]
            isOneToOne: false
            referencedRelation: "stain_library_classifications"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          company_name: string
          company_ref: string | null
          company_roles: string[]
          company_verification: string
          countries_served: string[]
          country: string | null
          created_at: string
          display_name: string | null
          headquarters: string | null
          id: string
          is_distributor: boolean
          is_manufacturer: boolean
          languages: string[]
          legal_name: string | null
          logo_ref: string | null
          manufacturer_or_distributor: string | null
          notes: string | null
          official_email: string | null
          official_phone: string | null
          parent_company_id: string | null
          parent_verified: boolean
          status: Database["public"]["Enums"]["record_status"]
          trading_name: string | null
          updated_at: string
          verification_source: string | null
          verification_status: Database["public"]["Enums"]["verification_status"]
          website: string | null
        }
        Insert: {
          company_name: string
          company_ref?: string | null
          company_roles?: string[]
          company_verification?: string
          countries_served?: string[]
          country?: string | null
          created_at?: string
          display_name?: string | null
          headquarters?: string | null
          id?: string
          is_distributor?: boolean
          is_manufacturer?: boolean
          languages?: string[]
          legal_name?: string | null
          logo_ref?: string | null
          manufacturer_or_distributor?: string | null
          notes?: string | null
          official_email?: string | null
          official_phone?: string | null
          parent_company_id?: string | null
          parent_verified?: boolean
          status?: Database["public"]["Enums"]["record_status"]
          trading_name?: string | null
          updated_at?: string
          verification_source?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          website?: string | null
        }
        Update: {
          company_name?: string
          company_ref?: string | null
          company_roles?: string[]
          company_verification?: string
          countries_served?: string[]
          country?: string | null
          created_at?: string
          display_name?: string | null
          headquarters?: string | null
          id?: string
          is_distributor?: boolean
          is_manufacturer?: boolean
          languages?: string[]
          legal_name?: string | null
          logo_ref?: string | null
          manufacturer_or_distributor?: string | null
          notes?: string | null
          official_email?: string | null
          official_phone?: string | null
          parent_company_id?: string | null
          parent_verified?: boolean
          status?: Database["public"]["Enums"]["record_status"]
          trading_name?: string | null
          updated_at?: string
          verification_source?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_parent_company_id_fkey"
            columns: ["parent_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_relationships: {
        Row: {
          claim_source: string | null
          claim_text: string | null
          company_id: string
          created_at: string
          id: string
          notes: string | null
          related_company_id: string | null
          related_company_name: string | null
          relationship_type: string
          reviewer: string | null
          updated_at: string
          verification: string
        }
        Insert: {
          claim_source?: string | null
          claim_text?: string | null
          company_id: string
          created_at?: string
          id?: string
          notes?: string | null
          related_company_id?: string | null
          related_company_name?: string | null
          relationship_type: string
          reviewer?: string | null
          updated_at?: string
          verification?: string
        }
        Update: {
          claim_source?: string | null
          claim_text?: string | null
          company_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          related_company_id?: string | null
          related_company_name?: string | null
          relationship_type?: string
          reviewer?: string | null
          updated_at?: string
          verification?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_relationships_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_relationships_related_company_id_fkey"
            columns: ["related_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      coupons: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_percent: number | null
          discount_type: string
          discount_value_minor: number
          id: string
          is_active: boolean
          max_redemptions: number | null
          redemption_count: number
          updated_at: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          discount_type?: string
          discount_value_minor?: number
          id?: string
          is_active?: boolean
          max_redemptions?: number | null
          redemption_count?: number
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          discount_type?: string
          discount_value_minor?: number
          id?: string
          is_active?: boolean
          max_redemptions?: number | null
          redemption_count?: number
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      damage_interpretations: {
        Row: {
          created_at: string
          damage_key: string
          id: string
          is_stain: boolean
          label: string
          plain_description: string | null
          requires_professional: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          damage_key: string
          id?: string
          is_stain?: boolean
          label: string
          plain_description?: string | null
          requires_professional?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          damage_key?: string
          id?: string
          is_stain?: boolean
          label?: string
          plain_description?: string | null
          requires_professional?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      domestic_adverse_events: {
        Row: {
          case_access_blocked: boolean
          case_id: string | null
          created_at: string
          damage_type: string
          domestic_treatment_id: string
          household_product_key: string | null
          id: string
          method_version: number
          observations: string | null
          photographs: string[]
          product_version: string | null
          reported_by: string | null
          resolution: string | null
          review_status: string
          reviewer: string | null
          updated_at: string
        }
        Insert: {
          case_access_blocked?: boolean
          case_id?: string | null
          created_at?: string
          damage_type: string
          domestic_treatment_id: string
          household_product_key?: string | null
          id?: string
          method_version?: number
          observations?: string | null
          photographs?: string[]
          product_version?: string | null
          reported_by?: string | null
          resolution?: string | null
          review_status?: string
          reviewer?: string | null
          updated_at?: string
        }
        Update: {
          case_access_blocked?: boolean
          case_id?: string | null
          created_at?: string
          damage_type?: string
          domestic_treatment_id?: string
          household_product_key?: string | null
          id?: string
          method_version?: number
          observations?: string | null
          photographs?: string[]
          product_version?: string | null
          reported_by?: string | null
          resolution?: string | null
          review_status?: string
          reviewer?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      domestic_content_migration: {
        Row: {
          classification: string
          created_at: string
          id: string
          original_content: string
          publicly_visible: boolean
          rejection_reason: string | null
          reviewed_at: string
          reviewer: string | null
          source_location: string
          stain_key: string | null
        }
        Insert: {
          classification: string
          created_at?: string
          id?: string
          original_content: string
          publicly_visible?: boolean
          rejection_reason?: string | null
          reviewed_at?: string
          reviewer?: string | null
          source_location: string
          stain_key?: string | null
        }
        Update: {
          classification?: string
          created_at?: string
          id?: string
          original_content?: string
          publicly_visible?: boolean
          rejection_reason?: string | null
          reviewed_at?: string
          reviewer?: string | null
          source_location?: string
          stain_key?: string | null
        }
        Relationships: []
      }
      domestic_treatment_evidence: {
        Row: {
          claim: string
          colour_tested: string | null
          control: string | null
          country: string | null
          created_at: string
          damage_observed: string | null
          domestic_treatment_id: string
          fabric_tested: string | null
          id: string
          issuer: string | null
          method: string | null
          publication_date: string | null
          relevant_section: string | null
          repeatability: string | null
          result: string | null
          reviewer: string | null
          source: string
          source_type: Database["public"]["Enums"]["document_type"] | null
          source_version: string | null
          stain_condition: string | null
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          claim: string
          colour_tested?: string | null
          control?: string | null
          country?: string | null
          created_at?: string
          damage_observed?: string | null
          domestic_treatment_id: string
          fabric_tested?: string | null
          id?: string
          issuer?: string | null
          method?: string | null
          publication_date?: string | null
          relevant_section?: string | null
          repeatability?: string | null
          result?: string | null
          reviewer?: string | null
          source: string
          source_type?: Database["public"]["Enums"]["document_type"] | null
          source_version?: string | null
          stain_condition?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          claim?: string
          colour_tested?: string | null
          control?: string | null
          country?: string | null
          created_at?: string
          damage_observed?: string | null
          domestic_treatment_id?: string
          fabric_tested?: string | null
          id?: string
          issuer?: string | null
          method?: string | null
          publication_date?: string | null
          relevant_section?: string | null
          repeatability?: string | null
          result?: string | null
          reviewer?: string | null
          source?: string
          source_type?: Database["public"]["Enums"]["document_type"] | null
          source_version?: string | null
          stain_condition?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: []
      }
      domestic_treatment_feedback: {
        Row: {
          attempt_number: number
          case_id: string | null
          colour_changed: boolean
          created_at: string
          domestic_treatment_id: string
          garment_damaged: boolean
          household_product_key: string | null
          id: string
          method_version: number
          notes: string | null
          odour_remains: boolean
          outcome: string
          photographs: string[]
          product_version: string | null
          professional_referral_used: boolean
          ring_formed: boolean
          texture_changed: boolean
          user_id: string | null
          user_stopped: boolean
        }
        Insert: {
          attempt_number?: number
          case_id?: string | null
          colour_changed?: boolean
          created_at?: string
          domestic_treatment_id: string
          garment_damaged?: boolean
          household_product_key?: string | null
          id?: string
          method_version?: number
          notes?: string | null
          odour_remains?: boolean
          outcome: string
          photographs?: string[]
          product_version?: string | null
          professional_referral_used?: boolean
          ring_formed?: boolean
          texture_changed?: boolean
          user_id?: string | null
          user_stopped?: boolean
        }
        Update: {
          attempt_number?: number
          case_id?: string | null
          colour_changed?: boolean
          created_at?: string
          domestic_treatment_id?: string
          garment_damaged?: boolean
          household_product_key?: string | null
          id?: string
          method_version?: number
          notes?: string | null
          odour_remains?: boolean
          outcome?: string
          photographs?: string[]
          product_version?: string | null
          professional_referral_used?: boolean
          ring_formed?: boolean
          texture_changed?: boolean
          user_id?: string | null
          user_stopped?: boolean
        }
        Relationships: []
      }
      domestic_treatment_tests: {
        Row: {
          control_sample: string | null
          created_at: string
          damage_observed: string | null
          decision: string | null
          domestic_treatment_id: string
          drying_result: string | null
          fabric: string | null
          fabric_colour: string | null
          fabric_finish: string | null
          household_product_key: string | null
          id: string
          method: string | null
          method_version: number
          odour: string | null
          photographs: string[]
          repeatability: string | null
          residue: string | null
          result: string | null
          result_after_laundering: string | null
          reviewer: string | null
          ring_formation: boolean
          stain_age: string | null
          stain_key: string | null
          stain_quantity: string | null
          test_date: string | null
          test_id: string
          updated_at: string
        }
        Insert: {
          control_sample?: string | null
          created_at?: string
          damage_observed?: string | null
          decision?: string | null
          domestic_treatment_id: string
          drying_result?: string | null
          fabric?: string | null
          fabric_colour?: string | null
          fabric_finish?: string | null
          household_product_key?: string | null
          id?: string
          method?: string | null
          method_version?: number
          odour?: string | null
          photographs?: string[]
          repeatability?: string | null
          residue?: string | null
          result?: string | null
          result_after_laundering?: string | null
          reviewer?: string | null
          ring_formation?: boolean
          stain_age?: string | null
          stain_key?: string | null
          stain_quantity?: string | null
          test_date?: string | null
          test_id: string
          updated_at?: string
        }
        Update: {
          control_sample?: string | null
          created_at?: string
          damage_observed?: string | null
          decision?: string | null
          domestic_treatment_id?: string
          drying_result?: string | null
          fabric?: string | null
          fabric_colour?: string | null
          fabric_finish?: string | null
          household_product_key?: string | null
          id?: string
          method?: string | null
          method_version?: number
          odour?: string | null
          photographs?: string[]
          repeatability?: string | null
          residue?: string | null
          result?: string | null
          result_after_laundering?: string | null
          reviewer?: string | null
          ring_formation?: boolean
          stain_age?: string | null
          stain_key?: string | null
          stain_quantity?: string | null
          test_date?: string | null
          test_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      domestic_treatment_versions: {
        Row: {
          actions_to_avoid: string[]
          care_label_requirements: string[]
          confidence_factors: Json
          confidence_score: number
          created_at: string
          domestic_treatment_id: string
          drying_restrictions: string[]
          eligible_colours: string[]
          eligible_constructions: string[]
          eligible_countries: string[]
          eligible_fabrics: string[]
          eligible_roles: string[]
          escalation_point: string | null
          expected_outcome: string | null
          fabric_confidence_requirement: string
          hidden_area_test: Json | null
          household_product_key: string | null
          id: string
          inspection_points: string[]
          intended_condition: string[]
          last_reviewed_date: string | null
          maximum_attempts: number | null
          maximum_risk_level: Database["public"]["Enums"]["risk_level"]
          method_steps: Json
          minimum_stain_confidence: number
          next_review_date: string | null
          preparation: Json
          product_label_requirement: string | null
          prohibited_colours: string[]
          prohibited_constructions: string[]
          prohibited_fabrics: string[]
          required_materials: Json
          revision_history: Json
          safety_reviewer: string | null
          stain_key: string
          stain_variant: string | null
          stop_conditions: string[]
          technical_reviewer: string | null
          treatment_key: string
          treatment_name: string
          updated_at: string
          version: number
          workflow_status: string
        }
        Insert: {
          actions_to_avoid?: string[]
          care_label_requirements?: string[]
          confidence_factors?: Json
          confidence_score?: number
          created_at?: string
          domestic_treatment_id: string
          drying_restrictions?: string[]
          eligible_colours?: string[]
          eligible_constructions?: string[]
          eligible_countries?: string[]
          eligible_fabrics?: string[]
          eligible_roles?: string[]
          escalation_point?: string | null
          expected_outcome?: string | null
          fabric_confidence_requirement?: string
          hidden_area_test?: Json | null
          household_product_key?: string | null
          id?: string
          inspection_points?: string[]
          intended_condition?: string[]
          last_reviewed_date?: string | null
          maximum_attempts?: number | null
          maximum_risk_level?: Database["public"]["Enums"]["risk_level"]
          method_steps?: Json
          minimum_stain_confidence?: number
          next_review_date?: string | null
          preparation?: Json
          product_label_requirement?: string | null
          prohibited_colours?: string[]
          prohibited_constructions?: string[]
          prohibited_fabrics?: string[]
          required_materials?: Json
          revision_history?: Json
          safety_reviewer?: string | null
          stain_key: string
          stain_variant?: string | null
          stop_conditions?: string[]
          technical_reviewer?: string | null
          treatment_key: string
          treatment_name: string
          updated_at?: string
          version?: number
          workflow_status?: string
        }
        Update: {
          actions_to_avoid?: string[]
          care_label_requirements?: string[]
          confidence_factors?: Json
          confidence_score?: number
          created_at?: string
          domestic_treatment_id?: string
          drying_restrictions?: string[]
          eligible_colours?: string[]
          eligible_constructions?: string[]
          eligible_countries?: string[]
          eligible_fabrics?: string[]
          eligible_roles?: string[]
          escalation_point?: string | null
          expected_outcome?: string | null
          fabric_confidence_requirement?: string
          hidden_area_test?: Json | null
          household_product_key?: string | null
          id?: string
          inspection_points?: string[]
          intended_condition?: string[]
          last_reviewed_date?: string | null
          maximum_attempts?: number | null
          maximum_risk_level?: Database["public"]["Enums"]["risk_level"]
          method_steps?: Json
          minimum_stain_confidence?: number
          next_review_date?: string | null
          preparation?: Json
          product_label_requirement?: string | null
          prohibited_colours?: string[]
          prohibited_constructions?: string[]
          prohibited_fabrics?: string[]
          required_materials?: Json
          revision_history?: Json
          safety_reviewer?: string | null
          stain_key?: string
          stain_variant?: string | null
          stop_conditions?: string[]
          technical_reviewer?: string | null
          treatment_key?: string
          treatment_name?: string
          updated_at?: string
          version?: number
          workflow_status?: string
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
          domestic_treatment_id: string | null
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
          workflow_status: string | null
        }
        Insert: {
          actions_to_avoid?: string[]
          approval_status?: Database["public"]["Enums"]["content_status"]
          confidence_score?: number
          country_applicability?: string[]
          created_at?: string
          domestic_treatment_id?: string | null
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
          workflow_status?: string | null
        }
        Update: {
          actions_to_avoid?: string[]
          approval_status?: Database["public"]["Enums"]["content_status"]
          confidence_score?: number
          country_applicability?: string[]
          created_at?: string
          domestic_treatment_id?: string | null
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
          workflow_status?: string | null
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
      governance_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: string | null
          approval_impact: boolean
          country: string | null
          created_at: string
          id: string
          new_value: string | null
          organization: string | null
          previous_value: string | null
          reason: string | null
          record_stable_id: string | null
          session_meta: string | null
          source: string | null
          version: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: string | null
          approval_impact?: boolean
          country?: string | null
          created_at?: string
          id?: string
          new_value?: string | null
          organization?: string | null
          previous_value?: string | null
          reason?: string | null
          record_stable_id?: string | null
          session_meta?: string | null
          source?: string | null
          version?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: string | null
          approval_impact?: boolean
          country?: string | null
          created_at?: string
          id?: string
          new_value?: string | null
          organization?: string | null
          previous_value?: string | null
          reason?: string | null
          record_stable_id?: string | null
          session_meta?: string | null
          source?: string | null
          version?: string | null
        }
        Relationships: []
      }
      governance_case_snapshots: {
        Row: {
          case_id: string
          created_at: string
          id: string
          payload: Json
          record_stable_id: string
          used_at: string
          version: string
        }
        Insert: {
          case_id: string
          created_at?: string
          id?: string
          payload?: Json
          record_stable_id: string
          used_at?: string
          version: string
        }
        Update: {
          case_id?: string
          created_at?: string
          id?: string
          payload?: Json
          record_stable_id?: string
          used_at?: string
          version?: string
        }
        Relationships: []
      }
      governance_change_requests: {
        Row: {
          assigned_owner: string | null
          category: string
          created_at: string
          evidence: string | null
          id: string
          linked_record_id: string | null
          priority: string
          reporter_id: string | null
          request_id: string
          resolution: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_owner?: string | null
          category: string
          created_at?: string
          evidence?: string | null
          id?: string
          linked_record_id?: string | null
          priority?: string
          reporter_id?: string | null
          request_id: string
          resolution?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_owner?: string | null
          category?: string
          created_at?: string
          evidence?: string | null
          id?: string
          linked_record_id?: string | null
          priority?: string
          reporter_id?: string | null
          request_id?: string
          resolution?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      governance_findings: {
        Row: {
          assigned_role: string | null
          created_at: string
          detail: string | null
          id: string
          kind: string
          record_stable_id: string
          severity: string
          status: string
          task_id: string | null
          updated_at: string
        }
        Insert: {
          assigned_role?: string | null
          created_at?: string
          detail?: string | null
          id?: string
          kind: string
          record_stable_id: string
          severity?: string
          status?: string
          task_id?: string | null
          updated_at?: string
        }
        Update: {
          assigned_role?: string | null
          created_at?: string
          detail?: string | null
          id?: string
          kind?: string
          record_stable_id?: string
          severity?: string
          status?: string
          task_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      governance_notifications: {
        Row: {
          created_at: string
          critical: boolean
          id: string
          kind: string
          message: string
          read_at: string | null
          recipient_id: string | null
          record_stable_id: string | null
        }
        Insert: {
          created_at?: string
          critical?: boolean
          id?: string
          kind: string
          message: string
          read_at?: string | null
          recipient_id?: string | null
          record_stable_id?: string | null
        }
        Update: {
          created_at?: string
          critical?: boolean
          id?: string
          kind?: string
          message?: string
          read_at?: string | null
          recipient_id?: string | null
          record_stable_id?: string | null
        }
        Relationships: []
      }
      governance_records: {
        Row: {
          approval_notes: string | null
          approved_at: string | null
          archived_at: string | null
          author_id: string | null
          content_type: string
          countries: string[]
          country_reviewer_id: string | null
          created_at: string
          current_version: string
          domestic_confidence: number | null
          id: string
          language: string
          last_reviewed_at: string | null
          next_review_at: string | null
          owner_id: string | null
          provisional: boolean
          published_at: string | null
          reason_for_change: string | null
          recommendation_count: number | null
          review_interval_days: number | null
          reviewed_at: string | null
          revision_summary: string | null
          risk_level: string
          safety_reviewer_id: string | null
          schedule_kind: string
          source_document_ids: string[]
          stable_id: string
          status: string
          submitted_at: string | null
          superseded_at: string | null
          suspended_at: string | null
          suspension_reason: string | null
          technical_reviewer_id: string | null
          title: string
          translation_reviewer_id: string | null
          updated_at: string
        }
        Insert: {
          approval_notes?: string | null
          approved_at?: string | null
          archived_at?: string | null
          author_id?: string | null
          content_type: string
          countries?: string[]
          country_reviewer_id?: string | null
          created_at?: string
          current_version?: string
          domestic_confidence?: number | null
          id?: string
          language?: string
          last_reviewed_at?: string | null
          next_review_at?: string | null
          owner_id?: string | null
          provisional?: boolean
          published_at?: string | null
          reason_for_change?: string | null
          recommendation_count?: number | null
          review_interval_days?: number | null
          reviewed_at?: string | null
          revision_summary?: string | null
          risk_level?: string
          safety_reviewer_id?: string | null
          schedule_kind?: string
          source_document_ids?: string[]
          stable_id: string
          status?: string
          submitted_at?: string | null
          superseded_at?: string | null
          suspended_at?: string | null
          suspension_reason?: string | null
          technical_reviewer_id?: string | null
          title: string
          translation_reviewer_id?: string | null
          updated_at?: string
        }
        Update: {
          approval_notes?: string | null
          approved_at?: string | null
          archived_at?: string | null
          author_id?: string | null
          content_type?: string
          countries?: string[]
          country_reviewer_id?: string | null
          created_at?: string
          current_version?: string
          domestic_confidence?: number | null
          id?: string
          language?: string
          last_reviewed_at?: string | null
          next_review_at?: string | null
          owner_id?: string | null
          provisional?: boolean
          published_at?: string | null
          reason_for_change?: string | null
          recommendation_count?: number | null
          review_interval_days?: number | null
          reviewed_at?: string | null
          revision_summary?: string | null
          risk_level?: string
          safety_reviewer_id?: string | null
          schedule_kind?: string
          source_document_ids?: string[]
          stable_id?: string
          status?: string
          submitted_at?: string | null
          superseded_at?: string | null
          suspended_at?: string | null
          suspension_reason?: string | null
          technical_reviewer_id?: string | null
          title?: string
          translation_reviewer_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      governance_releases: {
        Row: {
          approved_by: string | null
          countries: string[]
          created_at: string
          deployment: string
          id: string
          kind: string
          languages: string[]
          name: string
          notes: string | null
          owner_id: string | null
          record_ids: string[]
          release_id: string
          rollback_plan: string | null
          scheduled_date: string | null
          updated_at: string
          validation_issues: string[]
          validation_passed: boolean
          version: string
        }
        Insert: {
          approved_by?: string | null
          countries?: string[]
          created_at?: string
          deployment?: string
          id?: string
          kind?: string
          languages?: string[]
          name: string
          notes?: string | null
          owner_id?: string | null
          record_ids?: string[]
          release_id: string
          rollback_plan?: string | null
          scheduled_date?: string | null
          updated_at?: string
          validation_issues?: string[]
          validation_passed?: boolean
          version?: string
        }
        Update: {
          approved_by?: string | null
          countries?: string[]
          created_at?: string
          deployment?: string
          id?: string
          kind?: string
          languages?: string[]
          name?: string
          notes?: string | null
          owner_id?: string | null
          record_ids?: string[]
          release_id?: string
          rollback_plan?: string | null
          scheduled_date?: string | null
          updated_at?: string
          validation_issues?: string[]
          validation_passed?: boolean
          version?: string
        }
        Relationships: []
      }
      governance_review_tasks: {
        Row: {
          assigned_reviewer: string | null
          checklist: Json
          comments: string | null
          completed_at: string | null
          created_at: string
          decision: string | null
          due_date: string | null
          id: string
          priority: string
          record_stable_id: string
          required_documents: string[]
          review_type: string
          risk: string | null
          task_id: string
          updated_at: string
          version: string
        }
        Insert: {
          assigned_reviewer?: string | null
          checklist?: Json
          comments?: string | null
          completed_at?: string | null
          created_at?: string
          decision?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          record_stable_id: string
          required_documents?: string[]
          review_type: string
          risk?: string | null
          task_id: string
          updated_at?: string
          version: string
        }
        Update: {
          assigned_reviewer?: string | null
          checklist?: Json
          comments?: string | null
          completed_at?: string | null
          created_at?: string
          decision?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          record_stable_id?: string
          required_documents?: string[]
          review_type?: string
          risk?: string | null
          task_id?: string
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "governance_review_tasks_record_stable_id_fkey"
            columns: ["record_stable_id"]
            isOneToOne: false
            referencedRelation: "governance_records"
            referencedColumns: ["stable_id"]
          },
        ]
      }
      governance_versions: {
        Row: {
          approval_notes: string | null
          approved_at: string | null
          change_kinds: string[]
          created_at: string
          id: string
          immutable: boolean
          payload: Json
          published_at: string | null
          reason_for_change: string | null
          record_stable_id: string
          revision_summary: string | null
          signatures: Json
          source_document_ids: string[]
          status: string
          version: string
          withdrawn_at: string | null
        }
        Insert: {
          approval_notes?: string | null
          approved_at?: string | null
          change_kinds?: string[]
          created_at?: string
          id?: string
          immutable?: boolean
          payload?: Json
          published_at?: string | null
          reason_for_change?: string | null
          record_stable_id: string
          revision_summary?: string | null
          signatures?: Json
          source_document_ids?: string[]
          status?: string
          version: string
          withdrawn_at?: string | null
        }
        Update: {
          approval_notes?: string | null
          approved_at?: string | null
          change_kinds?: string[]
          created_at?: string
          id?: string
          immutable?: boolean
          payload?: Json
          published_at?: string | null
          reason_for_change?: string | null
          record_stable_id?: string
          revision_summary?: string | null
          signatures?: Json
          source_document_ids?: string[]
          status?: string
          version?: string
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "governance_versions_record_stable_id_fkey"
            columns: ["record_stable_id"]
            isOneToOne: false
            referencedRelation: "governance_records"
            referencedColumns: ["stable_id"]
          },
        ]
      }
      household_products: {
        Row: {
          application_instructions: string | null
          brand: string
          colour_restrictions: string[]
          contact_time: string | null
          country: string
          created_at: string
          dilution: string | null
          fabric_restrictions: string[]
          household_product_id: string
          id: string
          incompatibilities: string[]
          ingredient_disclosure: string | null
          intended_stain_use: string[]
          intended_textile_use: string[]
          label_version: string | null
          pack_size: string | null
          product_key: string
          product_name: string
          product_type: string
          quantity: string | null
          review_date: string | null
          rinsing: string | null
          source_documents: Json
          status: Database["public"]["Enums"]["record_status"]
          storage: string | null
          temperature: string | null
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          warnings: string[]
        }
        Insert: {
          application_instructions?: string | null
          brand: string
          colour_restrictions?: string[]
          contact_time?: string | null
          country: string
          created_at?: string
          dilution?: string | null
          fabric_restrictions?: string[]
          household_product_id: string
          id?: string
          incompatibilities?: string[]
          ingredient_disclosure?: string | null
          intended_stain_use?: string[]
          intended_textile_use?: string[]
          label_version?: string | null
          pack_size?: string | null
          product_key: string
          product_name: string
          product_type: string
          quantity?: string | null
          review_date?: string | null
          rinsing?: string | null
          source_documents?: Json
          status?: Database["public"]["Enums"]["record_status"]
          storage?: string | null
          temperature?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          warnings?: string[]
        }
        Update: {
          application_instructions?: string | null
          brand?: string
          colour_restrictions?: string[]
          contact_time?: string | null
          country?: string
          created_at?: string
          dilution?: string | null
          fabric_restrictions?: string[]
          household_product_id?: string
          id?: string
          incompatibilities?: string[]
          ingredient_disclosure?: string | null
          intended_stain_use?: string[]
          intended_textile_use?: string[]
          label_version?: string | null
          pack_size?: string | null
          product_key?: string
          product_name?: string
          product_type?: string
          quantity?: string | null
          review_date?: string | null
          rinsing?: string | null
          source_documents?: Json
          status?: Database["public"]["Enums"]["record_status"]
          storage?: string | null
          temperature?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          warnings?: string[]
        }
        Relationships: []
      }
      import_batches: {
        Row: {
          batch_name: string
          batch_number: number
          completed_at: string | null
          created_at: string
          expected_category_numbers: number[]
          expected_document_count: number
          id: string
          started_at: string
          status: string
          total_duplicates_prevented: number
          total_records_imported: number
          total_records_requiring_review: number
          total_records_updated: number
          updated_at: string
          validation_status: string
        }
        Insert: {
          batch_name: string
          batch_number: number
          completed_at?: string | null
          created_at?: string
          expected_category_numbers?: number[]
          expected_document_count?: number
          id?: string
          started_at?: string
          status?: string
          total_duplicates_prevented?: number
          total_records_imported?: number
          total_records_requiring_review?: number
          total_records_updated?: number
          updated_at?: string
          validation_status?: string
        }
        Update: {
          batch_name?: string
          batch_number?: number
          completed_at?: string | null
          created_at?: string
          expected_category_numbers?: number[]
          expected_document_count?: number
          id?: string
          started_at?: string
          status?: string
          total_duplicates_prevented?: number
          total_records_imported?: number
          total_records_requiring_review?: number
          total_records_updated?: number
          updated_at?: string
          validation_status?: string
        }
        Relationships: []
      }
      kit_products: {
        Row: {
          bottle_label: string | null
          claimed_pack_size: string | null
          created_at: string
          id: string
          kit_id: string
          notes: string | null
          pack_size_verified: boolean
          position: number | null
          product_id: string
          updated_at: string
        }
        Insert: {
          bottle_label?: string | null
          claimed_pack_size?: string | null
          created_at?: string
          id?: string
          kit_id: string
          notes?: string | null
          pack_size_verified?: boolean
          position?: number | null
          product_id: string
          updated_at?: string
        }
        Update: {
          bottle_label?: string | null
          claimed_pack_size?: string | null
          created_at?: string
          id?: string
          kit_id?: string
          notes?: string | null
          pack_size_verified?: boolean
          position?: number | null
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kit_products_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "product_kits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kit_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "professional_products"
            referencedColumns: ["id"]
          },
        ]
      }
      manufacturer_products: {
        Row: {
          created_at: string
          id: string
          manufacturer_id: string
          product_code: string | null
          product_name: string
          source_document_id: string | null
          updated_at: string
          verification_status: string
        }
        Insert: {
          created_at?: string
          id?: string
          manufacturer_id: string
          product_code?: string | null
          product_name: string
          source_document_id?: string | null
          updated_at?: string
          verification_status?: string
        }
        Update: {
          created_at?: string
          id?: string
          manufacturer_id?: string
          product_code?: string | null
          product_name?: string
          source_document_id?: string | null
          updated_at?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "manufacturer_products_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "manufacturers"
            referencedColumns: ["id"]
          },
        ]
      }
      manufacturers: {
        Row: {
          country: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      mapping_approval_history: {
        Row: {
          changed_by: string | null
          created_at: string
          from_status: string | null
          id: string
          justification: string
          mapping_code: string
          mapping_id: string | null
          safety_critical: boolean
          to_status: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          justification: string
          mapping_code: string
          mapping_id?: string | null
          safety_critical?: boolean
          to_status: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          justification?: string
          mapping_code?: string
          mapping_id?: string | null
          safety_critical?: boolean
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "mapping_approval_history_mapping_id_fkey"
            columns: ["mapping_id"]
            isOneToOne: false
            referencedRelation: "product_stage_mappings"
            referencedColumns: ["id"]
          },
        ]
      }
      mapping_conditions: {
        Row: {
          condition_kind: string
          created_at: string
          id: string
          mapping_id: string
          note: string | null
          source: string | null
          target_key: string
          verdict: string
        }
        Insert: {
          condition_kind: string
          created_at?: string
          id?: string
          mapping_id: string
          note?: string | null
          source?: string | null
          target_key: string
          verdict?: string
        }
        Update: {
          condition_kind?: string
          created_at?: string
          id?: string
          mapping_id?: string
          note?: string | null
          source?: string | null
          target_key?: string
          verdict?: string
        }
        Relationships: [
          {
            foreignKeyName: "mapping_conditions_mapping_id_fkey"
            columns: ["mapping_id"]
            isOneToOne: false
            referencedRelation: "product_stage_mappings"
            referencedColumns: ["id"]
          },
        ]
      }
      mapping_eligibility_results: {
        Row: {
          blocking_checks: string[]
          case_id: string | null
          created_at: string
          decision: Database["public"]["Enums"]["suitability_decision"]
          engine_version: string
          id: string
          mapping_code: string
          mapping_id: string | null
          mapping_version: number
          outcome: string
          passed_checks: string[]
          product_key: string
          product_version_key: string
          reason: string
          stage_number: number
        }
        Insert: {
          blocking_checks?: string[]
          case_id?: string | null
          created_at?: string
          decision?: Database["public"]["Enums"]["suitability_decision"]
          engine_version?: string
          id?: string
          mapping_code: string
          mapping_id?: string | null
          mapping_version?: number
          outcome: string
          passed_checks?: string[]
          product_key: string
          product_version_key: string
          reason: string
          stage_number: number
        }
        Update: {
          blocking_checks?: string[]
          case_id?: string | null
          created_at?: string
          decision?: Database["public"]["Enums"]["suitability_decision"]
          engine_version?: string
          id?: string
          mapping_code?: string
          mapping_id?: string | null
          mapping_version?: number
          outcome?: string
          passed_checks?: string[]
          product_key?: string
          product_version_key?: string
          reason?: string
          stage_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "mapping_eligibility_results_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mapping_eligibility_results_mapping_id_fkey"
            columns: ["mapping_id"]
            isOneToOne: false
            referencedRelation: "product_stage_mappings"
            referencedColumns: ["id"]
          },
        ]
      }
      mapping_evidence: {
        Row: {
          created_at: string
          description: string
          document_id: string | null
          document_key: string | null
          document_version: string | null
          evidence_level: string
          id: string
          mapping_id: string
          reviewer: string | null
        }
        Insert: {
          created_at?: string
          description: string
          document_id?: string | null
          document_key?: string | null
          document_version?: string | null
          evidence_level: string
          id?: string
          mapping_id: string
          reviewer?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          document_id?: string | null
          document_key?: string | null
          document_version?: string | null
          evidence_level?: string
          id?: string
          mapping_id?: string
          reviewer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mapping_evidence_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "source_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mapping_evidence_mapping_id_fkey"
            columns: ["mapping_id"]
            isOneToOne: false
            referencedRelation: "product_stage_mappings"
            referencedColumns: ["id"]
          },
        ]
      }
      mapping_inspection_gates: {
        Row: {
          case_id: string | null
          created_at: string
          findings: string[]
          heat_allowed: boolean
          id: string
          mapping_id: string | null
          notes: string | null
          operator: string | null
          photograph_path: string | null
          repeat_allowed: boolean
          stage_number: number
          stopped: boolean
        }
        Insert: {
          case_id?: string | null
          created_at?: string
          findings?: string[]
          heat_allowed?: boolean
          id?: string
          mapping_id?: string | null
          notes?: string | null
          operator?: string | null
          photograph_path?: string | null
          repeat_allowed?: boolean
          stage_number: number
          stopped?: boolean
        }
        Update: {
          case_id?: string | null
          created_at?: string
          findings?: string[]
          heat_allowed?: boolean
          id?: string
          mapping_id?: string | null
          notes?: string | null
          operator?: string | null
          photograph_path?: string | null
          repeat_allowed?: boolean
          stage_number?: number
          stopped?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "mapping_inspection_gates_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mapping_inspection_gates_mapping_id_fkey"
            columns: ["mapping_id"]
            isOneToOne: false
            referencedRelation: "product_stage_mappings"
            referencedColumns: ["id"]
          },
        ]
      }
      mapping_quantities: {
        Row: {
          applicable_material: string | null
          applicable_process: string | null
          approval_status: string
          contact_time: string | null
          country: string | null
          created_at: string
          dilution: string | null
          document_version: string | null
          id: string
          mapping_id: string
          maximum_attempts: string | null
          quantity: string | null
          reapplication_limit: string | null
          reviewer: string | null
          source: string | null
          temperature: string | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          applicable_material?: string | null
          applicable_process?: string | null
          approval_status?: string
          contact_time?: string | null
          country?: string | null
          created_at?: string
          dilution?: string | null
          document_version?: string | null
          id?: string
          mapping_id: string
          maximum_attempts?: string | null
          quantity?: string | null
          reapplication_limit?: string | null
          reviewer?: string | null
          source?: string | null
          temperature?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          applicable_material?: string | null
          applicable_process?: string | null
          approval_status?: string
          contact_time?: string | null
          country?: string | null
          created_at?: string
          dilution?: string | null
          document_version?: string | null
          id?: string
          mapping_id?: string
          maximum_attempts?: string | null
          quantity?: string | null
          reapplication_limit?: string | null
          reviewer?: string | null
          source?: string | null
          temperature?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mapping_quantities_mapping_id_fkey"
            columns: ["mapping_id"]
            isOneToOne: false
            referencedRelation: "product_stage_mappings"
            referencedColumns: ["id"]
          },
        ]
      }
      mapping_requirements: {
        Row: {
          approved: boolean
          created_at: string
          id: string
          mapping_id: string
          method_source: string | null
          requirement_key: string
          requirement_kind: string
          requirement_level: string
        }
        Insert: {
          approved?: boolean
          created_at?: string
          id?: string
          mapping_id: string
          method_source?: string | null
          requirement_key: string
          requirement_kind: string
          requirement_level?: string
        }
        Update: {
          approved?: boolean
          created_at?: string
          id?: string
          mapping_id?: string
          method_source?: string | null
          requirement_key?: string
          requirement_kind?: string
          requirement_level?: string
        }
        Relationships: [
          {
            foreignKeyName: "mapping_requirements_mapping_id_fkey"
            columns: ["mapping_id"]
            isOneToOne: false
            referencedRelation: "product_stage_mappings"
            referencedColumns: ["id"]
          },
        ]
      }
      mapping_rinse_requirements: {
        Row: {
          country: string | null
          created_at: string
          document_version: string | null
          duration: string | null
          equipment: string | null
          fallback_text: string
          id: string
          inspection_required: boolean
          mapping_id: string
          medium: string | null
          method: string | null
          process_destination: string | null
          product_version_key: string | null
          quantity: string | null
          requirement: string
          reviewer: string | null
          source_document_key: string | null
          temperature: string | null
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          document_version?: string | null
          duration?: string | null
          equipment?: string | null
          fallback_text?: string
          id?: string
          inspection_required?: boolean
          mapping_id: string
          medium?: string | null
          method?: string | null
          process_destination?: string | null
          product_version_key?: string | null
          quantity?: string | null
          requirement?: string
          reviewer?: string | null
          source_document_key?: string | null
          temperature?: string | null
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          document_version?: string | null
          duration?: string | null
          equipment?: string | null
          fallback_text?: string
          id?: string
          inspection_required?: boolean
          mapping_id?: string
          medium?: string | null
          method?: string | null
          process_destination?: string | null
          product_version_key?: string | null
          quantity?: string | null
          requirement?: string
          reviewer?: string | null
          source_document_key?: string | null
          temperature?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mapping_rinse_requirements_mapping_id_fkey"
            columns: ["mapping_id"]
            isOneToOne: false
            referencedRelation: "product_stage_mappings"
            referencedColumns: ["id"]
          },
        ]
      }
      mapping_role_conditions: {
        Row: {
          created_at: string
          id: string
          mapping_id: string
          roles: string[]
          supervision_required: boolean
          training_requirements: string[]
        }
        Insert: {
          created_at?: string
          id?: string
          mapping_id: string
          roles?: string[]
          supervision_required?: boolean
          training_requirements?: string[]
        }
        Update: {
          created_at?: string
          id?: string
          mapping_id?: string
          roles?: string[]
          supervision_required?: boolean
          training_requirements?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "mapping_role_conditions_mapping_id_fkey"
            columns: ["mapping_id"]
            isOneToOne: false
            referencedRelation: "product_stage_mappings"
            referencedColumns: ["id"]
          },
        ]
      }
      mapping_versions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          mapping_code: string
          mapping_id: string | null
          snapshot: Json
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          mapping_code: string
          mapping_id?: string | null
          snapshot: Json
          version: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          mapping_code?: string
          mapping_id?: string | null
          snapshot?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "mapping_versions_mapping_id_fkey"
            columns: ["mapping_id"]
            isOneToOne: false
            referencedRelation: "product_stage_mappings"
            referencedColumns: ["id"]
          },
        ]
      }
      master_case_events: {
        Row: {
          case_id: string
          created_at: string
          event_kind: string
          id: string
          owner_id: string
          payload: Json
          status: string | null
          summary: string | null
        }
        Insert: {
          case_id: string
          created_at?: string
          event_kind: string
          id?: string
          owner_id?: string
          payload?: Json
          status?: string | null
          summary?: string | null
        }
        Update: {
          case_id?: string
          created_at?: string
          event_kind?: string
          id?: string
          owner_id?: string
          payload?: Json
          status?: string | null
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "master_case_events_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "master_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      master_cases: {
        Row: {
          adverse_event: string | null
          case_reference: string
          construction: Json
          created_at: string
          customer_notes: string | null
          dye_colour: Json
          escalation_reason: string | null
          evidence: Json
          fibre: Json
          final_disposition: string | null
          garment: Json
          id: string
          operator_notes: string | null
          organization_id: string | null
          outcome: string | null
          owner_id: string
          photographs: Json
          record_version: number
          safety_decisions: Json
          selected_kits: Json
          selected_products: Json
          source_versions: Json
          stain_diagnosis: Json
          supervisor_notes: string | null
          test_results: Json
          trims_finishes: Json
          updated_at: string
          working_level: string
        }
        Insert: {
          adverse_event?: string | null
          case_reference: string
          construction?: Json
          created_at?: string
          customer_notes?: string | null
          dye_colour?: Json
          escalation_reason?: string | null
          evidence?: Json
          fibre?: Json
          final_disposition?: string | null
          garment?: Json
          id?: string
          operator_notes?: string | null
          organization_id?: string | null
          outcome?: string | null
          owner_id?: string
          photographs?: Json
          record_version?: number
          safety_decisions?: Json
          selected_kits?: Json
          selected_products?: Json
          source_versions?: Json
          stain_diagnosis?: Json
          supervisor_notes?: string | null
          test_results?: Json
          trims_finishes?: Json
          updated_at?: string
          working_level?: string
        }
        Update: {
          adverse_event?: string | null
          case_reference?: string
          construction?: Json
          created_at?: string
          customer_notes?: string | null
          dye_colour?: Json
          escalation_reason?: string | null
          evidence?: Json
          fibre?: Json
          final_disposition?: string | null
          garment?: Json
          id?: string
          operator_notes?: string | null
          organization_id?: string | null
          outcome?: string | null
          owner_id?: string
          photographs?: Json
          record_version?: number
          safety_decisions?: Json
          selected_kits?: Json
          selected_products?: Json
          source_versions?: Json
          stain_diagnosis?: Json
          supervisor_notes?: string | null
          test_results?: Json
          trims_finishes?: Json
          updated_at?: string
          working_level?: string
        }
        Relationships: [
          {
            foreignKeyName: "master_cases_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      master_stains: {
        Row: {
          added_components: string[]
          approval_status: Database["public"]["Enums"]["content_status"]
          canonical_name: string
          canonical_parent_id: string | null
          classification_confidence: number
          classification_evidence: string | null
          classification_explanation: string | null
          classification_reviewer: string | null
          classification_version: number
          component_confidence: number
          condition_tags: string[]
          content_owner: string | null
          content_version: number
          countries: string[]
          created_at: string
          damage_interpretation: string | null
          display_plural: string | null
          display_singular: string
          domestic_confidence: number
          domestic_status: string
          icon: string | null
          id: string
          identification: Json
          is_damage_diagnosis: boolean
          is_published: boolean
          languages: string[]
          last_reviewed: string | null
          next_review: string | null
          primary_category: string
          record_key: string
          revision_reason: string | null
          risk_tags: string[]
          science: Json
          science_plain: string | null
          search_keywords: string[]
          secondary_components: Json
          short_description: string | null
          source_documents: string[]
          source_types: string[]
          stain_id: string
          technical_content: Json
          technical_name: string | null
          technical_reviewer: string | null
          updated_at: string
          variant_notes: string | null
        }
        Insert: {
          added_components?: string[]
          approval_status?: Database["public"]["Enums"]["content_status"]
          canonical_name: string
          canonical_parent_id?: string | null
          classification_confidence?: number
          classification_evidence?: string | null
          classification_explanation?: string | null
          classification_reviewer?: string | null
          classification_version?: number
          component_confidence?: number
          condition_tags?: string[]
          content_owner?: string | null
          content_version?: number
          countries?: string[]
          created_at?: string
          damage_interpretation?: string | null
          display_plural?: string | null
          display_singular: string
          domestic_confidence?: number
          domestic_status?: string
          icon?: string | null
          id?: string
          identification?: Json
          is_damage_diagnosis?: boolean
          is_published?: boolean
          languages?: string[]
          last_reviewed?: string | null
          next_review?: string | null
          primary_category: string
          record_key: string
          revision_reason?: string | null
          risk_tags?: string[]
          science?: Json
          science_plain?: string | null
          search_keywords?: string[]
          secondary_components?: Json
          short_description?: string | null
          source_documents?: string[]
          source_types?: string[]
          stain_id: string
          technical_content?: Json
          technical_name?: string | null
          technical_reviewer?: string | null
          updated_at?: string
          variant_notes?: string | null
        }
        Update: {
          added_components?: string[]
          approval_status?: Database["public"]["Enums"]["content_status"]
          canonical_name?: string
          canonical_parent_id?: string | null
          classification_confidence?: number
          classification_evidence?: string | null
          classification_explanation?: string | null
          classification_reviewer?: string | null
          classification_version?: number
          component_confidence?: number
          condition_tags?: string[]
          content_owner?: string | null
          content_version?: number
          countries?: string[]
          created_at?: string
          damage_interpretation?: string | null
          display_plural?: string | null
          display_singular?: string
          domestic_confidence?: number
          domestic_status?: string
          icon?: string | null
          id?: string
          identification?: Json
          is_damage_diagnosis?: boolean
          is_published?: boolean
          languages?: string[]
          last_reviewed?: string | null
          next_review?: string | null
          primary_category?: string
          record_key?: string
          revision_reason?: string | null
          risk_tags?: string[]
          science?: Json
          science_plain?: string | null
          search_keywords?: string[]
          secondary_components?: Json
          short_description?: string | null
          source_documents?: string[]
          source_types?: string[]
          stain_id?: string
          technical_content?: Json
          technical_name?: string | null
          technical_reviewer?: string | null
          updated_at?: string
          variant_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "master_stains_canonical_parent_id_fkey"
            columns: ["canonical_parent_id"]
            isOneToOne: false
            referencedRelation: "master_stains"
            referencedColumns: ["id"]
          },
        ]
      }
      master_treatment_ledger: {
        Row: {
          amount: string | null
          case_id: string
          colour_movement: string | null
          component_key: string | null
          contact_time: string | null
          created_at: string
          dilution: string | null
          drying_or_heat: string | null
          entry_order: number
          id: string
          inspection_result: string | null
          manufacturer: string | null
          mechanical_action: string | null
          neutralization_performed: boolean
          notes: string | null
          operator_observation: boolean
          owner_id: string
          performed_at: string
          product_id: string | null
          product_name: string | null
          rinse_performed: boolean
          spotting_board_used: boolean
          stage_key: string | null
          stage_number: number | null
          steam_used: boolean
          temperature: string | null
          texture_change: string | null
          updated_at: string
          vacuum_used: boolean
          visible_response: string | null
        }
        Insert: {
          amount?: string | null
          case_id: string
          colour_movement?: string | null
          component_key?: string | null
          contact_time?: string | null
          created_at?: string
          dilution?: string | null
          drying_or_heat?: string | null
          entry_order?: number
          id?: string
          inspection_result?: string | null
          manufacturer?: string | null
          mechanical_action?: string | null
          neutralization_performed?: boolean
          notes?: string | null
          operator_observation?: boolean
          owner_id?: string
          performed_at?: string
          product_id?: string | null
          product_name?: string | null
          rinse_performed?: boolean
          spotting_board_used?: boolean
          stage_key?: string | null
          stage_number?: number | null
          steam_used?: boolean
          temperature?: string | null
          texture_change?: string | null
          updated_at?: string
          vacuum_used?: boolean
          visible_response?: string | null
        }
        Update: {
          amount?: string | null
          case_id?: string
          colour_movement?: string | null
          component_key?: string | null
          contact_time?: string | null
          created_at?: string
          dilution?: string | null
          drying_or_heat?: string | null
          entry_order?: number
          id?: string
          inspection_result?: string | null
          manufacturer?: string | null
          mechanical_action?: string | null
          neutralization_performed?: boolean
          notes?: string | null
          operator_observation?: boolean
          owner_id?: string
          performed_at?: string
          product_id?: string | null
          product_name?: string | null
          rinse_performed?: boolean
          spotting_board_used?: boolean
          stage_key?: string | null
          stage_number?: number | null
          steam_used?: boolean
          temperature?: string | null
          texture_change?: string | null
          updated_at?: string
          vacuum_used?: boolean
          visible_response?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "master_treatment_ledger_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "master_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "master_treatment_ledger_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "professional_products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          access_ends_at: string | null
          access_starts_at: string | null
          coupon_code: string | null
          created_at: string
          currency: string
          discount_minor: number
          id: string
          invoice_number: string | null
          list_price_minor: number
          offer_price_minor: number
          paid_at: string | null
          plan_code: string
          provider: string | null
          provider_order_id: string | null
          provider_payment_id: string | null
          status: string
          tax_minor: number
          total_minor: number
          updated_at: string
          user_id: string
        }
        Insert: {
          access_ends_at?: string | null
          access_starts_at?: string | null
          coupon_code?: string | null
          created_at?: string
          currency?: string
          discount_minor?: number
          id?: string
          invoice_number?: string | null
          list_price_minor: number
          offer_price_minor: number
          paid_at?: string | null
          plan_code: string
          provider?: string | null
          provider_order_id?: string | null
          provider_payment_id?: string | null
          status?: string
          tax_minor?: number
          total_minor: number
          updated_at?: string
          user_id: string
        }
        Update: {
          access_ends_at?: string | null
          access_starts_at?: string | null
          coupon_code?: string | null
          created_at?: string
          currency?: string
          discount_minor?: number
          id?: string
          invoice_number?: string | null
          list_price_minor?: number
          offer_price_minor?: number
          paid_at?: string | null
          plan_code?: string
          provider?: string | null
          provider_order_id?: string | null
          provider_payment_id?: string | null
          status?: string
          tax_minor?: number
          total_minor?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_product_inventory: {
        Row: {
          batch_number: string | null
          bottle_size: string | null
          company: string | null
          country: string | null
          created_at: string
          date_opened: string | null
          document_availability: string
          eligible_for_guidance: boolean
          expiry_date: string | null
          expiry_or_review: string | null
          id: string
          kit_id: string | null
          kit_name: string | null
          label_available: boolean
          notes: string | null
          organization_approved: boolean
          organization_id: string | null
          product_id: string | null
          product_name: string
          product_version_id: string | null
          sds_available: boolean
          staff_permissions: string[]
          storage_location: string | null
          tds_available: boolean
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          batch_number?: string | null
          bottle_size?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          date_opened?: string | null
          document_availability?: string
          eligible_for_guidance?: boolean
          expiry_date?: string | null
          expiry_or_review?: string | null
          id?: string
          kit_id?: string | null
          kit_name?: string | null
          label_available?: boolean
          notes?: string | null
          organization_approved?: boolean
          organization_id?: string | null
          product_id?: string | null
          product_name: string
          product_version_id?: string | null
          sds_available?: boolean
          staff_permissions?: string[]
          storage_location?: string | null
          tds_available?: boolean
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          batch_number?: string | null
          bottle_size?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          date_opened?: string | null
          document_availability?: string
          eligible_for_guidance?: boolean
          expiry_date?: string | null
          expiry_or_review?: string | null
          id?: string
          kit_id?: string | null
          kit_name?: string | null
          label_available?: boolean
          notes?: string | null
          organization_approved?: boolean
          organization_id?: string | null
          product_id?: string | null
          product_name?: string
          product_version_id?: string | null
          sds_available?: boolean
          staff_permissions?: string[]
          storage_location?: string | null
          tds_available?: boolean
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "organization_product_inventory_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "product_kits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_product_inventory_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_product_inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "professional_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_product_inventory_product_version_id_fkey"
            columns: ["product_version_id"]
            isOneToOne: false
            referencedRelation: "product_versions"
            referencedColumns: ["id"]
          },
        ]
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
      outcome_adverse_records: {
        Row: {
          actual_method_summary: string
          adverse_id: string
          approved_method_key: string | null
          case_version: number
          closure_date: string | null
          corrective_actions: Json
          created_at: string
          damage_types: string[]
          deviation: string | null
          escalation_route: string | null
          garment_description: string
          id: string
          immediate_symptoms: string[]
          investigation_status: string
          operator: string | null
          outcome_id: string
          photos: string[]
          product_batch: string | null
          product_key: string | null
          required_first_response: string | null
          reviewer: string | null
          root_cause_conclusion: string | null
          severity: number
          stain_key: string | null
          updated_at: string
        }
        Insert: {
          actual_method_summary: string
          adverse_id: string
          approved_method_key?: string | null
          case_version?: number
          closure_date?: string | null
          corrective_actions?: Json
          created_at?: string
          damage_types?: string[]
          deviation?: string | null
          escalation_route?: string | null
          garment_description: string
          id?: string
          immediate_symptoms?: string[]
          investigation_status?: string
          operator?: string | null
          outcome_id: string
          photos?: string[]
          product_batch?: string | null
          product_key?: string | null
          required_first_response?: string | null
          reviewer?: string | null
          root_cause_conclusion?: string | null
          severity: number
          stain_key?: string | null
          updated_at?: string
        }
        Update: {
          actual_method_summary?: string
          adverse_id?: string
          approved_method_key?: string | null
          case_version?: number
          closure_date?: string | null
          corrective_actions?: Json
          created_at?: string
          damage_types?: string[]
          deviation?: string | null
          escalation_route?: string | null
          garment_description?: string
          id?: string
          immediate_symptoms?: string[]
          investigation_status?: string
          operator?: string | null
          outcome_id?: string
          photos?: string[]
          product_batch?: string | null
          product_key?: string | null
          required_first_response?: string | null
          reviewer?: string | null
          root_cause_conclusion?: string | null
          severity?: number
          stain_key?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      outcome_audit_log: {
        Row: {
          action: string
          changed_by: string | null
          created_at: string
          field: string | null
          id: string
          new_value: string | null
          outcome_id: string
          previous_value: string | null
          reason: string
        }
        Insert: {
          action: string
          changed_by?: string | null
          created_at?: string
          field?: string | null
          id?: string
          new_value?: string | null
          outcome_id: string
          previous_value?: string | null
          reason: string
        }
        Update: {
          action?: string
          changed_by?: string | null
          created_at?: string
          field?: string | null
          id?: string
          new_value?: string | null
          outcome_id?: string
          previous_value?: string | null
          reason?: string
        }
        Relationships: []
      }
      outcome_evidence_promotions: {
        Row: {
          created_at: string
          decision: string
          from_stage: string
          id: string
          outcome_id: string
          reason: string
          reviewer: string | null
          to_stage: string
        }
        Insert: {
          created_at?: string
          decision: string
          from_stage: string
          id?: string
          outcome_id: string
          reason: string
          reviewer?: string | null
          to_stage: string
        }
        Update: {
          created_at?: string
          decision?: string
          from_stage?: string
          id?: string
          outcome_id?: string
          reason?: string
          reviewer?: string | null
          to_stage?: string
        }
        Relationships: []
      }
      outcome_reviews: {
        Row: {
          answers: Json
          conclusion: string | null
          corrective_actions: Json
          created_at: string
          id: string
          outcome_id: string
          priority: string
          review_id: string
          reviewer: string | null
          status: string
          trigger: string
          updated_at: string
        }
        Insert: {
          answers?: Json
          conclusion?: string | null
          corrective_actions?: Json
          created_at?: string
          id?: string
          outcome_id: string
          priority?: string
          review_id: string
          reviewer?: string | null
          status?: string
          trigger: string
          updated_at?: string
        }
        Update: {
          answers?: Json
          conclusion?: string | null
          corrective_actions?: Json
          created_at?: string
          id?: string
          outcome_id?: string
          priority?: string
          review_id?: string
          reviewer?: string | null
          status?: string
          trigger?: string
          updated_at?: string
        }
        Relationships: []
      }
      pathway_stages: {
        Row: {
          condition_text: string | null
          created_at: string
          id: string
          optional: boolean
          pathway_id: string
          position: number
          stage_id: string
        }
        Insert: {
          condition_text?: string | null
          created_at?: string
          id?: string
          optional?: boolean
          pathway_id: string
          position: number
          stage_id: string
        }
        Update: {
          condition_text?: string | null
          created_at?: string
          id?: string
          optional?: boolean
          pathway_id?: string
          position?: number
          stage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pathway_stages_pathway_id_fkey"
            columns: ["pathway_id"]
            isOneToOne: false
            referencedRelation: "treatment_pathways"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pathway_stages_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "treatment_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          is_duplicate: boolean
          order_id: string | null
          payload: Json | null
          provider: string
          provider_event_id: string | null
          signature_verified: boolean
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          is_duplicate?: boolean
          order_id?: string | null
          payload?: Json | null
          provider: string
          provider_event_id?: string | null
          signature_verified?: boolean
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          is_duplicate?: boolean
          order_id?: string | null
          payload?: Json | null
          provider?: string
          provider_event_id?: string | null
          signature_verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "payment_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      previous_cleaning_events: {
        Row: {
          assessment_id: string
          attempts: number
          created_at: string
          heat_applied_after: boolean
          id: string
          notes: string | null
          outcomes: string[]
          process: string
          solvent_known: boolean
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assessment_id: string
          attempts?: number
          created_at?: string
          heat_applied_after?: boolean
          id?: string
          notes?: string | null
          outcomes?: string[]
          process: string
          solvent_known?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assessment_id?: string
          attempts?: number
          created_at?: string
          heat_applied_after?: boolean
          id?: string
          notes?: string | null
          outcomes?: string[]
          process?: string
          solvent_known?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "previous_cleaning_events_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "case_condition_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_plans: {
        Row: {
          access_period_days: number
          created_at: string
          currency: string
          id: string
          is_active: boolean
          list_price_minor: number
          offer_price_minor: number
          plan_code: string
          plan_name: string
          tax_label: string
          tax_rate_percent: number
          updated_at: string
        }
        Insert: {
          access_period_days?: number
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          list_price_minor: number
          offer_price_minor: number
          plan_code: string
          plan_name: string
          tax_label?: string
          tax_rate_percent?: number
          updated_at?: string
        }
        Update: {
          access_period_days?: number
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          list_price_minor?: number
          offer_price_minor?: number
          plan_code?: string
          plan_name?: string
          tax_label?: string
          tax_rate_percent?: number
          updated_at?: string
        }
        Relationships: []
      }
      prior_chemical_checks: {
        Row: {
          applied_product_keys: string[]
          blocked: boolean
          case_id: string | null
          created_at: string
          id: string
          mapping_id: string | null
          outcome: string
          previous_chemistry: string[]
          reasons: string[]
          requires_flushing: boolean
        }
        Insert: {
          applied_product_keys?: string[]
          blocked?: boolean
          case_id?: string | null
          created_at?: string
          id?: string
          mapping_id?: string | null
          outcome: string
          previous_chemistry?: string[]
          reasons?: string[]
          requires_flushing?: boolean
        }
        Update: {
          applied_product_keys?: string[]
          blocked?: boolean
          case_id?: string | null
          created_at?: string
          id?: string
          mapping_id?: string | null
          outcome?: string
          previous_chemistry?: string[]
          reasons?: string[]
          requires_flushing?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "prior_chemical_checks_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prior_chemical_checks_mapping_id_fkey"
            columns: ["mapping_id"]
            isOneToOne: false
            referencedRelation: "product_stage_mappings"
            referencedColumns: ["id"]
          },
        ]
      }
      product_actives: {
        Row: {
          acidic: string
          alkaline: string
          chemical_family: string
          concentration: string | null
          created_at: string
          disclosure_confidence: string
          disclosure_source: string | null
          enzyme_present: string
          flash_point: string | null
          hazardous_components: string[]
          id: string
          ingredient: string
          oxidizing: string
          ph_value: string | null
          physical_properties: string | null
          product_version_id: string
          reducing: string
          solvent_family: string
          surfactant_type: string
          updated_at: string
        }
        Insert: {
          acidic?: string
          alkaline?: string
          chemical_family?: string
          concentration?: string | null
          created_at?: string
          disclosure_confidence?: string
          disclosure_source?: string | null
          enzyme_present?: string
          flash_point?: string | null
          hazardous_components?: string[]
          id?: string
          ingredient?: string
          oxidizing?: string
          ph_value?: string | null
          physical_properties?: string | null
          product_version_id: string
          reducing?: string
          solvent_family?: string
          surfactant_type?: string
          updated_at?: string
        }
        Update: {
          acidic?: string
          alkaline?: string
          chemical_family?: string
          concentration?: string | null
          created_at?: string
          disclosure_confidence?: string
          disclosure_source?: string | null
          enzyme_present?: string
          flash_point?: string | null
          hazardous_components?: string[]
          id?: string
          ingredient?: string
          oxidizing?: string
          ph_value?: string | null
          physical_properties?: string | null
          product_version_id?: string
          reducing?: string
          solvent_family?: string
          surfactant_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_actives_product_version_id_fkey"
            columns: ["product_version_id"]
            isOneToOne: false
            referencedRelation: "product_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      product_audit_log: {
        Row: {
          action: string
          approval_decision: string | null
          changed_by: string | null
          created_at: string
          entity_id: string | null
          entity_table: string
          field_key: string | null
          id: string
          justification_required: boolean
          new_value: string | null
          previous_value: string | null
          product_id: string | null
          reason: string | null
          reviewer: string | null
          safety_critical: boolean
          source_document_id: string | null
        }
        Insert: {
          action: string
          approval_decision?: string | null
          changed_by?: string | null
          created_at?: string
          entity_id?: string | null
          entity_table: string
          field_key?: string | null
          id?: string
          justification_required?: boolean
          new_value?: string | null
          previous_value?: string | null
          product_id?: string | null
          reason?: string | null
          reviewer?: string | null
          safety_critical?: boolean
          source_document_id?: string | null
        }
        Update: {
          action?: string
          approval_decision?: string | null
          changed_by?: string | null
          created_at?: string
          entity_id?: string | null
          entity_table?: string
          field_key?: string | null
          id?: string
          justification_required?: boolean
          new_value?: string | null
          previous_value?: string | null
          product_id?: string | null
          reason?: string | null
          reviewer?: string | null
          safety_critical?: boolean
          source_document_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_audit_log_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "professional_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_audit_log_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "source_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      product_conflicts: {
        Row: {
          blocks_publication: boolean
          conflict_type: string
          created_at: string
          field_key: string | null
          id: string
          product_id: string
          product_version_id: string | null
          resolution: string | null
          resolved: boolean
          reviewer: string | null
          severity: string
          source_a: string | null
          source_b: string | null
          updated_at: string
          value_a: string | null
          value_b: string | null
        }
        Insert: {
          blocks_publication?: boolean
          conflict_type: string
          created_at?: string
          field_key?: string | null
          id?: string
          product_id: string
          product_version_id?: string | null
          resolution?: string | null
          resolved?: boolean
          reviewer?: string | null
          severity?: string
          source_a?: string | null
          source_b?: string | null
          updated_at?: string
          value_a?: string | null
          value_b?: string | null
        }
        Update: {
          blocks_publication?: boolean
          conflict_type?: string
          created_at?: string
          field_key?: string | null
          id?: string
          product_id?: string
          product_version_id?: string | null
          resolution?: string | null
          resolved?: boolean
          reviewer?: string | null
          severity?: string
          source_a?: string | null
          source_b?: string | null
          updated_at?: string
          value_a?: string | null
          value_b?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_conflicts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "professional_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_conflicts_product_version_id_fkey"
            columns: ["product_version_id"]
            isOneToOne: false
            referencedRelation: "product_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      product_costs: {
        Row: {
          cost_per_treatment: number | null
          cost_per_unit: number | null
          country: string | null
          created_at: string
          currency: string | null
          dose_unit: string | null
          dose_verified: boolean
          estimated_waste: number | null
          id: string
          organization_id: string | null
          pack_size: number | null
          price_date: string | null
          price_source: string | null
          product_version_id: string
          purchase_price: number | null
          shipping_allocation: number | null
          tax_status: string | null
          updated_at: string
          usable_quantity: number | null
          verified_dose: number | null
        }
        Insert: {
          cost_per_treatment?: number | null
          cost_per_unit?: number | null
          country?: string | null
          created_at?: string
          currency?: string | null
          dose_unit?: string | null
          dose_verified?: boolean
          estimated_waste?: number | null
          id?: string
          organization_id?: string | null
          pack_size?: number | null
          price_date?: string | null
          price_source?: string | null
          product_version_id: string
          purchase_price?: number | null
          shipping_allocation?: number | null
          tax_status?: string | null
          updated_at?: string
          usable_quantity?: number | null
          verified_dose?: number | null
        }
        Update: {
          cost_per_treatment?: number | null
          cost_per_unit?: number | null
          country?: string | null
          created_at?: string
          currency?: string | null
          dose_unit?: string | null
          dose_verified?: boolean
          estimated_waste?: number | null
          id?: string
          organization_id?: string | null
          pack_size?: number | null
          price_date?: string | null
          price_source?: string | null
          product_version_id?: string
          purchase_price?: number | null
          shipping_allocation?: number | null
          tax_status?: string | null
          updated_at?: string
          usable_quantity?: number | null
          verified_dose?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_costs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_costs_product_version_id_fkey"
            columns: ["product_version_id"]
            isOneToOne: false
            referencedRelation: "product_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      product_country_applicability: {
        Row: {
          approved_distributor: string | null
          availability: string | null
          country: string
          country_mismatch: boolean
          created_at: string
          document_completeness: string
          emergency_contact: string | null
          id: string
          import_status: string | null
          label_language: string | null
          market_status: string
          measurement_units: string
          product_version_id: string
          regulatory_classification: string | null
          sds_jurisdiction: string | null
          updated_at: string
        }
        Insert: {
          approved_distributor?: string | null
          availability?: string | null
          country: string
          country_mismatch?: boolean
          created_at?: string
          document_completeness?: string
          emergency_contact?: string | null
          id?: string
          import_status?: string | null
          label_language?: string | null
          market_status?: string
          measurement_units?: string
          product_version_id: string
          regulatory_classification?: string | null
          sds_jurisdiction?: string | null
          updated_at?: string
        }
        Update: {
          approved_distributor?: string | null
          availability?: string | null
          country?: string
          country_mismatch?: boolean
          created_at?: string
          document_completeness?: string
          emergency_contact?: string | null
          id?: string
          import_status?: string | null
          label_language?: string | null
          market_status?: string
          measurement_units?: string
          product_version_id?: string
          regulatory_classification?: string | null
          sds_jurisdiction?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_country_applicability_product_version_id_fkey"
            columns: ["product_version_id"]
            isOneToOne: false
            referencedRelation: "product_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      product_document_extractions: {
        Row: {
          confirmed_by: string | null
          created_at: string
          document_id: string
          extracted_value: string | null
          extraction_confidence: number
          field_key: string
          id: string
          page_or_section: string | null
          product_id: string | null
          reviewer: string | null
          reviewer_approved: boolean
          safety_critical: boolean
          updated_at: string
          user_confirmed: boolean
        }
        Insert: {
          confirmed_by?: string | null
          created_at?: string
          document_id: string
          extracted_value?: string | null
          extraction_confidence?: number
          field_key: string
          id?: string
          page_or_section?: string | null
          product_id?: string | null
          reviewer?: string | null
          reviewer_approved?: boolean
          safety_critical?: boolean
          updated_at?: string
          user_confirmed?: boolean
        }
        Update: {
          confirmed_by?: string | null
          created_at?: string
          document_id?: string
          extracted_value?: string | null
          extraction_confidence?: number
          field_key?: string
          id?: string
          page_or_section?: string | null
          product_id?: string | null
          reviewer?: string | null
          reviewer_approved?: boolean
          safety_critical?: boolean
          updated_at?: string
          user_confirmed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "product_document_extractions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "source_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_document_extractions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "professional_products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_incompatibilities: {
        Row: {
          approval_status: Database["public"]["Enums"]["content_status"]
          created_at: string
          id: string
          incompatibility_type: string
          incompatible_kind: string
          incompatible_product_id: string | null
          incompatible_with: string
          product_version_id: string
          required_separation: string | null
          reviewer: string | null
          severity: string
          source: string | null
          updated_at: string
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["content_status"]
          created_at?: string
          id?: string
          incompatibility_type: string
          incompatible_kind: string
          incompatible_product_id?: string | null
          incompatible_with: string
          product_version_id: string
          required_separation?: string | null
          reviewer?: string | null
          severity?: string
          source?: string | null
          updated_at?: string
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["content_status"]
          created_at?: string
          id?: string
          incompatibility_type?: string
          incompatible_kind?: string
          incompatible_product_id?: string | null
          incompatible_with?: string
          product_version_id?: string
          required_separation?: string | null
          reviewer?: string | null
          severity?: string
          source?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_incompatibilities_incompatible_product_id_fkey"
            columns: ["incompatible_product_id"]
            isOneToOne: false
            referencedRelation: "professional_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_incompatibilities_product_version_id_fkey"
            columns: ["product_version_id"]
            isOneToOne: false
            referencedRelation: "product_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      product_instructions: {
        Row: {
          application_method: string | null
          application_stage: string
          approval_status: Database["public"]["Enums"]["content_status"]
          contact_time: string | null
          country: string | null
          created_at: string
          dilution: string | null
          document_type: Database["public"]["Enums"]["document_type"] | null
          document_version: string | null
          drying: string | null
          flushing: string | null
          id: string
          inspection_point: string | null
          instruction_origin: string
          maximum_attempts: string | null
          mechanical_action: string | null
          moisture_requirement: string | null
          neutralization: string | null
          product_quantity: string | null
          product_version_id: string
          reapplication_rule: string | null
          required_equipment: string | null
          reviewer: string | null
          rinsing: string | null
          section_reference: string | null
          source_description: string | null
          source_document_id: string | null
          step_order: number
          stop_conditions: string[]
          surface_preparation: string | null
          temperature: string | null
          training_requirement: string | null
          updated_at: string
        }
        Insert: {
          application_method?: string | null
          application_stage: string
          approval_status?: Database["public"]["Enums"]["content_status"]
          contact_time?: string | null
          country?: string | null
          created_at?: string
          dilution?: string | null
          document_type?: Database["public"]["Enums"]["document_type"] | null
          document_version?: string | null
          drying?: string | null
          flushing?: string | null
          id?: string
          inspection_point?: string | null
          instruction_origin?: string
          maximum_attempts?: string | null
          mechanical_action?: string | null
          moisture_requirement?: string | null
          neutralization?: string | null
          product_quantity?: string | null
          product_version_id: string
          reapplication_rule?: string | null
          required_equipment?: string | null
          reviewer?: string | null
          rinsing?: string | null
          section_reference?: string | null
          source_description?: string | null
          source_document_id?: string | null
          step_order?: number
          stop_conditions?: string[]
          surface_preparation?: string | null
          temperature?: string | null
          training_requirement?: string | null
          updated_at?: string
        }
        Update: {
          application_method?: string | null
          application_stage?: string
          approval_status?: Database["public"]["Enums"]["content_status"]
          contact_time?: string | null
          country?: string | null
          created_at?: string
          dilution?: string | null
          document_type?: Database["public"]["Enums"]["document_type"] | null
          document_version?: string | null
          drying?: string | null
          flushing?: string | null
          id?: string
          inspection_point?: string | null
          instruction_origin?: string
          maximum_attempts?: string | null
          mechanical_action?: string | null
          moisture_requirement?: string | null
          neutralization?: string | null
          product_quantity?: string | null
          product_version_id?: string
          reapplication_rule?: string | null
          required_equipment?: string | null
          reviewer?: string | null
          rinsing?: string | null
          section_reference?: string | null
          source_description?: string | null
          source_document_id?: string | null
          step_order?: number
          stop_conditions?: string[]
          surface_preparation?: string | null
          temperature?: string | null
          training_requirement?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_instructions_product_version_id_fkey"
            columns: ["product_version_id"]
            isOneToOne: false
            referencedRelation: "product_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_instructions_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "source_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      product_kits: {
        Row: {
          company_id: string
          country_availability: string[]
          created_at: string
          effective_date: string | null
          id: string
          included_accessories: string[]
          intended_market: string | null
          intended_processes: string[]
          intended_users: string[]
          kit_display_name: string | null
          kit_edition: string | null
          kit_name: string
          kit_ref: string | null
          kit_version: string | null
          language: string | null
          notes: string | null
          number_of_products: number | null
          official_kit_document: string | null
          pack_configuration: string | null
          product_count_claimed: number | null
          product_count_verified: number
          review_date: string | null
          source_status: Database["public"]["Enums"]["verification_status"]
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
        }
        Insert: {
          company_id: string
          country_availability?: string[]
          created_at?: string
          effective_date?: string | null
          id?: string
          included_accessories?: string[]
          intended_market?: string | null
          intended_processes?: string[]
          intended_users?: string[]
          kit_display_name?: string | null
          kit_edition?: string | null
          kit_name: string
          kit_ref?: string | null
          kit_version?: string | null
          language?: string | null
          notes?: string | null
          number_of_products?: number | null
          official_kit_document?: string | null
          pack_configuration?: string | null
          product_count_claimed?: number | null
          product_count_verified?: number
          review_date?: string | null
          source_status?: Database["public"]["Enums"]["verification_status"]
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Update: {
          company_id?: string
          country_availability?: string[]
          created_at?: string
          effective_date?: string | null
          id?: string
          included_accessories?: string[]
          intended_market?: string | null
          intended_processes?: string[]
          intended_users?: string[]
          kit_display_name?: string | null
          kit_edition?: string | null
          kit_name?: string
          kit_ref?: string | null
          kit_version?: string | null
          language?: string | null
          notes?: string | null
          number_of_products?: number | null
          official_kit_document?: string | null
          pack_configuration?: string | null
          product_count_claimed?: number | null
          product_count_verified?: number
          review_date?: string | null
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
      product_manufacturer_claims: {
        Row: {
          claim_status: string
          claimed_category: string | null
          claimed_stain: string
          country: string | null
          created_at: string
          document_version: string | null
          id: string
          notes: string | null
          product_id: string
          product_version_id: string | null
          section_reference: string | null
          source_description: string | null
          source_document_id: string | null
          updated_at: string
        }
        Insert: {
          claim_status?: string
          claimed_category?: string | null
          claimed_stain: string
          country?: string | null
          created_at?: string
          document_version?: string | null
          id?: string
          notes?: string | null
          product_id: string
          product_version_id?: string | null
          section_reference?: string | null
          source_description?: string | null
          source_document_id?: string | null
          updated_at?: string
        }
        Update: {
          claim_status?: string
          claimed_category?: string | null
          claimed_stain?: string
          country?: string | null
          created_at?: string
          document_version?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          product_version_id?: string | null
          section_reference?: string | null
          source_description?: string | null
          source_document_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_manufacturer_claims_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "professional_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_manufacturer_claims_product_version_id_fkey"
            columns: ["product_version_id"]
            isOneToOne: false
            referencedRelation: "product_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_manufacturer_claims_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "source_documents"
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
      product_packs: {
        Row: {
          barcode: string | null
          bottle_colour: string | null
          case_quantity: number | null
          claimed_only: boolean
          closure_type: string | null
          container_type: string | null
          country: string | null
          created_at: string
          effective_date: string | null
          id: string
          included_applicator: string | null
          kit_quantity: number | null
          measurement_unit: string | null
          pack_size: number | null
          product_version_id: string
          sku: string | null
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
          verification_source: string | null
        }
        Insert: {
          barcode?: string | null
          bottle_colour?: string | null
          case_quantity?: number | null
          claimed_only?: boolean
          closure_type?: string | null
          container_type?: string | null
          country?: string | null
          created_at?: string
          effective_date?: string | null
          id?: string
          included_applicator?: string | null
          kit_quantity?: number | null
          measurement_unit?: string | null
          pack_size?: number | null
          product_version_id: string
          sku?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          verification_source?: string | null
        }
        Update: {
          barcode?: string | null
          bottle_colour?: string | null
          case_quantity?: number | null
          claimed_only?: boolean
          closure_type?: string | null
          container_type?: string | null
          country?: string | null
          created_at?: string
          effective_date?: string | null
          id?: string
          included_applicator?: string | null
          kit_quantity?: number | null
          measurement_unit?: string | null
          pack_size?: number | null
          product_version_id?: string
          sku?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          verification_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_packs_product_version_id_fkey"
            columns: ["product_version_id"]
            isOneToOne: false
            referencedRelation: "product_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      product_ppe_requirements: {
        Row: {
          breakthrough_time: string | null
          country: string | null
          created_at: string
          id: string
          material: string | null
          ppe_kind: string
          product_version_id: string
          requirement_level: string
          reviewer: string | null
          source: string | null
          task_or_process: string | null
          updated_at: string
        }
        Insert: {
          breakthrough_time?: string | null
          country?: string | null
          created_at?: string
          id?: string
          material?: string | null
          ppe_kind: string
          product_version_id: string
          requirement_level?: string
          reviewer?: string | null
          source?: string | null
          task_or_process?: string | null
          updated_at?: string
        }
        Update: {
          breakthrough_time?: string | null
          country?: string | null
          created_at?: string
          id?: string
          material?: string | null
          ppe_kind?: string
          product_version_id?: string
          requirement_level?: string
          reviewer?: string | null
          source?: string | null
          task_or_process?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_ppe_requirements_product_version_id_fkey"
            columns: ["product_version_id"]
            isOneToOne: false
            referencedRelation: "product_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      product_process_compatibility: {
        Row: {
          country: string | null
          created_at: string
          id: string
          machine_entry_restriction: string | null
          permitted: string
          process_key: string
          product_version_id: string
          required_equipment: string | null
          rinsing_destination: string | null
          source: string | null
          source_document_id: string | null
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          machine_entry_restriction?: string | null
          permitted?: string
          process_key: string
          product_version_id: string
          required_equipment?: string | null
          rinsing_destination?: string | null
          source?: string | null
          source_document_id?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          machine_entry_restriction?: string | null
          permitted?: string
          process_key?: string
          product_version_id?: string
          required_equipment?: string | null
          rinsing_destination?: string | null
          source?: string | null
          source_document_id?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "product_process_compatibility_product_version_id_fkey"
            columns: ["product_version_id"]
            isOneToOne: false
            referencedRelation: "product_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_process_compatibility_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "source_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      product_safety_data: {
        Row: {
          created_at: string
          disposal: string | null
          emergency_contact: string | null
          environmental_precautions: string | null
          exposure_limits: string | null
          first_aid_summary: string | null
          hazard_statements: string[]
          id: string
          incompatible_materials: string[]
          pictograms: string[]
          precautionary_statements: string[]
          product_version_id: string
          routes_of_exposure: string[]
          sds_country: string | null
          sds_language: string | null
          sds_revision_date: string | null
          sds_version: string | null
          signal_word: string | null
          source_document_id: string | null
          spill_response: string | null
          storage: string | null
          transport_classification: string | null
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          created_at?: string
          disposal?: string | null
          emergency_contact?: string | null
          environmental_precautions?: string | null
          exposure_limits?: string | null
          first_aid_summary?: string | null
          hazard_statements?: string[]
          id?: string
          incompatible_materials?: string[]
          pictograms?: string[]
          precautionary_statements?: string[]
          product_version_id: string
          routes_of_exposure?: string[]
          sds_country?: string | null
          sds_language?: string | null
          sds_revision_date?: string | null
          sds_version?: string | null
          signal_word?: string | null
          source_document_id?: string | null
          spill_response?: string | null
          storage?: string | null
          transport_classification?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          created_at?: string
          disposal?: string | null
          emergency_contact?: string | null
          environmental_precautions?: string | null
          exposure_limits?: string | null
          first_aid_summary?: string | null
          hazard_statements?: string[]
          id?: string
          incompatible_materials?: string[]
          pictograms?: string[]
          precautionary_statements?: string[]
          product_version_id?: string
          routes_of_exposure?: string[]
          sds_country?: string | null
          sds_language?: string | null
          sds_revision_date?: string | null
          sds_version?: string | null
          signal_word?: string | null
          source_document_id?: string | null
          spill_response?: string | null
          storage?: string | null
          transport_classification?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "product_safety_data_product_version_id_fkey"
            columns: ["product_version_id"]
            isOneToOne: false
            referencedRelation: "product_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_safety_data_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "source_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      product_scorecards: {
        Row: {
          blocking_reasons: string[]
          can_publish_instructions: boolean
          checks: Json
          created_at: string
          id: string
          last_evaluated: string
          overall_status: string
          product_id: string
          product_version_id: string | null
          reviewer: string | null
          updated_at: string
        }
        Insert: {
          blocking_reasons?: string[]
          can_publish_instructions?: boolean
          checks?: Json
          created_at?: string
          id?: string
          last_evaluated?: string
          overall_status?: string
          product_id: string
          product_version_id?: string | null
          reviewer?: string | null
          updated_at?: string
        }
        Update: {
          blocking_reasons?: string[]
          can_publish_instructions?: boolean
          checks?: Json
          created_at?: string
          id?: string
          last_evaluated?: string
          overall_status?: string
          product_id?: string
          product_version_id?: string | null
          reviewer?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_scorecards_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "professional_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_scorecards_product_version_id_fkey"
            columns: ["product_version_id"]
            isOneToOne: false
            referencedRelation: "product_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      product_stage_mappings: {
        Row: {
          approval_status: string
          category_key: string | null
          company_key: string
          component_key: string | null
          country: string
          created_at: string
          decision: Database["public"]["Enums"]["suitability_decision"]
          effective_date: string | null
          evidence_level: string
          flags: string[]
          id: string
          kit_key: string | null
          manufacturer_claim: string | null
          mapping_code: string
          not_recommended_reason: string | null
          notes: string | null
          product_id: string | null
          product_key: string
          product_version_id: string | null
          product_version_key: string
          prohibited_prior_chemistry: string[]
          provisional: boolean
          repetition_rule: string
          required_following_stage: number | null
          required_prior_stage: number | null
          review_date: string | null
          reviewer: string | null
          source_document_keys: string[]
          source_type: string | null
          specificity: string
          stage_id: string | null
          stage_number: number
          stain_key: string | null
          stop_conditions: string[]
          supersedes_mapping_code: string | null
          updated_at: string
          ventilation_requirement: string
          verified_use: boolean
          version: number
        }
        Insert: {
          approval_status?: string
          category_key?: string | null
          company_key: string
          component_key?: string | null
          country: string
          created_at?: string
          decision?: Database["public"]["Enums"]["suitability_decision"]
          effective_date?: string | null
          evidence_level?: string
          flags?: string[]
          id?: string
          kit_key?: string | null
          manufacturer_claim?: string | null
          mapping_code: string
          not_recommended_reason?: string | null
          notes?: string | null
          product_id?: string | null
          product_key: string
          product_version_id?: string | null
          product_version_key: string
          prohibited_prior_chemistry?: string[]
          provisional?: boolean
          repetition_rule?: string
          required_following_stage?: number | null
          required_prior_stage?: number | null
          review_date?: string | null
          reviewer?: string | null
          source_document_keys?: string[]
          source_type?: string | null
          specificity?: string
          stage_id?: string | null
          stage_number: number
          stain_key?: string | null
          stop_conditions?: string[]
          supersedes_mapping_code?: string | null
          updated_at?: string
          ventilation_requirement?: string
          verified_use?: boolean
          version?: number
        }
        Update: {
          approval_status?: string
          category_key?: string | null
          company_key?: string
          component_key?: string | null
          country?: string
          created_at?: string
          decision?: Database["public"]["Enums"]["suitability_decision"]
          effective_date?: string | null
          evidence_level?: string
          flags?: string[]
          id?: string
          kit_key?: string | null
          manufacturer_claim?: string | null
          mapping_code?: string
          not_recommended_reason?: string | null
          notes?: string | null
          product_id?: string | null
          product_key?: string
          product_version_id?: string | null
          product_version_key?: string
          prohibited_prior_chemistry?: string[]
          provisional?: boolean
          repetition_rule?: string
          required_following_stage?: number | null
          required_prior_stage?: number | null
          review_date?: string | null
          reviewer?: string | null
          source_document_keys?: string[]
          source_type?: string | null
          specificity?: string
          stage_id?: string | null
          stage_number?: number
          stain_key?: string | null
          stop_conditions?: string[]
          supersedes_mapping_code?: string | null
          updated_at?: string
          ventilation_requirement?: string
          verified_use?: boolean
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_stage_mappings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "professional_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_stage_mappings_product_version_id_fkey"
            columns: ["product_version_id"]
            isOneToOne: false
            referencedRelation: "product_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_stage_mappings_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "treatment_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      product_stain_mappings: {
        Row: {
          created_at: string
          evidence_note: string | null
          id: string
          manufacturer_product_id: string
          source_document_id: string | null
          stain_record_id: string
          updated_at: string
          verification_status: string
        }
        Insert: {
          created_at?: string
          evidence_note?: string | null
          id?: string
          manufacturer_product_id: string
          source_document_id?: string | null
          stain_record_id: string
          updated_at?: string
          verification_status?: string
        }
        Update: {
          created_at?: string
          evidence_note?: string | null
          id?: string
          manufacturer_product_id?: string
          source_document_id?: string | null
          stain_record_id?: string
          updated_at?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_stain_mappings_manufacturer_product_id_fkey"
            columns: ["manufacturer_product_id"]
            isOneToOne: false
            referencedRelation: "manufacturer_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_stain_mappings_stain_record_id_fkey"
            columns: ["stain_record_id"]
            isOneToOne: false
            referencedRelation: "stain_records"
            referencedColumns: ["id"]
          },
        ]
      }
      product_textile_compatibility: {
        Row: {
          approval_status: Database["public"]["Enums"]["content_status"]
          country: string | null
          created_at: string
          id: string
          main_risk: string | null
          product_version_id: string
          required_test: string | null
          reviewer: string | null
          source: string | null
          suitability: string
          target_key: string
          target_kind: string
          updated_at: string
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["content_status"]
          country?: string | null
          created_at?: string
          id?: string
          main_risk?: string | null
          product_version_id: string
          required_test?: string | null
          reviewer?: string | null
          source?: string | null
          suitability?: string
          target_key: string
          target_kind: string
          updated_at?: string
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["content_status"]
          country?: string | null
          created_at?: string
          id?: string
          main_risk?: string | null
          product_version_id?: string
          required_test?: string | null
          reviewer?: string | null
          source?: string | null
          suitability?: string
          target_key?: string
          target_kind?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_textile_compatibility_product_version_id_fkey"
            columns: ["product_version_id"]
            isOneToOne: false
            referencedRelation: "product_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      product_training_requirements: {
        Row: {
          created_at: string
          detail: string | null
          id: string
          product_version_id: string
          required: boolean
          requirement_key: string
          source: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          detail?: string | null
          id?: string
          product_version_id: string
          required?: boolean
          requirement_key: string
          source?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          detail?: string | null
          id?: string
          product_version_id?: string
          required?: boolean
          requirement_key?: string
          source?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_training_requirements_product_version_id_fkey"
            columns: ["product_version_id"]
            isOneToOne: false
            referencedRelation: "product_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      product_transitions: {
        Row: {
          approval_status: string
          country: string
          created_at: string
          from_chemistry_family: string | null
          from_product_key: string | null
          from_product_version_key: string | null
          id: string
          inspection_required: boolean
          notes: string | null
          permission: string
          required_neutralization: string | null
          required_rinse: string | null
          reviewer: string | null
          source: string
          to_chemistry_family: string | null
          to_product_key: string | null
          to_product_version_key: string | null
          transition_code: string
          updated_at: string
          waiting_requirement: string | null
        }
        Insert: {
          approval_status?: string
          country?: string
          created_at?: string
          from_chemistry_family?: string | null
          from_product_key?: string | null
          from_product_version_key?: string | null
          id?: string
          inspection_required?: boolean
          notes?: string | null
          permission?: string
          required_neutralization?: string | null
          required_rinse?: string | null
          reviewer?: string | null
          source: string
          to_chemistry_family?: string | null
          to_product_key?: string | null
          to_product_version_key?: string | null
          transition_code: string
          updated_at?: string
          waiting_requirement?: string | null
        }
        Update: {
          approval_status?: string
          country?: string
          created_at?: string
          from_chemistry_family?: string | null
          from_product_key?: string | null
          from_product_version_key?: string | null
          id?: string
          inspection_required?: boolean
          notes?: string | null
          permission?: string
          required_neutralization?: string | null
          required_rinse?: string | null
          reviewer?: string | null
          source?: string
          to_chemistry_family?: string | null
          to_product_key?: string | null
          to_product_version_key?: string | null
          transition_code?: string
          updated_at?: string
          waiting_requirement?: string | null
        }
        Relationships: []
      }
      product_use_verifications: {
        Row: {
          approval_status: Database["public"]["Enums"]["content_status"]
          claim_id: string | null
          created_at: string
          evidence_level: Database["public"]["Enums"]["evidence_level"]
          id: string
          internal_trial_reference: string | null
          product_id: string
          restriction: string | null
          reviewer: string | null
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["content_status"]
          claim_id?: string | null
          created_at?: string
          evidence_level?: Database["public"]["Enums"]["evidence_level"]
          id?: string
          internal_trial_reference?: string | null
          product_id: string
          restriction?: string | null
          reviewer?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["content_status"]
          claim_id?: string | null
          created_at?: string
          evidence_level?: Database["public"]["Enums"]["evidence_level"]
          id?: string
          internal_trial_reference?: string | null
          product_id?: string
          restriction?: string | null
          reviewer?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "product_use_verifications_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "product_manufacturer_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_use_verifications_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "professional_products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_versions: {
        Row: {
          approval_status: Database["public"]["Enums"]["content_status"]
          change_summary: string | null
          country: string
          created_at: string
          effective_date: string | null
          end_date: string | null
          formulation_identifier: string | null
          id: string
          immutable: boolean
          instruction_version: string | null
          known_formulation_change: boolean
          label_version: string | null
          market: string | null
          product_code: string | null
          product_id: string
          reviewer: string | null
          sds_version: string | null
          superseded_by: string | null
          tds_version: string | null
          verification_status: Database["public"]["Enums"]["verification_status"]
          version_ref: string
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["content_status"]
          change_summary?: string | null
          country: string
          created_at?: string
          effective_date?: string | null
          end_date?: string | null
          formulation_identifier?: string | null
          id?: string
          immutable?: boolean
          instruction_version?: string | null
          known_formulation_change?: boolean
          label_version?: string | null
          market?: string | null
          product_code?: string | null
          product_id: string
          reviewer?: string | null
          sds_version?: string | null
          superseded_by?: string | null
          tds_version?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          version_ref: string
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["content_status"]
          change_summary?: string | null
          country?: string
          created_at?: string
          effective_date?: string | null
          end_date?: string | null
          formulation_identifier?: string | null
          id?: string
          immutable?: boolean
          instruction_version?: string | null
          known_formulation_change?: boolean
          label_version?: string | null
          market?: string | null
          product_code?: string | null
          product_id?: string
          reviewer?: string | null
          sds_version?: string | null
          superseded_by?: string | null
          tds_version?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          version_ref?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_versions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "professional_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_versions_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "product_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_products: {
        Row: {
          active_chemistry: string
          alternative_names: string[]
          applicable_colours: string[]
          application_method: string
          brand: string | null
          chemical_family: string
          company_id: string
          compatible_materials: string[]
          contact_time: string
          cost_per_use: number | null
          country_availability: string[]
          country_formulation: string | null
          created_at: string
          dilution_instruction: string
          discontinued_date: string | null
          display_name: string | null
          id: string
          incompatibilities: string | null
          intended_processes: string[]
          intended_professional_use: string | null
          intended_stain_categories: string[]
          intended_stains: string[]
          kit_id: string | null
          label_version: string | null
          language: string | null
          manufacturer_claims: string | null
          neutralization_instruction: string
          odour_description: string | null
          pack_sizes: string[]
          physical_form: string | null
          ppe: string | null
          previous_names: string[]
          product_code: string | null
          product_colour: string | null
          product_name: string
          product_ref: string | null
          product_type: string | null
          prohibited_materials: string[]
          provisional: boolean
          record_state: Database["public"]["Enums"]["record_status"]
          replacement_product_id: string | null
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
          alternative_names?: string[]
          applicable_colours?: string[]
          application_method?: string
          brand?: string | null
          chemical_family?: string
          company_id: string
          compatible_materials?: string[]
          contact_time?: string
          cost_per_use?: number | null
          country_availability?: string[]
          country_formulation?: string | null
          created_at?: string
          dilution_instruction?: string
          discontinued_date?: string | null
          display_name?: string | null
          id?: string
          incompatibilities?: string | null
          intended_processes?: string[]
          intended_professional_use?: string | null
          intended_stain_categories?: string[]
          intended_stains?: string[]
          kit_id?: string | null
          label_version?: string | null
          language?: string | null
          manufacturer_claims?: string | null
          neutralization_instruction?: string
          odour_description?: string | null
          pack_sizes?: string[]
          physical_form?: string | null
          ppe?: string | null
          previous_names?: string[]
          product_code?: string | null
          product_colour?: string | null
          product_name: string
          product_ref?: string | null
          product_type?: string | null
          prohibited_materials?: string[]
          provisional?: boolean
          record_state?: Database["public"]["Enums"]["record_status"]
          replacement_product_id?: string | null
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
          alternative_names?: string[]
          applicable_colours?: string[]
          application_method?: string
          brand?: string | null
          chemical_family?: string
          company_id?: string
          compatible_materials?: string[]
          contact_time?: string
          cost_per_use?: number | null
          country_availability?: string[]
          country_formulation?: string | null
          created_at?: string
          dilution_instruction?: string
          discontinued_date?: string | null
          display_name?: string | null
          id?: string
          incompatibilities?: string | null
          intended_processes?: string[]
          intended_professional_use?: string | null
          intended_stain_categories?: string[]
          intended_stains?: string[]
          kit_id?: string | null
          label_version?: string | null
          language?: string | null
          manufacturer_claims?: string | null
          neutralization_instruction?: string
          odour_description?: string | null
          pack_sizes?: string[]
          physical_form?: string | null
          ppe?: string | null
          previous_names?: string[]
          product_code?: string | null
          product_colour?: string | null
          product_name?: string
          product_ref?: string | null
          product_type?: string | null
          prohibited_materials?: string[]
          provisional?: boolean
          record_state?: Database["public"]["Enums"]["record_status"]
          replacement_product_id?: string | null
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
          {
            foreignKeyName: "professional_products_replacement_product_id_fkey"
            columns: ["replacement_product_id"]
            isOneToOne: false
            referencedRelation: "professional_products"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          available_products: string[]
          country: string | null
          created_at: string
          currency_display: string
          display_name: string | null
          full_name: string | null
          id: string
          marketing_consent: boolean
          measurement_units: string
          organization_id: string | null
          phone_country_code: string | null
          phone_national_number: string | null
          preferred_kits: string[]
          preferred_language: string
          setup_completed_at: string | null
          setup_step: number
          status: string
          time_zone: string | null
          training_level: string
          updated_at: string
          user_id: string
          working_level: string | null
        }
        Insert: {
          available_products?: string[]
          country?: string | null
          created_at?: string
          currency_display?: string
          display_name?: string | null
          full_name?: string | null
          id?: string
          marketing_consent?: boolean
          measurement_units?: string
          organization_id?: string | null
          phone_country_code?: string | null
          phone_national_number?: string | null
          preferred_kits?: string[]
          preferred_language?: string
          setup_completed_at?: string | null
          setup_step?: number
          status?: string
          time_zone?: string | null
          training_level?: string
          updated_at?: string
          user_id: string
          working_level?: string | null
        }
        Update: {
          available_products?: string[]
          country?: string | null
          created_at?: string
          currency_display?: string
          display_name?: string | null
          full_name?: string | null
          id?: string
          marketing_consent?: boolean
          measurement_units?: string
          organization_id?: string | null
          phone_country_code?: string | null
          phone_national_number?: string | null
          preferred_kits?: string[]
          preferred_language?: string
          setup_completed_at?: string | null
          setup_step?: number
          status?: string
          time_zone?: string | null
          training_level?: string
          updated_at?: string
          user_id?: string
          working_level?: string | null
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
      readiness_overrides: {
        Row: {
          assessment_id: string
          created_at: string
          id: string
          justification: string
          new_status: Database["public"]["Enums"]["readiness_status"]
          previous_snapshot: Json | null
          previous_status: Database["public"]["Enums"]["readiness_status"]
          reviewer_id: string | null
        }
        Insert: {
          assessment_id: string
          created_at?: string
          id?: string
          justification: string
          new_status: Database["public"]["Enums"]["readiness_status"]
          previous_snapshot?: Json | null
          previous_status: Database["public"]["Enums"]["readiness_status"]
          reviewer_id?: string | null
        }
        Update: {
          assessment_id?: string
          created_at?: string
          id?: string
          justification?: string
          new_status?: Database["public"]["Enums"]["readiness_status"]
          previous_snapshot?: Json | null
          previous_status?: Database["public"]["Enums"]["readiness_status"]
          reviewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "readiness_overrides_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "case_condition_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      readiness_risk_events: {
        Row: {
          assessment_id: string
          assessment_version: string
          created_at: string
          id: string
          risk_from: Database["public"]["Enums"]["risk_level"]
          risk_to: Database["public"]["Enums"]["risk_level"]
          rule: string
          user_id: string | null
        }
        Insert: {
          assessment_id: string
          assessment_version?: string
          created_at?: string
          id?: string
          risk_from: Database["public"]["Enums"]["risk_level"]
          risk_to: Database["public"]["Enums"]["risk_level"]
          rule: string
          user_id?: string | null
        }
        Update: {
          assessment_id?: string
          assessment_version?: string
          created_at?: string
          id?: string
          risk_from?: Database["public"]["Enums"]["risk_level"]
          risk_to?: Database["public"]["Enums"]["risk_level"]
          rule?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "readiness_risk_events_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "case_condition_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_evaluations: {
        Row: {
          blocked: boolean
          case_key: string
          case_snapshot: Json
          case_version: number
          created_at: string
          determining_rule_code: string | null
          domestic_allowed: boolean
          engine_failure: string | null
          engine_version: string
          explanation: string[]
          fired_rules: Json
          gate_status: string
          id: string
          outcome: string
          product_eligibility: string
          required_actions: string[]
          risk_level: string
          rule_versions: Json
          ruleset_version: string
          suppressed_rules: Json
          updated_at: string
          user_id: string | null
          warnings: string[]
        }
        Insert: {
          blocked?: boolean
          case_key: string
          case_snapshot?: Json
          case_version?: number
          created_at?: string
          determining_rule_code?: string | null
          domestic_allowed?: boolean
          engine_failure?: string | null
          engine_version: string
          explanation?: string[]
          fired_rules?: Json
          gate_status: string
          id?: string
          outcome: string
          product_eligibility: string
          required_actions?: string[]
          risk_level: string
          rule_versions?: Json
          ruleset_version: string
          suppressed_rules?: Json
          updated_at?: string
          user_id?: string | null
          warnings?: string[]
        }
        Update: {
          blocked?: boolean
          case_key?: string
          case_snapshot?: Json
          case_version?: number
          created_at?: string
          determining_rule_code?: string | null
          domestic_allowed?: boolean
          engine_failure?: string | null
          engine_version?: string
          explanation?: string[]
          fired_rules?: Json
          gate_status?: string
          id?: string
          outcome?: string
          product_eligibility?: string
          required_actions?: string[]
          risk_level?: string
          rule_versions?: Json
          ruleset_version?: string
          suppressed_rules?: Json
          updated_at?: string
          user_id?: string | null
          warnings?: string[]
        }
        Relationships: []
      }
      safety_overrides: {
        Row: {
          approved_at: string
          approved_by: string | null
          approved_by_name: string
          case_key: string
          created_at: string
          expires_at: string | null
          id: string
          reason: string
          revoked_at: string | null
          rule_code: string
          updated_at: string
        }
        Insert: {
          approved_at?: string
          approved_by?: string | null
          approved_by_name?: string
          case_key: string
          created_at?: string
          expires_at?: string | null
          id?: string
          reason: string
          revoked_at?: string | null
          rule_code: string
          updated_at?: string
        }
        Update: {
          approved_at?: string
          approved_by?: string | null
          approved_by_name?: string
          case_key?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          reason?: string
          revoked_at?: string | null
          rule_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      safety_rule_audit: {
        Row: {
          action: string
          changed_by: string | null
          changed_by_name: string
          created_at: string
          field: string | null
          id: string
          justification: string
          new_value: string | null
          previous_value: string | null
          rule_code: string
        }
        Insert: {
          action: string
          changed_by?: string | null
          changed_by_name?: string
          created_at?: string
          field?: string | null
          id?: string
          justification: string
          new_value?: string | null
          previous_value?: string | null
          rule_code: string
        }
        Update: {
          action?: string
          changed_by?: string | null
          changed_by_name?: string
          created_at?: string
          field?: string | null
          id?: string
          justification?: string
          new_value?: string | null
          previous_value?: string | null
          rule_code?: string
        }
        Relationships: []
      }
      safety_rules: {
        Row: {
          band: string
          category: string
          content_owner: string
          countries: string[]
          created_at: string
          effective_date: string
          effects: string[]
          evidence_source: string
          excluded_conditions: string[]
          gate_effect: string | null
          id: string
          name: string
          overridable: boolean
          plain_title: string
          product_eligibility_effect: string | null
          required_action: string | null
          required_data: string[]
          review_date: string | null
          risk_effect: string | null
          roles: string[]
          rule_code: string
          severity: string
          status: string
          stop_condition: string | null
          technical_description: string
          technical_reviewer: string | null
          trigger_description: string
          updated_at: string
          version: number
          warning: string
        }
        Insert: {
          band: string
          category: string
          content_owner?: string
          countries?: string[]
          created_at?: string
          effective_date?: string
          effects?: string[]
          evidence_source?: string
          excluded_conditions?: string[]
          gate_effect?: string | null
          id?: string
          name: string
          overridable?: boolean
          plain_title: string
          product_eligibility_effect?: string | null
          required_action?: string | null
          required_data?: string[]
          review_date?: string | null
          risk_effect?: string | null
          roles?: string[]
          rule_code: string
          severity: string
          status?: string
          stop_condition?: string | null
          technical_description?: string
          technical_reviewer?: string | null
          trigger_description?: string
          updated_at?: string
          version?: number
          warning: string
        }
        Update: {
          band?: string
          category?: string
          content_owner?: string
          countries?: string[]
          created_at?: string
          effective_date?: string
          effects?: string[]
          evidence_source?: string
          excluded_conditions?: string[]
          gate_effect?: string | null
          id?: string
          name?: string
          overridable?: boolean
          plain_title?: string
          product_eligibility_effect?: string | null
          required_action?: string | null
          required_data?: string[]
          review_date?: string | null
          risk_effect?: string | null
          roles?: string[]
          rule_code?: string
          severity?: string
          status?: string
          stop_condition?: string | null
          technical_description?: string
          technical_reviewer?: string | null
          trigger_description?: string
          updated_at?: string
          version?: number
          warning?: string
        }
        Relationships: []
      }
      source_documents: {
        Row: {
          company_id: string | null
          country: string | null
          created_at: string
          document_ref: string | null
          document_state: string
          document_title: string
          document_type: Database["public"]["Enums"]["document_type"]
          effective_date: string | null
          expiry_or_review_date: string | null
          file_hash: string | null
          file_or_url: string | null
          id: string
          issuer: string | null
          issuer_uncertain: boolean
          issuing_organization: string | null
          kit_id: string | null
          language: string
          notes: string | null
          product_id: string | null
          publication_date: string | null
          review_date: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer: string | null
          revision_date: string | null
          source_url: string | null
          superseded_by: string | null
          supersedes_document_id: string | null
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          version: string | null
        }
        Insert: {
          company_id?: string | null
          country?: string | null
          created_at?: string
          document_ref?: string | null
          document_state?: string
          document_title: string
          document_type: Database["public"]["Enums"]["document_type"]
          effective_date?: string | null
          expiry_or_review_date?: string | null
          file_hash?: string | null
          file_or_url?: string | null
          id?: string
          issuer?: string | null
          issuer_uncertain?: boolean
          issuing_organization?: string | null
          kit_id?: string | null
          language?: string
          notes?: string | null
          product_id?: string | null
          publication_date?: string | null
          review_date?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer?: string | null
          revision_date?: string | null
          source_url?: string | null
          superseded_by?: string | null
          supersedes_document_id?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          version?: string | null
        }
        Update: {
          company_id?: string | null
          country?: string | null
          created_at?: string
          document_ref?: string | null
          document_state?: string
          document_title?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          effective_date?: string | null
          expiry_or_review_date?: string | null
          file_hash?: string | null
          file_or_url?: string | null
          id?: string
          issuer?: string | null
          issuer_uncertain?: boolean
          issuing_organization?: string | null
          kit_id?: string | null
          language?: string
          notes?: string | null
          product_id?: string | null
          publication_date?: string | null
          review_date?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer?: string | null
          revision_date?: string | null
          source_url?: string | null
          superseded_by?: string | null
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
            foreignKeyName: "source_documents_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "product_kits"
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
            foreignKeyName: "source_documents_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "source_documents"
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
      stain_aliases: {
        Row: {
          alias: string
          alias_type: string
          approval_status: Database["public"]["Enums"]["content_status"]
          country: string | null
          created_at: string
          id: string
          language: string
          master_stain_id: string
          requires_label_check: boolean
          reviewer: string | null
          script: string | null
          search_priority: number
          source: string | null
          transliteration: string | null
          updated_at: string
        }
        Insert: {
          alias: string
          alias_type: string
          approval_status?: Database["public"]["Enums"]["content_status"]
          country?: string | null
          created_at?: string
          id?: string
          language?: string
          master_stain_id: string
          requires_label_check?: boolean
          reviewer?: string | null
          script?: string | null
          search_priority?: number
          source?: string | null
          transliteration?: string | null
          updated_at?: string
        }
        Update: {
          alias?: string
          alias_type?: string
          approval_status?: Database["public"]["Enums"]["content_status"]
          country?: string | null
          created_at?: string
          id?: string
          language?: string
          master_stain_id?: string
          requires_label_check?: boolean
          reviewer?: string | null
          script?: string | null
          search_priority?: number
          source?: string | null
          transliteration?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stain_aliases_master_stain_id_fkey"
            columns: ["master_stain_id"]
            isOneToOne: false
            referencedRelation: "master_stains"
            referencedColumns: ["id"]
          },
        ]
      }
      stain_categories: {
        Row: {
          active_status: boolean
          canonical_name: string | null
          category_key: string
          category_number: number | null
          core_rule: string | null
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          is_legacy: boolean
          name: string
          routing_note: string | null
          short_description: string | null
          slug: string | null
          sort_order: number
          source_document_id: string | null
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
          version: string
        }
        Insert: {
          active_status?: boolean
          canonical_name?: string | null
          category_key: string
          category_number?: number | null
          core_rule?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_legacy?: boolean
          name: string
          routing_note?: string | null
          short_description?: string | null
          slug?: string | null
          sort_order?: number
          source_document_id?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
          version?: string
        }
        Update: {
          active_status?: boolean
          canonical_name?: string | null
          category_key?: string
          category_number?: number | null
          core_rule?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_legacy?: boolean
          name?: string
          routing_note?: string | null
          short_description?: string | null
          slug?: string | null
          sort_order?: number
          source_document_id?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      stain_classification_components: {
        Row: {
          classification_id: string
          component_key: string
          confidence: number
          created_at: string
          evidence_level: Database["public"]["Enums"]["classification_evidence"]
          id: string
          notes: string | null
          relevance: Database["public"]["Enums"]["component_relevance"]
          review_status: Database["public"]["Enums"]["content_status"]
        }
        Insert: {
          classification_id: string
          component_key: string
          confidence?: number
          created_at?: string
          evidence_level?: Database["public"]["Enums"]["classification_evidence"]
          id?: string
          notes?: string | null
          relevance?: Database["public"]["Enums"]["component_relevance"]
          review_status?: Database["public"]["Enums"]["content_status"]
        }
        Update: {
          classification_id?: string
          component_key?: string
          confidence?: number
          created_at?: string
          evidence_level?: Database["public"]["Enums"]["classification_evidence"]
          id?: string
          notes?: string | null
          relevance?: Database["public"]["Enums"]["component_relevance"]
          review_status?: Database["public"]["Enums"]["content_status"]
        }
        Relationships: [
          {
            foreignKeyName: "stain_classification_components_classification_id_fkey"
            columns: ["classification_id"]
            isOneToOne: false
            referencedRelation: "stain_library_classifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stain_classification_components_component_key_fkey"
            columns: ["component_key"]
            isOneToOne: false
            referencedRelation: "stain_components"
            referencedColumns: ["component_key"]
          },
        ]
      }
      stain_classification_sources: {
        Row: {
          classification_id: string
          confidence: number
          created_at: string
          id: string
          source_key: string
        }
        Insert: {
          classification_id: string
          confidence?: number
          created_at?: string
          id?: string
          source_key: string
        }
        Update: {
          classification_id?: string
          confidence?: number
          created_at?: string
          id?: string
          source_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "stain_classification_sources_classification_id_fkey"
            columns: ["classification_id"]
            isOneToOne: false
            referencedRelation: "stain_library_classifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stain_classification_sources_source_key_fkey"
            columns: ["source_key"]
            isOneToOne: false
            referencedRelation: "stain_source_types"
            referencedColumns: ["source_key"]
          },
        ]
      }
      stain_classification_tags: {
        Row: {
          classification_id: string
          created_at: string
          id: string
          tag_key: string
        }
        Insert: {
          classification_id: string
          created_at?: string
          id?: string
          tag_key: string
        }
        Update: {
          classification_id?: string
          created_at?: string
          id?: string
          tag_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "stain_classification_tags_classification_id_fkey"
            columns: ["classification_id"]
            isOneToOne: false
            referencedRelation: "stain_library_classifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stain_classification_tags_tag_key_fkey"
            columns: ["tag_key"]
            isOneToOne: false
            referencedRelation: "classification_tags"
            referencedColumns: ["tag_key"]
          },
        ]
      }
      stain_colour_rules: {
        Row: {
          colour_key: string
          colourfastness_test_required: boolean
          created_at: string
          dye_transfer_risk: string
          evidence_type: string | null
          heat_restricted: boolean
          id: string
          main_risk: string
          master_stain_id: string
          oxidation_restricted: boolean
          reduction_restricted: boolean
          referral: string | null
          updated_at: string
        }
        Insert: {
          colour_key: string
          colourfastness_test_required?: boolean
          created_at?: string
          dye_transfer_risk?: string
          evidence_type?: string | null
          heat_restricted?: boolean
          id?: string
          main_risk: string
          master_stain_id: string
          oxidation_restricted?: boolean
          reduction_restricted?: boolean
          referral?: string | null
          updated_at?: string
        }
        Update: {
          colour_key?: string
          colourfastness_test_required?: boolean
          created_at?: string
          dye_transfer_risk?: string
          evidence_type?: string | null
          heat_restricted?: boolean
          id?: string
          main_risk?: string
          master_stain_id?: string
          oxidation_restricted?: boolean
          reduction_restricted?: boolean
          referral?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stain_colour_rules_master_stain_id_fkey"
            columns: ["master_stain_id"]
            isOneToOne: false
            referencedRelation: "master_stains"
            referencedColumns: ["id"]
          },
        ]
      }
      stain_common_sources: {
        Row: {
          countries: string[]
          created_at: string
          evidence_type: string | null
          formulation_variable: boolean
          id: string
          likelihood: string
          master_stain_id: string
          notes: string | null
          source_name: string
          source_type: string
          typical_context: string | null
          updated_at: string
        }
        Insert: {
          countries?: string[]
          created_at?: string
          evidence_type?: string | null
          formulation_variable?: boolean
          id?: string
          likelihood?: string
          master_stain_id: string
          notes?: string | null
          source_name: string
          source_type: string
          typical_context?: string | null
          updated_at?: string
        }
        Update: {
          countries?: string[]
          created_at?: string
          evidence_type?: string | null
          formulation_variable?: boolean
          id?: string
          likelihood?: string
          master_stain_id?: string
          notes?: string | null
          source_name?: string
          source_type?: string
          typical_context?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stain_common_sources_master_stain_id_fkey"
            columns: ["master_stain_id"]
            isOneToOne: false
            referencedRelation: "master_stains"
            referencedColumns: ["id"]
          },
        ]
      }
      stain_components: {
        Row: {
          archived: boolean
          component_key: string
          created_at: string
          description: string | null
          id: string
          label: string
          technical_only: boolean
          updated_at: string
        }
        Insert: {
          archived?: boolean
          component_key: string
          created_at?: string
          description?: string | null
          id?: string
          label: string
          technical_only?: boolean
          updated_at?: string
        }
        Update: {
          archived?: boolean
          component_key?: string
          created_at?: string
          description?: string | null
          id?: string
          label?: string
          technical_only?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      stain_condition_effects: {
        Row: {
          added_damage_risk: string | null
          assessment_requirement: string | null
          condition_key: string
          created_at: string
          difficulty: string
          escalation_condition: string | null
          id: string
          master_stain_id: string
          outcome_adjustment: string | null
          updated_at: string
        }
        Insert: {
          added_damage_risk?: string | null
          assessment_requirement?: string | null
          condition_key: string
          created_at?: string
          difficulty?: string
          escalation_condition?: string | null
          id?: string
          master_stain_id: string
          outcome_adjustment?: string | null
          updated_at?: string
        }
        Update: {
          added_damage_risk?: string | null
          assessment_requirement?: string | null
          condition_key?: string
          created_at?: string
          difficulty?: string
          escalation_condition?: string | null
          id?: string
          master_stain_id?: string
          outcome_adjustment?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stain_condition_effects_master_stain_id_fkey"
            columns: ["master_stain_id"]
            isOneToOne: false
            referencedRelation: "master_stains"
            referencedColumns: ["id"]
          },
        ]
      }
      stain_evidence_claims: {
        Row: {
          claim: string
          country: string | null
          created_at: string
          evidence_type: string
          id: string
          master_stain_id: string
          reviewer: string | null
          section: string
          source: string
          source_date: string | null
          source_version: string | null
          updated_at: string
          verification: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          claim: string
          country?: string | null
          created_at?: string
          evidence_type: string
          id?: string
          master_stain_id: string
          reviewer?: string | null
          section: string
          source: string
          source_date?: string | null
          source_version?: string | null
          updated_at?: string
          verification?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          claim?: string
          country?: string | null
          created_at?: string
          evidence_type?: string
          id?: string
          master_stain_id?: string
          reviewer?: string | null
          section?: string
          source?: string
          source_date?: string | null
          source_version?: string | null
          updated_at?: string
          verification?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "stain_evidence_claims_master_stain_id_fkey"
            columns: ["master_stain_id"]
            isOneToOne: false
            referencedRelation: "master_stains"
            referencedColumns: ["id"]
          },
        ]
      }
      stain_expected_outcomes: {
        Row: {
          colour_key: string | null
          created_at: string
          damaged: boolean | null
          dye_loss: string | null
          fabric_key: string | null
          fibre_damage: string | null
          finish_damage: string | null
          foreign_material: string | null
          heat_exposed: boolean | null
          id: string
          master_stain_id: string
          odour_hygiene: string | null
          outcome_class: string
          previously_treated: boolean | null
          remaining_pigment: string | null
          stain_age: string | null
          updated_at: string
        }
        Insert: {
          colour_key?: string | null
          created_at?: string
          damaged?: boolean | null
          dye_loss?: string | null
          fabric_key?: string | null
          fibre_damage?: string | null
          finish_damage?: string | null
          foreign_material?: string | null
          heat_exposed?: boolean | null
          id?: string
          master_stain_id: string
          odour_hygiene?: string | null
          outcome_class: string
          previously_treated?: boolean | null
          remaining_pigment?: string | null
          stain_age?: string | null
          updated_at?: string
        }
        Update: {
          colour_key?: string | null
          created_at?: string
          damaged?: boolean | null
          dye_loss?: string | null
          fabric_key?: string | null
          fibre_damage?: string | null
          finish_damage?: string | null
          foreign_material?: string | null
          heat_exposed?: boolean | null
          id?: string
          master_stain_id?: string
          odour_hygiene?: string | null
          outcome_class?: string
          previously_treated?: boolean | null
          remaining_pigment?: string | null
          stain_age?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stain_expected_outcomes_master_stain_id_fkey"
            columns: ["master_stain_id"]
            isOneToOne: false
            referencedRelation: "master_stains"
            referencedColumns: ["id"]
          },
        ]
      }
      stain_fabric_rules: {
        Row: {
          confidence: number
          created_at: string
          evidence_type: string | null
          fabric_key: string
          first_response_boundary: string | null
          id: string
          is_component_part: boolean
          main_risk: string
          master_stain_id: string
          prohibited_principles: string[]
          referral_condition: string | null
          reviewer: string | null
          test_required: boolean
          updated_at: string
          why_risk: string | null
        }
        Insert: {
          confidence?: number
          created_at?: string
          evidence_type?: string | null
          fabric_key: string
          first_response_boundary?: string | null
          id?: string
          is_component_part?: boolean
          main_risk: string
          master_stain_id: string
          prohibited_principles?: string[]
          referral_condition?: string | null
          reviewer?: string | null
          test_required?: boolean
          updated_at?: string
          why_risk?: string | null
        }
        Update: {
          confidence?: number
          created_at?: string
          evidence_type?: string | null
          fabric_key?: string
          first_response_boundary?: string | null
          id?: string
          is_component_part?: boolean
          main_risk?: string
          master_stain_id?: string
          prohibited_principles?: string[]
          referral_condition?: string | null
          reviewer?: string | null
          test_required?: boolean
          updated_at?: string
          why_risk?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stain_fabric_rules_master_stain_id_fkey"
            columns: ["master_stain_id"]
            isOneToOne: false
            referencedRelation: "master_stains"
            referencedColumns: ["id"]
          },
        ]
      }
      stain_failure_profiles: {
        Row: {
          created_at: string
          dye_loss_indicators: string[]
          escalation_point: string | null
          evidence_type: string | null
          fibre_damage_indicators: string[]
          finish_damage_indicators: string[]
          further_attempt_safe: string
          id: string
          mandatory_stop: string[]
          master_stain_id: string
          max_attempt_policy: string | null
          next_assessment: string | null
          residue_indicators: string[]
          updated_at: string
          why_may_fail: string[]
        }
        Insert: {
          created_at?: string
          dye_loss_indicators?: string[]
          escalation_point?: string | null
          evidence_type?: string | null
          fibre_damage_indicators?: string[]
          finish_damage_indicators?: string[]
          further_attempt_safe?: string
          id?: string
          mandatory_stop?: string[]
          master_stain_id: string
          max_attempt_policy?: string | null
          next_assessment?: string | null
          residue_indicators?: string[]
          updated_at?: string
          why_may_fail?: string[]
        }
        Update: {
          created_at?: string
          dye_loss_indicators?: string[]
          escalation_point?: string | null
          evidence_type?: string | null
          fibre_damage_indicators?: string[]
          finish_damage_indicators?: string[]
          further_attempt_safe?: string
          id?: string
          mandatory_stop?: string[]
          master_stain_id?: string
          max_attempt_policy?: string | null
          next_assessment?: string | null
          residue_indicators?: string[]
          updated_at?: string
          why_may_fail?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "stain_failure_profiles_master_stain_id_fkey"
            columns: ["master_stain_id"]
            isOneToOne: false
            referencedRelation: "master_stains"
            referencedColumns: ["id"]
          },
        ]
      }
      stain_faqs: {
        Row: {
          answer: string
          approval_status: Database["public"]["Enums"]["content_status"]
          audience: string
          country: string | null
          created_at: string
          display_order: number
          evidence_type: string | null
          id: string
          language: string
          master_stain_id: string
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          approval_status?: Database["public"]["Enums"]["content_status"]
          audience?: string
          country?: string | null
          created_at?: string
          display_order?: number
          evidence_type?: string | null
          id?: string
          language?: string
          master_stain_id: string
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          approval_status?: Database["public"]["Enums"]["content_status"]
          audience?: string
          country?: string | null
          created_at?: string
          display_order?: number
          evidence_type?: string | null
          id?: string
          language?: string
          master_stain_id?: string
          question?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stain_faqs_master_stain_id_fkey"
            columns: ["master_stain_id"]
            isOneToOne: false
            referencedRelation: "master_stains"
            referencedColumns: ["id"]
          },
        ]
      }
      stain_first_responses: {
        Row: {
          action: string
          approval_status: Database["public"]["Enums"]["content_status"]
          created_at: string
          eligible_fabric_conditions: string | null
          eligible_roles: string[]
          eligible_stain_conditions: string | null
          escalation_trigger: string | null
          evidence_type: string | null
          heat_warning: string | null
          id: string
          master_stain_id: string
          max_delay_before_assessment: string | null
          prohibited_circumstances: string[]
          purpose: string | null
          updated_at: string
        }
        Insert: {
          action: string
          approval_status?: Database["public"]["Enums"]["content_status"]
          created_at?: string
          eligible_fabric_conditions?: string | null
          eligible_roles?: string[]
          eligible_stain_conditions?: string | null
          escalation_trigger?: string | null
          evidence_type?: string | null
          heat_warning?: string | null
          id?: string
          master_stain_id: string
          max_delay_before_assessment?: string | null
          prohibited_circumstances?: string[]
          purpose?: string | null
          updated_at?: string
        }
        Update: {
          action?: string
          approval_status?: Database["public"]["Enums"]["content_status"]
          created_at?: string
          eligible_fabric_conditions?: string | null
          eligible_roles?: string[]
          eligible_stain_conditions?: string | null
          escalation_trigger?: string | null
          evidence_type?: string | null
          heat_warning?: string | null
          id?: string
          master_stain_id?: string
          max_delay_before_assessment?: string | null
          prohibited_circumstances?: string[]
          purpose?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stain_first_responses_master_stain_id_fkey"
            columns: ["master_stain_id"]
            isOneToOne: false
            referencedRelation: "master_stains"
            referencedColumns: ["id"]
          },
        ]
      }
      stain_identification_reviews: {
        Row: {
          corrected_stain_key: string | null
          created_at: string
          id: string
          identification_id: string
          previous_snapshot: Json | null
          reason: string
          reviewer_id: string | null
        }
        Insert: {
          corrected_stain_key?: string | null
          created_at?: string
          id?: string
          identification_id: string
          previous_snapshot?: Json | null
          reason: string
          reviewer_id?: string | null
        }
        Update: {
          corrected_stain_key?: string | null
          created_at?: string
          id?: string
          identification_id?: string
          previous_snapshot?: Json | null
          reason?: string
          reviewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stain_identification_reviews_identification_id_fkey"
            columns: ["identification_id"]
            isOneToOne: false
            referencedRelation: "stain_identifications"
            referencedColumns: ["id"]
          },
        ]
      }
      stain_identifications: {
        Row: {
          ai_model_version: string | null
          ai_suggestions: Json
          answers: Json
          assessment_version: string
          candidates: Json
          confidence_explanation: string | null
          confirmed_stain_key: string | null
          created_at: string
          damage_answers: string[]
          documentation_only: boolean
          entry_route: string | null
          fabric_assessment_id: string | null
          gate_after: string | null
          gate_before: string | null
          hazard_answers: string[]
          id: string
          identification_confidence: number | null
          image_quality: Json
          local_case_ref: string | null
          local_name_used: string | null
          next_action: string | null
          organization_id: string | null
          outcome: string | null
          photos: Json
          previous_treatment: string[]
          primary_category_key: string | null
          rejected_stain_keys: string[]
          risk_after: string | null
          risk_before: string | null
          risk_rule: string | null
          search_terms: string[]
          secondary_component_keys: string[]
          selected_category_key: string | null
          selected_source_key: string | null
          selected_stain_key: string | null
          stain_age: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ai_model_version?: string | null
          ai_suggestions?: Json
          answers?: Json
          assessment_version?: string
          candidates?: Json
          confidence_explanation?: string | null
          confirmed_stain_key?: string | null
          created_at?: string
          damage_answers?: string[]
          documentation_only?: boolean
          entry_route?: string | null
          fabric_assessment_id?: string | null
          gate_after?: string | null
          gate_before?: string | null
          hazard_answers?: string[]
          id?: string
          identification_confidence?: number | null
          image_quality?: Json
          local_case_ref?: string | null
          local_name_used?: string | null
          next_action?: string | null
          organization_id?: string | null
          outcome?: string | null
          photos?: Json
          previous_treatment?: string[]
          primary_category_key?: string | null
          rejected_stain_keys?: string[]
          risk_after?: string | null
          risk_before?: string | null
          risk_rule?: string | null
          search_terms?: string[]
          secondary_component_keys?: string[]
          selected_category_key?: string | null
          selected_source_key?: string | null
          selected_stain_key?: string | null
          stain_age?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ai_model_version?: string | null
          ai_suggestions?: Json
          answers?: Json
          assessment_version?: string
          candidates?: Json
          confidence_explanation?: string | null
          confirmed_stain_key?: string | null
          created_at?: string
          damage_answers?: string[]
          documentation_only?: boolean
          entry_route?: string | null
          fabric_assessment_id?: string | null
          gate_after?: string | null
          gate_before?: string | null
          hazard_answers?: string[]
          id?: string
          identification_confidence?: number | null
          image_quality?: Json
          local_case_ref?: string | null
          local_name_used?: string | null
          next_action?: string | null
          organization_id?: string | null
          outcome?: string | null
          photos?: Json
          previous_treatment?: string[]
          primary_category_key?: string | null
          rejected_stain_keys?: string[]
          risk_after?: string | null
          risk_before?: string | null
          risk_rule?: string | null
          search_terms?: string[]
          secondary_component_keys?: string[]
          selected_category_key?: string | null
          selected_source_key?: string | null
          selected_stain_key?: string | null
          stain_age?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      stain_library_classifications: {
        Row: {
          alternative_names: string[]
          approval_status: Database["public"]["Enums"]["content_status"]
          bonding_behaviour: string
          classification_version: number
          component_confidence: number
          content_owner: string | null
          country_applicability: string[]
          created_at: string
          damage_default_key: string | null
          damage_interpretation_confidence: number
          display_name: string
          effect_of_acidity: string
          effect_of_ageing: string
          effect_of_alkalinity: string
          effect_of_heat: string
          effect_of_oxidation: string
          evidence_level: Database["public"]["Enums"]["classification_evidence"]
          id: string
          legacy_category: string | null
          likely_composition: string
          local_names: string[]
          needs_review: boolean
          next_review_date: string | null
          plain_explanation: string | null
          primary_category_confidence: number
          primary_category_key: string
          primary_category_reason: string | null
          review_date: string | null
          review_note: string | null
          solubility: string
          source_confidence: number
          stain_id: string | null
          stain_key: string
          taxonomy_version: string
          technical_reviewer: string | null
          treatment_principle_note: string
          updated_at: string
        }
        Insert: {
          alternative_names?: string[]
          approval_status?: Database["public"]["Enums"]["content_status"]
          bonding_behaviour?: string
          classification_version?: number
          component_confidence?: number
          content_owner?: string | null
          country_applicability?: string[]
          created_at?: string
          damage_default_key?: string | null
          damage_interpretation_confidence?: number
          display_name: string
          effect_of_acidity?: string
          effect_of_ageing?: string
          effect_of_alkalinity?: string
          effect_of_heat?: string
          effect_of_oxidation?: string
          evidence_level?: Database["public"]["Enums"]["classification_evidence"]
          id?: string
          legacy_category?: string | null
          likely_composition?: string
          local_names?: string[]
          needs_review?: boolean
          next_review_date?: string | null
          plain_explanation?: string | null
          primary_category_confidence?: number
          primary_category_key: string
          primary_category_reason?: string | null
          review_date?: string | null
          review_note?: string | null
          solubility?: string
          source_confidence?: number
          stain_id?: string | null
          stain_key: string
          taxonomy_version?: string
          technical_reviewer?: string | null
          treatment_principle_note?: string
          updated_at?: string
        }
        Update: {
          alternative_names?: string[]
          approval_status?: Database["public"]["Enums"]["content_status"]
          bonding_behaviour?: string
          classification_version?: number
          component_confidence?: number
          content_owner?: string | null
          country_applicability?: string[]
          created_at?: string
          damage_default_key?: string | null
          damage_interpretation_confidence?: number
          display_name?: string
          effect_of_acidity?: string
          effect_of_ageing?: string
          effect_of_alkalinity?: string
          effect_of_heat?: string
          effect_of_oxidation?: string
          evidence_level?: Database["public"]["Enums"]["classification_evidence"]
          id?: string
          legacy_category?: string | null
          likely_composition?: string
          local_names?: string[]
          needs_review?: boolean
          next_review_date?: string | null
          plain_explanation?: string | null
          primary_category_confidence?: number
          primary_category_key?: string
          primary_category_reason?: string | null
          review_date?: string | null
          review_note?: string | null
          solubility?: string
          source_confidence?: number
          stain_id?: string | null
          stain_key?: string
          taxonomy_version?: string
          technical_reviewer?: string | null
          treatment_principle_note?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stain_library_classifications_damage_default_key_fkey"
            columns: ["damage_default_key"]
            isOneToOne: false
            referencedRelation: "damage_interpretations"
            referencedColumns: ["damage_key"]
          },
          {
            foreignKeyName: "stain_library_classifications_primary_category_key_fkey"
            columns: ["primary_category_key"]
            isOneToOne: false
            referencedRelation: "stain_primary_categories"
            referencedColumns: ["category_key"]
          },
          {
            foreignKeyName: "stain_library_classifications_stain_id_fkey"
            columns: ["stain_id"]
            isOneToOne: false
            referencedRelation: "stains"
            referencedColumns: ["id"]
          },
        ]
      }
      stain_primary_categories: {
        Row: {
          archived: boolean
          category_key: string
          created_at: string
          examples: string[]
          heat_warning: string | null
          icon: string | null
          id: string
          important_limitation: string | null
          name: string
          plain_description: string
          sort_order: number
          technical_only: boolean
          translations: Json
          updated_at: string
        }
        Insert: {
          archived?: boolean
          category_key: string
          created_at?: string
          examples?: string[]
          heat_warning?: string | null
          icon?: string | null
          id?: string
          important_limitation?: string | null
          name: string
          plain_description: string
          sort_order?: number
          technical_only?: boolean
          translations?: Json
          updated_at?: string
        }
        Update: {
          archived?: boolean
          category_key?: string
          created_at?: string
          examples?: string[]
          heat_warning?: string | null
          icon?: string | null
          id?: string
          important_limitation?: string | null
          name?: string
          plain_description?: string
          sort_order?: number
          technical_only?: boolean
          translations?: Json
          updated_at?: string
        }
        Relationships: []
      }
      stain_prohibitions: {
        Row: {
          affected_roles: string[]
          applies_condition: string
          created_at: string
          evidence_type: string | null
          id: string
          master_stain_id: string
          prohibition_type: string
          reason: string
          reviewer: string | null
          severity: string
          updated_at: string
        }
        Insert: {
          affected_roles?: string[]
          applies_condition: string
          created_at?: string
          evidence_type?: string | null
          id?: string
          master_stain_id: string
          prohibition_type: string
          reason: string
          reviewer?: string | null
          severity?: string
          updated_at?: string
        }
        Update: {
          affected_roles?: string[]
          applies_condition?: string
          created_at?: string
          evidence_type?: string | null
          id?: string
          master_stain_id?: string
          prohibition_type?: string
          reason?: string
          reviewer?: string | null
          severity?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stain_prohibitions_master_stain_id_fkey"
            columns: ["master_stain_id"]
            isOneToOne: false
            referencedRelation: "master_stains"
            referencedColumns: ["id"]
          },
        ]
      }
      stain_public_contents: {
        Row: {
          before_you_start: string | null
          common_mistakes: string[]
          created_at: string
          disclaimer: string | null
          id: string
          language: string
          master_stain_id: string
          materials_cautious: string[]
          materials_professional: string[]
          page_title: string
          professional_summary: string | null
          short_answer: string | null
          source_version: number
          updated_at: string
          why_difficult: string | null
        }
        Insert: {
          before_you_start?: string | null
          common_mistakes?: string[]
          created_at?: string
          disclaimer?: string | null
          id?: string
          language?: string
          master_stain_id: string
          materials_cautious?: string[]
          materials_professional?: string[]
          page_title: string
          professional_summary?: string | null
          short_answer?: string | null
          source_version?: number
          updated_at?: string
          why_difficult?: string | null
        }
        Update: {
          before_you_start?: string | null
          common_mistakes?: string[]
          created_at?: string
          disclaimer?: string | null
          id?: string
          language?: string
          master_stain_id?: string
          materials_cautious?: string[]
          materials_professional?: string[]
          page_title?: string
          professional_summary?: string | null
          short_answer?: string | null
          source_version?: number
          updated_at?: string
          why_difficult?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stain_public_contents_master_stain_id_fkey"
            columns: ["master_stain_id"]
            isOneToOne: false
            referencedRelation: "master_stains"
            referencedColumns: ["id"]
          },
        ]
      }
      stain_record_aliases: {
        Row: {
          alias: string
          alias_type: string
          created_at: string
          id: string
          is_active: boolean
          language: string
          region: string | null
          review_status: string
          source_document_id: string | null
          source_note: string | null
          stain_record_id: string
          updated_at: string
        }
        Insert: {
          alias: string
          alias_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          language?: string
          region?: string | null
          review_status?: string
          source_document_id?: string | null
          source_note?: string | null
          stain_record_id: string
          updated_at?: string
        }
        Update: {
          alias?: string
          alias_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          language?: string
          region?: string | null
          review_status?: string
          source_document_id?: string | null
          source_note?: string | null
          stain_record_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stain_record_aliases_stain_record_id_fkey"
            columns: ["stain_record_id"]
            isOneToOne: false
            referencedRelation: "stain_records"
            referencedColumns: ["id"]
          },
        ]
      }
      stain_record_reroutes: {
        Row: {
          created_at: string
          id: string
          review_status: string
          routing_note: string | null
          sort_order: number
          stain_record_id: string
          target_category_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          review_status?: string
          routing_note?: string | null
          sort_order?: number
          stain_record_id: string
          target_category_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          review_status?: string
          routing_note?: string | null
          sort_order?: number
          stain_record_id?: string
          target_category_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stain_record_reroutes_stain_record_id_fkey"
            columns: ["stain_record_id"]
            isOneToOne: false
            referencedRelation: "stain_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stain_record_reroutes_target_category_id_fkey"
            columns: ["target_category_id"]
            isOneToOne: false
            referencedRelation: "stain_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      stain_records: {
        Row: {
          aged: boolean
          aliases: string[]
          biological_risk: boolean
          canonical_name: string
          category_version: string | null
          chemical_risk: boolean
          contamination_risk: boolean
          created_at: string
          cured: boolean
          damage_suspected: boolean
          deposit_present: boolean
          dominant_residue: string | null
          dried: boolean
          fire_risk: boolean
          fresh: boolean
          heat_set: boolean
          hidden_test_required: boolean
          id: string
          import_batch_id: string | null
          inhalation_risk: boolean
          initial_outcome_class: string
          mandatory_stop_or_reroute_trigger: string | null
          oxidized: boolean
          physical_state: string | null
          previously_treated: boolean
          primary_category_id: string
          publication_status: string
          regional_terms: string[]
          reroute_pending: boolean
          reroute_target: string | null
          review_status: string
          searchable_secondary_category_ids: string[]
          source_document_id: string | null
          source_section: string | null
          stable_id: string
          typical_chemistry: string | null
          updated_at: string
        }
        Insert: {
          aged?: boolean
          aliases?: string[]
          biological_risk?: boolean
          canonical_name: string
          category_version?: string | null
          chemical_risk?: boolean
          contamination_risk?: boolean
          created_at?: string
          cured?: boolean
          damage_suspected?: boolean
          deposit_present?: boolean
          dominant_residue?: string | null
          dried?: boolean
          fire_risk?: boolean
          fresh?: boolean
          heat_set?: boolean
          hidden_test_required?: boolean
          id?: string
          import_batch_id?: string | null
          inhalation_risk?: boolean
          initial_outcome_class: string
          mandatory_stop_or_reroute_trigger?: string | null
          oxidized?: boolean
          physical_state?: string | null
          previously_treated?: boolean
          primary_category_id: string
          publication_status?: string
          regional_terms?: string[]
          reroute_pending?: boolean
          reroute_target?: string | null
          review_status?: string
          searchable_secondary_category_ids?: string[]
          source_document_id?: string | null
          source_section?: string | null
          stable_id: string
          typical_chemistry?: string | null
          updated_at?: string
        }
        Update: {
          aged?: boolean
          aliases?: string[]
          biological_risk?: boolean
          canonical_name?: string
          category_version?: string | null
          chemical_risk?: boolean
          contamination_risk?: boolean
          created_at?: string
          cured?: boolean
          damage_suspected?: boolean
          deposit_present?: boolean
          dominant_residue?: string | null
          dried?: boolean
          fire_risk?: boolean
          fresh?: boolean
          heat_set?: boolean
          hidden_test_required?: boolean
          id?: string
          import_batch_id?: string | null
          inhalation_risk?: boolean
          initial_outcome_class?: string
          mandatory_stop_or_reroute_trigger?: string | null
          oxidized?: boolean
          physical_state?: string | null
          previously_treated?: boolean
          primary_category_id?: string
          publication_status?: string
          regional_terms?: string[]
          reroute_pending?: boolean
          reroute_target?: string | null
          review_status?: string
          searchable_secondary_category_ids?: string[]
          source_document_id?: string | null
          source_section?: string | null
          stable_id?: string
          typical_chemistry?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stain_records_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stain_records_primary_category_id_fkey"
            columns: ["primary_category_id"]
            isOneToOne: false
            referencedRelation: "stain_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      stain_relations: {
        Row: {
          created_at: string
          directional: boolean
          evidence_type: string | null
          explanation: string | null
          id: string
          master_stain_id: string
          related_key: string | null
          related_stain_id: string | null
          relation_kind: string
          reviewer: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          directional?: boolean
          evidence_type?: string | null
          explanation?: string | null
          id?: string
          master_stain_id: string
          related_key?: string | null
          related_stain_id?: string | null
          relation_kind: string
          reviewer?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          directional?: boolean
          evidence_type?: string | null
          explanation?: string | null
          id?: string
          master_stain_id?: string
          related_key?: string | null
          related_stain_id?: string | null
          relation_kind?: string
          reviewer?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stain_relations_master_stain_id_fkey"
            columns: ["master_stain_id"]
            isOneToOne: false
            referencedRelation: "master_stains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stain_relations_related_stain_id_fkey"
            columns: ["related_stain_id"]
            isOneToOne: false
            referencedRelation: "master_stains"
            referencedColumns: ["id"]
          },
        ]
      }
      stain_review_flags: {
        Row: {
          created_at: string
          id: string
          master_stain_id: string
          note: string | null
          resolved: boolean
          resolved_by: string | null
          sections: string[]
          trigger_key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          master_stain_id: string
          note?: string | null
          resolved?: boolean
          resolved_by?: string | null
          sections?: string[]
          trigger_key: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          master_stain_id?: string
          note?: string | null
          resolved?: boolean
          resolved_by?: string | null
          sections?: string[]
          trigger_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stain_review_flags_master_stain_id_fkey"
            columns: ["master_stain_id"]
            isOneToOne: false
            referencedRelation: "master_stains"
            referencedColumns: ["id"]
          },
        ]
      }
      stain_revisions: {
        Row: {
          approval_status: Database["public"]["Enums"]["content_status"]
          changed_by: string | null
          content_version: number
          created_at: string
          id: string
          master_stain_id: string
          reason: string | null
          sections: string[]
          snapshot: Json | null
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["content_status"]
          changed_by?: string | null
          content_version: number
          created_at?: string
          id?: string
          master_stain_id: string
          reason?: string | null
          sections?: string[]
          snapshot?: Json | null
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["content_status"]
          changed_by?: string | null
          content_version?: number
          created_at?: string
          id?: string
          master_stain_id?: string
          reason?: string | null
          sections?: string[]
          snapshot?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "stain_revisions_master_stain_id_fkey"
            columns: ["master_stain_id"]
            isOneToOne: false
            referencedRelation: "master_stains"
            referencedColumns: ["id"]
          },
        ]
      }
      stain_source_types: {
        Row: {
          archived: boolean
          created_at: string
          icon: string | null
          id: string
          label: string
          sort_order: number
          source_key: string
          updated_at: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          icon?: string | null
          id?: string
          label: string
          sort_order?: number
          source_key: string
          updated_at?: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          icon?: string | null
          id?: string
          label?: string
          sort_order?: number
          source_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      stain_stage_links: {
        Row: {
          approval_status: Database["public"]["Enums"]["content_status"]
          created_at: string
          evidence_type: string | null
          id: string
          inspection_point: string | null
          master_stain_id: string
          preconditions: string[]
          prohibited_conditions: string[]
          stage_key: string
          stage_order: number
          stop_condition: string | null
          updated_at: string
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["content_status"]
          created_at?: string
          evidence_type?: string | null
          id?: string
          inspection_point?: string | null
          master_stain_id: string
          preconditions?: string[]
          prohibited_conditions?: string[]
          stage_key: string
          stage_order?: number
          stop_condition?: string | null
          updated_at?: string
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["content_status"]
          created_at?: string
          evidence_type?: string | null
          id?: string
          inspection_point?: string | null
          master_stain_id?: string
          preconditions?: string[]
          prohibited_conditions?: string[]
          stage_key?: string
          stage_order?: number
          stop_condition?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stain_stage_links_master_stain_id_fkey"
            columns: ["master_stain_id"]
            isOneToOne: false
            referencedRelation: "master_stains"
            referencedColumns: ["id"]
          },
        ]
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
      stain_translations: {
        Row: {
          country: string | null
          created_at: string
          display_name: string
          id: string
          language: string
          master_stain_id: string
          script: string | null
          short_description: string | null
          source_version: number
          technical_review_of_translation: string | null
          translation_status: string
          translator: string | null
          units: string
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          display_name: string
          id?: string
          language: string
          master_stain_id: string
          script?: string | null
          short_description?: string | null
          source_version?: number
          technical_review_of_translation?: string | null
          translation_status?: string
          translator?: string | null
          units?: string
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          display_name?: string
          id?: string
          language?: string
          master_stain_id?: string
          script?: string | null
          short_description?: string | null
          source_version?: number
          technical_review_of_translation?: string | null
          translation_status?: string
          translator?: string | null
          units?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stain_translations_master_stain_id_fkey"
            columns: ["master_stain_id"]
            isOneToOne: false
            referencedRelation: "master_stains"
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
      stop_return_rules: {
        Row: {
          category_id: string | null
          created_at: string
          customer_wording: string | null
          id: string
          import_batch_id: string | null
          rule_order: number
          rule_text: string
          rule_type: string
          source_document_id: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          customer_wording?: string | null
          id?: string
          import_batch_id?: string | null
          rule_order?: number
          rule_text: string
          rule_type?: string
          source_document_id?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          customer_wording?: string | null
          id?: string
          import_batch_id?: string | null
          rule_order?: number
          rule_text?: string
          rule_type?: string
          source_document_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stop_return_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "stain_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stop_return_rules_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          access_ends_at: string | null
          access_starts_at: string | null
          created_at: string
          id: string
          order_id: string | null
          plan_code: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_ends_at?: string | null
          access_starts_at?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          plan_code: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_ends_at?: string | null
          access_starts_at?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          plan_code?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
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
      treatment_outcomes: {
        Row: {
          approved_method: Json | null
          attempts: Json
          baseline: Json
          classification: string | null
          client_record_key: string
          closure_exception_reason: string | null
          closure_state: string | null
          context: Json
          corrects_outcome_id: string | null
          created_at: string
          evidence_stage: string
          failure_hypotheses: string[]
          follow_up: Json | null
          id: string
          immediate_inspection: Json
          organization_key: string | null
          outcome_id: string
          post_drying: Json | null
          post_rinse: Json | null
          record_type: string
          remaining_mark: string | null
          reported_by: string | null
          severity: number | null
          superseded: boolean
          updated_at: string
          version: number
        }
        Insert: {
          approved_method?: Json | null
          attempts?: Json
          baseline?: Json
          classification?: string | null
          client_record_key: string
          closure_exception_reason?: string | null
          closure_state?: string | null
          context?: Json
          corrects_outcome_id?: string | null
          created_at?: string
          evidence_stage?: string
          failure_hypotheses?: string[]
          follow_up?: Json | null
          id?: string
          immediate_inspection?: Json
          organization_key?: string | null
          outcome_id: string
          post_drying?: Json | null
          post_rinse?: Json | null
          record_type: string
          remaining_mark?: string | null
          reported_by?: string | null
          severity?: number | null
          superseded?: boolean
          updated_at?: string
          version?: number
        }
        Update: {
          approved_method?: Json | null
          attempts?: Json
          baseline?: Json
          classification?: string | null
          client_record_key?: string
          closure_exception_reason?: string | null
          closure_state?: string | null
          context?: Json
          corrects_outcome_id?: string | null
          created_at?: string
          evidence_stage?: string
          failure_hypotheses?: string[]
          follow_up?: Json | null
          id?: string
          immediate_inspection?: Json
          organization_key?: string | null
          outcome_id?: string
          post_drying?: Json | null
          post_rinse?: Json | null
          record_type?: string
          remaining_mark?: string | null
          reported_by?: string | null
          severity?: number | null
          superseded?: boolean
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      treatment_pathways: {
        Row: {
          categories: string[]
          completion_requirements: string[]
          created_at: string
          description: string | null
          id: string
          name: string
          pathway_code: string
          pathway_key: string
          plain_name: string
          professional_only: boolean
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
          version: string
        }
        Insert: {
          categories?: string[]
          completion_requirements?: string[]
          created_at?: string
          description?: string | null
          id?: string
          name: string
          pathway_code: string
          pathway_key: string
          plain_name: string
          professional_only?: boolean
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
          version?: string
        }
        Update: {
          categories?: string[]
          completion_requirements?: string[]
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          pathway_code?: string
          pathway_key?: string
          plain_name?: string
          professional_only?: boolean
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
          version?: string
        }
        Relationships: []
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
      treatment_stages: {
        Row: {
          actionable: boolean
          applicable_categories: string[]
          applicable_components: string[]
          created_at: string
          evidence_requirement: string
          exit_conditions: string[]
          id: string
          name: string
          next_allowed_stages: number[]
          plain_name: string
          prohibited_conditions: string[]
          purpose: string | null
          required_equipment: string[]
          required_inputs: string[]
          required_inspection: boolean
          required_ppe: string[]
          required_preconditions: string[]
          required_roles: string[]
          required_training: string[]
          stage_code: string
          stage_key: string
          stage_number: number
          status: Database["public"]["Enums"]["content_status"]
          stop_conditions: string[]
          technical_description: string
          updated_at: string
          version: string
        }
        Insert: {
          actionable?: boolean
          applicable_categories?: string[]
          applicable_components?: string[]
          created_at?: string
          evidence_requirement?: string
          exit_conditions?: string[]
          id?: string
          name: string
          next_allowed_stages?: number[]
          plain_name: string
          prohibited_conditions?: string[]
          purpose?: string | null
          required_equipment?: string[]
          required_inputs?: string[]
          required_inspection?: boolean
          required_ppe?: string[]
          required_preconditions?: string[]
          required_roles?: string[]
          required_training?: string[]
          stage_code: string
          stage_key: string
          stage_number: number
          status?: Database["public"]["Enums"]["content_status"]
          stop_conditions?: string[]
          technical_description: string
          updated_at?: string
          version?: string
        }
        Update: {
          actionable?: boolean
          applicable_categories?: string[]
          applicable_components?: string[]
          created_at?: string
          evidence_requirement?: string
          exit_conditions?: string[]
          id?: string
          name?: string
          next_allowed_stages?: number[]
          plain_name?: string
          prohibited_conditions?: string[]
          purpose?: string | null
          required_equipment?: string[]
          required_inputs?: string[]
          required_inspection?: boolean
          required_ppe?: string[]
          required_preconditions?: string[]
          required_roles?: string[]
          required_training?: string[]
          stage_code?: string
          stage_key?: string
          stage_number?: number
          status?: Database["public"]["Enums"]["content_status"]
          stop_conditions?: string[]
          technical_description?: string
          updated_at?: string
          version?: string
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
      can_publish_content: { Args: { _user_id: string }; Returns: boolean }
      ensure_default_role: { Args: never; Returns: undefined }
      has_active_access: { Args: { _user_id: string }; Returns: boolean }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_content_maintainer: { Args: { _user_id: string }; Returns: boolean }
      is_platform_admin: { Args: { _user_id: string }; Returns: boolean }
      search_stains: {
        Args: { lim?: number; off?: number; q: string }
        Returns: {
          biological_risk: boolean
          canonical_name: string
          category_name: string
          category_slug: string
          chemical_risk: boolean
          damage_suspected: boolean
          fire_risk: boolean
          hidden_test_required: boolean
          id: string
          initial_outcome_class: string
          mandatory_stop_or_reroute_trigger: string
          match_rank: number
          primary_category_id: string
          reroute_pending: boolean
          stable_id: string
          total_count: number
          typical_chemistry: string
        }[]
      }
      stain_category_counts: {
        Args: never
        Returns: {
          category_id: string
          record_count: number
        }[]
      }
      stain_norm: { Args: { t: string }; Returns: string }
      stain_stem: { Args: { tok: string }; Returns: string }
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
        | "owner"
        | "administrator"
        | "content_editor"
        | "translator"
        | "auditor"
        | "support"
      assessment_photo_kind:
        | "fibre_composition_label"
        | "care_symbol_label"
        | "garment_front"
        | "garment_back"
        | "existing_damage"
        | "stain_area"
        | "professional_test"
      assessment_state: "in_progress" | "completed" | "abandoned"
      classification_evidence:
        | "manufacturer_documented"
        | "recognized_technical_reference"
        | "internal_trial_verified"
        | "professional_consensus"
        | "user_reported_source"
        | "ai_suggested"
        | "inferred"
        | "insufficient_information"
      classification_tag_kind: "condition" | "risk"
      component_relevance: "primary" | "major" | "minor" | "possible"
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
      readiness_status:
        | "ready_for_classification"
        | "more_information_required"
        | "compatibility_test_required"
        | "professional_only"
        | "specialist_referral_required"
        | "blocked_previous_chemical"
        | "blocked_existing_damage"
        | "blocked_possible_hazard"
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
        "owner",
        "administrator",
        "content_editor",
        "translator",
        "auditor",
        "support",
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
      classification_evidence: [
        "manufacturer_documented",
        "recognized_technical_reference",
        "internal_trial_verified",
        "professional_consensus",
        "user_reported_source",
        "ai_suggested",
        "inferred",
        "insufficient_information",
      ],
      classification_tag_kind: ["condition", "risk"],
      component_relevance: ["primary", "major", "minor", "possible"],
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
      readiness_status: [
        "ready_for_classification",
        "more_information_required",
        "compatibility_test_required",
        "professional_only",
        "specialist_referral_required",
        "blocked_previous_chemical",
        "blocked_existing_damage",
        "blocked_possible_hazard",
      ],
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
