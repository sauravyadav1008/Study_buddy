from app.memory.user_profile import load_user_profile
from app.memory.summary import load_user_summary, save_user_summary
from app.memory.history import clear_history
from app.vectorstore.retriever import retrieve_context
from app.services.gap_detector import GapDetector
from app.agents.study_agent import StudyAgent
from app.services.assessment_service import AssessmentService
from app.api.upload import get_user_uploaded_content, clear_user_uploaded_content
from fastapi import BackgroundTasks

import logging

logger = logging.getLogger(__name__)

class TutorService:
    def __init__(self):
        self.agent = StudyAgent()
        self.assessment_service = AssessmentService()
        self.gap_detector = GapDetector()

    async def reset_user(self, user_id: str):
        try:
            import uuid
            from app.memory.user_profile import UserProfile, save_user_profile
            
            # 1. Clear in-memory history
            self.agent.clear_memory(user_id)
            
            # 2. Clear on-disk history
            clear_history(user_id)
            
            # 3. Initialize fresh empty state
            new_profile = UserProfile(
                user_id=user_id,
                current_session_id=str(uuid.uuid4()),
                topics={},
                mastery=0.0,
                weak_areas=[],
                known_concepts=[]
            )
            save_user_profile(new_profile)
            
            # 4. Clear summary
            import os
            from app.config import settings
            summary_path = os.path.join(settings.USER_DATA_PATH, f"{user_id}_summary.txt")
            if os.path.exists(summary_path):
                os.remove(summary_path)
                
            # 5. Clear uploaded file content
            clear_user_uploaded_content(user_id)
                
            return True
        except Exception as e:
            logger.error(f"Error resetting user {user_id}: {e}")
            return False

    async def _background_tasks(self, user_id: str, message: str, history: str, profile, session_id: str, output: str):
        try:
            # 1. Detect Gaps and Update Profile
            await self.gap_detector.analyze_and_update(user_id, message, history, profile)
            
            # 2. Save Session History
            from app.memory.history import SessionHistory, ChatMessage, save_session_history
            from datetime import datetime
            
            session = SessionHistory(
                session_id=session_id,
                user_id=user_id,
                messages=[
                    ChatMessage(role="user", content=message),
                    ChatMessage(role="assistant", content=output)
                ],
                mastered_concepts=profile.known_concepts,
                weak_areas=profile.weak_areas,
                topic_mastery=profile.topic_mastery,
                created_at=datetime.now()
            )
            save_session_history(session)
        except Exception as e:
            logger.error(f"Error in background tasks: {e}")

    async def stream_response(self, user_id: str, message: str, session_id: str = "default", background_tasks: BackgroundTasks = None):
        try:
            import asyncio
            # Load user context and retrieve materials in parallel
            profile_task = asyncio.to_thread(load_user_profile, user_id)
            summary_task = asyncio.to_thread(load_user_summary, user_id)
            
            # Check for uploaded content
            uploaded_content = get_user_uploaded_content(user_id)
            
            if uploaded_content:
                context = uploaded_content
                profile = await profile_task
                summary = await summary_task
            else:
                context_task = retrieve_context(message)
                try:
                    profile, summary, context = await asyncio.wait_for(
                        asyncio.gather(profile_task, summary_task, context_task),
                        timeout=30.0
                    )
                except asyncio.TimeoutError:
                    logger.error(f"Timeout gathering context for user {user_id}")
                    profile = load_user_profile(user_id)
                    summary = ""
                    context = ""
            
            full_output = ""
            async for chunk in self.agent.stream(
                user_id=user_id,
                input_text=message,
                profile=profile,
                summary=summary,
                context=context,
                is_file_context=bool(uploaded_content)
            ):
                full_output += chunk
                yield chunk

            # After streaming finishes, run background tasks
            history = f"User: {message}\nAssistant: {full_output}"
            
            if background_tasks:
                background_tasks.add_task(self._background_tasks, user_id, message, history, profile, session_id, full_output)
            else:
                await self._background_tasks(user_id, message, history, profile, session_id, full_output)

        except Exception as e:
            logger.error(f"Error in TutorService streaming: {e}", exc_info=True)
            yield f"Error: {str(e)}"

    async def get_response(self, user_id: str, message: str, session_id: str = "default", background_tasks: BackgroundTasks = None):
        try:
            import asyncio
            # 1 & 2. Load User Context and Retrieve Relevant Materials in parallel
            profile_task = asyncio.to_thread(load_user_profile, user_id)
            summary_task = asyncio.to_thread(load_user_summary, user_id)
            
            # Check for uploaded content
            uploaded_content = get_user_uploaded_content(user_id)
            
            if uploaded_content:
                context = uploaded_content
                profile = await profile_task
                summary = await summary_task
            else:
                context_task = retrieve_context(message)
                try:
                    profile, summary, context = await asyncio.wait_for(
                        asyncio.gather(profile_task, summary_task, context_task),
                        timeout=30.0
                    )
                except asyncio.TimeoutError:
                    logger.error(f"Timeout gathering context for user {user_id}")
                    profile = load_user_profile(user_id)
                    summary = ""
                    context = ""
            
            # 3. Get Agent Response
            response = await self.agent.run(
                user_id=user_id,
                input_text=message,
                profile=profile,
                summary=summary,
                context=context,
                is_file_context=bool(uploaded_content)
            )
            
            output = response["output"]
            history = response.get("history", "")

            # Schedule background work
            if background_tasks:
                background_tasks.add_task(self._background_tasks, user_id, message, history, profile, session_id, output)
            else:
                # Fallback if no background tasks provided (e.g. testing)
                await self._background_tasks(user_id, message, history, profile, session_id, output)

            return {
                "response": output,
                "mastery_updates": profile.topic_mastery
            }
        except Exception as e:
            logger.error(f"Error in TutorService: {e}", exc_info=True)
            raise e

# Shared instance
tutor_service = TutorService()
