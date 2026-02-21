from fastapi import Request, HTTPException
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_ANON_KEY

_sb = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)


async def get_current_user(request: Request) -> dict:
    """Extract and verify user from Supabase JWT token using Supabase client."""
    auth_header = request.headers.get("Authorization", "")

    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization token")

    token = auth_header.split(" ", 1)[1]

    try:
        user_response = _sb.auth.get_user(token)
        user = user_response.user

        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")

        return {
            "id": user.id,
            "email": user.email,
        }
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
