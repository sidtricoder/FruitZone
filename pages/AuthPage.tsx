import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
// import { gsap } from 'gsap'; // Temporarily comment out if not used elsewhere after otpContainer animation removal
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

export default function AuthPage() {
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const formRef = useRef(null);
  const navigate = useNavigate();
  const { login, requestOtp, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
    
    // Initial animation
    // gsap.from(formRef.current, {
    //   opacity: 0,
    //   y: 50,
    //   duration: 1,
    //   ease: 'power3.out'
    // });
  }, [isAuthenticated, navigate]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    console.log('[AuthPage] Attempting to request OTP for:', mobileNumber); // Log number before formatting

    // Normalize mobile number: Prepend +91 if it's a 10-digit Indian number and doesn't already start with +
    let formattedMobileNumber = mobileNumber;
    if (formattedMobileNumber.length === 10 && /^[6-9]\d{9}$/.test(formattedMobileNumber)) {
      formattedMobileNumber = `+91${formattedMobileNumber}`;
    } else if (formattedMobileNumber.length === 12 && /^91\d{10}$/.test(formattedMobileNumber) && !formattedMobileNumber.startsWith('+')) {
      // Handles cases like 917622085960 -> +917622085960
      formattedMobileNumber = `+${formattedMobileNumber}`;
    }
    console.log('[AuthPage] Sending to Supabase with formatted number:', formattedMobileNumber);

    try {
      await requestOtp(formattedMobileNumber); // Use the formatted number
      setIsOtpSent(true);
      
      // Animate OTP container using GSAP ref
      // if (otpContainerRef.current) { // Temporarily comment out GSAP animation
      //   gsap.fromTo(
      //     otpContainerRef.current,
      //     { height: 0, opacity: 0 },
      //     { height: 'auto', opacity: 1, overflow: 'visible', duration: 0.5, ease: 'power2.out' }
      //   );
      // }
      
      toast({
        title: "OTP Sent!",
        description: "Please check your phone for the OTP.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send OTP",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await login(mobileNumber, otp);
      toast({
        title: "Success!",
        description: "You have been successfully logged in.",
      });
      navigate('/');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid OTP",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-background p-4">
      <Card className="w-full max-w-md bg-white shadow-lg" ref={formRef}>
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-gray-900">Welcome Back</CardTitle>
          <CardDescription className="text-center text-gray-700">
            {isOtpSent ? 'Enter the OTP sent to your phone' : 'Login with your mobile number'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={isOtpSent ? handleLogin : handleRequestOtp}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mobile" className="text-gray-800 font-medium">Mobile Number</Label>
                <Input
                  id="mobile"
                  type="tel"
                  placeholder="Enter mobile (+91XXXXXXXXXX or XXXXXXXXXX)"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  // Loosened pattern to allow more flexibility, formatting is handled in the function
                  pattern="^\+?[0-9]{10,13}$" 
                  title="Enter a 10-digit number or include country code (e.g., +91)."
                  required
                  disabled={isOtpSent}
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary border-gray-300 bg-white text-gray-900"
                />
              </div>
              
              {isOtpSent && (
                <div className="otp-container space-y-2">
                  <Label htmlFor="otp" className="text-gray-800 font-medium">OTP</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    pattern="[0-9]{6}"
                    required
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary border-gray-300 bg-white text-gray-900"
                  />
                </div>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">↻</span>
                  {isOtpSent ? 'Verifying...' : 'Sending OTP...'}
                </span>
              ) : (
                isOtpSent ? 'Verify OTP' : 'Send OTP'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-600">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
