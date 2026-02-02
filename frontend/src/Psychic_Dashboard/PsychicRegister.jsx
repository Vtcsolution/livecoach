// src/pages/psychic/PsychicRegister.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePsychicAuth } from "@/context/PsychicAuthContext";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

export default function PsychicRegister() {
  const { register, loading } = usePsychicAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    ratePerMin: "",
    bio: "",
    gender: "",
    image: "", // Store Cloudinary URL
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleGenderChange = (value) => {
    setFormData({ ...formData, gender: value });
  };

  // Cloudinary upload function - SAME as Add_Advisor
  const uploadToCloudinary = async (file) => {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "ml_default"); // Same preset as Add_Advisor
    
    try {
      const res = await fetch("https://api.cloudinary.com/v1_1/dovyqaltq/image/upload", {
        method: "POST",
        body: data,
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Upload failed");
      return json.secure_url;
    } catch (error) {
      toast.error("Image upload failed: " + error.message);
      throw error;
    }
  };

  // Handle image file selection - SAME as Add_Advisor
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
      // Remove the manual image URL input when uploading a file
      setFormData(prev => ({ ...prev, image: "" }));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreviewUrl(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!formData.gender) {
      toast.error("Please select your gender");
      return;
    }

    try {
      // Upload image to Cloudinary if file is selected
      let finalImageUrl = formData.image;
      
      if (imageFile) {
        setIsUploadingImage(true);
        finalImageUrl = await uploadToCloudinary(imageFile);
        setIsUploadingImage(false);
      }

      // Prepare data for registration
      const registrationData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        ratePerMin: formData.ratePerMin,
        bio: formData.bio,
        gender: formData.gender,
        image: finalImageUrl
      };

      // Call the register function from context
      const result = await register(registrationData);

      if (result?.success) {
        toast.success("Application submitted! Awaiting admin approval.");
        navigate("/psychic/login");
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Join as Psychic
          </CardTitle>
          <CardDescription className="text-center">
            Fill in your details to apply
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image Upload Section - SAME as Add_Advisor */}
            <div className="flex flex-col items-center space-y-2">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 overflow-hidden flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer">
                  {imagePreviewUrl ? (
                    <img 
                      src={imagePreviewUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : formData.image ? (
                    <img 
                      src={formData.image} 
                      alt="Current" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400 text-sm">No Image</div>
                  )}
                </div>
                {(imagePreviewUrl || formData.image) && (
                  <button
                    type="button"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                    onClick={removeImage}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="profile-image"
                  onChange={handleImageChange}
                />
              </div>
              <Label
                htmlFor="profile-image"
                className="text-sm text-gray-600 cursor-pointer flex items-center gap-1"
              >
                <Upload className="w-3 h-3" />
                {imageFile ? "Change Image" : "Upload Image"}
              </Label>
            </div>

            {/* Image URL Input (alternative to upload) */}
            <div className="space-y-2">
              <Label htmlFor="image">Or enter image URL</Label>
              <Input 
                type="text" 
                id="image" 
                value={formData.image} 
                onChange={handleChange} 
                placeholder="Enter image URL" 
                disabled={!!imageFile}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                required 
                value={formData.name}
                onChange={handleChange} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                required 
                value={formData.email}
                onChange={handleChange} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={formData.password}
                onChange={handleChange} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                required 
                value={formData.confirmPassword}
                onChange={handleChange} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ratePerMin">Rate per Minute ($)</Label>
              <Input
                id="ratePerMin"
                type="number"
                step="0.01"
                min="0.99"
                placeholder="3.99"
                required
                value={formData.ratePerMin}
                onChange={handleChange}
              />
            </div>

            {/* GENDER FIELD */}
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select onValueChange={handleGenderChange} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select your gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other / Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio (Tell us about your gifts)</Label>
              <textarea
                id="bio"
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="I specialize in tarot, astrology, love readings..."
                required
                value={formData.bio}
                onChange={handleChange}
              />
            </div>

            <Button
              type="submit"
              variant="brand"
              className="w-full"
              size="lg"
              disabled={loading || isUploadingImage}
            >
              {(loading || isUploadingImage) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isUploadingImage ? "Uploading Image..." : "Submitting Application..."}
                </>
              ) : (
                "Apply to Become a Psychic"
              )}
            </Button>
          </form>

          <div className="text-center text-sm text-gray-600 mt-6">
            Already approved?{" "}
            <Link to="/psychic/login" className="text-[#3B5EB7] hover:underline font-medium">
              Sign In Here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}