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
  admin_or_not?: boolean; // Added admin status field
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

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true; // For cleanup

    const loadMockSession = async () => {
      if (!isMounted) return;
      setIsLoading(true);
      try {
        const mockSessionData = localStorage.getItem('mockSession');
        const mockUserData = localStorage.getItem('mockUser');

        if (mockSessionData && mockUserData) {
          const storedUser: User = JSON.parse(mockUserData);
          if (storedUser.mobile_number) {
            const dbCompatibleMobileNumber = storedUser.mobile_number.slice(-10);
            const { data: dbUser, error: dbError } = await supabase
              .from('users')
              .select('id, mobile_number, is_verified, full_name, default_street_address_line_1, default_street_address_line_2, default_city, default_state_province_region, default_postal_code, default_country, created_at, updated_at, admin_or_not')
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
              const effectiveUserId = originalDbId;
              const contextUser: User = {
                id: effectiveUserId,
                mobile_number: dbUser.mobile_number,
                email: "", 
                is_verified: dbUser.is_verified,
                full_name: dbUser.full_name,
                default_street_address_line_1: dbUser.default_street_address_line_1,
                default_street_address_line_2: dbUser.default_street_address_line_2,
                default_city: dbUser.default_city,
                default_state_province_region: dbUser.default_state_province_region,
                default_postal_code: dbUser.default_postal_code,
                default_country: dbUser.default_country,
                app_metadata: { provider: 'phone', providers: ['phone'] }, // Default value
                user_metadata: {}, // Default value
                created_at: dbUser.created_at,
                updated_at: dbUser.updated_at,
                admin_or_not: dbUser.admin_or_not || false,
              };
              if (isMounted) setUser(contextUser);
              
              const currentSession: Session = JSON.parse(mockSessionData);
              const supabaseStyleUser: SupabaseUser = {
                id: effectiveUserId,
                aud: 'authenticated',
                role: 'authenticated',
                email: "",
                phone: dbUser.mobile_number, 
                created_at: dbUser.created_at || new Date().toISOString(),
                updated_at: dbUser.updated_at || new Date().toISOString(),
                app_metadata: { provider: 'phone', providers: ['phone'] }, // Default value
                user_metadata: { // Default value, merged with profile-like data from users table
                  full_name: dbUser.full_name,
                  default_street_address_line_1: dbUser.default_street_address_line_1,
                  default_street_address_line_2: dbUser.default_street_address_line_2,
                  default_city: dbUser.default_city,
                  default_state_province_region: dbUser.default_state_province_region,
                  default_postal_code: dbUser.default_postal_code,
                  default_country: dbUser.default_country,
                },
                identities: [{
                  id: effectiveUserId,
                  user_id: effectiveUserId,
                  identity_id: effectiveUserId, 
                  // @ts-ignore
                  identity_data: { sub: effectiveUserId, phone: dbUser.mobile_number },
                  provider: 'phone',
                  // @ts-ignore
                  last_sign_in_at: dbUser.last_sign_in_at || new Date().toISOString(),
                  created_at: dbUser.created_at || new Date().toISOString(),
                  updated_at: dbUser.updated_at || new Date().toISOString(),
                }],
              };
              currentSession.user = supabaseStyleUser;
              if (isMounted) setSession(currentSession);

            } else {
              localStorage.removeItem('mockUser');
              localStorage.removeItem('mockSession');
              if (isMounted) {
                setUser(null);
                setSession(null);
              }
            }
          } else {
            localStorage.removeItem('mockUser');
            localStorage.removeItem('mockSession');
            if (isMounted) {
                setUser(null);
                setSession(null);
            }
          }
        }
      } catch (e) {
        console.error("[MOCK AUTH] Error in loadMockSession:", e);
        localStorage.removeItem('mockUser');
        localStorage.removeItem('mockSession');
        if (isMounted) {
            setUser(null);
            setSession(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    const fetchAndSetUserWithProfile = async (supabaseAuthUser: SupabaseUser | null | undefined) => {
      if (!isMounted || !supabaseAuthUser) {
        if(isMounted && !supabaseAuthUser) setUser(null); // Clear user if supabaseAuthUser is null
        if(isMounted) setIsLoading(false);
        return;
      }

      let profileData: Partial<User> = {};
      try {
        const { data: profileResult, error } = await supabase
          .from('profiles')
          .select('full_name, default_street_address_line_1, default_street_address_line_2, default_city, default_state_province_region, default_postal_code, default_country, updated_at, admin_or_not')
          .eq('id', supabaseAuthUser.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching real user profile:', error);
        }
        if (profileResult) {
          profileData = profileResult;
        }
      } catch (e) {
          console.error("Exception fetching real user profile:", e);
      }
      
      if (isMounted) {
          setUser({
            id: supabaseAuthUser.id,
            mobile_number: supabaseAuthUser.phone,
            email: "", 
            is_verified: !!supabaseAuthUser.phone_confirmed_at || !!supabaseAuthUser.email_confirmed_at,
            full_name: profileData.full_name || supabaseAuthUser.user_metadata?.full_name,
            default_street_address_line_1: profileData.default_street_address_line_1,
            default_street_address_line_2: profileData.default_street_address_line_2,
            default_city: profileData.default_city,
            default_state_province_region: profileData.default_state_province_region,
            default_postal_code: profileData.default_postal_code,
            default_country: profileData.default_country,
            app_metadata: supabaseAuthUser.app_metadata,
            user_metadata: supabaseAuthUser.user_metadata,
            created_at: supabaseAuthUser.created_at,
            updated_at: profileData.updated_at || supabaseAuthUser.updated_at,
            admin_or_not: profileData.admin_or_not || false,
          });
          setIsLoading(false);
      }
    };

    if (USE_MOCK_AUTH) {
      loadMockSession();
    } else {
      setIsLoading(true);
      supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
        if (isMounted) {
          setSession(currentSession);
          await fetchAndSetUserWithProfile(currentSession?.user);
        }
      }).catch(error => {
          console.error("Error in getSession:", error);
          if(isMounted) setIsLoading(false);
      });

      const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(
        async (_event, currentSession) => {
          if (isMounted) {
            setSession(currentSession);
            setIsLoading(true); 
            await fetchAndSetUserWithProfile(currentSession?.user);
          }
        }
      );
      
      return () => { // Cleanup function
        isMounted = false;
        authListener?.unsubscribe();
      };
    }
    
    return () => { // General cleanup for isMounted
        isMounted = false;
    };

  }, []); // KEEP DEPS ARRAY EMPTY: This effect should run once on mount.

  const requestOtp = async (mobileNumber: string) => {
    setIsLoading(true);
    try {
      if (USE_MOCK_AUTH) {
        const dbCompatibleMobileNumber = mobileNumber.slice(-10);
        const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiryTime = new Date(Date.now() + 10 * 60 * 1000); 

        console.log(`[MOCK AUTH] OTP for ${mobileNumber} (DB: ${dbCompatibleMobileNumber}): ${generatedOtp} (Expires: ${expiryTime.toLocaleTimeString()})`);

        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('id')
          .eq('mobile_number', dbCompatibleMobileNumber)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('[MOCK AUTH] Error fetching user:', fetchError);
          throw fetchError;
        }

        const userData = {
          mobile_number: dbCompatibleMobileNumber,
          otp: generatedOtp,
          otp_expires_at: expiryTime.toISOString(),
          is_verified: false, 
          updated_at: new Date().toISOString(),
        };

        if (existingUser) {
          const { error: updateError } = await supabase
            .from('users')
            .update(userData)
            .eq('mobile_number', dbCompatibleMobileNumber);

          if (updateError) {
            console.error('[MOCK AUTH] Error updating OTP for existing user:', updateError);
            throw updateError;
          }
          console.log(`[MOCK AUTH] OTP updated for existing user ${mobileNumber}`);
        } else {
          const newUserPayload = {
            ...userData,
            created_at: new Date().toISOString(),
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
      } else {
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
          .select('id, mobile_number, is_verified, full_name, default_street_address_line_1, default_street_address_line_2, default_city, default_state_province_region, default_postal_code, default_country, created_at, updated_at, admin_or_not, otp, otp_expires_at')
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
          await supabase.from('users').update({ otp: null, otp_expires_at: null, updated_at: new Date().toISOString() }).eq('id', dbUser.id);
          throw new Error('OTP expired.');
        }
        
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({
            is_verified: true,
            otp: null,
            otp_expires_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', dbUser.id)
          .select('id, mobile_number, is_verified, full_name, default_street_address_line_1, default_street_address_line_2, default_city, default_state_province_region, default_postal_code, default_country, created_at, updated_at, admin_or_not')
          .single();
        
        if (updateError || !updatedUser) {
          console.error('[MOCK AUTH] Error updating user to verified state:', updateError);
          throw updateError || new Error('Failed to update user state.');
        }

        let originalUpdatedId = updatedUser.id;
        if (typeof originalUpdatedId === 'number') {
            originalUpdatedId = String(originalUpdatedId);
        }
        const effectiveUserId = originalUpdatedId;

        const contextUser: User = {
          id: effectiveUserId,
          mobile_number: updatedUser.mobile_number,
          email: "",
          is_verified: updatedUser.is_verified,
          full_name: updatedUser.full_name,
          default_street_address_line_1: updatedUser.default_street_address_line_1,
          default_street_address_line_2: updatedUser.default_street_address_line_2,
          default_city: updatedUser.default_city,
          default_state_province_region: updatedUser.default_state_province_region,
          default_postal_code: updatedUser.default_postal_code,
          default_country: updatedUser.default_country,
          app_metadata: { provider: 'phone', providers: ['phone'] }, // Default value
          user_metadata: {}, // Default value
          created_at: updatedUser.created_at,
          updated_at: updatedUser.updated_at,
          admin_or_not: updatedUser.admin_or_not || false,
        };
        setUser(contextUser);

        const supabaseStyleUser: SupabaseUser = {
          id: effectiveUserId,
          aud: 'authenticated',
          role: 'authenticated',
          email: "",
          phone: updatedUser.mobile_number, 
          created_at: updatedUser.created_at || new Date().toISOString(),
          updated_at: updatedUser.updated_at || new Date().toISOString(),
          app_metadata: { provider: 'phone', providers: ['phone'] }, // Default value
          user_metadata: { // Default value, merged with profile-like data from users table
            full_name: updatedUser.full_name,
            default_street_address_line_1: updatedUser.default_street_address_line_1,
            default_street_address_line_2: updatedUser.default_street_address_line_2,
            default_city: updatedUser.default_city,
            default_state_province_region: updatedUser.default_state_province_region,
            default_postal_code: updatedUser.default_postal_code,
            default_country: updatedUser.default_country,
          },
          identities: [{
            id: effectiveUserId, 
            user_id: effectiveUserId,
            identity_id: effectiveUserId, 
            // @ts-ignore
            identity_data: { sub: effectiveUserId, phone: updatedUser.mobile_number },
            provider: 'phone',
            // @ts-ignore
            last_sign_in_at: updatedUser.last_sign_in_at || new Date().toISOString(), 
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
        } else {
          throw new Error('OTP verification did not result in a session or user.');
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
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
      } else {
        console.log('[Auth] Logging out via Supabase.');
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('Supabase logout error:', error);
          throw error;
        }
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
        isAuthenticated: !!user && !!session,
        login,
        requestOtp,
        logout,
        setUser,
        USE_MOCK_AUTH,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
