from pydantic import BaseModel


class ProgressSummaryResponse(BaseModel):
    total_vocabulary: int
    due_today: int
    reviews_completed: int
    correct_reviews: int
    accuracy_percentage: float
    current_streak_days: int
