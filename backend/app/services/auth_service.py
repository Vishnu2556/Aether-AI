from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.auth import UserRegister, UserLogin
from app.core.security import get_password_hash, verify_password, create_access_token

class AuthService:
    @staticmethod
    def register_user(db: Session, user_data: UserRegister) -> User:
        # Check if username or email exists
        existing_user = db.query(User).filter(
            (User.username == user_data.username.lower()) | (User.email == user_data.email.lower())
        ).first()
        
        if existing_user:
            if existing_user.username == user_data.username.lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already registered"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
        
        hashed_password = get_password_hash(user_data.password)
        new_user = User(
            username=user_data.username.lower(),
            email=user_data.email.lower(),
            password_hash=hashed_password
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user

    @staticmethod
    def authenticate_user(db: Session, login_data: UserLogin) -> dict:
        login_identifier = login_data.username.strip().lower()
        
        # Can login with either username or email
        user = db.query(User).filter(
            (User.username == login_identifier) | (User.email == login_identifier)
        ).first()
        
        if not user or not verify_password(login_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username/email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token = create_access_token(data={"sub": str(user.id), "username": user.username})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user
        }
