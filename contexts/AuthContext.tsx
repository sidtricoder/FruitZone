import { createContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient'; // Import Supabase client
import { Session, User as SupabaseUser } from '@supabase/supabase-js'; // Import Supabase types

// Updated User interface to include profile fields
export interface User {
  id: string; // Will store the INT8 ID from 'users' table as a string
  mobile_number?: string;
  email?: string; // Added email field
  is_verified: boolean;
  full_name?: string;
  default_street_address_line_1?: string;
  default_street_address_line_2?: string | null;
  default_city?: string;
  default_state_province_region?: string;
  default_postal_code?: string;
  default_country?: string;
  app_metadata?: Record<string, any>;
  user_metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null; // Supabase session object
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (mobileNumber: string, otp: string) => Promise<void>; 
  requestOtp: (mobileNumber: string) => Promise<void>;
  logout: () => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>; // Expose setUser
  USE_MOCK_AUTH: boolean; // Expose USE_MOCK_AUTH
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// MOCK IMPLEMENTATION FLAG - Set to true to use mock auth, false for real Supabase auth
const USE_MOCK_AUTH = true;

// Removed MOCK_USER_FALLBACK_UUID

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // mockOtpStorage is removed as OTPs will be stored in the DB for mock flow

  useEffect(() => {
    const loadMockSession = async () => {
      setIsLoading(true);
      try {
        const mockSessionData = localStorage.getItem('mockSession');
        const mockUserData = localStorage.getItem('mockUser');

        if (mockSessionData && mockUserData) {
          const storedUser: User = JSON.parse(mockUserData);
          if (storedUser.mobile_number) {
            const dbCompatibleMobileNumber = storedUser.mobile_number.slice(-10);
            // Select all relevant fields from the mock 'users' table
            const { data: dbUser, error: dbError } = await supabase
              .from('users')
              .select('*, email, full_name, default_street_address_line_1, default_street_address_line_2, default_city, default_state_province_region, default_postal_code, default_country, updated_at') // Added email to select
              .eq('mobile_number', dbCompatibleMobileNumber)
              .single();

            if (dbError && dbError.code !== 'PGRST116') {
              console.error("[MOCK AUTH] Error fetching user during session load:", dbError);
            }

            if (dbUser && dbUser.is_verified) {
              let originalDbId = dbUser.id;
              if (typeof originalDbId === 'number') {
                originalDbId = String(originalDbId);
              }

              // UUID check and fallback removed. User ID is now the string representation of INT8.
              const effectiveUserId = originalDbId;

              const contextUser: User = {
                id: effectiveUserId,
                mobile_number: dbUser.mobile_number, // This will be the 10-digit number from DB
                email: dbUser.email, // Added email
                is_verified: dbUser.is_verified,
                full_name: dbUser.full_name,
                default_street_address_line_1: dbUser.default_street_address_line_1,
                default_street_address_line_2: dbUser.default_street_address_line_2,
                default_city: dbUser.default_city,
                default_state_province_region: dbUser.default_state_province_region,
                default_postal_code: dbUser.default_postal_code,
                default_country: dbUser.default_country,
                app_metadata: dbUser.app_metadata || { provider: 'phone', providers: ['phone'] },
                user_metadata: dbUser.user_metadata || {},
                created_at: dbUser.created_at,
                updated_at: dbUser.updated_at,
              };
              setUser(contextUser);
              
              const currentSession: Session = JSON.parse(mockSessionData);
              const supabaseStyleUser: SupabaseUser = {
                id: effectiveUserId, // Use effectiveUserId (string representation of INT8)
                aud: 'authenticated',
                role: 'authenticated',
                email: dbUser.email, // Added email
                phone: dbUser.mobile_number, 
                created_at: dbUser.created_at || new Date().toISOString(),
                updated_at: dbUser.updated_at || new Date().toISOString(), // from users table
                app_metadata: dbUser.app_metadata || { provider: 'phone', providers: ['phone'] },
                user_metadata: { ...dbUser.user_metadata, ...{ // Merge profile data into user_metadata for SupabaseUser object for closer resemblance
                  full_name: dbUser.full_name,
                  default_street_address_line_1: dbUser.default_street_address_line_1,
                  default_street_address_line_2: dbUser.default_street_address_line_2,
                  default_city: dbUser.default_city,
                  default_state_province_region: dbUser.default_state_province_region,
                  default_postal_code: dbUser.default_postal_code,
                  default_country: dbUser.default_country,
                }},
                identities: [{
                  id: effectiveUserId, // Use effectiveUserId
                  user_id: effectiveUserId, // Use effectiveUserId
                  identity_id: effectiveUserId, // Use effectiveUserId
                  identity_data: { sub: effectiveUserId, phone: dbUser.mobile_number },
                  provider: 'phone',
                  last_sign_in_at: dbUser.last_sign_in_at || new Date().toISOString(),
                  created_at: dbUser.created_at || new Date().toISOString(),
                  updated_at: dbUser.updated_at || new Date().toISOString(),
                }],
              };
              currentSession.user = supabaseStyleUser;
              setSession(currentSession);

            } else {
              // User not verified in DB, not found, or error occurred
              localStorage.removeItem('mockUser');
              localStorage.removeItem('mockSession');
              setUser(null);
              setSession(null);
            }
          } else {
            // Stored user has no mobile number, invalidate
            localStorage.removeItem('mockUser');
            localStorage.removeItem('mockSession');
            setUser(null);
            setSession(null);
          }
        }
      } catch (e) {
        console.error("[MOCK AUTH] Error in loadMockSession:", e);
        localStorage.removeItem('mockUser');
        localStorage.removeItem('mockSession');
        setUser(null);
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (USE_MOCK_AUTH) {
      loadMockSession();
      // No Supabase auth listener needed for mock auth
      return;
    }

    // Real Supabase auth logic
    let isMounted = true;
    setIsLoading(true);

    const fetchAndSetUserWithProfile = async (supabaseAuthUser: SupabaseUser | null | undefined) => {
      if (!isMounted) return;

      if (supabaseAuthUser) {
        let profileData: Partial<User> = {};
        try {
          const { data, error } = await supabase
            .from('profiles') // Assumes 'profiles' table for real user profiles
            .select('email, full_name, default_street_address_line_1, default_street_address_line_2, default_city, default_state_province_region, default_postal_code, default_country, updated_at') // Added email to select
            .eq('id', supabaseAuthUser.id) // Linked by Supabase Auth User ID (UUID)
            .single();

          if (error && error.code !== 'PGRST116') { // PGRST116 means no row found, which is fine.
            console.error('Error fetching real user profile:', error);
          }
          if (data) {
            profileData = data;
          }
        } catch (e) {
            console.error("Exception fetching real user profile:", e);
        }
        
        if (isMounted) {
            setUser({
              id: supabaseAuthUser.id,
              mobile_number: supabaseAuthUser.phone,
              email: profileData.email || supabaseAuthUser.email, // Added email
              is_verified: !!supabaseAuthUser.phone_confirmed_at || !!supabaseAuthUser.email_confirmed_at,
              full_name: profileData.full_name || supabaseAuthUser.user_metadata?.full_name,
              default_street_address_line_1: profileData.default_street_address_line_1,
              default_street_address_line_2: profileData.default_street_address_line_2,
              default_city: profileData.default_city,
              default_state_province_region: profileData.default_state_province_region,
              default_postal_code: profileData.default_postal_code,
              default_country: profileData.default_country,
              app_metadata: supabaseAuthUser.app_metadata,
              user_metadata: supabaseAuthUser.user_metadata, // Keep original user_metadata
              created_at: supabaseAuthUser.created_at,
              updated_at: profileData.updated_at || supabaseAuthUser.updated_at,
            });
        }
      } else {
        if (isMounted) setUser(null);
      }
      if (isMounted) setIsLoading(false);
    };

    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      if (isMounted) {
        setSession(currentSession);
        // setIsLoading(true) is already set at the beginning of this block
        await fetchAndSetUserWithProfile(currentSession?.user);
      }
    }).catch(error => {
        console.error("Error in getSession:", error);
        if(isMounted) setIsLoading(false);
    });

    const {
      data: { subscription: authListener },
    } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        if (isMounted) {
          setSession(currentSession);
          setIsLoading(true); // Set loading true before async profile fetch
          await fetchAndSetUserWithProfile(currentSession?.user);
        }
      }
    );

    return () => {
      isMounted = false;
      authListener?.unsubscribe();
    };
  }, []); // KEEP DEPS ARRAY EMPTY: This effect should run once on mount.

  const requestOtp = async (mobileNumber: string) => {
    setIsLoading(true);
    try {
      if (USE_MOCK_AUTH) {
        const dbCompatibleMobileNumber = mobileNumber.slice(-10); // Extract last 10 digits for DB operations

        const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiryTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

        console.log(`[MOCK AUTH] OTP for ${mobileNumber} (DB: ${dbCompatibleMobileNumber}): ${generatedOtp} (Expires: ${expiryTime.toLocaleTimeString()})`);

        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('id') // Check existence
          .eq('mobile_number', dbCompatibleMobileNumber) // Use 10-digit number for query
          .single();

        // PGRST116: "Searched for a single row, but 0 rows were found" - this is not an error for our check
        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('[MOCK AUTH] Error fetching user:', fetchError);
          throw fetchError;
        }

        const userData = {
          mobile_number: dbCompatibleMobileNumber, // Save 10-digit number to DB
          otp: generatedOtp,
          otp_expires_at: expiryTime.toISOString(),
          is_verified: false,
          updated_at: new Date().toISOString(),
        };

        if (existingUser) {
          // User exists, update OTP and other relevant fields
          const { error: updateError } = await supabase
            .from('users')
            .update(userData) // userData does not include app_metadata or user_metadata
            .eq('mobile_number', dbCompatibleMobileNumber); // Use 10-digit number for matching

          if (updateError) {
            console.error('[MOCK AUTH] Error updating OTP for existing user:', updateError);
            throw updateError;
          }
          console.log(`[MOCK AUTH] OTP updated for existing user ${mobileNumber}`);
        } else {
          // User does not exist, insert new user
          const newUserPayload = {
            ...userData,
            created_at: new Date().toISOString(), // Set created_at only for new users
            // Removed app_metadata and user_metadata as they might not exist in the DB schema
            // id will be auto-generated by Supabase if setup correctly (e.g., UUID default)
          };
          const { error: insertError } = await supabase
            .from('users')
            .insert(newUserPayload);

          if (insertError) {
            console.error('[MOCK AUTH] Error inserting new user:', insertError);
            throw insertError;
          }
          console.log(`[MOCK AUTH] New user created and OTP set for ${mobileNumber}`);
        }
        // Simulate OTP sent successfully (no actual SMS)
      } else {
        // Real Supabase requestOtp (existing code)
        console.log(`[Auth] Requesting OTP for mobile number via Supabase: ${mobileNumber}`);
        const { error } = await supabase.auth.signInWithOtp({
          phone: mobileNumber,
        });
        if (error) {
          console.error('Supabase OTP request error:', error);
          throw error;
        }
        console.log('[Auth] Supabase OTP sent successfully.');
      }
    } catch (error) {
      console.error('OTP request failed:', error);
      // Keep existing error handling for network issues etc.
      if (typeof window !== 'undefined' && !window.navigator.onLine && !(error instanceof Error && error.message.includes('[MOCK AUTH]'))) {
        throw new Error('Network error: You appear to be offline. Please check your internet connection.');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (mobileNumber: string, otp: string) => {
    setIsLoading(true);
    try {
      if (USE_MOCK_AUTH) {
        const dbCompatibleMobileNumber = mobileNumber.slice(-10);

        const { data: dbUser, error: fetchError } = await supabase
          .from('users')
          .select('*, email, full_name, default_street_address_line_1, default_street_address_line_2, default_city, default_state_province_region, default_postal_code, default_country, updated_at') // Added email
          .eq('mobile_number', dbCompatibleMobileNumber)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('[MOCK AUTH] Error fetching user for login:', fetchError);
          throw fetchError;
        }

        if (!dbUser) {
          console.error('[MOCK AUTH] Login failed: User not found.', mobileNumber);
          throw new Error('Login failed: User not found.');
        }

        if (dbUser.otp !== otp) {
          console.error('[MOCK AUTH] Invalid OTP for:', mobileNumber);
          throw new Error('Invalid OTP.');
        }

        if (!dbUser.otp_expires_at || new Date(dbUser.otp_expires_at) < new Date()) {
          console.error('[MOCK AUTH] OTP expired for:', mobileNumber);
          // Optionally clear the expired OTP from DB
          await supabase.from('users').update({ otp: null, otp_expires_at: null, updated_at: new Date().toISOString() }).eq('id', dbUser.id);
          throw new Error('OTP expired.');
        }

        // OTP is valid, update user to verified and clear OTP
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({
            is_verified: true,
            otp: null,
            otp_expires_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', dbUser.id) // dbUser.id here is the original ID from the table
          .select('*, email, full_name, default_street_address_line_1, default_street_address_line_2, default_city, default_state_province_region, default_postal_code, default_country, updated_at') // Added email
          .single();
        
        if (updateError || !updatedUser) {
          console.error('[MOCK AUTH] Error updating user to verified state:', updateError);
          throw updateError || new Error('Failed to update user state.');
        }

        let originalUpdatedId = updatedUser.id;
        if (typeof originalUpdatedId === 'number') {
            originalUpdatedId = String(originalUpdatedId);
        }
        
        // UUID check and fallback removed. User ID is now the string representation of INT8.
        const effectiveUserId = originalUpdatedId;

        const contextUser: User = {
          id: effectiveUserId, // Use effectiveUserId (string representation of INT8)
          mobile_number: updatedUser.mobile_number,
          email: updatedUser.email, // Added email
          is_verified: updatedUser.is_verified,
          full_name: updatedUser.full_name,
          default_street_address_line_1: updatedUser.default_street_address_line_1,
          default_street_address_line_2: updatedUser.default_street_address_line_2,
          default_city: updatedUser.default_city,
          default_state_province_region: updatedUser.default_state_province_region,
          default_postal_code: updatedUser.default_postal_code,
          default_country: updatedUser.default_country,
          app_metadata: updatedUser.app_metadata || { provider: 'phone', providers: ['phone'] },
          user_metadata: updatedUser.user_metadata || {},
          created_at: updatedUser.created_at,
          updated_at: updatedUser.updated_at,
        };
        setUser(contextUser);

        const supabaseStyleUser: SupabaseUser = {
          id: effectiveUserId, // Use effectiveUserId (string representation of INT8)
          aud: 'authenticated',
          role: 'authenticated',
          email: updatedUser.email, // Added email
          phone: updatedUser.mobile_number, 
          created_at: updatedUser.created_at || new Date().toISOString(),
          updated_at: updatedUser.updated_at || new Date().toISOString(),
          app_metadata: updatedUser.app_metadata || { provider: 'phone', providers: ['phone'] },
          user_metadata: { ...updatedUser.user_metadata, ...{ // Merge profile data into user_metadata
            full_name: updatedUser.full_name,
            default_street_address_line_1: updatedUser.default_street_address_line_1,
            default_street_address_line_2: updatedUser.default_street_address_line_2,
            default_city: updatedUser.default_city,
            default_state_province_region: updatedUser.default_state_province_region,
            default_postal_code: updatedUser.default_postal_code,
            default_country: updatedUser.default_country,
          }},
          identities: [{
            id: effectiveUserId, // or a specific identity id if you have one
            user_id: effectiveUserId,
            identity_id: effectiveUserId, // Added missing property
            identity_data: { sub: effectiveUserId, phone: updatedUser.mobile_number }, // Or other relevant identity data
            provider: 'phone',
            last_sign_in_at: updatedUser.last_sign_in_at || new Date().toISOString(), // if available
            created_at: updatedUser.created_at || new Date().toISOString(),
            updated_at: updatedUser.updated_at || new Date().toISOString(),
          }],
        };

        const newMockSession: Session = {
          access_token: `mock-access-token-${Date.now()}`,
          refresh_token: `mock-refresh-token-${Date.now()}`,
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          token_type: 'bearer',
          user: supabaseStyleUser,
        };
        setSession(newMockSession);

        localStorage.setItem('mockUser', JSON.stringify(contextUser));
        localStorage.setItem('mockSession', JSON.stringify(newMockSession));
        console.log('[MOCK AUTH] Login successful for:', mobileNumber);

      } else {
        // Real Supabase login (existing code)
        console.log(`[Auth] Verifying OTP for mobile number via Supabase: ${mobileNumber}`);
        const { data, error } = await supabase.auth.verifyOtp({
          phone: mobileNumber,
          token: otp,
          type: 'sms',
        });

        if (error) {
          console.error('Supabase OTP verification error:', error);
          throw error;
        }

        if (data.session && data.user) {
          console.log('[Auth] Supabase OTP verified successfully. Session established.');
          // onAuthStateChange will handle setting user and session state
        } else {
          throw new Error('OTP verification did not result in a session or user.');
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
      // Keep existing error handling
      if (typeof window !== 'undefined' && !window.navigator.onLine && !(error instanceof Error && error.message.includes('[MOCK AUTH]'))) {
        throw new Error('Network error: You appear to be offline. Please check your internet connection.');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      if (USE_MOCK_AUTH) {
        setUser(null);
        setSession(null);
        localStorage.removeItem('mockUser');
        localStorage.removeItem('mockSession');
        console.log('[MOCK AUTH] Logged out.');
        // No DB interaction needed on logout as per current requirements (OTP cleared on login)
      } else {
        // Real Supabase logout (existing code)
        console.log('[Auth] Logging out via Supabase.');
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('Supabase logout error:', error);
          throw error;
        }
        // User and session will be cleared by onAuthStateChange
        console.log('[Auth] Supabase logout successful.');
      }
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthenticated: !!user && !!session, // Or based on your specific logic for isAuthenticated
        login,
        requestOtp,
        logout,
        setUser, // Provide setUser in context
        USE_MOCK_AUTH, // Provide USE_MOCK_AUTH in context
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
