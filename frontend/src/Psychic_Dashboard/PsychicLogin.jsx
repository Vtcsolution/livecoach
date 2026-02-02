// src/pages/psychic/PsychicLogin.jsx  (or wherever you keep it)
import React, { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { usePsychicAuth } from '@/context/PsychicAuthContext';
import { Loader2 } from 'lucide-react';

export default function PsychicLogin() {
  const { login, loading } = usePsychicAuth();
  const navigate = useNavigate();

  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = await login(credentials);

    if (result?.success) {
      navigate('/psychic/dashboard', { replace: true });
    }
    // Errors are already toasted inside PsychicAuthContext
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Psychic Sign In
          </CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your portal
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={credentials.email}
                onChange={handleChange}
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={credentials.password}
                onChange={handleChange}
                required
                className="w-full"
              />
            </div>

            <Button
              type="submit"
              variant="brand"        // same as your user login
              className="w-full mt-6"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2  className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="text-end my-2">
            <Link
              to="/psychic/forgot-password"
              className="text-[#3B5EB7] hover:underline font-medium text-sm"
            >
              Forgot Password?
            </Link>
          </div>

          <div className="text-center text-sm text-gray-600 mt-6">
            Not yet approved?{' '}
            <Link
              to="/psychic/register"
              className="text-[#3B5EB7] hover:underline font-medium"
            >
              Apply to Become a Psychic
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}