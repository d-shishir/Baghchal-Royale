import asyncio
from sqlalchemy import text
from app.db.session import AsyncSessionLocal

async def clear_game_history():
    """
    Connects to the database and deletes all records from the 'games' table.
    """
    print("Connecting to the database to clear game history...")
    db = AsyncSessionLocal()
    try:
        print("Deleting all records from the 'games' table...")
        # Using text() for a raw SQL query with SQLAlchemy 2.0 style
        await db.execute(text("DELETE FROM games;"))
        await db.commit()
        print("✅ Game history has been successfully cleared.")
    except Exception as e:
        print(f"An error occurred: {e}")
        await db.rollback()
    finally:
        await db.close()
        print("Database connection closed.")

if __name__ == "__main__":
    asyncio.run(clear_game_history()) 