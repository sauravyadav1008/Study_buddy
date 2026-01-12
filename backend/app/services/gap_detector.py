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

            # Update profile
            analysis = json.loads(response[start_idx:end_idx])
            
            # Update topic mastery and topics dict
            import uuid
            from app.memory.user_profile import TopicState
            
            mastery_updates = analysis.get("topic_mastery_updates", {})
            for topic_name, delta in mastery_updates.items():
                if topic_name not in profile.topics:
                    profile.topics[topic_name] = TopicState(
                        topic_id=str(uuid.uuid4()),
                        name=topic_name
                    )
                
                topic = profile.topics[topic_name]
                current_m = profile.topic_mastery.get(topic_name, 0.0)
                new_m = max(0.0, min(1.0, current_m + delta))
                profile.topic_mastery[topic_name] = new_m
                topic.mastery = new_m
                
                # Update status based on new mastery
                if topic.mastery < 0.40:
                    topic.status = "weak"
                else:
                    topic.status = "strong"

            # Handle new concepts and weak areas lists from LLM
            new_concepts = analysis.get("new_concepts", [])
            weak_areas = analysis.get("weak_areas", [])
            
            for nc in new_concepts:
                if nc not in profile.topics:
                    profile.topics[nc] = TopicState(
                        topic_id=str(uuid.uuid4()),
                        name=nc,
                        status="strong",
                        mastery=0.5
                    )
                    profile.topic_mastery[nc] = 0.5
                elif profile.topics[nc].status != "strong":
                    profile.topics[nc].status = "strong"
                    profile.topics[nc].mastery = max(profile.topics[nc].mastery, 0.4)
                    profile.topic_mastery[nc] = profile.topics[nc].mastery

            for wa in weak_areas:
                if wa not in profile.topics:
                    profile.topics[wa] = TopicState(
                        topic_id=str(uuid.uuid4()),
                        name=wa,
                        status="weak",
                        mastery=0.2
                    )
                    profile.topic_mastery[wa] = 0.2
                elif profile.topics[wa].status != "weak":
                    profile.topics[wa].status = "weak"
                    profile.topics[wa].mastery = min(profile.topics[wa].mastery, 0.3)
                    profile.topic_mastery[wa] = profile.topics[wa].mastery

            # Final sync of lists
            profile.known_concepts = [name for name, t in profile.topics.items() if t.status == "strong"]
            profile.weak_areas = [name for name, t in profile.topics.items() if t.status == "weak"]
            
            # Adjust confidence
            profile.confidence_score = max(0.0, min(1.0, profile.confidence_score + analysis.get("confidence_delta", 0)))

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
