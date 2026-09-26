import { getSupabaseClient } from '../lib/supabase';

export interface FarmerProfile {
  id: string;
  user_id: string;
  full_name: string;
  mobile_number: string;
  state: string;
  district: string;
  village: string;
  preferred_language: string;
  created_at?: string;
  updated_at?: string;
}

export interface FarmDetails {
  id: string;
  farmer_id: string;
  farm_name?: string;
  land_area: number;
  land_area_unit: string;
  village?: string;
  district?: string;
  state?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FarmerCrop {
  id: string;
  farmer_id: string;
  farm_id?: string | null;
  crop_name: string;
  variety?: string | null;
  sowing_date?: string | null;
  area?: number | null;
  area_unit?: string | null;
  season?: string | null;
  irrigation_type?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface InitialCropInput {
  crop_name: string;
  variety?: string;
  area?: number;
  area_unit?: string;
  season?: string;
  irrigation_type?: string;
}

export interface FarmerRegistrationInput {
  full_name: string;
  mobile_number: string;
  pin: string; // 4-6 digit PIN for simple mobile authentication
  state: string;
  district: string;
  village: string;
  preferred_language: string;
  main_crop: string;
  land_area: number;
  land_area_unit: string;
  additional_crops?: InitialCropInput[];
}

export interface FarmerAIContext {
  farmer: {
    name: string;
    state: string;
    district: string;
    village: string;
    preferred_language: string;
  };
  farm: {
    land_area: number;
    land_area_unit: string;
  };
  crops: Array<{
    crop_name: string;
    variety?: string | null;
    sowing_date?: string | null;
    area?: number | null;
    area_unit?: string | null;
    season?: string | null;
    irrigation_type?: string | null;
  }>;
}

// Session keys for active authenticated farmer
const ACTIVE_FARMER_KEY = 'kfhh_active_farmer_cache';

// Helper to normalize mobile email alias for Supabase Auth
export function mobileToAuthEmail(mobile: string): string {
  const digits = mobile.replace(/\D/g, '');
  return `farmer_${digits || 'default'}@farmer.kfhh.local`;
}

// -------------------------------------------------------------
// 1. Authentication & Session Management
// -------------------------------------------------------------

export async function getCurrentAuthUser() {
  const supabase = getSupabaseClient();
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.user) {
      return sessionData.session.user;
    }
  } catch {
    // Ignore session retrieval error
  }

  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return null;
    }
    return data.user;
  } catch {
    return null;
  }
}

export async function loginFarmer(mobileNumber: string, pin: string): Promise<{
  success: boolean;
  profile?: FarmerProfile;
  error?: string;
}> {
  const cleanMobile = mobileNumber.replace(/\D/g, '');
  if (!cleanMobile || cleanMobile.length < 10) {
    return { success: false, error: 'Please enter a valid 10-digit mobile number' };
  }
  if (!pin || pin.length < 4) {
    return { success: false, error: 'Please enter your 4-digit security PIN' };
  }

  const supabase = getSupabaseClient();
  const email = mobileToAuthEmail(cleanMobile);
  const password = `Farmer#${pin}#${cleanMobile.slice(-4)}`;

  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return { success: false, error: authError.message || 'Invalid mobile number or PIN' };
    }

    if (!authData.user) {
      return { success: false, error: 'Failed to authenticate user session' };
    }

    // Fetch farmer profile from Supabase
    const { data: profile, error: profError } = await supabase
      .from('farmer_profiles')
      .select('*')
      .eq('user_id', authData.user.id)
      .single();

    if (profError || !profile) {
      return {
        success: false,
        error: 'No farmer profile found for this mobile number. Please register first.',
      };
    }

    // Cache active session
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(ACTIVE_FARMER_KEY, JSON.stringify(profile));
    }

    return { success: true, profile };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Login failed. Please check your connection.' };
  }
}

export async function logoutFarmer(): Promise<void> {
  const supabase = getSupabaseClient();
  try {
    await supabase.auth.signOut();
  } catch {
    // Ignore sign out errors
  }
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(ACTIVE_FARMER_KEY);
  }
}

// -------------------------------------------------------------
// 2. Farmer Registration Flow
// -------------------------------------------------------------

export async function registerFarmer(input: FarmerRegistrationInput): Promise<{
  success: boolean;
  profile?: FarmerProfile;
  error?: string;
}> {
  const cleanMobile = input.mobile_number.replace(/\D/g, '');
  if (!cleanMobile || cleanMobile.length < 10) {
    return { success: false, error: 'Please enter a valid 10-digit mobile number' };
  }
  if (!input.full_name.trim()) {
    return { success: false, error: 'Full name is required' };
  }
  if (!input.state.trim() || !input.district.trim() || !input.village.trim()) {
    return { success: false, error: 'State, District, and Village are required' };
  }
  if (!input.main_crop.trim()) {
    return { success: false, error: 'Please enter or select your main crop' };
  }

  const supabase = getSupabaseClient();
  const email = mobileToAuthEmail(cleanMobile);
  const pin = input.pin && input.pin.length >= 4 ? input.pin : '1234';
  const password = `Farmer#${pin}#${cleanMobile.slice(-4)}`;

  try {
    // 1. Create or Sign In Supabase Auth Account
    let userId: string | null = null;

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: input.full_name.trim(),
          mobile_number: cleanMobile,
        },
      },
    });

    if (signUpError) {
      // If user already registered, sign them in
      if (signUpError.message?.toLowerCase().includes('already registered')) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          return {
            success: false,
            error: 'This mobile number is already registered with another PIN. Please use Login.',
          };
        }
        userId = signInData.user?.id || null;
      } else {
        return { success: false, error: signUpError.message };
      }
    } else {
      userId = signUpData.user?.id || null;
    }

    if (!userId) {
      return { success: false, error: 'Could not create authenticated user session' };
    }

    // 2. Upsert farmer_profiles
    const profilePayload = {
      user_id: userId,
      full_name: input.full_name.trim(),
      mobile_number: cleanMobile,
      state: input.state.trim(),
      district: input.district.trim(),
      village: input.village.trim(),
      preferred_language: input.preferred_language || 'en',
      updated_at: new Date().toISOString(),
    };

    const { data: profileData, error: profileError } = await supabase
      .from('farmer_profiles')
      .upsert(profilePayload, { onConflict: 'user_id' })
      .select()
      .single();

    if (profileError || !profileData) {
      throw new Error(`Failed to save farmer profile: ${profileError?.message || 'Database error'}`);
    }

    const farmerId = profileData.id;

    // 3. Create or Update farms
    const farmPayload = {
      farmer_id: farmerId,
      farm_name: `${input.full_name.trim()}'s Farm`,
      land_area: Number(input.land_area) || 1,
      land_area_unit: input.land_area_unit || 'Acres',
      village: input.village.trim(),
      district: input.district.trim(),
      state: input.state.trim(),
      updated_at: new Date().toISOString(),
    };

    const { data: farmData, error: farmError } = await supabase
      .from('farms')
      .insert([farmPayload])
      .select()
      .single();

    if (farmError && !farmError.message?.includes('already exists')) {
      console.warn('Farm creation notice:', farmError.message);
    }

    const farmId = farmData?.id || null;

    // 4. Create farmer_crops
    const allCropsToInsert = [
      {
        farmer_id: farmerId,
        farm_id: farmId,
        crop_name: input.main_crop.trim(),
        variety: 'Desi / Improved',
        area: Number(input.land_area) || 1,
        area_unit: input.land_area_unit || 'Acres',
        season: 'Kharif',
        irrigation_type: 'Borewell / Canal',
        sowing_date: new Date().toISOString().split('T')[0],
      },
    ];

    if (input.additional_crops && input.additional_crops.length > 0) {
      for (const extra of input.additional_crops) {
        if (extra.crop_name && extra.crop_name.trim()) {
          allCropsToInsert.push({
            farmer_id: farmerId,
            farm_id: farmId,
            crop_name: extra.crop_name.trim(),
            variety: extra.variety?.trim() || null,
            area: Number(extra.area) || 1,
            area_unit: extra.area_unit || input.land_area_unit || 'Acres',
            season: extra.season || 'Rabi',
            irrigation_type: extra.irrigation_type || 'Drip / Rainfed',
            sowing_date: new Date().toISOString().split('T')[0],
          });
        }
      }
    }

    const { error: cropsError } = await supabase
      .from('farmer_crops')
      .insert(allCropsToInsert);

    if (cropsError) {
      console.warn('Crop insert notice:', cropsError.message);
    }

    // Cache active session
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(ACTIVE_FARMER_KEY, JSON.stringify(profileData));
    }

    return { success: true, profile: profileData };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Registration failed' };
  }
}

// -------------------------------------------------------------
// 3. Data-Access Layer: Queries
// -------------------------------------------------------------

export async function getCurrentFarmerProfile(): Promise<FarmerProfile | null> {
  const supabase = getSupabaseClient();
  const user = await getCurrentAuthUser();
  if (!user) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('farmer_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.debug('Supabase profile query notice:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    return null;
  }
}

export async function getCurrentFarmerFarm(farmerId: string): Promise<FarmDetails | null> {
  if (!farmerId) return null;
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('farms')
      .select('*')
      .eq('farmer_id', farmerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.debug('Supabase farm query notice:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    return null;
  }
}

export async function getCurrentFarmerCrops(farmerId: string): Promise<FarmerCrop[]> {
  if (!farmerId) return [];
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('farmer_crops')
      .select('*')
      .eq('farmer_id', farmerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.debug('Supabase crops query notice:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    return [];
  }
}

// -------------------------------------------------------------
// 4. Data-Access Layer: Crop Operations (Add, Edit, Delete)
// -------------------------------------------------------------

export async function addCrop(crop: {
  farmer_id: string;
  farm_id?: string | null;
  crop_name: string;
  variety?: string;
  area?: number;
  area_unit?: string;
  season?: string;
  irrigation_type?: string;
  sowing_date?: string;
}): Promise<{ success: boolean; data?: FarmerCrop; error?: string }> {
  if (!crop.farmer_id || !crop.crop_name.trim()) {
    return { success: false, error: 'Crop name and Farmer ID are required' };
  }

  const supabase = getSupabaseClient();
  try {
    const { data, error } = await supabase
      .from('farmer_crops')
      .insert([
        {
          farmer_id: crop.farmer_id,
          farm_id: crop.farm_id || null,
          crop_name: crop.crop_name.trim(),
          variety: crop.variety?.trim() || null,
          area: Number(crop.area) || null,
          area_unit: crop.area_unit || 'Acres',
          season: crop.season || 'Kharif',
          irrigation_type: crop.irrigation_type || 'Borewell / Canal',
          sowing_date: crop.sowing_date || new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to add crop' };
  }
}

export async function updateCrop(
  cropId: string,
  updates: Partial<FarmerCrop>
): Promise<{ success: boolean; error?: string }> {
  if (!cropId) return { success: false, error: 'Crop ID is required' };
  const supabase = getSupabaseClient();

  try {
    const { error } = await supabase
      .from('farmer_crops')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cropId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update crop' };
  }
}

export async function deleteCrop(cropId: string): Promise<{ success: boolean; error?: string }> {
  if (!cropId) return { success: false, error: 'Crop ID is required' };
  const supabase = getSupabaseClient();

  try {
    const { error } = await supabase.from('farmer_crops').delete().eq('id', cropId);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete crop' };
  }
}

export async function updateFarmerProfile(
  farmerId: string,
  updates: Partial<FarmerProfile>
): Promise<{ success: boolean; error?: string }> {
  if (!farmerId) return { success: false, error: 'Farmer ID is required' };
  const supabase = getSupabaseClient();

  try {
    const { error } = await supabase
      .from('farmer_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', farmerId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update profile' };
  }
}

export async function updateFarm(
  farmId: string,
  updates: Partial<FarmDetails>
): Promise<{ success: boolean; error?: string }> {
  if (!farmId) return { success: false, error: 'Farm ID is required' };
  const supabase = getSupabaseClient();

  try {
    const { error } = await supabase
      .from('farms')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', farmId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update farm' };
  }
}

// -------------------------------------------------------------
// 5. Ask Farmer AI Context Builder
// Strictly implements Minimum Necessary Farmer Information
// -------------------------------------------------------------

export async function buildFarmerAIContext(question?: string): Promise<FarmerAIContext | null> {
  const profile = await getCurrentFarmerProfile();
  if (!profile) {
    return null;
  }

  const [farm, crops] = await Promise.all([
    getCurrentFarmerFarm(profile.id),
    getCurrentFarmerCrops(profile.id),
  ]);

  // Prioritize crop if explicitly mentioned in the question (Requirement 15)
  const sortedCrops = [...crops];
  if (question && question.trim()) {
    const qLower = question.toLowerCase();
    sortedCrops.sort((a, b) => {
      const aName = a.crop_name.toLowerCase();
      const bName = b.crop_name.toLowerCase();
      const aMatches = qLower.includes(aName) ? 1 : 0;
      const bMatches = qLower.includes(bName) ? 1 : 0;
      return bMatches - aMatches;
    });
  }

  // Build clean, privacy-conscious context
  return {
    farmer: {
      name: profile.full_name,
      state: profile.state,
      district: profile.district,
      village: profile.village,
      preferred_language: profile.preferred_language || 'en',
    },
    farm: {
      land_area: farm ? farm.land_area : 0,
      land_area_unit: farm ? farm.land_area_unit : 'Acres',
    },
    crops: sortedCrops.map((c) => ({
      crop_name: c.crop_name,
      variety: c.variety,
      sowing_date: c.sowing_date,
      area: c.area,
      area_unit: c.area_unit,
      season: c.season,
      irrigation_type: c.irrigation_type,
    })),
  };
}
