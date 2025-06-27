#!/usr/bin/env python3
"""
Create PostgreSQL database for Baghchal Royale
"""
import asyncio
import asyncpg
import sys

async def create_database():
    """Create the baghchal_royale database if it doesn't exist."""
    # Try different connection methods
    connection_configs = [
        # Try with no password
        {'host': 'localhost', 'port': 5432, 'user': 'shishirlamichhane', 'database': 'postgres'},
        # Try with postgres user (no password)
        {'host': 'localhost', 'port': 5432, 'user': 'postgres', 'database': 'postgres'},
        # Try with just database connection
        {'host': 'localhost', 'port': 5432, 'database': 'postgres'},
    ]
    
    for i, config in enumerate(connection_configs):
        try:
            print(f"🔄 Trying connection method {i+1}...")
            conn = await asyncpg.connect(**config)
            
            # Try to create user if we're connected as postgres
            if config.get('user') == 'postgres':
                try:
                    await conn.execute("CREATE USER shishirlamichhane WITH SUPERUSER")
                    print("✅ Created user 'shishirlamichhane'")
                except Exception as e:
                    print(f"ℹ️  User might already exist: {e}")
            
            # Check if our database exists
            result = await conn.fetchval(
                "SELECT 1 FROM pg_database WHERE datname = 'baghchal_royale'"
            )
            
            if result:
                print("✅ Database 'baghchal_royale' already exists")
            else:
                # Create the database
                await conn.execute("CREATE DATABASE baghchal_royale")
                print("✅ Created database 'baghchal_royale'")
            
            await conn.close()
            return True
            
        except Exception as e:
            print(f"❌ Connection method {i+1} failed: {e}")
            continue
    
    print("❌ All connection methods failed")
    return False

if __name__ == "__main__":
    success = asyncio.run(create_database())
    sys.exit(0 if success else 1) 