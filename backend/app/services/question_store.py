import uuid

class QuestionStore:
    def __init__(self):
        self._questions = {}

    def save_question(self, question: dict) -> str:
        q_id = str(uuid.uuid4())
        self._questions[q_id] = question
        return q_id

    def get_question(self, question_id: str) -> dict:
        return self._questions.get(question_id)

question_store = QuestionStore()
