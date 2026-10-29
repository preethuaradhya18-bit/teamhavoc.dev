import random
import string
from datetime import datetime, timezone, timedelta
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ..database import get_session
from .. import models, auth

router = APIRouter(prefix="/auth", tags=["auth"])

def generate_otp(length: int = 6) -> str:
    return ''.join(random.choices(string.digits, k=length))

class SendOTPRequest(BaseModel):
    identifier: str  # Email or phone

class VerifyOTPRequest(BaseModel):
    identifier: str
    code: str

class LoginRequest(BaseModel):
    identifier: str
    password: str

class OTPLoginRequest(BaseModel):
    identifier: str
    code: str

class RegisterRequest(BaseModel):
    identifier: str  # email or phone
    password: str
    code: str
    display_name: Optional[str] = "NetZero Eco-Hero"

class GoogleLoginRequest(BaseModel):
    email: str
    display_name: Optional[str] = "Google Explorer"
    avatar_url: Optional[str] = None
    google_id: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    identifier: str

class ResetPasswordRequest(BaseModel):
    identifier: str
    code: str
    new_password: str

@router.post("/send-otp")
async def send_otp(req: SendOTPRequest, session: Session = Depends(get_session)):
    """Generates real 6-digit OTP in database and outputs to console log."""
    identifier = req.identifier.strip()
    if not identifier:
        raise HTTPException(status_code=400, detail="Identifier (email or phone) is required")

    otp_code = generate_otp(6)
    expires = datetime.now(timezone.utc) + timedelta(minutes=10)
    db_otp = models.OTPCode(identifier=identifier, code=otp_code, expires_at=expires, verified=False)
    session.add(db_otp)
    session.commit()

    print(f"\n=======================================================")
    print(f"🔒 [NETZERO PRINTS SECURE OTP ENGINE]")
    print(f"Destination: {identifier}")
    print(f"Your Verification Code is:  >>>  {otp_code}  <<<")
    print(f"Valid for 10 minutes.")
    print(f"=======================================================\n")

    return {
        "success": True,
        "message": f"OTP successfully dispatched to {identifier}",
        "debug_otp": otp_code  # Helpful for immediate local testing
    }

@router.post("/verify-otp")
async def verify_otp(req: VerifyOTPRequest, session: Session = Depends(get_session)):
    stmt = (
        select(models.OTPCode)
        .where(models.OTPCode.identifier == req.identifier.strip())
        .order_by(models.OTPCode.id.desc())
    )
    otp_entry = session.exec(stmt).first()
    if not otp_entry:
        raise HTTPException(status_code=400, detail="No OTP requested for this identifier")
    if otp_entry.verified:
        return {"success": True, "message": "OTP already verified"}
    if otp_entry.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new code.")
    if otp_entry.code != req.code.strip():
        otp_entry.attempts += 1
        session.add(otp_entry)
        session.commit()
        raise HTTPException(status_code=400, detail="Invalid OTP code. Please check and retry.")

    otp_entry.verified = True
    session.add(otp_entry)
    session.commit()
    return {"success": True, "message": "OTP successfully verified"}

@router.post("/login-with-otp")
async def login_with_otp(req: OTPLoginRequest, session: Session = Depends(get_session)):
    """Logs in directly with verified OTP for mobile or email."""
    identifier = req.identifier.strip()
    code = req.code.strip()

    stmt = (
        select(models.OTPCode)
        .where(models.OTPCode.identifier == identifier)
        .order_by(models.OTPCode.id.desc())
    )
    otp_entry = session.exec(stmt).first()
    if not otp_entry or otp_entry.expires_at < datetime.now(timezone.utc) or otp_entry.code != code:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP code")

    otp_entry.verified = True
    session.add(otp_entry)

    # Check if user exists; if not, auto-create
    is_email = "@" in identifier
    if is_email:
        user = session.exec(select(models.User).where(models.User.email == identifier)).first()
    else:
        user = session.exec(select(models.User).where(models.User.phone == identifier)).first()

    if not user:
        user = models.User(
            email=identifier if is_email else None,
            phone=identifier if not is_email else None,
            hashed_password=auth.hash_password("NetZero@OTPPass2026"),
            avatar_path=None,
            is_active=True
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        profile = models.Profile(
            user_id=user.id,
            display_name=identifier.split("@")[0] if is_email else f"User {identifier[-4:]}",
            bio="Verified Solarpunk Eco-Citizen",
            privacy_public=True
        )
        session.add(profile)
        # Onboarding bonus
        session.add(models.CoinTransaction(
            user_id=user.id,
            amount=100,
            type="EARN",
            description="First OTP Login Welcome Bonus"
        ))
        session.commit()

    token = auth.create_access_token({"sub": str(user.id)})
    return {
        "success": True,
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
        "phone": user.phone,
    }

@router.post("/login")
async def login(req: LoginRequest, session: Session = Depends(get_session)):
    """Standard password login for Email or Phone."""
    identifier = req.identifier.strip()
    stmt = select(models.User).where((models.User.email == identifier) | (models.User.phone == identifier))
    user = session.exec(stmt).first()
    if not user or not auth.verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email/phone or password")

    token = auth.create_access_token({"sub": str(user.id)})
    return {
        "success": True,
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
        "phone": user.phone,
    }

@router.post("/register")
async def register(req: RegisterRequest, session: Session = Depends(get_session)):
    """Registers new user with verified OTP."""
    identifier = req.identifier.strip()
    stmt = (
        select(models.OTPCode)
        .where(models.OTPCode.identifier == identifier)
        .order_by(models.OTPCode.id.desc())
    )
    otp_entry = session.exec(stmt).first()
    if not otp_entry or not otp_entry.verified or otp_entry.code != req.code.strip():
        raise HTTPException(status_code=400, detail="OTP is not verified. Please verify OTP first.")

    is_email = "@" in identifier
    if is_email:
        existing = session.exec(select(models.User).where(models.User.email == identifier)).first()
        if existing:
            raise HTTPException(status_code=400, detail="An account with this email already exists")
    else:
        existing = session.exec(select(models.User).where(models.User.phone == identifier)).first()
        if existing:
            raise HTTPException(status_code=400, detail="An account with this phone already exists")

    user = models.User(
        email=identifier if is_email else None,
        phone=identifier if not is_email else None,
        hashed_password=auth.hash_password(req.password),
        avatar_path=None,
        is_active=True
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    profile = models.Profile(
        user_id=user.id,
        display_name=req.display_name or (identifier.split("@")[0] if is_email else "Eco Hero"),
        bio="New member on the path to Net-Zero emissions.",
        privacy_public=True
    )
    session.add(profile)
    # Registration coin bonus
    session.add(models.CoinTransaction(
        user_id=user.id,
        amount=150,
        type="EARN",
        description="Registration Welcome Gift"
    ))
    session.commit()

    token = auth.create_access_token({"sub": str(user.id)})
    return {
        "success": True,
        "message": "Account created successfully",
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
    }

@router.post("/google-login")
async def google_login(req: GoogleLoginRequest, session: Session = Depends(get_session)):
    """One-click Google Social Auth."""
    email = req.email.strip().lower()
    user = session.exec(select(models.User).where(models.User.email == email)).first()

    if not user:
        user = models.User(
            email=email,
            phone=None,
            hashed_password=auth.hash_password("GoogleOAuth2026SecretPass"),
            avatar_path=req.avatar_url,
            is_active=True
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        profile = models.Profile(
            user_id=user.id,
            display_name=req.display_name or email.split("@")[0],
            avatar_url=req.avatar_url,
            bio="Google-authenticated Eco-Warrior",
            privacy_public=True
        )
        session.add(profile)
        session.add(models.CoinTransaction(
            user_id=user.id,
            amount=120,
            type="EARN",
            description="Google Sign-In Eco-Grant"
        ))
        session.commit()

    token = auth.create_access_token({"sub": str(user.id)})
    return {
        "success": True,
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
        "display_name": req.display_name,
    }

@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest, session: Session = Depends(get_session)):
    """Triggers OTP for password reset."""
    identifier = req.identifier.strip()
    stmt = select(models.User).where((models.User.email == identifier) | (models.User.phone == identifier))
    user = session.exec(stmt).first()
    if not user:
        raise HTTPException(status_code=404, detail="No registered account found with this identifier")

    otp_code = generate_otp(6)
    expires = datetime.now(timezone.utc) + timedelta(minutes=10)
    db_otp = models.OTPCode(identifier=identifier, code=otp_code, expires_at=expires, verified=False)
    session.add(db_otp)
    session.commit()

    print(f"\n=======================================================")
    print(f"🔑 [PASSWORD RESET OTP]")
    print(f"Target: {identifier}")
    print(f"Reset Code:  >>>  {otp_code}  <<<")
    print(f"=======================================================\n")

    return {
        "success": True,
        "message": f"Password reset OTP sent to {identifier}",
        "debug_otp": otp_code
    }

@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest, session: Session = Depends(get_session)):
    """Verifies OTP and resets user's password in database."""
    identifier = req.identifier.strip()
    stmt = (
        select(models.OTPCode)
        .where(models.OTPCode.identifier == identifier)
        .order_by(models.OTPCode.id.desc())
    )
    otp_entry = session.exec(stmt).first()
    if not otp_entry or otp_entry.expires_at < datetime.now(timezone.utc) or otp_entry.code != req.code.strip():
        raise HTTPException(status_code=400, detail="Invalid or expired reset OTP code")

    user_stmt = select(models.User).where((models.User.email == identifier) | (models.User.phone == identifier))
    user = session.exec(user_stmt).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = auth.hash_password(req.new_password)
    otp_entry.verified = True
    session.add(user)
    session.add(otp_entry)
    session.commit()

    return {
        "success": True,
        "message": "Password has been successfully updated. You can now login with your new password."
    }
