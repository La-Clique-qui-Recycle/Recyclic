"""
CLI commands for the Recyclic API
"""
import argparse
import sys
from sqlalchemy.orm import Session
from recyclic_api.core.database import get_db
from recyclic_api.core.security import hash_password, validate_password_strength
from recyclic_api.models.user import User, UserRole, UserStatus

def create_super_admin(username: str, password: str):
    """
    Create a super admin user with the given username and password.
    """
    # Validate password strength
    is_valid, errors = validate_password_strength(password)
    if not is_valid:
        print(f"❌ Password does not meet security requirements:")
        for error in errors:
            print(f"   - {error}")
        sys.exit(1)

    # Get database session
    db: Session = next(get_db())

    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.username == username).first()
        if existing_user:
            print(f"❌ User with username '{username}' already exists!")
            print(f"   Current role: {existing_user.role}")
            print(f"   Current status: {existing_user.status}")
            sys.exit(1)

        # Hash the password
        hashed_password = hash_password(password)

        # Create new super admin user
        new_user = User(
            username=username,
            hashed_password=hashed_password,
            role=UserRole.SUPER_ADMIN.value,  # Use enum value
            status=UserStatus.APPROVED.value,  # Use enum value
            is_active=True
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        print(f"✅ Super admin created successfully!")
        print(f"   ID: {new_user.id}")
        print(f"   Username: {new_user.username}")
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
    create_admin_parser.add_argument("--username", required=True, help="Username for the super admin")
    create_admin_parser.add_argument("--password", required=True, help="Password for the super admin")

    args = parser.parse_args()

    if args.command == "create-super-admin":
        create_super_admin(args.username, args.password)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()

