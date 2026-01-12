import json
import logging
from datetime import datetime
from app.llm.ollama_client import get_ollama_llm
from app.llm.prompts import MCQ_GENERATION_PROMPT, QA_GENERATION_PROMPT, GRADING_PROMPT
from app.vectorstore.retriever import retrieve_context
from app.memory.user_profile import load_user_profile, save_user_profile
from app.services.question_store import question_store
from app.api.upload import get_user_uploaded_content

logger = logging.getLogger(__name__)

class AssessmentService:
    def __init__(self):
        self.llm = get_ollama_llm(temperature=0.7)
        self.grading_llm = get_ollama_llm(temperature=0)

    async def generate_mcqs(self, user_id: str, topics: list[str], count: int = 5, query: str = None):
        profile = load_user_profile(user_id)
        search_query = f"{' '.join(topics)} {query}" if query else " ".join(topics)
        
        # Check for uploaded content first
        uploaded_content = get_user_uploaded_content(user_id)
        if uploaded_content:
            context = uploaded_content
            logger.info(f"Using uploaded content as context for MCQ generation (user: {user_id})")
        else:
            context = await retrieve_context(search_query)
            logger.info(f"Retrieved context from vector store for MCQ generation (user: {user_id})")
        
        if not context:
            logger.warning(f"No context found for MCQ generation (user: {user_id}, query: {search_query})")
        
        if query:
            topics_str = f"{query} (within topics: {', '.join(topics)})" if topics else query
        else:
            topics_str = ", ".join(topics)
            
        prompt = MCQ_GENERATION_PROMPT.format(count=count, topics=topics_str, context=context)
        
        logger.info(f"Generating {count} MCQs for topics: {topics_str}")
        response = await self.llm.ainvoke(prompt)
        # Extract content from AIMessage
        content = response.content if hasattr(response, 'content') else str(response)
        
        logger.debug(f"LLM response for MCQ: {content}")
        questions = self._parse_json(content)
        
        if questions is None:
            logger.error(f"Failed to parse MCQs from LLM response. Content: {content[:500]}...")
            return None # Keep None for now to trigger 500, but we'll see if we want to change it
        
        if not isinstance(questions, list):
            questions = [questions]

        if isinstance(questions, list):
            for q in questions:
                q["topic"] = topics[0] if topics else "General"
                q["type"] = "MCQ"
                q_id = question_store.save_question(q)
                q["id"] = q_id
        
        return questions

    async def generate_qa(self, user_id: str, topics: list[str], size: str = "medium", count: int = 3, query: str = None):
        profile = load_user_profile(user_id)
        search_query = f"{' '.join(topics)} {query}" if query else " ".join(topics)
        
        # Check for uploaded content first
        uploaded_content = get_user_uploaded_content(user_id)
        if uploaded_content:
            context = uploaded_content
            logger.info(f"Using uploaded content as context for QA generation (user: {user_id})")
        else:
            context = await retrieve_context(search_query)
            logger.info(f"Retrieved context from vector store for QA generation (user: {user_id})")
        
        if not context:
            logger.warning(f"No context found for QA generation (user: {user_id}, query: {search_query})")
        
        if query:
            topics_str = f"{query} (within topics: {', '.join(topics)})" if topics else query
        else:
            topics_str = ", ".join(topics)
            
        prompt = QA_GENERATION_PROMPT.format(count=count, size=size, topics=topics_str, context=context)
        
        logger.info(f"Generating {count} QA for topics: {topics_str}")
        response = await self.llm.ainvoke(prompt)
        # Extract content from AIMessage
        content = response.content if hasattr(response, 'content') else str(response)
        
        logger.debug(f"LLM response for QA: {content}")
        questions = self._parse_json(content)
        
        if questions is None:
            logger.error(f"Failed to parse QA from LLM response. Content: {content[:500]}...")
            return None
        
        if not isinstance(questions, list):
            questions = [questions]

        if isinstance(questions, list):
            for q in questions:
                q["topic"] = topics[0] if topics else "General"
                q["type"] = "QA"
                q_id = question_store.save_question(q)
                q["id"] = q_id
        
        return questions

    async def grade_mcq(self, user_id: str, question_id: str, selected_option: int):
        stored_q = question_store.get_question(question_id)
        if not stored_q or stored_q.get("type") != "MCQ":
            return None
        
        correct_answer = stored_q.get("correct_answer")
        is_correct = (selected_option == correct_answer)
        topic_name = stored_q.get("topic")
        
        profile = load_user_profile(user_id)
        self._update_mastery(profile, topic_name, 1.0 if is_correct else 0.0)
        save_user_profile(profile)
        
        return {
            "is_correct": is_correct,
            "correct_option": correct_answer,
            "explanation": stored_q.get("explanation", "")
        }

    async def grade_answer(self, user_id: str, topic: str = None, question: str = None, key_points: str = None, user_answer: str = None, question_id: str = None):
        if question_id:
            stored_q = question_store.get_question(question_id)
            if stored_q:
                question = stored_q.get("question")
                key_points = stored_q.get("suggested_answer_key_points")
                topic = stored_q.get("topic")
        
        if not question or not key_points:
            return None

        prompt = GRADING_PROMPT.format(question=question, key_points=key_points, user_answer=user_answer)
        response = await self.grading_llm.ainvoke(prompt)
        # Extract content from AIMessage
        content = response.content if hasattr(response, 'content') else str(response)
        result = self._parse_json(content)
        
        if result and topic:
            total_score = result.get("total_score", 0)
            # Scoring:
            # Score >= 4 → correct (+1)
            # Score < 4 → incorrect (0)
            points = 1.0 if total_score >= 4 else 0.0
            
            profile = load_user_profile(user_id)
            self._update_mastery(profile, topic, points)
            save_user_profile(profile)
            
        return result

    def _update_mastery(self, profile, topic_name, points):
        from app.memory.user_profile import TopicState
        import uuid
        
        if topic_name not in profile.topics:
            profile.topics[topic_name] = TopicState(
                topic_id=str(uuid.uuid4()),
                name=topic_name
            )
        
        topic = profile.topics[topic_name]
        topic.attempted += 1
        topic.correct += points
        # Formula (ONLY): mastery = correct_answers / questions_attempted
        topic.mastery = round(topic.correct / topic.attempted, 4)
        
        # Update status
        if topic.attempted == 0:
            topic.status = "unassessed"
        elif topic.mastery < 0.40:
            topic.status = "weak"
        else:
            topic.status = "strong"
        
        topic.last_assessed = datetime.now()
        
        # Update Strong/Weak areas lists based on status
        if topic.status == "strong":
            if topic_name not in profile.known_concepts:
                profile.known_concepts.append(topic_name)
            if topic_name in profile.weak_areas:
                profile.weak_areas.remove(topic_name)
        elif topic.status == "weak":
            if topic_name not in profile.weak_areas:
                profile.weak_areas.append(topic_name)
            if topic_name in profile.known_concepts:
                profile.known_concepts.remove(topic_name)
        
        # Sync with old topic_mastery for compatibility
        profile.topic_mastery[topic_name] = topic.mastery

    def _parse_json(self, text: str):
        if not isinstance(text, str):
            logger.error(f"Expected string for JSON parsing, got {type(text)}")
            try:
                text = text.content if hasattr(text, 'content') else str(text)
            except:
                return None

        # Clean up common LLM artifacts
        text = text.strip()
        
        # Remove markdown code blocks if present
        if text.startswith("```"):
            # Find the end of the first line (e.g., ```json)
            first_newline = text.find("\n")
            if first_newline != -1:
                text = text[first_newline:].strip()
            # Remove trailing ```
            if text.endswith("```"):
                text = text[:-3].strip()
        
        # Try direct parsing first
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        try:
            # Find all JSON blocks
            # We'll look for [ ] first as it's the expected format
            start_bracket = text.find("[")
            end_bracket = text.rfind("]")
            
            if start_bracket != -1 and end_bracket != -1 and end_bracket > start_bracket:
                json_str = text[start_bracket:end_bracket+1]
                try:
                    return json.loads(json_str)
                except json.JSONDecodeError:
                    pass

            # If no list found or parsing failed, try finding all { } blocks
            import re
            # Extract anything that looks like a JSON object
            # This handles cases where LLM returns multiple objects not in a list
            blocks = []
            depth = 0
            start = -1
            for i, char in enumerate(text):
                if char == '{':
                    if depth == 0:
                        start = i
                    depth += 1
                elif char == '}':
                    depth -= 1
                    if depth == 0 and start != -1:
                        blocks.append(text[start:i+1])
                        start = -1
            
            if blocks:
                results = []
                for b in blocks:
                    try:
                        # Clean up common JSON errors within blocks
                        # e.g., trailing commas
                        b_cleaned = re.sub(r',\s*}', '}', b)
                        results.append(json.loads(b_cleaned))
                    except json.JSONDecodeError:
                        continue
                if results:
                    return results

            return None
        except Exception as e:
            logger.error(f"Error parsing JSON from LLM: {e}")
            logger.error(f"Raw text: {text}")
            return None
