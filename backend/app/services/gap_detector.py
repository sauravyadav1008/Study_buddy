import json
import logging
from app.llm.ollama_client import get_ollama_llm
from app.llm.prompts import GAP_DETECTOR_PROMPT
from app.memory.user_profile import UserProfile, save_user_profile

logger = logging.getLogger(__name__)

class GapDetector:
    def __init__(self):
        self.llm = get_ollama_llm(temperature=0)

    async def analyze_and_update(self, user_id: str, user_input: str, history: str, profile: UserProfile):
        prompt = GAP_DETECTOR_PROMPT.format(input=user_input, history=history)
        
        try:
            response = await self.llm.ainvoke(prompt)
            # Find the JSON part in case the LLM adds chatter
            start_idx = response.find("{")
            end_idx = response.rfind("}") + 1
            if start_idx == -1 or end_idx == 0:
                return profile

            analysis = json.loads(response[start_idx:end_idx])
            
            # Update profile
            profile.known_concepts = list(set(profile.known_concepts + analysis.get("new_concepts", [])))
            profile.weak_areas = list(set(profile.weak_areas + analysis.get("weak_areas", [])))
            
            # Adjust confidence
            profile.confidence_score = max(0.0, min(1.0, profile.confidence_score + analysis.get("confidence_delta", 0)))
            
            # Update topic mastery
            mastery_updates = analysis.get("topic_mastery_updates", {})
            for topic, delta in mastery_updates.items():
                current_mastery = profile.topic_mastery.get(topic, 0.0)
                profile.topic_mastery[topic] = max(0.0, min(1.0, current_mastery + delta))

            # Simple logic to upgrade level
            if profile.confidence_score > 0.8 and profile.knowledge_level == "Beginner":
                profile.knowledge_level = "Intermediate"
            elif profile.confidence_score > 0.95 and profile.knowledge_level == "Intermediate":
                profile.knowledge_level = "Advanced"
                
            save_user_profile(profile)
            return profile
        except Exception as e:
            logger.error(f"Error in gap detection: {e}")
            return profile
