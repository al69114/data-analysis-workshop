from typing import Any, Literal, Optional
from pydantic import BaseModel, Field


ModuleCategory = Literal["data", "science", "visualization", "machine-learning"]


class ModuleOptionChoice(BaseModel):
    value: str
    label: str


class ModuleOption(BaseModel):
    key: str
    label: str
    default: Any
    help_text: str
    type: Literal["text", "number", "select", "boolean"] = "text"
    choices: list[ModuleOptionChoice] = Field(default_factory=list)


class ModuleDefinition(BaseModel):
    id: str
    title: str
    package: str
    category: ModuleCategory
    description: str
    learner_goal: str
    badge: Optional[str] = None
    options: list[ModuleOption] = Field(default_factory=list)


class ProjectBlock(BaseModel):
    id: str
    module_id: str
    settings: dict[str, Any] = Field(default_factory=dict)


class GenerateRequest(BaseModel):
    project_name: str = "My First Data Science Project"
    blocks: list[ProjectBlock]


class GenerateResponse(BaseModel):
    code: str
    imports: list[str]
    notes: list[str]


class ExecuteRequest(BaseModel):
    project_name: str = "My First Data Science Project"
    blocks: list[ProjectBlock]
    custom_csv: Optional[str] = None


class MetricItem(BaseModel):
    label: str
    value: str | float | int
    description: Optional[str] = None
    status: Optional[Literal["good", "neutral", "attention"]] = None


class DataPreview(BaseModel):
    columns: list[str]
    rows: list[dict[str, Any]]
    total_rows: int
    total_columns: int


class BlockExecutionResult(BaseModel):
    block_id: str
    module_id: str
    title: str
    package: str
    category: ModuleCategory
    success: bool
    summary: str
    logs: list[str] = Field(default_factory=list)
    chart_base64: Optional[str] = None
    data_preview: Optional[DataPreview] = None
    metrics: list[MetricItem] = Field(default_factory=list)
    error: Optional[str] = None


class ExecuteResponse(BaseModel):
    success: bool
    results: list[BlockExecutionResult]
    execution_time_ms: float
    summary_insight: str
    notes: list[str] = Field(default_factory=list)
    error: Optional[str] = None


class PresetUseCase(BaseModel):
    id: str
    title: str
    subtitle: str
    description: str
    category: str
    icon: str
    difficulty: Literal["Beginner", "Intermediate", "Advanced"]
    blocks: list[ProjectBlock]
    key_takeaway: str
