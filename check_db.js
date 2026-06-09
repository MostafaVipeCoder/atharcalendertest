
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL_2?.replace(/['"]+/g, '');
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY_2?.replace(/['"]+/g, '');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data: projects, error: pError } = await supabase.from('projects').select('*');
  console.log("Projects in DB:", projects ? projects.length : 0);
  if (pError) console.error("Projects Error:", pError);

  const { data: schedules, error: sError } = await supabase.from('project_schedules').select('*');
  console.log("Schedules in DB:", schedules ? schedules.length : 0);
  if (sError) console.error("Schedules Error:", sError);
}

check();
