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


class ColumnProfile(BaseModel):
    name: str
    inferred_type: Literal["numeric", "categorical", "datetime", "text"]
    missing_values: int = 0
    unique_values: int = 0


class AnalysisSuggestion(BaseModel):
    id: str
    title: str
    chart_type: str
    difficulty: Literal["Beginner", "Intermediate", "Advanced"]
    why: str
    recommended_blocks: list[ProjectBlock] = Field(default_factory=list)
    steps: list[str] = Field(default_factory=list)


class DatasetProfileRequest(BaseModel):
    dataset_name: str = "ronaldo_all_seasons.csv"
    custom_csv: Optional[str] = None


class DatasetProfileResponse(BaseModel):
    dataset_name: str
    preview: DataPreview
    columns: list[ColumnProfile]
    suggestions: list[AnalysisSuggestion]
    notes: list[str] = Field(default_factory=list)


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


class CustomCodeExecuteRequest(BaseModel):
    code: str
    dataset_name: Optional[str] = "sales_marketing.csv"
    custom_csv: Optional[str] = None


class CustomCodeExecuteResponse(BaseModel):
    success: bool
    stdout: str = ""
    stderr: str = ""
    chart_base64: Optional[str] = None
    charts_base64: list[str] = Field(default_factory=list)
    execution_time_ms: float = 0.0
    data_preview: Optional[DataPreview] = None
    error: Optional[str] = None


class CodeToVisualMapping(BaseModel):
    code_snippet: str
    visual_element: str
    explanation: str


class WorkshopStep(BaseModel):
    id: str
    stage: int
    title: str
    subtitle: str
    objective: str
    dataset_name: str
    concept_summary: str
    starter_code: str
    solution_code: str
    code_mappings: list[CodeToVisualMapping] = Field(default_factory=list)
    key_takeaways: list[str] = Field(default_factory=list)
    pro_tips: list[str] = Field(default_factory=list)


class GuidedStep(BaseModel):
    step_number: int
    module_id: str
    target_action: str
    title: str
    description: str
    why_it_matters: str
    expected_output: str
    default_settings: dict[str, Any] = Field(default_factory=dict)
    code_snippet: str


class GuidedMission(BaseModel):
    id: str
    title: str
    subtitle: str
    category: str
    difficulty: Literal["Beginner", "Intermediate", "Advanced"]
    dataset_name: str
    overview: str
    steps: list[GuidedStep]

