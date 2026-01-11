from app.llm.ollama_client import get_ollama_llm
import json
from app.llm.prompts import get_study_prompt, get_file_study_prompt
from app.memory.conversation import get_conversation_memory
from langchain_core.output_parsers import StrOutputParser

class StudyAgent:
    def __init__(self):
        self.llm = get_ollama_llm()
        self.prompt = get_study_prompt()
        self.file_prompt = get_file_study_prompt()
        # In a real app, you'd manage memories in a dictionary or database
        self.memories = {}

    def _get_memory(self, user_id: str):
        if user_id not in self.memories:
            self.memories[user_id] = get_conversation_memory(user_id)
        return self.memories[user_id]

    def clear_memory(self, user_id: str):
        if user_id in self.memories:
            del self.memories[user_id]

    async def stream(self, user_id: str, input_text: str, profile, summary: str, context: str, is_file_context: bool = False):
        memory = self._get_memory(user_id)
        memory_vars = memory.load_memory_variables({})
        history = memory_vars.get("history", [])
        
        prompt = self.file_prompt if is_file_context else self.prompt
        chain = prompt | self.llm | StrOutputParser()
        
        full_response = ""
        
        params = {
            "input": input_text,
            "history": history,
            "context": context
        }
        
        if not is_file_context:
            params.update({
                "knowledge_level": profile.knowledge_level,
                "known_concepts": ", ".join(profile.known_concepts),
                "weak_areas": ", ".join(profile.weak_areas),
                "explanation_preference": profile.explanation_preference,
                "topic_mastery": json.dumps({k: v.dict() for k, v in profile.topics.items()}, default=str),
                "summary": summary
            })

        async for chunk in chain.astream(params):
            full_response += chunk
            yield chunk
        
        # Save the interaction after stream finishes
        memory.save_context({"input": input_text}, {"output": full_response})

    async def run(self, user_id: str, input_text: str, profile, summary: str, context: str, is_file_context: bool = False):
        memory = self._get_memory(user_id)
        
        # Load memory variables
        memory_vars = memory.load_memory_variables({})
        history = memory_vars.get("history", [])
        
        # Build the chain using LCEL
        prompt = self.file_prompt if is_file_context else self.prompt
        chain = prompt | self.llm | StrOutputParser()
        
        params = {
            "input": input_text,
            "history": history,
            "context": context
        }
        
        if not is_file_context:
            params.update({
                "knowledge_level": profile.knowledge_level,
                "known_concepts": ", ".join(profile.known_concepts),
                "weak_areas": ", ".join(profile.weak_areas),
                "explanation_preference": profile.explanation_preference,
                "topic_mastery": json.dumps({k: v.dict() for k, v in profile.topics.items()}, default=str),
                "summary": summary
            })

        output_text = await chain.ainvoke(params)
        
        # Save the interaction to memory
        memory.save_context({"input": input_text}, {"output": output_text})
        
        return {
            "output": output_text,
            "history": memory.load_memory_variables({})["history"]
        }
