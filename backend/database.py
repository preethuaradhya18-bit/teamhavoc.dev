import os
from sqlmodel import SQLModel, create_engine, Session, select
from pathlib import Path

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./netzero.db")

engine = create_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)

def init_db():
    """Create database tables and seed default challenge/reward templates if empty."""
    from . import models  # noqa: F401
    SQLModel.metadata.create_all(engine)
    seed_initial_data()

def get_session():
    """Yield a new DB session. Used as FastAPI dependency."""
    with Session(engine) as session:
        yield session

def seed_initial_data():
    from .models import Challenge, User, Profile, CoinTransaction
    from .auth import hash_password
    with Session(engine) as session:
        # Check if challenges exist
        existing_challenges = session.exec(select(Challenge)).first()
        if not existing_challenges:
            challenges = [
                # Daily Challenges
                Challenge(title="Zero Single-Use Plastic Day", description="Avoid all disposable plastic bottles, cups, and bags today.", tier="daily", reward_coins=25, target_metric="1 day", icon_name="ShieldCheck"),
                Challenge(title="Green Grid Energy Sync", description="Run washing machines or high-draw charging during peak solar daylight hours.", tier="daily", reward_coins=20, target_metric="1 charge cycle", icon_name="Zap"),
                Challenge(title="Stairway Sprint", description="Skip building elevators for trips under 4 floors to save power and boost health.", tier="daily", reward_coins=15, target_metric="4 stair climbs", icon_name="Activity"),
                
                # Weekly Challenges
                Challenge(title="Public Transit Commute Week", description="Log at least 3 commute trips via bus, train, or carpool this week.", tier="weekly", reward_coins=60, target_metric="3 trips", icon_name="Car"),
                Challenge(title="Compost Champion Week", description="100% organic waste segregation into campus or home composting.", tier="weekly", reward_coins=50, target_metric="7 days", icon_name="Trash2"),
                Challenge(title="Phantom Draw Purge", description="Unplug idle chargers, screens, and appliances every night before sleeping.", tier="weekly", reward_coins=45, target_metric="7 nights", icon_name="Power"),
                
                # Monthly Challenges
                Challenge(title="Verified Audit Grandmaster", description="Upload 3 verified utility bills or transit tickets to the audit engine.", tier="monthly", reward_coins=150, target_metric="3 verified proofs", icon_name="Award"),
                Challenge(title="20% Footprint Slasher", description="Achieve a 20% reduction against baseline in your monthly calculation.", tier="monthly", reward_coins=200, target_metric="20% reduction", icon_name="TrendingDown"),
                Challenge(title="Bio-Tech Community Pillar", description="Achieve a 14-day consecutive active logging streak.", tier="monthly", reward_coins=180, target_metric="14-day streak", icon_name="Sparkles"),
            ]
            for c in challenges:
                session.add(c)
            session.commit()

        # Seed initial demo user if none exists
        demo_user = session.exec(select(User).where(User.email == "preetam@havoc.dev")).first()
        if not demo_user:
            user = User(
                email="preetam@havoc.dev",
                phone="+919876543210",
                hashed_password=hash_password("NetZero@2026"),
                avatar_path=None,
                is_active=True,
            )
            session.add(user)
            session.commit()
            session.refresh(user)

            profile = Profile(
                user_id=user.id,
                display_name="Preetam (Team Havoc)",
                bio="Building NetZero Prints Solarpunk Carbon Platform for Hack Fest 2026.",
                privacy_public=True,
                data_sharing=True
            )
            session.add(profile)
            
            # Initial welcoming coins
            session.add(CoinTransaction(
                user_id=user.id,
                amount=150,
                type="EARN",
                description="Welcome to NetZero Prints! Hack Fest 2026 Onboarding Bonus"
            ))
            session.commit()
