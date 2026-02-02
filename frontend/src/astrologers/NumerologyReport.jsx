import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, Heart, User, Rocket } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { Loader2 } from "lucide-react";

const NumerologyReport = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [report, setReport] = useState(location.state?.numerologyReport || null);
  const [userData, setUserData] = useState(location.state?.userData || null);
  const [showModal, setShowModal] = useState(!!location.state?.numerologyReport);
  const [firstPsychicId, setFirstPsychicId] = useState(null);
  const [isLoading, setIsLoading] = useState(!location.state?.numerologyReport);

  // Fetch first Tarot psychic (optional, runs only if needed)
  useEffect(() => {
    const fetchFirstTarotPsychic = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/api/psychics/type/Tarot`,
          { withCredentials: true }
        );
        const psychics = res.data?.data || [];
        if (psychics.length > 0) {
          setFirstPsychicId(psychics[0]._id);
        } else {
          toast.error("Geen Tarot psychics gevonden.");
        }
      } catch (err) {
        console.error("❌ Mislukt om Tarot psychics op te halen:", err.response?.data || err.message);
        toast.error("Mislukt om Tarot psychic data te laden.");
      }
    };

    fetchFirstTarotPsychic();
  }, []);

  // Fetch report and user data if not provided in state
  useEffect(() => {
    const fetchData = async () => {
      const params = new URLSearchParams(location.search);
      const userReportModalId = params.get("userReportModalId");

      if (!userReportModalId) {
        toast.error("Invalid report ID. Please generate a new report.");
        navigate("/");
        return;
      }

      try {
        setIsLoading(true);

        // Fetch numerology report
        if (!report) {
          const reportResponse = await axios.get(
            `${import.meta.env.VITE_BASE_URL}/api/numerology-report?userReportModalId=${userReportModalId}`,
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (reportResponse.data.success) {
            setReport(reportResponse.data.data);
          } else {
            toast.error(reportResponse.data.message || "Failed to fetch numerology report.");
            navigate("/");
            return;
          }
        }

        // Fetch user data from UserReportModal
        if (!userData) {
          const userResponse = await axios.get(
            `${import.meta.env.VITE_BASE_URL}/api/user-report-modal/${userReportModalId}`,
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (userResponse.data.success) {
            setUserData(userResponse.data.data);
          } else {
            toast.error(userResponse.data.message || "Failed to fetch user data.");
          }
        }
      } catch (error) {
        console.error("Fetch Data Error:", error);
        toast.error(error.response?.data?.message || "Error fetching report or user data.");
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    if (!report || !userData) {
      fetchData();
    } else {
      setIsLoading(false);
    }
  }, [report, userData, location, navigate]);

  const renderSummary = () => {
    if (!report || !report.numbers) return null;
    const { numbers } = report;
    return (
      <div className="bg-gradient-to-r from-purple-100 to-indigo-100 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center text-indigo-900 mb-4">
          Je Numerologie Snapshot 🌟
        </h2>
        <p className="text-gray-700 text-center mb-6">
          Hier is een snelle blik op de essentie van je numerologische reis:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-6 w-6 text-yellow-500" />
            <div>
              <h3 className="font-semibold">Levenspad {numbers.lifepath.number}</h3>
              <p className="text-gray-600 text-sm">{numbers.lifepath.description}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Rocket className="h-6 w-6 text-blue-500" />
            <div>
              <h3 className="font-semibold">Expressie {numbers.expression.number}</h3>
              <p className="text-gray-600 text-sm">{numbers.expression.description}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Heart className="h-6 w-6 text-red-500" />
            <div>
              <h3 className="font-semibold">Hartgetal {numbers.soulurge.number}</h3>
              <p className="text-gray-600 text-sm">{numbers.soulurge.description}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <User className="h-6 w-6 text-green-500" />
            <div>
              <h3 className="font-semibold">Persoonlijkheid {numbers.personality.number}</h3>
              <p className="text-gray-600 text-sm">{numbers.personality.description}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 overflow-auto">
      <div className="max-w-4xl mx-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin h-8 w-8 text-amber-400" />
          </div>
        ) : (
          <>
            {/* Header with User Data */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-extrabold text-indigo-900 sm:text-5xl">
                Je Numerologie Blauwdruk
                {userData?.name && `, ${userData.name}`}
              </h1>
              <p className="mt-4 text-lg text-gray-600">
                Ontdek de unieke energieën die je levensreis vormen. 🌈
              </p>
              {userData && (
                <div className="mt-4 text-gray-600">
                  <p><strong>Naam:</strong> {userData.name}</p>
                  <p><strong>Geboortedatum:</strong> {new Date(userData.dob).toLocaleDateString("nl-NL")}</p>
                  <p><strong>Email:</strong> {userData.email}</p>
                  {userData.birthTime && (
                    <p><strong>Geboortetijd:</strong> {userData.birthTime}</p>
                  )}
                </div>
              )}
              <Badge className="mt-4 bg-indigo-500 text-white">Gepersonaliseerd Rapport</Badge>
            </div>

            {/* Summary Section */}
            {renderSummary()}

            {/* Detailed Report */}
            {report && report.numbers && (
              <Card className="mt-8 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-indigo-900">
                    Je Kosmische Verhaal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="prose max-w-none text-gray-700 whitespace-pre-line">
                    {report.narrative}
                  </div>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-indigo-800 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-yellow-500" /> Levenspadgetal: {report.numbers.lifepath.number}
                      </h3>
                      <p className="text-gray-600">{report.numbers.lifepath.description}</p>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-indigo-800 flex items-center gap-2">
                        <Rocket className="h-5 w-5 text-blue-500" /> Expressiegetal: {report.numbers.expression.number}
                      </h3>
                      <p className="text-gray-600">{report.numbers.expression.description}</p>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-indigo-800 flex items-center gap-2">
                        <Heart className="h-5 w-5 text-red-500" /> Hartgetal: {report.numbers.soulurge.number}
                      </h3>
                      <p className="text-gray-600">{report.numbers.soulurge.description}</p>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-indigo-800 flex items-center gap-2">
                        <User className="h-5 w-5 text-green-500" /> Persoonlijkheidsgetal: {report.numbers.personality.number}
                      </h3>
                      <p className="text-gray-600">{report.numbers.personality.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Call to Action */}
            <div className="mt-12 text-center">
              <h2 className="text-2xl font-bold text-indigo-900 mb-4">
                Klaar om Meer te Ontdekken?
              </h2>
              <p className="text-gray-600 mb-6">
                Verbind met een AI Tarot Psychic om dieper in je numerologische reis te duiken en verdere inzichten te ontgrendelen.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
               <Button
  variant="brand"
  className="
    relative overflow-hidden rounded-full 
    text-white text-base sm:text-lg py-3 px-6 shadow-md
    bg-[linear-gradient(270deg,#7c3aed,#4f46e5,#ec4899)] bg-[length:600%_600%]
    animate-[gradientShift_8s_ease_infinite,pulse_3s_ease-in-out_infinite]
  "
  onClick={() => navigate("/register")}
>
  1 minuut gratis chat met een coach
</Button>

<style>
{`
@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
`}
</style>
              </div>
            </div>

            {/* Modal for Initial Report Display */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
              <DialogContent className="max-w-lg p-6 bg-white dark:bg-slate-950 rounded-lg shadow-xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-indigo-900">
                    Je Numerologie Blauwdruk
                  </DialogTitle>
                </DialogHeader>
                <div className="max-h-[70vh] overflow-y-auto">
                  {renderSummary()}
                </div>
                <Button
                  variant="brand"
                  className="mt-6 w-full rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-base sm:text-lg py-3 px-6 shadow-md transition-all duration-300"
                  onClick={() => setShowModal(false)}
                >
                  Verken Volledig Rapport
                </Button>
              </DialogContent>
            </Dialog>

            {/* Back to Home Button */}
            <div className="mt-8 text-center">
              <Button
                variant="outline"
                className="rounded-full border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 py-3 px-6"
                onClick={() => navigate("/")}
              >
                Terug naar Home
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NumerologyReport;