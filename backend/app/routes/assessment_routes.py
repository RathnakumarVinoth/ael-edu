from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from database import get_db
from app.models.assessment import AssessmentSession, StudentAnswer
from app.models.quiz import Quiz, QuizQuestion
from app.models.question import Question
from app.models.hint import Hint
from app.schemas.assessment_schema import (
    AssessmentStartResponse,
    QuizQuestionForStudent,
    AnswerSubmitRequest,
    AnswerSubmitResponse,
    AssessmentCompleteResponse,
    StudentResultResponse,
    AssessmentSessionDetail,
    StudentAnswerResponse,
    HintResponse,
)
from app.core.security import require_role

router = APIRouter()


@router.post("/assessments/start/{quiz_id}", response_model=AssessmentStartResponse)
def start_assessment(quiz_id: int, db: Session = Depends(get_db), user=Depends(require_role("student"))):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    session = AssessmentSession(student_id=user.id, quiz_id=quiz_id, status="in_progress")
    db.add(session)
    db.commit()
    db.refresh(session)

    # gather questions for the quiz
    qqs = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz_id).all()
    questions_payload: List[QuizQuestionForStudent] = []
    for qq in qqs:
        q = db.query(Question).filter(Question.id == qq.question_id).first()
        if not q:
            continue
        hints = db.query(Hint).filter(Hint.question_id == q.id).all()
        hint_res = [HintResponse(id=h.id, question_id=h.question_id, hint_level=h.hint_level, hint_text=h.hint_text) for h in hints]
        questions_payload.append(
            QuizQuestionForStudent(
                question_id=q.id,
                topic_id=q.topic_id,
                difficulty_level=q.difficulty_level,
                question_text=q.question_text,
                option_a=q.option_a,
                option_b=q.option_b,
                option_c=q.option_c,
                option_d=q.option_d,
                marks=q.marks,
                expected_time=q.expected_time,
                hints=hint_res,
            )
        )

    return AssessmentStartResponse(session_id=session.id, quiz_id=quiz_id, started_at=session.started_at, questions=questions_payload)


@router.post("/assessments/{session_id}/submit-answer", response_model=AnswerSubmitResponse)
def submit_answer(session_id: int, payload: AnswerSubmitRequest, db: Session = Depends(get_db), user=Depends(require_role("student"))):
    session = db.query(AssessmentSession).filter(AssessmentSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment session not found")
    if session.student_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your assessment session")
    if session.status != "in_progress":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assessment is not in progress")

    q = db.query(Question).filter(Question.id == payload.question_id).first()
    if not q:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    # compare answers (case-insensitive)
    is_correct = False
    if q.correct_answer is not None and payload.answer is not None:
        try:
            is_correct = q.correct_answer.strip().lower() == payload.answer.strip().lower()
        except Exception:
            is_correct = False

    marks_awarded = q.marks if is_correct and q.marks else 0

    ans = StudentAnswer(
        assessment_session_id=session.id,
        student_id=user.id,
        quiz_id=session.quiz_id,
        question_id=q.id,
        answer=payload.answer,
        time_taken=payload.time_taken,
        hints_used=payload.hints_used,
        attempts=payload.attempts,
        is_correct=is_correct,
        marks_awarded=marks_awarded,
        emotion_state=payload.emotion_state,
        attention_score=payload.attention_score,
    )
    db.add(ans)
    db.commit()
    db.refresh(ans)

    return AnswerSubmitResponse(question_id=q.id, is_correct=is_correct, marks_awarded=marks_awarded)


@router.post("/assessments/complete/{session_id}", response_model=AssessmentCompleteResponse)
def complete_assessment(session_id: int, db: Session = Depends(get_db), user=Depends(require_role("student"))):
    session = db.query(AssessmentSession).filter(AssessmentSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment session not found")
    if session.student_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your assessment session")
    if session.status != "in_progress":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assessment already completed or not in progress")

    # total marks = sum of marks for questions in quiz
    qqs = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == session.quiz_id).all()
    total_marks = 0
    question_ids = [qq.question_id for qq in qqs]
    questions = db.query(Question).filter(Question.id.in_(question_ids)).all() if question_ids else []
    for q in questions:
        total_marks += q.marks or 0

    # obtained marks = sum of marks_awarded for this session
    answers = db.query(StudentAnswer).filter(StudentAnswer.assessment_session_id == session.id).all()
    obtained = sum(a.marks_awarded or 0 for a in answers)

    percentage = (obtained / total_marks * 100) if total_marks and total_marks > 0 else 0.0

    session.total_marks = total_marks
    session.obtained_marks = obtained
    session.percentage = percentage
    session.status = "completed"
    session.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(session)

    return AssessmentCompleteResponse(session_id=session.id, total_marks=total_marks, obtained_marks=obtained, percentage=percentage, completed_at=session.completed_at)


@router.get("/assessments/my-results", response_model=List[StudentResultResponse])
def my_results(db: Session = Depends(get_db), user=Depends(require_role("student"))):
    sessions = db.query(AssessmentSession).filter(AssessmentSession.student_id == user.id, AssessmentSession.status == "completed").all()
    return sessions


@router.get("/assessments/session/{session_id}", response_model=AssessmentSessionDetail)
def session_detail(session_id: int, db: Session = Depends(get_db), user=Depends(require_role("student"))):
    session = db.query(AssessmentSession).filter(AssessmentSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment session not found")
    if session.student_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your assessment session")

    answers = db.query(StudentAnswer).filter(StudentAnswer.assessment_session_id == session.id).all()
    answer_res = [
        StudentAnswerResponse(
            id=a.id,
            question_id=a.question_id,
            answer=a.answer,
            is_correct=a.is_correct,
            marks_awarded=a.marks_awarded,
            time_taken=a.time_taken,
            hints_used=a.hints_used,
            attempts=a.attempts,
            emotion_state=a.emotion_state,
            attention_score=a.attention_score,
            created_at=a.created_at,
        )
        for a in answers
    ]

    return AssessmentSessionDetail(
        id=session.id,
        quiz_id=session.quiz_id,
        student_id=session.student_id,
        status=session.status,
        started_at=session.started_at,
        completed_at=session.completed_at,
        total_marks=session.total_marks,
        obtained_marks=session.obtained_marks,
        percentage=session.percentage,
        answers=answer_res,
    )
