from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.codegen import generate_project_code
from app.executor import execute_pipeline
from app.models import (
    ExecuteRequest,
    ExecuteResponse,
    GenerateRequest,
    GenerateResponse,
    ModuleDefinition,
    PresetUseCase,
)
from app.modules import MODULES, PRESET_USE_CASES


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


@app.post("/generate", response_model=GenerateResponse)
def generate_code(request: GenerateRequest) -> GenerateResponse:
    return generate_project_code(request)


@app.post("/execute", response_model=ExecuteResponse)
def execute(request: ExecuteRequest) -> ExecuteResponse:
    return execute_pipeline(request)
