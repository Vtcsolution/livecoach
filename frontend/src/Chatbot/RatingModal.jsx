import { useState } from "react";
import { Star, X, User, MessageCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import axios from "axios";

const RatingModal = ({ 
  isOpen, 
  onClose, 
  psychic, 
  sessionId,
  onRatingSubmitted 
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Selecteer een beoordeling");
      return;
    }

    if (comment.trim().length < 5) {
      toast.error("Schrijf een opmerking (minimaal 5 tekens)");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/ratings`,
        {
          psychicId: psychic._id,
          rating,
          comment: comment.trim(),
          sessionId
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast.success("Bedankt voor je feedback!");
        onRatingSubmitted(response.data.data);
        handleClose();
      }
    } catch (error) {
      console.error("Fout bij het verzenden van beoordeling:", error);
      toast.error(error.response?.data?.message || "Beoordeling verzenden mislukt");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setComment("");
    setHoverRating(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Star className="h-5 w-5 text-amber-500" />
            Beoordeel je sessie
          </DialogTitle>
          <DialogDescription>
            Hoe was je ervaring met {psychic.name}?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Psychic Info */}
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r van-purple-50 naar-pink-50 rounded-lg">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
              {psychic.name?.[0] || "P"}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{psychic.name}</h3>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <User className="h-3 w-3" />
                Menselijk medium
              </p>
            </div>
          </div>

          {/* Rating Stars */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Hoe zou je je ervaring beoordelen?
            </label>
            <div className="flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none"
                  aria-label={`Beoordeel ${star} ster${star > 1 ? 'ren' : ''}`}
                >
                  <Star
                    className={`h-10 w-10 ${
                      star <= (hoverRating || rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="text-center">
              <span className="text-sm text-gray-600">
                {rating === 0 ? "Selecteer een beoordeling" : 
                 rating === 1 ? "Slecht" :
                 rating === 2 ? "Matig" :
                 rating === 3 ? "Goed" :
                 rating === 4 ? "Zeer goed" : "Uitstekend"}
              </span>
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Deel je ervaring (optioneel maar gewaardeerd)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Wat vond je goed aan de sessie? Hoe kan het verbeterd worden?"
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Minimaal 5 tekens</span>
              <span>{comment.length}/500</span>
            </div>
          </div>

          {/* Tips for Good Feedback */}
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-1">
              Tips voor nuttige feedback:
            </h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li className="flex items-start gap-1">
                <MessageCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                Was het medium inzichtelijk en behulpzaam?
              </li>
              <li className="flex items-start gap-1">
                <Clock className="h-3 w-3 mt-0.5 flex-shrink-0" />
                Was de responstijd redelijk?
              </li>
              <li className="flex items-start gap-1">
                <Star className="h-3 w-3 mt-0.5 flex-shrink-0" />
                Zou je dit medium aan anderen aanbevelen?
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1"
              disabled={submitting}
            >
              <X className="mr-2 h-4 w-4" />
              Overslaan
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              disabled={submitting || rating === 0 || comment.trim().length < 5}
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Verzenden...
                </>
              ) : (
                <>
                  <Star className="mr-2 h-4 w-4" />
                  Beoordeling verzenden
                </>
              )}
            </Button>
          </div>

          {/* Privacy Note */}
          <p className="text-xs text-gray-500 text-center">
            Je feedback helpt onze service te verbeteren. Beoordelingen zijn anoniem en zichtbaar voor andere gebruikers.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RatingModal;
