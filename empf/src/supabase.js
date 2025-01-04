import { createClient } from "@supabase/supabase-js";

const supabase = createClient("https://pwalbqiyygrtctbapzwk.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3YWxicWl5eWdydGN0YmFwendrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQxMzkyNzAsImV4cCI6MjA0OTcxNTI3MH0.2Ba9zwt01qpwnOFC6is_Yif2IJkU-Ma2TuxzOCKzrjo");


export default supabase;