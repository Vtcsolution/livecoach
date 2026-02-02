import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  Star, 
  MessageCircle, 
  Clock, 
  MessageSquare, 
  ChevronLeft, 
  ChevronRight, 
  Cpu, 
  User, 
  Heart,
  ThumbsUp,
  Calendar,
  TrendingUp,
  Users,
  ChevronDown,
  ChevronUp,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PsychicProfile = () => {
  const { psychicId } = useParams();
  const navigate = useNavigate();
  const [psychic, setPsychic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allRatings, setAllRatings] = useState([]); // Alle beoordelingen opslaan
  const [displayedRatings, setDisplayedRatings] = useState([]); // Weer te geven beoordelingen
  const [ratingStats, setRatingStats] = useState({
    averageRating: 0,
    totalRatings: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [psychicType, setPsychicType] = useState(null);
  const [activeTab, setActiveTab] = useState("reviews");
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [hasMoreRatings, setHasMoreRatings] = useState(true);
  const [ratingsPage, setRatingsPage] = useState(1);
  const [sortBy, setSortBy] = useState("newest");
  const [filterRating, setFilterRating] = useState("all");

  // Initiële aantal weer te geven beoordelingen
  const INITIAL_RATINGS_COUNT = 5;
  const LOAD_MORE_COUNT = 10;

  useEffect(() => {
    const fetchPsychicProfile = async () => {
      setLoading(true);
      try {
        console.log("Psychic profiel ophalen voor ID:", psychicId);
        
        // Probeer eerst human psychic endpoint
        let response;
        try {
          console.log("Human psychic endpoint proberen...");
          response = await axios.get(
            `${import.meta.env.VITE_BASE_URL}/api/human-psychics/profile/${psychicId}`,
            {
              headers: { "Content-Type": "application/json" },
            }
          );
          
          if (response.data.success) {
            console.log("Human psychic gevonden:", response.data.data);
            setPsychic(response.data.data.psychic);
            setPsychicType('human');
            // Beoordelingen ophalen voor human psychic
            await fetchInitialRatings(psychicId, 'human');
            return;
          }
        } catch (humanError) {
          console.log("Human psychic endpoint mislukt, AI psychic proberen...");
        }

        // Als human psychic niet gevonden, probeer AI psychic endpoint
        try {
          console.log("AI psychic endpoint proberen...");
          response = await axios.get(
            `${import.meta.env.VITE_BASE_URL}/api/psychics/profile/${psychicId}`,
            {
              headers: { "Content-Type": "application/json" },
            }
          );
          
          if (response.data.success) {
            console.log("AI psychic gevonden:", response.data.data);
            setPsychic(response.data.data.psychic);
            setPsychicType('ai');
            // Beoordelingen ophalen voor AI psychic
            await fetchInitialRatings(psychicId, 'ai');
            return;
          }
        } catch (aiError) {
          console.log("AI psychic endpoint mislukt:", aiError.message);
        }

        // Als beide endpoints mislukken
        toast.error("Psychic niet gevonden. Mogelijk verwijderd of ID ongeldig.");
        
      } catch (error) {
        console.error("Fetch error:", error);
        toast.error(error.response?.data?.message || "Fout bij ophalen psychic profiel");
      } finally {
        setLoading(false);
      }
    };

    fetchPsychicProfile();
  }, [psychicId]);

  // Initiële beoordelingen en statistieken ophalen
  const fetchInitialRatings = async (id, type) => {
    try {
      // Beoordeling statistieken ophalen
      const statsResponse = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/ratings/psychic/${id}/summary`,
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      
      if (statsResponse.data.success) {
        console.log("Beoordeling statistieken gevonden:", statsResponse.data.data);
        setRatingStats(statsResponse.data.data);
      }

      // Eerste pagina van beoordelingen ophalen
      await fetchRatingsPage(1);

    } catch (error) {
      console.log("Geen beoordelingen gevonden of rating endpoint niet beschikbaar:", error.message);
      // Als ratings endpoint niet bestaat, gebruik feedback van psychic data
      if (psychic?.feedback) {
        const feedbackRatings = psychic.feedback.map(f => ({
          _id: f._id || Math.random().toString(),
          rating: f.rating || 0,
          comment: f.message || "",
          user: {
            firstName: f.userName || "Anoniem",
            image: f.userImage || "/default-avatar.jpg"
          },
          createdAt: f.createdAt || new Date().toISOString()
        }));
        setAllRatings(feedbackRatings);
        setDisplayedRatings(feedbackRatings.slice(0, INITIAL_RATINGS_COUNT));
      }
    }
  };

  // Beoordelingen ophalen met paginatie
  const fetchRatingsPage = async (page) => {
    setRatingsLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/ratings/psychic/${psychicId}`,
        {
          params: { 
            page,
            limit: 50,
            sort: sortBy,
            rating: filterRating !== "all" ? filterRating : undefined
          },
          headers: { "Content-Type": "application/json" },
        }
      );
      
      if (response.data.success) {
        const newRatings = response.data.data.ratings;
        const totalPages = response.data.data.totalPages || 1;
        
        if (page === 1) {
          // Eerste pagina, vervang alle beoordelingen
          setAllRatings(newRatings);
          setDisplayedRatings(newRatings.slice(0, INITIAL_RATINGS_COUNT));
        } else {
          // Volgende pagina's, voeg toe aan bestaande beoordelingen
          const updatedRatings = [...allRatings, ...newRatings];
          setAllRatings(updatedRatings);
          setDisplayedRatings(updatedRatings.slice(0, INITIAL_RATINGS_COUNT + ((page - 1) * 50)));
        }
        
        setHasMoreRatings(page < totalPages);
        setRatingsPage(page);
      }
    } catch (error) {
      console.error("Fout bij ophalen beoordelingen:", error);
      toast.error("Niet gelukt om meer reviews te laden");
    } finally {
      setRatingsLoading(false);
    }
  };

  // Meer beoordelingen laden
  const loadMoreRatings = () => {
    const currentlyDisplayed = displayedRatings.length;
    const nextDisplayCount = currentlyDisplayed + LOAD_MORE_COUNT;
    
    if (nextDisplayCount >= allRatings.length) {
      // We moeten meer van de server ophalen
      const nextPage = ratingsPage + 1;
      fetchRatingsPage(nextPage);
    } else {
      // We hebben meer beoordelingen lokaal, toon er meer
      setDisplayedRatings(allRatings.slice(0, nextDisplayCount));
    }
  };

  // Beoordelingen sorteren en filteren
  useEffect(() => {
    let filteredRatings = allRatings;
    
    // Beoordelingsfilter toepassen
    if (filterRating !== "all") {
      filteredRatings = filteredRatings.filter(r => r.rating === parseInt(filterRating));
    }
    
    // Sortering toepassen
    filteredRatings = [...filteredRatings].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "highest":
          return b.rating - a.rating;
        case "lowest":
          return a.rating - b.rating;
        default:
          return 0;
      }
    });
    
    // Weer te geven beoordelingen bijwerken
    setAllRatings(filteredRatings);
    setDisplayedRatings(filteredRatings.slice(0, displayedRatings.length > INITIAL_RATINGS_COUNT ? displayedRatings.length : INITIAL_RATINGS_COUNT));
    setCurrentReviewIndex(0); // Carousel resetten
  }, [sortBy, filterRating]);

  const nextReview = () => {
    if (displayedRatings.length === 0) return;
    setCurrentReviewIndex((prev) =>
      prev === displayedRatings.length - 1 ? 0 : prev + 1
    );
  };

  const prevReview = () => {
    if (displayedRatings.length === 0) return;
    setCurrentReviewIndex((prev) =>
      prev === 0 ? displayedRatings.length - 1 : prev - 1
    );
  };

  const handleChatClick = () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/login");
      return;
    }

    if (psychicType === 'human') {
      navigate(`/`);
    } else if (psychicType === 'ai') {
      navigate(`/`);
    }
  };

  const calculateStarPercentage = (starCount) => {
    if (ratingStats.totalRatings === 0) return 0;
    return Math.round((starCount / ratingStats.totalRatings) * 100);
  };

  // Beoordelingen filteren op sterren
  const filterByStar = (star) => {
    if (filterRating === star.toString()) {
      setFilterRating("all"); // Uitschakelen
    } else {
      setFilterRating(star.toString());
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-b from-purple-50 to-cyan-50 dark:from-purple-900 dark:to-cyan-900">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-40 w-40 rounded-full bg-gray-200 dark:bg-gray-700"></div>
          <div className="h-5 w-48 rounded bg-gray-200 dark:bg-gray-700"></div>
          <div className="h-4 w-64 rounded bg-gray-200 dark:bg-gray-700"></div>
          <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700"></div>
        </div>
      </div>
    );
  }

  if (!psychic) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-b from-purple-50 to-cyan-50 dark:from-purple-900 dark:to-cyan-900">
        <Card className="text-center p-6 max-w-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md rounded-xl">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white">
              Psychic niet gevonden
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
              De psychic die je zoekt bestaat niet of is mogelijk verwijderd.
            </p>
            <Button
              variant="brand"
              className="rounded-full px-6 py-2 text-sm font-medium"
              onClick={() => navigate("/")}
            >
              Psychics Bekijken
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const abilities = Array.isArray(psychic.abilities) ? psychic.abilities : [];
  const chatStats = psychic.chatStats || { totalChats: 0, totalMessages: 0, averageSessionDuration: 0 };
  const rate = psychic.rate || { perMinute: 1.00 };
  const type = psychic.type || (psychicType === 'ai' ? 'AI Psychic' : 'Human Psychic');

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero Sectie */}
        <div className="flex flex-col md:flex-row gap-6 mb-10 animate-fade-in">
          <div className="md:w-1/3 flex justify-center">
            <div className="relative">
              <Avatar className="h-40 w-40 sm:h-48 sm:w-48 md:h-56 md:w-56 border-2 border-white dark:border-gray-800 shadow-md ring-2 ring-purple-500/30 transition-transform duration-300 hover:scale-105">
                <AvatarImage src={psychic.image} alt={psychic.name} />
                <AvatarFallback className="text-xl font-bold bg-gradient-to-r from-purple-500 to-cyan-400 text-white">
                  {psychic.name?.charAt(0) || "P"}
                </AvatarFallback>
              </Avatar>
              <Badge className="absolute bottom-2 right-2 font-medium px-3 py-1 rounded-full shadow-sm flex items-center gap-1"
                style={{ 
                  backgroundColor: psychicType === 'ai' ? '#3B82F6' : '#10B981'
                }}>
                {psychicType === 'ai' ? <Cpu className="h-3 w-3" /> : <User className="h-3 w-3" />}
                {type}
              </Badge>
            </div>
          </div>

          <div className="md:w-2/3 flex flex-col justify-center text-center md:text-left">
            <h1 className="text-4xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 animate-slide-up">
              {psychic.name}
            </h1>
            <p className="text-md text-gray-600 dark:text-gray-300 mb-4 max-w-xl animate-slide-up animation-delay-200">
              {psychic.bio || "Geen biografie beschikbaar."}
            </p>
            
            {/* Beoordelingsweergave met Statistieken */}
            <div className="flex items-center justify-center md:justify-start gap-4 mb-4 animate-slide-up animation-delay-400">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 dark:text-white">
                  {ratingStats.averageRating.toFixed(1)}
                </div>
                <div className="flex justify-center md:justify-start mt-1">
                  {Array(5).fill(0).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(ratingStats.averageRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300 dark:text-gray-600"
                      }`}
                    />
                  ))}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {ratingStats.totalRatings} {ratingStats.totalRatings === 1 ? 'review' : 'reviews'}
                </div>
              </div>
              
              <div className="hidden sm:block h-12 w-px bg-gray-300"></div>
              
              <div className="hidden sm:flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <div className="text-lg font-bold text-green-600">
                    {ratingStats.ratingDistribution[5] || 0}
                  </div>
                  <div className="text-xs text-gray-500">5★</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-lg font-bold text-blue-600">
                    {ratingStats.ratingDistribution[4] || 0}
                  </div>
                  <div className="text-xs text-gray-500">4★</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-lg font-bold text-yellow-600">
                    {ratingStats.ratingDistribution[3] || 0}
                  </div>
                  <div className="text-xs text-gray-500">3★</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-lg font-bold text-orange-600">
                    {ratingStats.ratingDistribution[2] || 0}
                  </div>
                  <div className="text-xs text-gray-500">2★</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-lg font-bold text-red-600">
                    {ratingStats.ratingDistribution[1] || 0}
                  </div>
                  <div className="text-xs text-gray-500">1★</div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
             
              <Button
                variant="outline"
                className="rounded-full px-6 py-2 text-base font-medium"
                onClick={() => navigate("/")}
              >
                Terug naar Home
              </Button>
            </div>
          </div>
        </div>

        {/* Hoofdinhoud met Tabs */}
        <Tabs defaultValue="reviews" className="space-y-6" onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="reviews" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Reviews ({ratingStats.totalRatings})
            </TabsTrigger>
            <TabsTrigger value="about" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Over
            </TabsTrigger>
           
          </TabsList>

          <TabsContent value="reviews" className="space-y-6">
            {/* Beoordelingsverdeling */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-md rounded-xl">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                  Beoordelingsverdeling
                </CardTitle>
                <CardDescription className="text-sm">Hoe klanten deze psychic beoordelen</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <div key={star} className="flex items-center gap-3">
                      <button 
                        onClick={() => filterByStar(star)}
                        className={`flex items-center gap-1 w-16 transition-all ${
                          filterRating === star.toString() 
                            ? 'scale-105 font-bold text-purple-600 dark:text-purple-400' 
                            : 'hover:text-purple-500'
                        }`}
                      >
                        <span className="text-sm font-medium">{star}★</span>
                        <Star className={`h-4 w-4 ${
                          filterRating === star.toString() 
                            ? 'text-purple-500 fill-purple-500' 
                            : 'text-yellow-500 fill-yellow-500'
                        }`} />
                      </button>
                      <Progress 
                        value={calculateStarPercentage(ratingStats.ratingDistribution[star] || 0)} 
                        className="h-2 flex-1"
                      />
                      <div className="w-10 text-right">
                        <span className="text-sm font-medium text-gray-700">
                          {ratingStats.ratingDistribution[star] || 0}
                        </span>
                        <span className="text-xs text-gray-500 ml-1">
                          ({calculateStarPercentage(ratingStats.ratingDistribution[star] || 0)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Filter reset knop */}
                {filterRating !== "all" && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setFilterRating("all")}
                    className="mt-3"
                  >
                    Filter wissen ({filterRating}★)
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Sorteer en Filter Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Alle Reviews ({allRatings.length})
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Wat klanten zeggen over {psychic.name}
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Sorteren op" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Nieuwste eerst</SelectItem>
                    <SelectItem value="oldest">Oudste eerst</SelectItem>
                    <SelectItem value="highest">Hoogste beoordeling</SelectItem>
                    <SelectItem value="lowest">Laagste beoordeling</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Reviews Inhoud */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-md rounded-xl">
              <CardContent className="p-6">
                {displayedRatings.length > 0 ? (
                  <div className="space-y-6">
                    {/* Carousel voor top reviews */}
                    {displayedRatings.length > 0 && (
                      <div className="relative mb-8">
                        <div className="mb-4">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Uitgelichte Reviews</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Uitgelichte klantervaringen
                          </p>
                        </div>
                        <div className="overflow-hidden">
                          <div
                            className="transition-transform duration-300 ease-in-out"
                            style={{
                              transform: `translateX(-${currentReviewIndex * 100}%)`,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {displayedRatings.slice(0, 5).map((review, idx) => (
                              <div
                                key={review._id}
                                className="inline-block w-full align-top p-3"
                                style={{ whiteSpace: "normal" }}
                              >
                                <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800/50 dark:to-gray-900/50 backdrop-blur-sm p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-10 w-10">
                                        <AvatarImage src={review.user?.image || "/default-avatar.jpg"} />
                                        <AvatarFallback className="text-sm bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                                          {(review.user?.firstName || "U").charAt(0)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white">
                                          {review.user?.firstName || "Anoniem"} {review.user?.lastName || ""}
                                        </h4>
                                        <div className="flex items-center gap-1">
                                          {Array(5).fill(0).map((_, i) => (
                                            <Star
                                              key={i}
                                              className={`h-3 w-3 ${
                                                i < (review.rating || 0)
                                                  ? "fill-yellow-400 text-yellow-400"
                                                  : "text-gray-300 dark:text-gray-600"
                                              }`}
                                            />
                                          ))}
                                          <span className="ml-2 text-xs text-gray-500">
                                            {new Date(review.createdAt).toLocaleDateString('nl-NL', {
                                              year: 'numeric',
                                              month: 'short',
                                              day: 'numeric'
                                            })}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    {review.isEdited && (
                                      <Badge variant="outline" className="text-xs">
                                        Bewerkt
                                      </Badge>
                                    )}
                                  </div>
                                  {review.comment && (
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-3 leading-relaxed">
                                      "{review.comment}"
                                    </p>
                                  )}
                                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="secondary" className="text-xs">
                                        {review.rating}★ Beoordeling
                                      </Badge>
                                      {psychicType === 'human' && (
                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                          <Clock className="h-3 w-3" />
                                          Menselijke Sessie
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button size="sm" variant="ghost" className="h-7">
                                        <ThumbsUp className="h-3 w-3 mr-1" />
                                        Handig
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {displayedRatings.length > 1 && (
                          <div className="flex justify-between mt-4">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={prevReview}
                              className="rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/70"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center gap-2">
                              {displayedRatings.slice(0, 5).map((_, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setCurrentReviewIndex(idx)}
                                  className={`h-2 w-2 rounded-full transition-all duration-300 ${
                                    idx === currentReviewIndex
                                      ? "bg-purple-600 w-3"
                                      : "bg-gray-300 dark:bg-gray-600"
                                  }`}
                                  aria-label={`Ga naar review ${idx + 1}`}
                                />
                              ))}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={nextReview}
                              className="rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/70"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Alle Reviews Lijst */}
                    <div>
                      <div className="mb-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                          Alle Reviews ({allRatings.length})
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Toont {displayedRatings.length} van {allRatings.length} reviews
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        {displayedRatings.map((review) => (
                          <div key={review._id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={review.user?.image} />
                                  <AvatarFallback className="text-sm bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                                    {(review.user?.firstName || "A").charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {review.user?.firstName || "Anoniem"} {review.user?.lastName || ""}
                                  </div>
                                  <div className="flex items-center gap-1 mt-1">
                                    {Array(5).fill(0).map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-3 w-3 ${
                                          i < (review.rating || 0)
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-gray-300 dark:text-gray-600"
                                        }`}
                                      />
                                    ))}
                                    <span className="ml-2 text-xs text-gray-500">
                                      {new Date(review.createdAt).toLocaleDateString('nl-NL')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {review.rating}★
                                </Badge>
                              </div>
                            </div>
                            {review.comment && (
                              <div className="mt-3">
                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                  {review.comment}
                                </p>
                                {review.comment.length > 200 && (
                                  <button className="text-xs text-purple-600 dark:text-purple-400 mt-1 hover:underline">
                                    Lees meer
                                  </button>
                                )}
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                              <div className="text-xs text-gray-500">
                                {psychicType === 'human' ? 'Menselijke Reading' : 'AI Chat Sessie'}
                              </div>
                              <Button size="sm" variant="ghost" className="h-6 text-xs">
                                <ThumbsUp className="h-3 w-3 mr-1" />
                                Handig
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Laad Meer Knop */}
                      {(allRatings.length > displayedRatings.length || hasMoreRatings) && (
                        <div className="mt-8 text-center">
                          <Button
                            onClick={loadMoreRatings}
                            disabled={ratingsLoading}
                            variant="outline"
                            className="px-8 py-2 rounded-full"
                          >
                            {ratingsLoading ? (
                              <>
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-purple-600 mr-2"></div>
                                Laden...
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-4 w-4 mr-2" />
                                Laad Meer Reviews ({allRatings.length - displayedRatings.length} meer)
                              </>
                            )}
                          </Button>
                          <p className="text-xs text-gray-500 mt-2">
                            Toont {displayedRatings.length} van {allRatings.length} reviews
                            {hasMoreRatings && " • Meer reviews beschikbaar"}
                          </p>
                        </div>
                      )}

                      {/* Geen reviews meer bericht */}
                      {allRatings.length > 0 && displayedRatings.length >= allRatings.length && !hasMoreRatings && (
                        <div className="text-center py-6">
                          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 mb-3">
                            <Star className="h-6 w-6 text-green-600 dark:text-green-400" />
                          </div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                            Alle reviews geladen
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Je hebt alle {allRatings.length} reviews bekeken voor {psychic.name}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="mx-auto h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                      <Star className="h-8 w-8 text-gray-400 dark:text-gray-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Nog geen reviews
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                      Wees de eerste om je ervaring met {psychic.name} te delen
                    </p>
                    <Button
                      onClick={handleChatClick}
                      className="mt-4"
                      variant="outline"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Chat om een review achter te laten
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Over en Statistieken tabs blijven hetzelfde */}
        <TabsContent value="about" className="space-y-6">
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* Linker Kolom - Belangrijke Informatie */}
    <div className="lg:col-span-2 space-y-6">
      {/* Hoofd Beschrijving */}
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-md rounded-xl">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
            Over {psychic.name}
          </CardTitle>
          <CardDescription className="text-sm">
            Leer je psychic advisor kennen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300">
            <p className="leading-relaxed">
              {psychic.bio || `${psychic.name} is een begaafde psychic met jarenlange ervaring in het helpen van mensen om helderheid en begeleiding te vinden.`}
            </p>
            
            {psychic.experience && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Ervaring & Achtergrond
                </h4>
                <p className="text-sm">{psychic.experience}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Specialiteiten & Vaardigheden */}
      {abilities.length > 0 && (
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-md rounded-xl">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
              Specialiteiten & Vaardigheden
            </CardTitle>
            <CardDescription className="text-sm">
              Expertise gebieden en spirituele gaven
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {abilities.map((ability, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="px-3 py-1.5 text-sm rounded-full flex items-center gap-1"
                >
                  <Star className="h-3 w-3" />
                  {ability}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>

    {/* Rechter Kolom - Snelle Feiten */}
    <div className="space-y-6">
      {/* Psychic Details */}
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-md rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Snelle Feiten
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Type</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {psychicType === 'ai' ? 'AI Psychic' : 'Human Psychic'}
                </p>
              </div>
            </div>

           
              

            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Actief Sinds</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {psychic.createdAt 
                    ? new Date(psychic.createdAt).toLocaleDateString('nl-NL', {
                        year: 'numeric',
                        month: 'long'
                      })
                    : 'Recent lid geworden'}
                </p>
              </div>
            </div>

            {psychic.languages && (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Talen</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {psychic.languages.join(', ')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hoe Verbinding te Maken */}
      <Card className="bg-gradient-to-br from-purple-50 to-cyan-50 dark:from-purple-900/20 dark:to-cyan-900/20 backdrop-blur-sm border-0 shadow-md rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Klaar om te Verbinden?
          </CardTitle>
          <CardDescription className="text-sm">
            Begin je spirituele reis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Maak verbinding met {psychic.name} voor gepersonaliseerde begeleiding en inzichten.
            </p>
            
            <Button
              variant="brand"
              className="w-full rounded-full py-2 text-base font-medium"
              onClick={handleChatClick}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Start Chat Sessie
            </Button>
            
            <div className="text-xs text-gray-600 dark:text-gray-400 text-center pt-2">
              <p>Geen verplichtingen • Per minuut betalen • 24/7 beschikbaar</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>

  {/* Filosofie & Aanpak (Optioneel) */}
  {psychic.philosophy && (
    <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-md rounded-xl">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
          Mijn Aanpak
        </CardTitle>
        <CardDescription className="text-sm">
          Spirituele filosofie en leesstijl
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative pl-6 border-l-2 border-purple-200 dark:border-purple-800">
          <div className="absolute left-[-9px] top-0 h-4 w-4 rounded-full bg-purple-500"></div>
          <p className="text-gray-700 dark:text-gray-300 italic">
            "{psychic.philosophy}"
          </p>
        </div>
      </CardContent>
    </Card>
  )}

  {/* Cliënt Focus Gebieden */}
  {psychic.focusAreas && psychic.focusAreas.length > 0 && (
    <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-md rounded-xl">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
          Ik Kan Helpen Met
        </CardTitle>
        <CardDescription className="text-sm">
          Veelvoorkomende onderwerpen en gebieden van begeleiding
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {psychic.focusAreas.map((area, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
            >
              <Heart className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{area}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )}
</TabsContent>
        
        </Tabs>
      </div>

      {/* Custom CSS voor Animaties */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
        .animation-delay-600 {
          animation-delay: 0.6s;
        }
      `}</style>
    </div>
  );
};

export default PsychicProfile;