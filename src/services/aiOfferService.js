import { fetchOffersFromApi } from "./apiClient";
export async function getAiRecommendedOffers(quizData) {
    // 1. Pobierz aktualne oferty z serwera via cache client
    const availableOffers = await fetchOffersFromApi(quizData);
    if (!availableOffers || availableOffers.length === 0) {
        console.error("Brak dostępnych ofert do rekomendacji");
        return null;
    }
    // 2. Poproś serwer o wybór z aktualnych ofert
    try {
        const response = await fetch('/api/ai-offers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quizData, availableOffers })
        });
        if (!response.ok) {
            throw new Error(`Błąd serwera: ${response.status}`);
        }
        const result = await response.json();
        // 3. Znajdź pełny obiekt oferty na podstawie ID
        const recommended = availableOffers.find((offer) => offer.id === result.recommendedOfferId);
        if (!recommended)
            return null;
        // 4. Mapuj na format oczekiwany przez frontend
        return {
            id: recommended.id,
            name: recommended.name,
            description: result.reasoning || 'Oferta dopasowana do Twojego profilu.',
            interestRate: "0%", // Zastąpione przez RRSO w UI
            maxAmount: result.maxAmount || "Zależnie od zdolności",
            rrso: result.rrso || "0%",
            decisionTime: result.decisionTime || "15 min",
            comment: recommended.comment
        };
    }
    catch (error) {
        console.error("Błąd podczas pobierania rekomendacji AI:", error);
        return null;
    }
}
