
import { useEffect, useState } from 'react';
import axios from 'axios';
import Dashboard_Navbar from './Admin_Navbar';
import Doctor_Side_Bar from './SideBar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Eye, MoreHorizontal, Star, Trash2 } from 'lucide-react';

const Reviewss = ({ side, setSide, admin }) => {
  const [feedbackData, setFeedbackData] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 5; // Number of feedback items per page

  // Fetch feedback from backend
  useEffect(() => {
    const fetchFeedback = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/api/ratings?page=${currentPage}&limit=${pageSize}`,
          { withCredentials: true }
        );
        console.log('Feedback Data:', response.data); // Debug
        setFeedbackData(response.data.feedback);
        setTotalPages(response.data.totalPages);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching feedback:', err);
        setError('Failed to load feedback');
        setLoading(false);
      } finally {
        setIsLoaded(true);
      }
    };

    fetchFeedback();
  }, [currentPage]);

  // Delete feedback by ID
  const handleDelete = async (feedbackId) => {
    try {
      await axios.delete(`${import.meta.env.VITE_BASE_URL}/api/feedback/${feedbackId}`, {
        withCredentials: true,
      });
      setFeedbackData((prev) => prev.filter((fb) => fb._id !== feedbackId));
      setTotalPages(Math.ceil((feedbackData.length - 1) / pageSize));
      if (feedbackData.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (err) {
      console.error('Error deleting feedback:', err);
      setError('Failed to delete feedback');
    }
  };

  // Pagination controls
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not provided";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const renderRating = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-4 w-4 ${i <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
        />
      );
    }
    return <div className="flex">{stars}</div>;
  };

  return (
    <div>
      <Dashboard_Navbar side={side} setSide={setSide} user={admin} />
      <div className="dashboard-wrapper">
        <Doctor_Side_Bar side={side} setSide={setSide} user={admin} />
        <div className="dashboard-side min-h-screen">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-sans font-extrabold text-center my-6">Reviews</h2>
          <div className="rounded-md border overflow-hidden mx-2 md:mx-4 overflow-x-auto backdrop-blur-md shadow-xl transition-all duration-500 hover:shadow-2xl hover:translate-y-[-5px]">
            <Card
              className={`w-full bg-white/10 border-white/20 backdrop-blur-md shadow-xl transition-all duration-500 hover:shadow-2xl hover:translate-y-[-5px] ${isLoaded ? "animate-slide-in-bottom opacity-100" : "opacity-0"}`}
              style={{ animationDelay: "1.3s" }}
            >
              <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                  <CardTitle>Reviews</CardTitle>
                  <CardDescription>Recently submitted feedback</CardDescription>
                </div>
               
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center text-gray-500 py-10">Loading feedback...</div>
                ) : error ? (
                  <div className="text-center text-red-500 py-10">{error}</div>
                ) : (
                  <>
                    <Table className="[&_tbody_tr:hover]:bg-white/20">
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Rating</TableHead>
                          <TableHead>Psychic ID</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {feedbackData.map((feedback, index) => (
                          <TableRow
                            key={feedback._id}
                            className={`transition-all duration-300 hover:scale-[1.01] ${isLoaded ? "animate-slide-in-right opacity-100" : "opacity-0"}`}
                            style={{ animationDelay: `${1.4 + index * 0.1}s` }}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <img
                                  src={feedback.profile || "https://via.placeholder.com/40"}
                                  alt="profile"
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                                <span>{feedback.username}</span>
                              </div>
                            </TableCell>
                            <TableCell>{renderRating(feedback.rating)}</TableCell>
                            <TableCell>{feedback.psychicId}</TableCell>
                            <TableCell>{formatDate(feedback.createdAt)}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Open menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                 
                                  <DropdownMenuItem className="cursor-pointer text-destructive" onClick={() => handleDelete(feedback._id)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete feedback
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {/* Pagination Controls */}
                    <div className="flex justify-between items-center mt-4">
                      <Button
                        disabled={currentPage === 1}
                        onClick={() => handlePageChange(currentPage - 1)}
                        className="bg-[#3B5EB7] hover:bg-[#2a4b9a]"
                      >
                        Previous
                      </Button>
                      <span>
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        disabled={currentPage === totalPages}
                        onClick={() => handlePageChange(currentPage + 1)}
                        className="bg-[#3B5EB7] hover:bg-[#2a4b9a]"
                      >
                        Next
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reviewss;
