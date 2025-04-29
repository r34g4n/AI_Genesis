from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class Activity(BaseModel):
    description: str = Field(..., description="What the learner should do, e.g., 'Watch tutorial on X'.")
    frequency: str = Field(..., description="How often or when, e.g., 'Daily', '3×/week'.")


class Resource(BaseModel):
    name: str = Field(..., description="Resource title, e.g., 'Duolingo'.")
    type: Literal["app", "podcast", "book", "documentation", "other"] = Field(
        ..., description="Resource type, e.g., 'app', 'podcast', 'book'."
    )
    url: Optional[str] = Field(None, description="Optional URL to access resource.")


class WeekPlan(BaseModel):
    week_number: int = Field(..., description="Sequential week index starting at 1.")
    focus: str = Field(..., description="The primary learning objective for the week.")
    activities: List[Activity] = Field(..., description="List of learning activities for the week.")
    resources: List[Resource] = Field(..., description="List of core resources used this week.")
    checkpoint: str = Field(..., description="Concrete deliverable or assessment at end of the week.")


class LearningPlan(BaseModel):
    topic: str = Field(..., description="The subject or skill the learner wishes to acquire.")
    duration_weeks: int = Field(..., description="Total length of the plan in weeks.")
    weekly_plans: List[WeekPlan] = Field(..., description="Ordered list of per-week plans.")
