import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "../supabase/config";
import { createClient } from "../supabase/server";
import type { StrategySummary, StrategyStatus } from "../marketing-strategy/types";

export type DashboardPost = { id: string; title: string | null; caption: string | null; platform: string; status: string; created_at: string };
export type DashboardWorkspace = {
  configured: boolean; userName: string | null; userEmail: string | null;
  business: { id: string; name: string; industry: string | null; city: string | null; description: string | null } | null;
  brand: { tone: string | null; primary_color: string | null; language_preferences: string[] } | null;
  preferences: { platforms: string[]; content_goals: string[]; target_audience: string | null; posts_per_week: number } | null;
  recentPosts: DashboardPost[]; postCount: number; readyCount: number; latestStrategy: StrategySummary | null;
};
const previewWorkspace: DashboardWorkspace = { configured:false,userName:"DigiSprint owner",userEmail:null,business:{id:"preview",name:"Your business",industry:"Small business",city:"India",description:"Your business context will appear here after setup."},brand:{tone:"Friendly",primary_color:"#6366F1",language_preferences:["en"]},preferences:{platforms:["instagram"],content_goals:["visibility"],target_audience:"Your ideal local customers",posts_per_week:3},recentPosts:[],postCount:0,readyCount:0,latestStrategy:null };

export async function loadDashboard(): Promise<DashboardWorkspace> {
  if (!isSupabaseConfigured()) return previewWorkspace;
  const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login?next=/dashboard");
  const {
  data: membership,
  error: membershipError,
} = await supabase
.from("business_members").select("business_id").eq("user_id",user.id).eq("is_active",true).limit(1).maybeSingle();console.log("[Dashboard Membership]", {
  hasMembership: !!membership,
  errorCode: membershipError?.code ?? null,
  errorMessage: membershipError?.message ?? null,
  userId: user.id.slice(-8),
});if(!membership)redirect("/setup");
  const businessId=membership.business_id;
  const [businessResult,brandResult,preferencesResult,postsResult,countResult,readyResult,strategyResult,strategyCount]=await Promise.all([
    supabase.from("businesses").select("id, name, industry, city, description").eq("id",businessId).single(),
    supabase.from("brand_kits").select("tone, primary_color, language_preferences").eq("business_id",businessId).maybeSingle(),
    supabase.from("content_preferences").select("platforms, content_goals, target_audience, posts_per_week").eq("business_id",businessId).maybeSingle(),
    supabase.from("posts").select("id, title, caption, platform, status, created_at").eq("business_id",businessId).order("created_at",{ascending:false}).limit(5),
    supabase.from("posts").select("id",{count:"exact",head:true}).eq("business_id",businessId),
    supabase.from("posts").select("id",{count:"exact",head:true}).eq("business_id",businessId).eq("status","ready"),
    supabase.from("generated_content").select("id,title,status,prompt_version,language,created_at,structured_content").eq("business_id",businessId).eq("content_type","marketing_strategy").order("created_at",{ascending:false}).limit(1).maybeSingle(),
    supabase.from("generated_content").select("id",{count:"exact",head:true}).eq("business_id",businessId).eq("content_type","marketing_strategy"),
  ]);
  if(businessResult.error||!businessResult.data)throw new Error("Unable to load the business workspace.");
  const latest=strategyResult.data;const structured=latest?.structured_content as {title?:unknown}|null;
  return {configured:true,userName:typeof user.user_metadata.full_name==="string"?user.user_metadata.full_name:null,userEmail:user.email??null,business:businessResult.data,brand:brandResult.data,preferences:preferencesResult.data,recentPosts:postsResult.data??[],postCount:countResult.count??0,readyCount:readyResult.count??0,latestStrategy:latest?{id:latest.id,title:typeof structured?.title==="string"?structured.title:latest.title,status:latest.status as StrategyStatus,promptVersion:latest.prompt_version,language:latest.language,createdAt:latest.created_at,version:strategyCount.count??1}:null};
}
