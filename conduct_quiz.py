import asyncio
import sys
import os
import json

# Add backend to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.services.assessment_service import AssessmentService

async def main():
    service = AssessmentService()
    questions = await service.generate_mcqs("user123", ["NLP", "Computer Vision"], count=3)
    
    if not questions:
        print("ERROR: Failed to generate questions.")
        return

    # Save correct answers internally
    with open("internal_quiz_data.json", "w") as f:
        json.dump(questions, f)

    # Print for user (PHASE 1)
    for i, q in enumerate(questions):
        print(f"Question {i+1}: {q['question']}")
        options = ["A", "B", "C", "D"]
        for j, opt in enumerate(q['options']):
            print(f"  {options[j]}. {opt}")
        print()
    
    print("Please reply with your answers only (example: A B C D).")

if __name__ == "__main__":
    asyncio.run(main())
