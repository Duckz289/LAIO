from datetime import date, timedelta


def calculate_sm2(
    current_ease: float,
    current_interval: int,
    current_repetition: int,
    score: int,
) -> dict:
    """
    SuperMemo 2 algorithm.
    
    Args:
        current_ease: Current ease factor (min 1.3)
        current_interval: Current interval in days
        current_repetition: Number of consecutive correct reviews
        score: User's score (0-5)
    
    Returns:
        dict with new ease_factor, interval_days, repetition_count, next_review_date
    """
    if score < 0 or score > 5:
        raise ValueError("Score must be between 0 and 5")
    
    if score >= 3:
        # Correct answer
        if current_repetition == 0:
            new_interval = 1
        elif current_repetition == 1:
            new_interval = 6
        else:
            new_interval = round(current_interval * current_ease)
        
        new_repetition = current_repetition + 1
    else:
        # Incorrect answer - reset
        new_interval = 1
        new_repetition = 0
    
    # Calculate new ease factor
    new_ease = current_ease + (0.1 - (5 - score) * (0.08 + (5 - score) * 0.02))
    new_ease = max(1.3, new_ease)  # Minimum ease factor is 1.3
    
    # Calculate next review date
    next_review = date.today() + timedelta(days=new_interval)
    
    return {
        "ease_factor": round(new_ease, 2),
        "interval_days": new_interval,
        "repetition_count": new_repetition,
        "next_review_date": next_review,
    }