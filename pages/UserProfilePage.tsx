import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import gsap from 'gsap';

const UserProfilePage: React.FC = () => {
  const { user, isLoading: authLoading, setUser: setAuthUser, USE_MOCK_AUTH } = useAuth();
  const [fullName, setFullName] = useState('');
  const [streetAddress1, setStreetAddress1] = useState('');
  const [streetAddress2, setStreetAddress2] = useState('');
  const [city, setCity] = useState('');
  const [stateProvinceRegion, setStateProvinceRegion] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const profileCardRef = useRef<HTMLDivElement>(null);
  const ordersCardRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (profileCardRef.current) {
      gsap.fromTo(profileCardRef.current, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' });
    }
    if (formRef.current) {
    }
  }, [user]); // Re-run when user loads to ensure refs are set

  useEffect(() => {
    // This effect handles animations for the order history section when orders data changes.
    if (ordersCardRef.current) {
      if (orders.length > 0) {
        // Animate the main "Order History" card into view
        gsap.fromTo(
          ordersCardRef.current,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            delay: 0.3, // Small delay for a smoother appearance
            onComplete: () => {
              // After the main card is visible, animate individual order items
              const itemCardsNodeList = ordersCardRef.current?.querySelectorAll('.order-item-card');
              if (itemCardsNodeList && itemCardsNodeList.length > 0) {
                const itemCards = Array.from(itemCardsNodeList); // Convert NodeList to Array for GSAP
                gsap.fromTo(
                  itemCards,
                  { opacity: 0, y: 20 }, // Start from slightly below and invisible
                  {
                    opacity: 1,
                    y: 0,
                    duration: 0.5,
                    stagger: 0.1, // Stagger the animation for each card
                    ease: 'power2.out',
                  }
                );
              }
            }
          }
        );
      } else {
        // If there are no orders, ensure the "Order History" card is hidden or reset.
        // We only animate it out if it was previously visible.
        // GSAP's getProperty might return a string, ensure it's parsed for comparison.
        const currentOpacity = parseFloat(gsap.getProperty(ordersCardRef.current, "opacity") as string);
        if (currentOpacity > 0) {
             gsap.to(ordersCardRef.current, { opacity: 0, y: 50, duration: 0.5 });
        }
        // Also, ensure any individual item cards are hidden if orders are cleared.
        const itemCardsNodeList = ordersCardRef.current?.querySelectorAll('.order-item-card');
        if (itemCardsNodeList && itemCardsNodeList.length > 0) {
            gsap.to(Array.from(itemCardsNodeList), { opacity: 0, duration: 0.3 });
        }
      }
    }
  }, [orders]); // This effect should run whenever the `orders` state changes.

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setStreetAddress1(user.default_street_address_line_1 || '');
      setStreetAddress2(user.default_street_address_line_2 || '');
      setCity(user.default_city || '');
      setStateProvinceRegion(user.default_state_province_region || '');
      setPostalCode(user.default_postal_code || '');
      setCountry(user.default_country || '');

      const fetchOrders = async () => {
        setLoadingOrders(true);
        setError(null); // Clear previous errors
        console.log('[UserProfilePage] Fetching orders for user:', user);
        if (!user || !user.id) {
          console.error('[UserProfilePage] No user or user.id found for fetching orders.');
          setOrders([]);
          setLoadingOrders(false);
          return;
        }

        try {
          const userIdColumn = USE_MOCK_AUTH ? 'user_id' : 'user_id_uuid';
          let queryUserId: string | number = user.id;

          if (USE_MOCK_AUTH) {
            const parsedId = parseInt(user.id, 10);
            if (isNaN(parsedId)) {
              console.error('[UserProfilePage] Mock Auth: Invalid user ID for orders query - not a number:', user.id);
              setOrders([]);
              setLoadingOrders(false);
              return;
            }
            queryUserId = parsedId;
          }
          
          console.log(`[UserProfilePage] Querying 'orders' table with column '${userIdColumn}' and ID '${queryUserId}' (type: ${typeof queryUserId})`);

          const { data, error: ordersError } = await supabase
            .from('orders')
            .select('*, order_items(*, products(name, image_url))')
            .eq(userIdColumn, queryUserId)
            .order('created_at', { ascending: false });

          console.log('[UserProfilePage] Supabase orders query response:', { data, ordersError });

          if (ordersError) {
            console.error('[UserProfilePage] Supabase error fetching orders:', ordersError);
            throw ordersError;
          }
          setOrders(data || []);
          if (data && data.length === 0) {
            console.log('[UserProfilePage] No orders found for this user.');
          }
        } catch (err: any) {
          console.error('Error fetching orders:', err);
          setError('Failed to load order history. ' + err.message);
        } finally {
          setLoadingOrders(false);
        }
      };
      fetchOrders();
    }
  }, [user, USE_MOCK_AUTH]);

  const handleProfileSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) {
      setError('You must be logged in to update your profile.');
      return;
    }
    setLoadingProfile(true);
    setError(null);
    setSuccessMessage(null);

    const profileData = {
      full_name: fullName,
      default_street_address_line_1: streetAddress1,
      default_street_address_line_2: streetAddress2 || null,
      default_city: city,
      default_state_province_region: stateProvinceRegion,
      default_postal_code: postalCode,
      default_country: country,
      updated_at: new Date().toISOString(),
    };

    try {
      if (USE_MOCK_AUTH) {
        const { data: updatedUserData, error: updateError } = await supabase
          .from('users')
          .update(profileData)
          .eq('id', user.id)
          .select()
          .single();

        if (updateError) throw updateError;
        
        if (updatedUserData) {
          setAuthUser((prevUser: any) => prevUser ? ({ ...prevUser, ...updatedUserData }) : null);
          setSuccessMessage('Profile updated successfully!');
          // Animate success message
          gsap.fromTo('.success-toast', {opacity: 0, y: -20}, {opacity: 1, y: 0, duration: 0.5});
        } else {
          throw new Error('No data returned after update.');
        }

      } else {
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({ ...profileData, id: user.id, updated_at: new Date().toISOString() })
          .eq('id', user.id);

        if (upsertError) throw upsertError;
        setSuccessMessage('Profile updated successfully!');
        // Animate success message
        gsap.fromTo('.success-toast', {opacity: 0, y: -20}, {opacity: 1, y: 0, duration: 0.5});
        setAuthUser((prevUser: any) => prevUser ? ({ 
            ...prevUser, 
            full_name: fullName,
            default_street_address_line_1: streetAddress1,
            default_street_address_line_2: streetAddress2,
            default_city: city,
            default_state_province_region: stateProvinceRegion,
            default_postal_code: postalCode,
            default_country: country,
            updated_at: profileData.updated_at
        }) : null);
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. ' + err.message);
      // Animate error message
      gsap.fromTo('.error-toast', {opacity: 0, y: -20}, {opacity: 1, y: 0, duration: 0.5});
    } finally {
      setLoadingProfile(false);
    }
  };

  if (authLoading) {
    return <div className="flex justify-center items-center h-screen"><p>Loading authentication details...</p></div>;
  }

  if (!user) {
    return <div className="flex justify-center items-center h-screen"><p>Please log in to view your profile.</p></div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">User Profile</h1>
      
      {error && <div className="error-toast fixed top-5 right-5 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-lg" role="alert"><p className="font-bold">Error</p><p>{error}</p></div>}
      {successMessage && <div className="success-toast fixed top-5 right-5 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md shadow-lg" role="alert"><p className="font-bold">Success</p><p>{successMessage}</p></div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card ref={profileCardRef} className="opacity-0">
            <CardHeader>
              <CardTitle className="text-2xl">Personal Information</CardTitle>
              <CardDescription>Manage your personal details and default shipping address.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-6" ref={formRef}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="mobileNumber">Mobile Number (from login)</Label>
                    <Input
                      type="text"
                      id="mobileNumber"
                      value={user.mobile_number || ''}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      type="text"
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold pt-4 border-t mt-6">Default Shipping Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="streetAddress1">Street Address Line 1</Label>
                    <Input
                      type="text"
                      id="streetAddress1"
                      value={streetAddress1}
                      onChange={(e) => setStreetAddress1(e.target.value)}
                      placeholder="e.g., 123 Main St"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="streetAddress2">Street Address Line 2 (Optional)</Label>
                    <Input
                      type="text"
                      id="streetAddress2"
                      value={streetAddress2}
                      onChange={(e) => setStreetAddress2(e.target.value)}
                      placeholder="e.g., Apt, Suite, Building"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      type="text"
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g., New York"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stateProvinceRegion">State/Province/Region</Label>
                    <Input
                      type="text"
                      id="stateProvinceRegion"
                      value={stateProvinceRegion}
                      onChange={(e) => setStateProvinceRegion(e.target.value)}
                      placeholder="e.g., NY"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      type="text"
                      id="postalCode"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="e.g., 10001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      type="text"
                      id="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="e.g., USA"
                    />
                  </div>
                </div>
                <CardFooter className="pt-6 flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={loadingProfile}
                    // onMouseEnter={(e) => anime({ targets: e.currentTarget, scale: 1.05, duration: 200 })} // Changed usage
                    // onMouseLeave={(e) => anime({ targets: e.currentTarget, scale: 1, duration: 200 })} // Changed usage
                  >
                    {loadingProfile ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : 'Save Profile'}
                  </Button>
                </CardFooter>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card ref={ordersCardRef} className="opacity-0">
            <CardHeader>
              <CardTitle className="text-2xl">Order History</CardTitle>
              <CardDescription>View your past orders.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingOrders ? (
                <p>Loading orders...</p>
              ) : orders.length > 0 ? (
                <div className="space-y-6">
                  {orders.map((order, index) => (
                    <Card key={order.id} className="order-item-card opacity-0" data-index={index}>
                      <CardHeader>
                        <CardTitle className="text-lg">Order ID: {order.id}</CardTitle>
                        <CardDescription>Date: {new Date(order.created_at).toLocaleDateString()} | Status: <span className={`font-semibold ${order.status === 'Completed' ? 'text-green-600' : order.status === 'Pending' ? 'text-yellow-600' : 'text-red-600'}`}>{order.status}</span></CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="font-semibold text-md">Total: ${order.total_amount.toFixed(2)}</p>
                        <h4 className="font-medium mt-3 mb-2 text-gray-700">Items:</h4>
                        <ul className="list-disc list-inside ml-4 space-y-1 text-sm text-gray-600">
                          {order.order_items.map((item: any) => (
                            <li key={item.id} className="flex items-center justify-between">
                              <div>
                                <span className="font-medium">{item.products.name}</span> (x{item.quantity}) - ${item.price.toFixed(2)} each
                              </div>
                              {item.products.image_url && 
                                <img src={item.products.image_url} alt={item.products.name} className="w-12 h-12 object-cover rounded-md ml-2"/>}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p>You have no orders yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;

