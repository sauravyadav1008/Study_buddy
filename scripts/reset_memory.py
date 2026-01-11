import sys
import os
import asyncio
import argparse

# Add backend to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.services.tutor_service import tutor_service

async def main(user_id: str):
    print(f"Resetting memory for user: {user_id}...")
    success = await tutor_service.reset_user(user_id)
    if success:
        print(f"Memory reset successfully for user: {user_id}")
    else:
        print(f"Failed to reset memory for user: {user_id}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Reset user memory.")
    parser.add_argument("user_id", type=str, help="ID of the user to reset.")
    args = parser.parse_args()
    
    asyncio.run(main(args.user_id))
