import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, Gift, X } from 'lucide-react';
import { useAuth } from './AuthContext';
import axios from 'axios';

export default function Signup() {
  const { register, user, error } = useAuth();
  const navigate = useNavigate();
  const hasInteracted = useRef(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [countdown, setCountdown] = useState(10); // Increased from 5 to 10 seconds
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState({
    gebruikersnaam: '',
    email: '',
    wachtwoord: '',
    bevestigWachtwoord: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Handle countdown for auto-redirect
  useEffect(() => {
    let timer;
    if (registrationSuccess && showSuccess) {
      setCountdown(10); // Reset to 10 seconds
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate("/");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [registrationSuccess, showSuccess, navigate]);

  // Auto-show success message when registrationSuccess becomes true
  useEffect(() => {
    if (registrationSuccess) {
      setShowSuccess(true);
    }
  }, [registrationSuccess]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
    setFormErrors({ ...formErrors, [id]: '' });

    if (!hasInteracted.current && window.ttq) {
      window.ttq.track('Lead', {
        content_id: formData.email || 'unknown',
        field: id,
      });
      hasInteracted.current = true;
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.gebruikersnaam) errors.gebruikersnaam = 'Gebruikersnaam is verplicht';
    if (!formData.email) errors.email = 'E-mailadres is verplicht';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Ongeldig e-mailformaat';
    if (!formData.wachtwoord) errors.wachtwoord = 'Wachtwoord is verplicht';
    else if (formData.wachtwoord.length < 6) errors.wachtwoord = 'Wachtwoord moet minstens 6 tekens bevatten';
    if (formData.wachtwoord !== formData.bevestigWachtwoord) errors.bevestigWachtwoord = 'Wachtwoorden komen niet overeen';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setIsLoading(true);
      
      const payload = {
        username: formData.gebruikersnaam,
        email: formData.email,
        password: formData.wachtwoord,
        confirmPassword: formData.bevestigWachtwoord,
      };

      const result = await register(payload);
      if (result.success) {
        if (window.ttq) {
          window.ttq.track('SignUp', {
            content_id: result.userId || formData.email,
            email: formData.email,
          });
        }

        toast.success('Account succesvol aangemaakt!', {
          duration: 5000, // Keep toast for 5 seconds
        });
        setRegistrationSuccess(true);
        
        // Reset form data
        setFormData({
          gebruikersnaam: '',
          email: '',
          wachtwoord: '',
          bevestigWachtwoord: '',
        });

      } else {
        toast.error(result.message || 'Registratie mislukt');
      }
    } catch (err) {
      toast.error('Registratie mislukt: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Close success message manually
  const closeSuccessMessage = () => {
    setShowSuccess(false);
    navigate("/");
  };

  // Redirect if already logged in
  useEffect(() => {
    if (user && !error && !registrationSuccess) {
      navigate("/");
    }
    if (error) {
      toast.error(error);
    }
  }, [user, error, navigate, registrationSuccess]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md relative">
        {/* Large Success Overlay Modal */}
        {showSuccess && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-green-800">Welkom! 🎉</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeSuccessMessage}
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Gift className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-blue-800">
                        U heeft 2 GRATIS credits ontvangen! 🎁
                      </h3>
                    </div>
                  </div>
                  <p className="text-blue-700 mb-2">
                    <strong>Dit is uw welkomstgeschenk!</strong> Begin direct met chatten met een van onze coaches.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Wat kunt u nu doen?</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      <span>Kies een coach die bij u past</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      <span>Start direct een gesprek (eerste 2 minuten gratis)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      <span>Ontdek uw persoonlijke inzichten</span>
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col gap-3">
                  <Button
                    onClick={() => navigate("/")}
                    className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-bold py-3 text-lg"
                    size="lg"
                  >
                    🚀 Naar Homepagina
                  </Button>
                  
                  <Button
                    onClick={() => navigate("/")}
                    variant="outline"
                    className="w-full border-blue-600 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                  >
                    👁️ Direct coaches bekijken
                  </Button>
                </div>

                <div className="text-center pt-4 border-t border-gray-200">
                  <p className="text-gray-600 text-sm">
                    Automatische doorsturen over <span className="font-bold text-blue-600">{countdown} seconden</span>
                  </p>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-1000 ease-linear"
                      style={{ width: `${(countdown / 10) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Start jouw reis
          </CardTitle>
          <CardDescription className="text-center">
            Maak uw account aan
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Inline Success Message (smaller, still visible) */}
          {registrationSuccess && !showSuccess && (
            <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-300 rounded-xl p-4 shadow-md animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <h3 className="font-bold text-blue-800">Account aangemaakt! 🎉</h3>
                    <p className="text-blue-700 text-sm">
                      Klik hier om uw 2 gratis credits te bekijken
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowSuccess(true)}
                  variant="outline"
                  size="sm"
                  className="border-blue-600 text-blue-700 hover:bg-blue-50"
                >
                  Details
                </Button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gebruikersnaam">Gebruikersnaam</Label>
              <Input
                id="gebruikersnaam"
                value={formData.gebruikersnaam}
                onChange={handleChange}
                placeholder="Voer uw gebruikersnaam in"
                required
                disabled={isLoading || registrationSuccess}
              />
              {formErrors.gebruikersnaam && (
                <div className="text-red-500 text-sm">{formErrors.gebruikersnaam}</div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mailadres</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Voer uw e-mailadres in"
                required
                disabled={isLoading || registrationSuccess}
              />
              {formErrors.email && (
                <div className="text-red-500 text-sm">{formErrors.email}</div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="wachtwoord">Wachtwoord</Label>
              <Input
                id="wachtwoord"
                type="password"
                value={formData.wachtwoord}
                onChange={handleChange}
                placeholder="Maak een wachtwoord (min. 6 tekens)"
                required
                disabled={isLoading || registrationSuccess}
              />
              {formErrors.wachtwoord && (
                <div className="text-red-500 text-sm">{formErrors.wachtwoord}</div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bevestigWachtwoord">Bevestig Wachtwoord</Label>
              <Input
                id="bevestigWachtwoord"
                type="password"
                value={formData.bevestigWachtwoord}
                onChange={handleChange}
                placeholder="Bevestig uw wachtwoord"
                required
                disabled={isLoading || registrationSuccess}
              />
              {formErrors.bevestigWachtwoord && (
                <div className="text-red-500 text-sm">{formErrors.bevestigWachtwoord}</div>
              )}
            </div>

            {error && !registrationSuccess && (
              <div className="text-red-500 text-sm text-center">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="brand"
              className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 flex items-center justify-center shadow-md"
              size="lg"
              disabled={isLoading || registrationSuccess}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Account aanmaken...
                </>
              ) : registrationSuccess ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Account aangemaakt!
                </>
              ) : (
                'Account aanmaken'
              )}
            </Button>
          </form>

          <div className="text-center text-sm text-gray-600 mt-4">
            Heeft u al een account?{" "}
            <Link
              to="/login"
              className="text-blue-600 hover:underline font-medium"
            >
              Inloggen
            </Link>
          </div>
          
          {/* Info about credits - Enhanced visibility */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl shadow-sm">
            <div className="flex items-start gap-3">
              <div className="bg-white p-2 rounded-lg shadow">
                <Gift className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-blue-800 text-base font-bold">Welkomstgeschenk! 🎁</p>
                <p className="text-blue-700 text-sm mt-1">
                  Bij registratie ontvangt u <strong className="text-lg">2 GRATIS credits</strong> om direct met een coach te chatten.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-green-700 text-xs font-semibold">
                    Geen creditcard nodig • Direct beginnen
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
