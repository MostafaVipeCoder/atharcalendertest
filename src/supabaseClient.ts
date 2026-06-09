/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from "@supabase/supabase-js";

// استخدام الحساب الوحيد المتوفر في ملف .env
// @ts-ignore
const env = import.meta.env;
// التبديل للأسماء القياسية التي غالباً ما يتم حقنها تلقائياً أو التعرف عليها بشكل أفضل
const supabaseUrl = env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL_2 || "";
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY_2 || "";

console.log("Supabase URL present:", !!supabaseUrl);
console.log("Supabase Key present:", !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("CRITICAL: Supabase environment variables are missing from import.meta.env.");
}

const createSafeClient = (url: string, key: string) => {
  if (!url || !key || url.trim() === "" || key.trim() === "") {
    return null;
  }
  const cleanUrl = url.replace(/['"]+/g, '').trim();
  const cleanKey = key.replace(/['"]+/g, '').trim();
  return createClient(cleanUrl, cleanKey);
};

export const supabase = createSafeClient(supabaseUrl, supabaseAnonKey);
