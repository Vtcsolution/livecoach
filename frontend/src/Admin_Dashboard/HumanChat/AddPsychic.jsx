import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,        // User icon
  Mail,        // Email icon
  Lock,        // Password/lock icon
  DollarSign,  // Money/rate icon
  BookOpen,    // Book/bio icon
  Globe,       // Languages/globe icon
  Award,       // Abilities/award icon
  Briefcase,   // Specialization/briefcase icon
  CheckCircle, // Success/verified icon
  XCircle,     // Error/unverified icon
  Loader2,     // Loading spinner
  ArrowLeft,   // Back arrow
  Image,       // Image icon
  MapPin,      // Location icon (replaces Venue)
  Calendar,    // Experience/calendar icon
  Clock,       // Response time icon
  Shield       // Verification shield icon
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import Dashboard_Navbar from "../Admin_Navbar";
import Doctor_Side_Bar from "../SideBar";
import { Label } from "@/components/ui/label";
import axios from 'axios';

const AddPsychic = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [side, setSide] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [errors, setErrors] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    ratePerMin: "1.50",
    bio: "",
    gender: "female",
    image: "",
    abilities: "",
    location: "",
    languages: "English",
    experience: "0",
    specialization: "",
    isVerified: false,
    availability: true,
    responseTime: "5",
  });

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle select changes
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle switch changes
  const handleSwitchChange = (name, checked) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.email.includes('@')) newErrors.email = "Please enter a valid email";
    if (!formData.password) newErrors.password = "Password is required";
    if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (!formData.confirmPassword) newErrors.confirmPassword = "Please confirm password";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords don't match";
    if (!formData.ratePerMin) newErrors.ratePerMin = "Rate is required";
    if (!formData.bio.trim()) newErrors.bio = "Bio is required";
    if (formData.bio.length < 10) newErrors.bio = "Bio must be at least 10 characters";
    if (formData.image && !formData.image.startsWith('http')) newErrors.image = "Please enter a valid URL";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle image URL change
  const handleImageChange = (value) => {
    setPreviewImage(value);
    setFormData(prev => ({ ...prev, image: value }));
  };

  // Submit form
  const onSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Prepare abilities array
      const abilitiesArray = formData.abilities 
        ? formData.abilities.split(',').map(ability => ability.trim()).filter(ability => ability)
        : [];

      // Prepare languages array
      const languagesArray = formData.languages 
        ? formData.languages.split(',').map(lang => lang.trim()).filter(lang => lang)
        : ['English'];

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        ratePerMin: parseFloat(formData.ratePerMin),
        bio: formData.bio.trim(),
        gender: formData.gender,
        image: formData.image.trim(),
        abilities: abilitiesArray,
        location: formData.location.trim(),
        languages: languagesArray,
        experience: parseInt(formData.experience) || 0,
        specialization: formData.specialization.trim(),
        isVerified: formData.isVerified,
        availability: formData.availability,
        responseTime: parseInt(formData.responseTime) || 5,
      };

      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/human-psychics/admin/create`,
        payload,
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast({
          title: "Success",
          description: `Psychic "${formData.name}" created successfully`,
          variant: "default"
        });

        // Redirect to psychics list
        navigate('/admin/dashboard/humancoach');
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to create psychic",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Create psychic error:', error);
      
      let errorMessage = "Failed to create psychic";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        errorMessage = Object.values(error.response.data.errors).join(', ');
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Back to list
  const handleBack = () => {
    navigate('/admin/dashboard/humancoach');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Dashboard_Navbar side={side} setSide={setSide} />
      <div className="flex">
        <Doctor_Side_Bar side={side} setSide={setSide} />
        <main className="flex-1 p-6 ml-0 lg:ml-64 transition-all duration-300">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Add New Psychic
                </h1>
                <p className="text-muted-foreground mt-1">
                  Create a new human psychic account
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Profile & Image */}
              <div className="lg:col-span-1 space-y-6">
                {/* Profile Image Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Image</CardTitle>
                    <CardDescription>
                      Add a profile picture for the psychic
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Image Preview */}
                    <div className="flex flex-col items-center">
                      <div className="relative h-48 w-48 rounded-full overflow-hidden border-4 border-gray-200">
                        {previewImage ? (
                          <img
                            src={previewImage}
                            alt="Preview"
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='16' fill='%239ca3af' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
                            }}
                          />
                        ) : (
                          <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                            <User className="h-24 w-24 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Image URL Input */}
                    <div className="space-y-2">
                      <Label htmlFor="image" className="flex items-center gap-2">
                        <Image className="h-4 w-4" />
                        Image URL
                      </Label>
                      <Input
                        id="image"
                        name="image"
                        placeholder="https://example.com/image.jpg"
                        value={formData.image}
                        onChange={(e) => handleImageChange(e.target.value)}
                        className={errors.image ? "border-red-500" : ""}
                      />
                      {errors.image && (
                        <p className="text-sm text-red-500">{errors.image}</p>
                      )}
                      <p className="text-sm text-gray-500">
                        Enter a direct URL to the profile image
                      </p>
                    </div>

                    {/* Status Switches */}
                    <div className="space-y-4 pt-4">
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <Label className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Verified Account
                          </Label>
                          <p className="text-sm text-gray-500">
                            Verified psychics can log in immediately
                          </p>
                        </div>
                        <Switch
                          checked={formData.isVerified}
                          onCheckedChange={(checked) => handleSwitchChange('isVerified', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <Label className="flex items-center gap-2">
                            {formData.availability ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-gray-400" />
                            )}
                            Available Online
                          </Label>
                          <p className="text-sm text-gray-500">
                            Make psychic available for chat
                          </p>
                        </div>
                        <Switch
                          checked={formData.availability}
                          onCheckedChange={(checked) => handleSwitchChange('availability', checked)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Rate Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Rate Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label htmlFor="ratePerMin" className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Rate per Minute *
                      </Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500">$</span>
                        </div>
                        <Input
                          id="ratePerMin"
                          name="ratePerMin"
                          type="number"
                          step="0.01"
                          min="0.50"
                          max="10.00"
                          className={`pl-8 ${errors.ratePerMin ? "border-red-500" : ""}`}
                          value={formData.ratePerMin}
                          onChange={handleInputChange}
                        />
                      </div>
                      {errors.ratePerMin && (
                        <p className="text-sm text-red-500">{errors.ratePerMin}</p>
                      )}
                      <p className="text-sm text-gray-500">
                        Standard rate is $1.50 - $5.00 per minute
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Form Fields */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Information Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>
                      Enter the psychic's basic details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Full Name *
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={errors.name ? "border-red-500" : ""}
                      />
                      {errors.name && (
                        <p className="text-sm text-red-500">{errors.name}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="psychic@example.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={errors.email ? "border-red-500" : ""}
                      />
                      {errors.email && (
                        <p className="text-sm text-red-500">{errors.email}</p>
                      )}
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <Label htmlFor="password" className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Password *
                      </Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={errors.password ? "border-red-500" : ""}
                      />
                      {errors.password && (
                        <p className="text-sm text-red-500">{errors.password}</p>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Confirm Password *
                      </Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={errors.confirmPassword ? "border-red-500" : ""}
                      />
                      {errors.confirmPassword && (
                        <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                      )}
                    </div>

                    {/* Gender */}
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender *</Label>
                      <Select 
                        value={formData.gender} 
                        onValueChange={(value) => handleSelectChange('gender', value)}
                      >
                        <SelectTrigger id="gender" className={errors.gender ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.gender && (
                        <p className="text-sm text-red-500">{errors.gender}</p>
                      )}
                    </div>

                    {/* Response Time */}
                    <div className="space-y-2">
                      <Label htmlFor="responseTime" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Response Time (minutes)
                      </Label>
                      <Input
                        id="responseTime"
                        name="responseTime"
                        type="number"
                        min="1"
                        max="60"
                        placeholder="5"
                        value={formData.responseTime}
                        onChange={handleInputChange}
                      />
                      <p className="text-sm text-gray-500">
                        Average response time to messages
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Professional Details Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Professional Details</CardTitle>
                    <CardDescription>
                      Information about psychic's professional background
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Bio */}
                    <div className="space-y-2">
                      <Label htmlFor="bio" className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Biography *
                      </Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        placeholder="Describe the psychic's background, skills, and experience..."
                        className={`min-h-[120px] ${errors.bio ? "border-red-500" : ""}`}
                        value={formData.bio}
                        onChange={handleInputChange}
                      />
                      {errors.bio && (
                        <p className="text-sm text-red-500">{errors.bio}</p>
                      )}
                      <p className="text-sm text-gray-500">
                        This will be displayed on the psychic's profile
                      </p>
                    </div>

                    {/* Abilities */}
                    <div className="space-y-2">
                      <Label htmlFor="abilities" className="flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        Special Abilities
                      </Label>
                      <Input
                        id="abilities"
                        name="abilities"
                        placeholder="Tarot, Astrology, Numerology, Mediumship"
                        value={formData.abilities}
                        onChange={handleInputChange}
                      />
                      <p className="text-sm text-gray-500">
                        Separate multiple abilities with commas
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Location */}
                      <div className="space-y-2">
                        <Label htmlFor="location" className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Location
                        </Label>
                        <Input
                          id="location"
                          name="location"
                          placeholder="New York, USA"
                          value={formData.location}
                          onChange={handleInputChange}
                        />
                      </div>

                      {/* Languages */}
                      <div className="space-y-2">
                        <Label htmlFor="languages" className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Languages
                        </Label>
                        <Input
                          id="languages"
                          name="languages"
                          placeholder="English, Spanish, French"
                          value={formData.languages}
                          onChange={handleInputChange}
                        />
                        <p className="text-sm text-gray-500">
                          Separated by commas
                        </p>
                      </div>

                      {/* Experience */}
                      <div className="space-y-2">
                        <Label htmlFor="experience" className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Experience (years)
                        </Label>
                        <Input
                          id="experience"
                          name="experience"
                          type="number"
                          min="0"
                          max="50"
                          placeholder="5"
                          value={formData.experience}
                          onChange={handleInputChange}
                        />
                      </div>

                      {/* Specialization */}
                      <div className="space-y-2">
                        <Label htmlFor="specialization" className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          Specialization
                        </Label>
                        <Input
                          id="specialization"
                          name="specialization"
                          placeholder="Love & Relationships"
                          value={formData.specialization}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Form Actions */}
            <Card>
              <CardFooter className="flex justify-between px-6 py-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Psychic...
                    </>
                  ) : (
                    <>
                      <User className="h-4 w-4 mr-2" />
                      Create Psychic Account
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>

          {/* Quick Tips */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm">Quick Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Set <strong>isVerified</strong> to true if you want the psychic to be able to login immediately</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Use a professional image URL for best results (minimum 300x300 pixels)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Standard rates range from $1.50 to $5.00 per minute</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Make sure the email is unique and not already registered</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default AddPsychic;