"""
CLI commands for the Recyclic API
"""
import argparse
import sys
from sqlalchemy.orm import Session
from recyclic_api.core.database import get_db
from recyclic_api.models.user import User, UserRole, UserStatus

def create_super_admin(telegram_id: str, full_name: str):
    """
    Create a super admin user with the given telegram_id and full_name.
    """
    # Parse full name into first and last name
    name_parts = full_name.strip().split(" ", 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ""
    
    # Get database session
    db: Session = next(get_db())
    
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.telegram_id == telegram_id).first()
        if existing_user:
            print(f"❌ User with telegram_id '{telegram_id}' already exists!")
            print(f"   Current role: {existing_user.role}")
            print(f"   Current status: {existing_user.status}")
            sys.exit(1)
        
        # Create new super admin user
        new_user = User(
            telegram_id=telegram_id,
            first_name=first_name,
            last_name=last_name,
            role=UserRole.SUPER_ADMIN.value,  # Use enum value
            status=UserStatus.APPROVED.value,  # Use enum value
            is_active=True
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        print(f"✅ Super admin created successfully!")
        print(f"   ID: {new_user.id}")
        print(f"   Telegram ID: {new_user.telegram_id}")
        print(f"   Name: {new_user.first_name} {new_user.last_name}")
        print(f"   Role: {new_user.role}")
        print(f"   Status: {new_user.status}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating super admin: {str(e)}")
        sys.exit(1)
    finally:
        db.close()

def main():
    parser = argparse.ArgumentParser(description="Recyclic API CLI")
    subparsers = parser.add_subparsers(dest="command", help="Available commands")
    
    # Create super admin command
    create_admin_parser = subparsers.add_parser("create-super-admin", help="Create a super admin user")
    create_admin_parser.add_argument("telegram_id", help="Telegram ID of the super admin")
    create_admin_parser.add_argument("full_name", help="Full name of the super admin")
    
    args = parser.parse_args()
    
    if args.command == "create-super-admin":
        create_super_admin(args.telegram_id, args.full_name)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()

