from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.services.assessment_service import AssessmentService
from app.vectorstore.retriever import retrieve_context
from app.llm.ollama_client import get_ollama_llm

router = APIRouter()
assessment_service = AssessmentService()

class MCQRequest(BaseModel):
    user_id: str
    topics: List[str]
    query: Optional[str] = None
    count: Optional[int] = 5

class QARequest(BaseModel):
    user_id: str
    topics: List[str]
    query: Optional[str] = None
    size: str = "medium"
    count: Optional[int] = 3

class GradeRequest(BaseModel):
    user_id: str
    topic: str
    question: str
    key_points: str
    user_answer: str

class SubmitQARequest(BaseModel):
    user_id: str
    question_id: str
    user_answer: str

@router.post("/mcq/generate")
async def generate_mcqs(request: MCQRequest):
    questions = await assessment_service.generate_mcqs(request.user_id, request.topics, request.count, request.query)
    if questions is None:
        return [] # Return empty list instead of 500
    return questions

@router.post("/qa/generate")
async def generate_qa(request: QARequest):
    questions = await assessment_service.generate_qa(request.user_id, request.topics, request.size, request.count, request.query)
    if questions is None:
        return [] # Return empty list instead of 500
    return questions

class SubmitMCQRequest(BaseModel):
    user_id: str
    question_id: str
    selected_option: int

class BatchSubmitMCQRequest(BaseModel):
    user_id: str
    answers: dict[str, int]

@router.post("/mcq/submit")
async def submit_mcq(request: SubmitMCQRequest):
    result = await assessment_service.grade_mcq(
        user_id=request.user_id,
        question_id=request.question_id,
        selected_option=request.selected_option
    )
    if not result:
        raise HTTPException(status_code=404, detail="Question not found or grading failed")
    return result

@router.post("/mcq/batch-submit")
async def batch_submit_mcq(request: BatchSubmitMCQRequest):
    results = {}
    for q_id, opt in request.answers.items():
        res = await assessment_service.grade_mcq(request.user_id, q_id, opt)
        if res:
            results[q_id] = res
    return results

class BatchSubmitQARequest(BaseModel):
    user_id: str
    answers: dict[str, str]

@router.post("/qa/submit")
async def submit_qa(request: SubmitQARequest):
    result = await assessment_service.grade_answer(
        user_id=request.user_id,
        user_answer=request.user_answer,
        question_id=request.question_id
    )
    if not result:
        raise HTTPException(status_code=404, detail="Question not found or grading failed")
    return result

@router.post("/qa/batch-submit")
async def batch_submit_qa(request: BatchSubmitQARequest):
    results = {}
    for q_id, ans in request.answers.items():
        res = await assessment_service.grade_answer(
            user_id=request.user_id,
            user_answer=ans,
            question_id=q_id
        )
        if res:
            results[q_id] = res
    return results

@router.post("/grade")
async def grade_answer(request: GradeRequest):
    result = await assessment_service.grade_answer(
        user_id=request.user_id, 
        topic=request.topic, 
        question=request.question, 
        key_points=request.key_points, 
        user_answer=request.user_answer
    )
    if not result:
        raise HTTPException(status_code=500, detail="Failed to grade answer")
    return result

class RevisionRequest(BaseModel):
    user_id: str
    topics: List[str]

@router.post("/revision")
async def generate_revision(request: RevisionRequest):
    # Retrieve context for these topics and summarize/explain them
    context = await retrieve_context(" ".join(request.topics))
    llm = get_ollama_llm(temperature=0.8)
    prompt = f"Explain the following topics in detail to help a student revise. Focus on areas where they might be weak. Topics: {request.topics}. Context: {context}"
    response = await llm.ainvoke(prompt)
    content = response.content if hasattr(response, 'content') else str(response)
    return {"revision_material": content}
