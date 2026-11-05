// Generated from the gym-tracker Supabase schema (public). Regenerate after migrations.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      exercises: {
        Row: {
          created_at: string;
          exercise_type: string;
          id: string;
          image_path: string | null;
          image_url: string | null;
          name: string;
        };
        Insert: {
          created_at?: string;
          exercise_type: string;
          id?: string;
          image_path?: string | null;
          image_url?: string | null;
          name: string;
        };
        Update: {
          created_at?: string;
          exercise_type?: string;
          id?: string;
          image_path?: string | null;
          image_url?: string | null;
          name?: string;
        };
        Relationships: [];
      };
      personal_records: {
        Row: {
          achieved_date: string;
          best_weight_kg: number;
          created_at: string;
          exercise_id: string | null;
          exercise_name: string;
          id: string;
          notes: string | null;
          previous_best_kg: number | null;
          reps: number;
          user_id: string | null;
          workout_id: string | null;
        };
        Insert: {
          achieved_date: string;
          best_weight_kg: number;
          created_at?: string;
          exercise_id?: string | null;
          exercise_name: string;
          id?: string;
          notes?: string | null;
          previous_best_kg?: number | null;
          reps: number;
          user_id?: string | null;
          workout_id?: string | null;
        };
        Update: {
          achieved_date?: string;
          best_weight_kg?: number;
          created_at?: string;
          exercise_id?: string | null;
          exercise_name?: string;
          id?: string;
          notes?: string | null;
          previous_best_kg?: number | null;
          reps?: number;
          user_id?: string | null;
          workout_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "personal_records_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "personal_records_workout_id_fkey";
            columns: ["workout_id"];
            isOneToOne: true;
            referencedRelation: "workouts";
            referencedColumns: ["id"];
          },
        ];
      };
      workout_sessions: {
        Row: {
          created_at: string;
          duration_seconds: number | null;
          ended_at: string | null;
          exercise_id: string;
          id: string;
          notes: string | null;
          planned_sets: Json | null;
          session_type: string;
          started_at: string;
          status: string;
          target_distance_km: number | null;
          target_duration_seconds: number | null;
          user_id: string;
          workout_date: string;
        };
        Insert: {
          created_at?: string;
          duration_seconds?: number | null;
          ended_at?: string | null;
          exercise_id: string;
          id?: string;
          notes?: string | null;
          planned_sets?: Json | null;
          session_type: string;
          started_at: string;
          status?: string;
          target_distance_km?: number | null;
          target_duration_seconds?: number | null;
          user_id?: string;
          workout_date: string;
        };
        Update: {
          created_at?: string;
          duration_seconds?: number | null;
          ended_at?: string | null;
          exercise_id?: string;
          id?: string;
          notes?: string | null;
          planned_sets?: Json | null;
          session_type?: string;
          started_at?: string;
          status?: string;
          target_distance_km?: number | null;
          target_duration_seconds?: number | null;
          user_id?: string;
          workout_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workout_sessions_exercise_fk";
            columns: ["exercise_id", "session_type"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id", "exercise_type"];
          },
        ];
      };
      workouts: {
        Row: {
          created_at: string;
          distance_km: number | null;
          duration_minutes: number | null;
          effort_level: number | null;
          exercise_id: string | null;
          exercise_name: string;
          exercise_type: string;
          id: string;
          notes: string | null;
          reps: number | null;
          session_id: string | null;
          set_number: number | null;
          user_id: string;
          weight_kg: number | null;
          workout_date: string;
        };
        Insert: {
          created_at?: string;
          distance_km?: number | null;
          duration_minutes?: number | null;
          effort_level?: number | null;
          exercise_id?: string | null;
          exercise_name: string;
          exercise_type: string;
          id?: string;
          notes?: string | null;
          reps?: number | null;
          session_id?: string | null;
          set_number?: number | null;
          user_id?: string | null;
          weight_kg?: number | null;
          workout_date?: string;
        };
        Update: {
          created_at?: string;
          distance_km?: number | null;
          duration_minutes?: number | null;
          effort_level?: number | null;
          exercise_id?: string | null;
          exercise_name?: string;
          exercise_type?: string;
          id?: string;
          notes?: string | null;
          reps?: number | null;
          session_id?: string | null;
          set_number?: number | null;
          user_id?: string | null;
          weight_kg?: number | null;
          workout_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workouts_exercise_fk";
            columns: ["exercise_id", "exercise_type"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id", "exercise_type"];
          },
          {
            foreignKeyName: "workouts_session_fk";
            columns: ["session_id", "exercise_type"];
            isOneToOne: false;
            referencedRelation: "workout_sessions";
            referencedColumns: ["id", "session_type"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicTables = Database["public"]["Tables"];

export type Tables<T extends keyof PublicTables> = PublicTables[T]["Row"];
export type TablesInsert<T extends keyof PublicTables> = PublicTables[T]["Insert"];
export type TablesUpdate<T extends keyof PublicTables> = PublicTables[T]["Update"];
