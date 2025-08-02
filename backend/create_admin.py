#!/usr/bin/env python3
"""
Create an admin user for Baghchal Royale
"""
import asyncio
import sys
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import AsyncSessionLocal
from app.crud.user import user as user_crud
from app.schemas.user import UserCreate


async def create_admin_user():
    """Create an admin user with admin/admin credentials."""
    
    async with AsyncSessionLocal() as db:
        # Check if admin user already exists
        existing_user = await user_crud.get_by_username(db, username="admin")
        if existing_user:
            print("✅ Admin user already exists!")
            print(f"   Username: {existing_user.username}")
            print(f"   Email: {existing_user.email}")
            print(f"   Role: {existing_user.role}")
            return existing_user
        
        # Create admin user
        admin_user_data = UserCreate(
            email="admin@baghchal.com",
            username="admin",
            password="admin",
            is_superuser=True,  # This will set role to ADMIN
            country="Nepal"
        )
        
        try:
            admin_user = await user_crud.create(db, obj_in=admin_user_data)
            print("🎉 Admin user created successfully!")
            print(f"   Username: {admin_user.username}")
            print(f"   Email: {admin_user.email}")
            print(f"   Role: {admin_user.role}")
            print(f"   User ID: {admin_user.user_id}")
            print("\n🔐 Login credentials:")
            print("   Username: admin")
            print("   Password: admin")
            return admin_user
            
        except Exception as e:
            print(f"❌ Error creating admin user: {e}")
            return None


if __name__ == "__main__":
    print("🔧 Creating admin user for Baghchal Royale...")
    
    try:
        result = asyncio.run(create_admin_user())
        if result:
            print("\n✅ Admin user setup complete!")
        else:
            print("\n❌ Failed to create admin user!")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Script failed: {e}")
        sys.exit(1) 