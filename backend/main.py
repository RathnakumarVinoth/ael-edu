from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine

# import models so they are registered with SQLAlchemy metadata
import app.models.user  # noqa: F401
import app.models.course  # noqa: F401
import app.models.subject  # noqa: F401
import app.models.domain  # noqa: F401
import app.models.topic  # noqa: F401
import app.models.question  # noqa: F401
import app.models.hint  # noqa: F401
import app.models.quiz  # noqa: F401
import app.models.assessment  # noqa: F401
import app.models.alwe  # noqa: F401
import app.models.topic_mastery  # noqa: F401
import app.models.learning_recommendation  # noqa: F401

from app.routes.auth_routes import router as auth_router
from app.routes.course_routes import router as course_router
from app.routes.subject_routes import router as subject_router
from app.routes.domain_routes import router as domain_router
from app.routes.topic_routes import router as topic_router
from app.routes.question_routes import router as question_router
from app.routes.quiz_routes import router as quiz_router
from app.routes.assessment_routes import router as assessment_router
from app.routes.alwe_routes import router as alwe_router
from app.routes.topic_mastery_routes import router as topic_mastery_router
from app.routes.dashboard_routes import router as dashboard_router

app = FastAPI(title="AEL-Edu Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {"message": "Welcome to AEL-Edu Backend"}


@app.get("/health")
def health_check():
    return {"status": "AEL-Edu backend running"}


app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(course_router)
app.include_router(subject_router)
app.include_router(domain_router)
app.include_router(topic_router)
app.include_router(question_router, tags=["Questions"])
app.include_router(quiz_router, tags=["Quizzes"])
app.include_router(assessment_router, tags=["Assessments"])
app.include_router(alwe_router, tags=["ALWE"])
app.include_router(topic_mastery_router, tags=["Topic Mastery"])
app.include_router(dashboard_router, tags=["Dashboard"])
