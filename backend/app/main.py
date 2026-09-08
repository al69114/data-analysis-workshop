from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.codegen import generate_project_code
from app.executor import execute_custom_python_code, execute_pipeline
from app.models import (
    CustomCodeExecuteRequest,
    CustomCodeExecuteResponse,
    DatasetProfileRequest,
    DatasetProfileResponse,
    ExecuteRequest,
    ExecuteResponse,
    GenerateRequest,
    GenerateResponse,
    GuidedMission,
    ModuleDefinition,
    PresetUseCase,
    WorkshopStep,
)
from app.modules import GUIDED_MISSIONS, MATPLOTLIB_WORKSHOP_STEPS, MODULES, PRESET_USE_CASES
from app.recommender import profile_dataset


app = FastAPI(
    title="Data Analysis Workshop API",
    description="Interactive backend for visual data analysis, Matplotlib charts, and Scikit-learn models.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "data-analysis-workshop-backend"}


@app.get("/modules", response_model=list[ModuleDefinition])
def list_modules() -> list[ModuleDefinition]:
    return MODULES


@app.get("/presets", response_model=list[PresetUseCase])
def list_presets() -> list[PresetUseCase]:
    return PRESET_USE_CASES


@app.get("/workshops/matplotlib", response_model=list[WorkshopStep])
def list_matplotlib_workshop_steps() -> list[WorkshopStep]:
    return MATPLOTLIB_WORKSHOP_STEPS


@app.get("/guided-missions", response_model=list[GuidedMission])
def list_guided_missions() -> list[GuidedMission]:
    return GUIDED_MISSIONS


@app.post("/datasets/profile", response_model=DatasetProfileResponse)
def dataset_profile(request: DatasetProfileRequest) -> DatasetProfileResponse:
    return profile_dataset(request)



@app.post("/generate", response_model=GenerateResponse)
def generate_code(request: GenerateRequest) -> GenerateResponse:
    return generate_project_code(request)


@app.post("/execute", response_model=ExecuteResponse)
def execute(request: ExecuteRequest) -> ExecuteResponse:
    return execute_pipeline(request)


@app.post("/execute-code", response_model=CustomCodeExecuteResponse)
def execute_code(request: CustomCodeExecuteRequest) -> CustomCodeExecuteResponse:
    return execute_custom_python_code(request)
