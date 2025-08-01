from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import openai
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CodeFixRequest(BaseModel):
    code: str
    error: str

@app.post("/api/ai/fix-code")
async def fix_code(request: CodeFixRequest):
    try:
        openai.api_key = os.getenv("OPENAI_API_KEY")
        
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that fixes TypeScript/React code. Only respond with the fixed code, no explanations."
                },
                {
                    "role": "user",
                    "content": f"Fix this TypeScript/React code. Error: {request.error}\n\nCode:\n```typescript\n{request.code}\n```"
                }
            ],
            temperature=0.3
        )
        
        fixed_code = response.choices[0].message.content.strip()
        # Clean up the response to get just the code
        if "```typescript" in fixed_code:
            fixed_code = fixed_code.split("```typescript")[1].split("```")[0].strip()
        elif "```" in fixed_code:
            fixed_code = fixed_code.split("```")[1].split("```")[0].strip()
            
        return {"fixedCode": fixed_code}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
