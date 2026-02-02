import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  Star,
  User,
  DollarSign,
  Trash2 // Add trash icon
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Dashboard_Navbar from "../Admin_Navbar";
import Doctor_Side_Bar from "../SideBar";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import axios from 'axios';

const HumanCoachList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [side, setSide] = useState(false);
  const [loading, setLoading] = useState(true);
  const [psychics, setPsychics] = useState([]);
  const [search, setSearch] = useState('');
  
  // Dialog states
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [psychicToVerify, setPsychicToVerify] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [psychicToDelete, setPsychicToDelete] = useState(null);

  useEffect(() => {
    fetchPsychics();
  }, [search]);

  const fetchPsychics = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/human-psychics/admin/all`,
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        // Filter by search if needed
        let filteredPsychics = response.data.data || [];
        if (search) {
          filteredPsychics = filteredPsychics.filter(psychic =>
            psychic.name.toLowerCase().includes(search.toLowerCase()) ||
            psychic.email.toLowerCase().includes(search.toLowerCase())
          );
        }
        setPsychics(filteredPsychics);
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to load psychics",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Fetch psychics error:', error);
      
      // Fallback to regular endpoint
      try {
        const fallbackResponse = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/api/human-psychics`,
          { 
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (fallbackResponse.data.success) {
          let filteredPsychics = fallbackResponse.data.data || [];
          if (search) {
            filteredPsychics = filteredPsychics.filter(psychic =>
              psychic.name.toLowerCase().includes(search.toLowerCase()) ||
              psychic.email.toLowerCase().includes(search.toLowerCase())
            );
          }
          setPsychics(filteredPsychics);
        }
      } catch (fallbackError) {
        toast({
          title: "Error",
          description: "Failed to load psychics",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  // Create new psychic
  const handleCreatePsychic = () => {
    navigate('/admin/dashboard/psychics/create');
  };

  // View psychic details
  const handleViewPsychic = (psychicId) => {
    navigate(`/admin/dashboard/psychics/${psychicId}`);
  };

  // Verify psychic confirmation
  const handleVerifyClick = (psychic, verify = true) => {
    setPsychicToVerify({ ...psychic, verify });
    setVerifyDialogOpen(true);
  };

  // Delete psychic confirmation
  const handleDeleteClick = (psychic) => {
    setPsychicToDelete(psychic);
    setDeleteDialogOpen(true);
  };

  // Toggle verify/unverify psychic
  const handleToggleVerify = async () => {
    if (!psychicToVerify) return;

    try {
      const response = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/api/human-psychics/admin/${psychicToVerify._id}/toggle-verify`,
        {},
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
          description: `Psychic ${psychicToVerify.name} ${psychicToVerify.verify ? 'verified' : 'unverified'} successfully`,
          variant: "default"
        });
        
        // Refresh the list
        fetchPsychics();
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to update verification",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Toggle verify error:', error);
      
      // Fallback to legacy endpoint
      try {
        const legacyEndpoint = psychicToVerify.verify ? 'verify' : 'unverify';
        const legacyResponse = await axios.put(
          `${import.meta.env.VITE_BASE_URL}/api/human-psychics/${psychicToVerify._id}/${legacyEndpoint}`,
          {},
          { 
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (legacyResponse.data.success) {
          toast({
            title: "Success",
            description: `Psychic ${psychicToVerify.name} ${psychicToVerify.verify ? 'verified' : 'unverified'} successfully`,
            variant: "default"
          });
          fetchPsychics();
        }
      } catch (legacyError) {
        toast({
          title: "Error",
          description: "Failed to update verification status",
          variant: "destructive"
        });
      }
    } finally {
      setVerifyDialogOpen(false);
      setPsychicToVerify(null);
    }
  };

  // Delete psychic
  const handleDeletePsychic = async () => {
    if (!psychicToDelete) return;

    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_BASE_URL}/api/human-psychics/admin/${psychicToDelete._id}`,
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
          description: `Psychic ${psychicToDelete.name} deleted successfully`,
          variant: "default"
        });
        
        // Refresh the list
        fetchPsychics();
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to delete psychic",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Delete psychic error:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete psychic",
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setPsychicToDelete(null);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  if (loading && psychics.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Dashboard_Navbar side={side} setSide={setSide} />
        <div className="flex">
          <Doctor_Side_Bar side={side} setSide={setSide} />
          <main className="flex-1 p-6 ml-0 lg:ml-64 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-muted-foreground">Loading psychics...</span>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Dashboard_Navbar side={side} setSide={setSide} />
      <div className="flex">
        <Doctor_Side_Bar side={side} setSide={setSide} />
        <main className="flex-1 p-6 ml-0 lg:ml-64 transition-all duration-300">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Human Psychics Management
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage all human psychic accounts and verification
              </p>
            </div>
            <Button 
              onClick={handleCreatePsychic}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Psychic
            </Button>
          </div>

          {/* Search Bar */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="relative">
                <Input
                  placeholder="Search psychics by name or email..."
                  value={search}
                  onChange={handleSearch}
                  className="pl-10"
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          {/* Psychics Table */}
          <Card>
            <CardHeader>
              <CardTitle>Psychics List</CardTitle>
              <CardDescription>
                Total: {psychics.length} psychics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {psychics.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">No Psychics Found</h3>
                  <p className="text-muted-foreground mb-4">
                    {search ? "Try adjusting your search" : "Add your first psychic to get started"}
                  </p>
                  {!search && (
                    <Button onClick={handleCreatePsychic}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Psychic
                    </Button>
                  )}
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Psychic</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Verification</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {psychics.map((psychic) => (
                        <TableRow key={psychic._id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                {psychic.image ? (
                                  <AvatarImage src={psychic.image} alt={psychic.name} />
                                ) : (
                                  <AvatarFallback className="bg-blue-100 text-blue-600">
                                    {psychic.name?.[0]?.toUpperCase() || 'P'}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <div>
                                <p className="font-medium">{psychic.name}</p>
                                <p className="text-xs text-muted-foreground">{psychic.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4 text-green-600" />
                              <span className="font-medium">
                                {formatCurrency(psychic.ratePerMin || 1.5)}/min
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              psychic.availability
                                ? "border-green-500/20 bg-green-500/10 text-green-700"
                                : "border-gray-500/20 bg-gray-500/10 text-gray-700"
                            }>
                              {psychic.availability ? 'Online' : 'Offline'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                              <span>{(psychic.averageRating || 0).toFixed(1)}</span>
                              <span className="text-xs text-muted-foreground">
                                ({psychic.totalRatings || 0})
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={
                                psychic.isVerified 
                                  ? "border-green-500/20 bg-green-500/10 text-green-700"
                                  : "border-yellow-500/20 bg-yellow-500/10 text-yellow-700"
                              }
                            >
                              {psychic.isVerified ? 'Verified' : 'Pending'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewPsychic(psychic._id)}
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant={psychic.isVerified ? "outline" : "default"}
                                size="sm"
                                onClick={() => handleVerifyClick(psychic, !psychic.isVerified)}
                                className={
                                  psychic.isVerified 
                                    ? "border-yellow-500/20 text-yellow-700 hover:bg-yellow-50" 
                                    : "bg-green-600 hover:bg-green-700"
                                }
                                title={psychic.isVerified ? "Unverify" : "Verify"}
                              >
                                {psychic.isVerified ? (
                                  <XCircle className="h-4 w-4" />
                                ) : (
                                  <CheckCircle className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteClick(psychic)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                title="Delete Psychic"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Verify Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {psychicToVerify?.verify ? 'Verify' : 'Unverify'} Psychic
            </DialogTitle>
            <DialogDescription>
              {psychicToVerify?.verify 
                ? `Are you sure you want to verify "${psychicToVerify?.name}"? Verified psychics can log in and start accepting chat requests.`
                : `Are you sure you want to unverify "${psychicToVerify?.name}"? Unverified psychics cannot log in or accept chat requests.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant={psychicToVerify?.verify ? "default" : "outline"} 
              onClick={handleToggleVerify}
            >
              {psychicToVerify?.verify ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Verify Psychic
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Unverify Psychic
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Psychic</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete psychic "{psychicToDelete?.name}"? 
              This action cannot be undone and will permanently delete the psychic account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeletePsychic}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Psychic
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HumanCoachList;