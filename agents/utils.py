import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
from state import AgentAnalysis, SeverityLevel

llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash", 
    temperature=0,
    max_retries=2
)

async def analyze_image_category(
    image_url: str, 
    system_prompt: str,
    user_description: str = None
) -> AgentAnalysis:
    """
    Sends image + optional user description to Gemini.
    Enforces strict JSON output including a generated title.
    """
    context_text = "Analyze this image according to your instructions."

    if user_description:
        context_text += f"\n\nUSER REPORT DESCRIPTION: '{user_description}'\n(Use this context to inform the title and reasoning, but prioritize visual evidence for the severity.)"
    formatting_instruction = """
    \nIMPORTANT: You must strictly output ONLY valid JSON. 
    Do not add Markdown formatting (like ```json). 
    
    Generate a concise 'title' (max 10 words) that summarizes the visual content and the user description.
    
    The JSON structure must be:
    {
      "title": "A short, descriptive summary of the incident",
      "confidence": 0.95,
      "severity": "HIGH", 
      "reasoning": "Detailed explanation here"
    }
    """
    
    final_system_prompt = system_prompt + formatting_instruction

    message = HumanMessage(
        content=[
            {"type": "text", "text": context_text},
            {"type": "image_url", "image_url": image_url},
        ]
    )
    
    try:
        response = await llm.ainvoke([SystemMessage(content=final_system_prompt), message])
        raw_content = response.content.replace("```json", "").replace("```", "").strip()
        data = json.loads(raw_content)
        
        return AgentAnalysis(
            title=data.get("title", "Untitled Analysis"), 
            confidence=float(data.get("confidence", 0.0)),
            severity=SeverityLevel(data.get("severity", "LOW")), 
            reasoning=data.get("reasoning", "No reasoning provided")
        )

    except Exception as e:
        print(f" AI Analysis Failed: {e}")
        return AgentAnalysis(
            title="Analysis Error",
            confidence=0.0, 
            severity=SeverityLevel.LOW, 
            reasoning=f"Error during analysis: {str(e)}"
        )