import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { gsap } from 'gsap';
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
    gsap.from(formRef.current, {
      opacity: 0,
      y: 50,
      duration: 1,
      ease: 'power3.out'
    });
  }, [isAuthenticated, navigate]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await requestOtp(mobileNumber);
      setIsOtpSent(true);
      
      // Animate OTP input appearance
      gsap.to('.otp-container', {
        height: 'auto',
        opacity: 1,
        duration: 0.5,
        ease: 'power2.out'
      });
      
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
      <Card className="w-full max-w-md" ref={formRef}>
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">
            {isOtpSent ? 'Enter the OTP sent to your phone' : 'Login with your mobile number'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={isOtpSent ? handleLogin : handleRequestOtp}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input
                  id="mobile"
                  type="tel"
                  placeholder="Enter your mobile number"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  pattern="[0-9]{10}"
                  required
                  disabled={isOtpSent}
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary"
                />
              </div>
              
              {isOtpSent && (
                <div className="otp-container space-y-2" style={{ opacity: 0, height: 0, overflow: 'hidden' }}>
                  <Label htmlFor="otp">OTP</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    pattern="[0-9]{6}"
                    required
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full mt-6"
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
          <p className="text-sm text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
