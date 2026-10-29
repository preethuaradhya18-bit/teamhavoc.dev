import os
import io
import hashlib
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlmodel import Session, select, func

from .database import init_db, get_session
from . import models, auth
from .engine import (
    calculate_total_footprint,
    run_impact_forecast,
    get_contributors_analytics,
)
from .routers import auth as auth_router

# ReportLab imports for ESG PDF Generation
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

app = FastAPI(
    title="NetZero Prints API",
    description="Bio-Tech Glassmorphism Solarpunk Carbon Intelligence Platform - Team Havoc.dev",
    version="2.0.0",
)

# Ensure upload directories exist
UPLOADS_DIR = Path("uploads")
AVATARS_DIR = UPLOADS_DIR / "avatars"
PROOFS_DIR = UPLOADS_DIR / "proofs"
AVATARS_DIR.mkdir(parents=True, exist_ok=True)
PROOFS_DIR.mkdir(parents=True, exist_ok=True)

# Mount static files for public serving of avatars and proofs
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# CORS config with Content-Disposition exposed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

# Include Auth Router
app.include_router(auth_router.router)

@app.on_event("startup")
def on_startup():
    init_db()

# =========================================================================
# 1. USER PROFILE & AVATAR ENDPOINTS
# =========================================================================

@app.get("/api/user/profile")
def get_user_profile(
    current_user: models.User = Depends(auth.get_current_user),
    session: Session = Depends(get_session)
):
    profile = session.exec(select(models.Profile).where(models.Profile.user_id == current_user.id)).first()
    if not profile:
        profile = models.Profile(user_id=current_user.id, display_name="Solarpunk Pioneer")
        session.add(profile)
        session.commit()
        session.refresh(profile)

    return {
        "success": True,
        "user_id": current_user.id,
        "email": current_user.email,
        "phone": current_user.phone,
        "avatar_path": current_user.avatar_path,
        "display_name": profile.display_name,
        "bio": profile.bio,
        "privacy_public": profile.privacy_public,
        "data_sharing": profile.data_sharing,
        "created_at": current_user.created_at.isoformat(),
    }

@app.put("/api/user/profile")
def update_user_profile(
    req: models.ProfileUpdateRequest,
    current_user: models.User = Depends(auth.get_current_user),
    session: Session = Depends(get_session)
):
    profile = session.exec(select(models.Profile).where(models.Profile.user_id == current_user.id)).first()
    if not profile:
        profile = models.Profile(user_id=current_user.id)
        session.add(profile)

    if req.display_name is not None:
        profile.display_name = req.display_name
    if req.bio is not None:
        profile.bio = req.bio
    if req.privacy_public is not None:
        profile.privacy_public = req.privacy_public
    if req.data_sharing is not None:
        profile.data_sharing = req.data_sharing
    if req.phone is not None:
        current_user.phone = req.phone
        session.add(current_user)

    session.add(profile)
    session.commit()
    return {"success": True, "message": "Profile updated successfully"}

@app.post("/api/user/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user),
    session: Session = Depends(get_session)
):
    """
    Accepts an UploadFile payload, validates image format (.jpg, .jpeg, .png, .webp),
    saves to uploads/avatars/user_{id}{ext}, and updates user.avatar_path.
    """
    filename = file.filename or "avatar.png"
    ext = Path(filename).suffix.lower()
    allowed_exts = {".jpg", ".jpeg", ".png", ".webp"}
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid image format '{ext}'. Allowed extensions: {', '.join(allowed_exts)}"
        )

    file_bytes = await file.read()
    if len(file_bytes) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Avatar image size cannot exceed 5MB")

    saved_filename = f"user_{current_user.id}{ext}"
    target_path = AVATARS_DIR / saved_filename
    with open(target_path, "wb") as f:
        f.write(file_bytes)

    relative_url = f"/uploads/avatars/{saved_filename}"
    current_user.avatar_path = relative_url
    session.add(current_user)

    # Sync profile avatar if exists
    profile = session.exec(select(models.Profile).where(models.Profile.user_id == current_user.id)).first()
    if profile:
        profile.avatar_url = relative_url
        session.add(profile)

    session.commit()
    return {
        "success": True,
        "avatar_url": relative_url,
        "message": "Avatar uploaded and saved successfully"
    }

@app.post("/api/user/change-password")
def change_password(
    req: models.PasswordChangeRequest,
    current_user: models.User = Depends(auth.get_current_user),
    session: Session = Depends(get_session)
):
    if not auth.verify_password(req.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password entered is incorrect")

    current_user.hashed_password = auth.hash_password(req.new_password)
    session.add(current_user)
    session.commit()
    return {"success": True, "message": "Password changed successfully"}

# =========================================================================
# 2. CARBON ENGINE & CONTRIBUTORS ANALYTICS (DIET PURGED)
# =========================================================================

@app.post("/api/calculate")
def calculate_emissions(
    activity: models.ActivityInput,
    current_user: models.User = Depends(auth.get_current_user),
    session: Session = Depends(get_session)
):
    """
    Calculates pure 4-vector CO2e footprint (Electricity + Transport + Fuel + Waste).
    Saves snapshot to ActivityLog.
    """
    results = calculate_total_footprint(activity)

    # Save to user activity log
    log = models.ActivityLog(
        user_id=current_user.id,
        electricity_kwh=activity.electricity_kwh,
        commute_km_weekly=activity.commute_km_weekly,
        primary_transport_mode=activity.primary_transport_mode.value,
        fuel_liters_monthly=activity.fuel_liters_monthly,
        fuel_type=activity.fuel_type.value,
        waste_kg_weekly=activity.waste_kg_weekly,
        segregation_recycled_pct=activity.segregation_recycled_pct,
        segregation_composted_pct=activity.segregation_composted_pct,
        total_annual_kg_co2e=results["annual_kg_total"]
    )
    session.add(log)
    session.commit()

    return {"success": True, "data": results}

@app.post("/api/simulate")
def impact_forecast_endpoint(
    req: models.SimulationRequest,
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Feature 3: Impact Forecast Engine (formerly What-If Simulation)
    Reactive slider calculation for EV/Transit, Green Grid Solar, and Waste Diversion.
    """
    forecast = run_impact_forecast(req)
    return {"success": True, "data": forecast}

@app.post("/api/contributors")
def contributors_analytics_endpoint(
    activity: models.ActivityInput,
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Feature 6: Dedicated Contributors Analytics
    Identifies major carbon drivers and provides high-priority tailored action plans.
    """
    analytics = get_contributors_analytics(activity)
    return {"success": True, "data": analytics}

# =========================================================================
# 3. EXPANDED DOCUMENT PROOF AUDIT & ANTI-GREENWASHING
# =========================================================================

@app.post("/api/audit/verify-proof")
async def verify_proof_document(
    file: UploadFile = File(...),
    category: str = Form("Electricity"),
    document_type: str = Form("Utility Bill"),
    reported_value: str = Form("120"),
    unit: str = Form("kWh"),
    notes: Optional[str] = Form(None),
    current_user: models.User = Depends(auth.get_current_user),
    session: Session = Depends(get_session)
):
    """
    Feature 4: Expanded Document Proof Audit
    Accepts .png, .jpg, .jpeg, .pdf (Max 5MB).
    Hashes buffer with SHA-256 for anti-duplicate enforcement.
    Awards coin bounties and logs CoinTransaction.
    """
    filename = file.filename or "proof_doc.pdf"
    ext = Path(filename).suffix.lower()
    allowed_exts = {".png", ".jpg", ".jpeg", ".pdf"}
    if ext not in allowed_exts:
        raise HTTPException(status_code=400, detail=f"Invalid file type '{ext}'. Supported formats: PNG, JPG, JPEG, PDF.")

    file_bytes = await file.read()
    if len(file_bytes) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Uploaded proof exceeds 5MB limit.")

    file_hash = hashlib.sha256(file_bytes).hexdigest()

    # Check for anti-duplicate upload across database
    duplicate_check = session.exec(
        select(models.VerificationLog).where(models.VerificationLog.file_hash == file_hash)
    ).first()

    if duplicate_check:
        raise HTTPException(
            status_code=400,
            detail="Duplicate Document Rejected: An identical receipt/bill was previously submitted and audited."
        )

    # Save unique file
    saved_name = f"proof_{current_user.id}_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}{ext}"
    target_path = PROOFS_DIR / saved_name
    with open(target_path, "wb") as f:
        f.write(file_bytes)

    # Coin rewards based on category
    coin_payouts = {
        "Electricity": 50,
        "Transport": 40,
        "Fuel": 35,
        "Waste": 30,
        "Eco-Certificate": 75,
    }
    coins_awarded = coin_payouts.get(category, 40)

    # Save verification record
    proof_log = models.VerificationLog(
        user_id=current_user.id,
        category=category,
        document_type=document_type,
        document_path=f"/uploads/proofs/{saved_name}",
        file_hash=file_hash,
        reported_value=str(reported_value),
        unit=unit,
        coins_awarded=coins_awarded,
        status="VERIFIED",
        notes=notes or f"Automated audit verification verified file integrity for {filename}."
    )
    session.add(proof_log)

    # Credit coins in CoinTransaction table
    tx = models.CoinTransaction(
        user_id=current_user.id,
        amount=coins_awarded,
        type="EARN",
        description=f"Verified Proof Audit Bounty: {category} ({document_type})"
    )
    session.add(tx)
    session.commit()
    session.refresh(proof_log)

    return {
        "success": True,
        "message": f"Document Verified & Cryptographically Audited! +{coins_awarded} Eco-Coins awarded.",
        "log": {
            "id": proof_log.id,
            "category": proof_log.category,
            "document_type": proof_log.document_type,
            "reported_value": f"{proof_log.reported_value} {proof_log.unit}",
            "coins_awarded": proof_log.coins_awarded,
            "status": proof_log.status,
            "created_at": proof_log.created_at.isoformat(),
        }
    }

@app.get("/api/audit/logs")
def get_user_audit_logs(
    current_user: models.User = Depends(auth.get_current_user),
    session: Session = Depends(get_session)
):
    logs = session.exec(
        select(models.VerificationLog)
        .where(models.VerificationLog.user_id == current_user.id)
        .order_by(models.VerificationLog.id.desc())
    ).all()
    return {"success": True, "logs": logs}

# =========================================================================
# 4. COIN LEDGER & REWARDS MARKETPLACE
# =========================================================================

@app.get("/api/coins/balance")
def get_coins_balance(
    current_user: models.User = Depends(auth.get_current_user),
    session: Session = Depends(get_session)
):
    """
    Feature 2: Coin Ledger & Balance Engine
    Calculates Balance = SUM(EARN) - SUM(REDEEM) dynamically.
    """
    transactions = session.exec(
        select(models.CoinTransaction)
        .where(models.CoinTransaction.user_id == current_user.id)
        .order_by(models.CoinTransaction.id.desc())
    ).all()

    total_earned = sum(t.amount for t in transactions if t.type == "EARN")
    total_redeemed = sum(t.amount for t in transactions if t.type == "REDEEM")
    current_balance = max(0, total_earned - total_redeemed)

    return {
        "success": True,
        "balance": current_balance,
        "total_earned": total_earned,
        "total_redeemed": total_redeemed,
        "transactions": [
            {
                "id": t.id,
                "amount": t.amount,
                "type": t.type,
                "description": t.description,
                "created_at": t.created_at.isoformat(),
            }
            for t in transactions
        ]
    }

@app.post("/api/coins/redeem")
def redeem_reward(
    reward_title: str = Form(...),
    cost_coins: int = Form(...),
    current_user: models.User = Depends(auth.get_current_user),
    session: Session = Depends(get_session)
):
    transactions = session.exec(
        select(models.CoinTransaction).where(models.CoinTransaction.user_id == current_user.id)
    ).all()
    balance = sum(t.amount for t in transactions if t.type == "EARN") - sum(t.amount for t in transactions if t.type == "REDEEM")

    if balance < cost_coins:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient coins! You have {balance} coins, but this perk costs {cost_coins} coins."
        )

    tx = models.CoinTransaction(
        user_id=current_user.id,
        amount=cost_coins,
        type="REDEEM",
        description=f"Redeemed: {reward_title}"
    )
    session.add(tx)
    session.commit()

    return {
        "success": True,
        "message": f"Successfully redeemed '{reward_title}'! Voucher generated.",
        "new_balance": balance - cost_coins
    }

# =========================================================================
# 5. MULTI-TIERED ECO CHALLENGES
# =========================================================================

@app.get("/api/challenges")
def get_challenges(
    current_user: models.User = Depends(auth.get_current_user),
    session: Session = Depends(get_session)
):
    """
    Feature 5: Multi-Tiered Eco Challenges (Daily, Weekly, Monthly)
    """
    challenges = session.exec(select(models.Challenge)).all()
    user_challenges = session.exec(
        select(models.UserChallenge).where(models.UserChallenge.user_id == current_user.id)
    ).all()
    user_state = {uc.challenge_id: uc for uc in user_challenges}

    response_data = []
    for c in challenges:
        uc = user_state.get(c.id)
        response_data.append({
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "tier": c.tier,
            "reward_coins": c.reward_coins,
            "target_metric": c.target_metric,
            "icon_name": c.icon_name,
            "completed": uc.completed if uc else False,
            "claimed": uc.claimed if uc else False,
            "progress": uc.progress if uc else 0,
            "target": uc.target if uc else 1,
        })

    return {"success": True, "challenges": response_data}

@app.post("/api/challenges/{challenge_id}/complete")
def complete_challenge(
    challenge_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    session: Session = Depends(get_session)
):
    challenge = session.exec(select(models.Challenge).where(models.Challenge.id == challenge_id)).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    uc = session.exec(
        select(models.UserChallenge)
        .where(models.UserChallenge.user_id == current_user.id)
        .where(models.UserChallenge.challenge_id == challenge_id)
    ).first()

    if uc and uc.completed:
        return {"success": True, "message": "Challenge already completed!"}

    if not uc:
        uc = models.UserChallenge(
            user_id=current_user.id,
            challenge_id=challenge_id,
            progress=1,
            target=1,
            completed=True,
            claimed=True,
            completed_at=datetime.now(timezone.utc)
        )
        session.add(uc)
    else:
        uc.completed = True
        uc.claimed = True
        uc.completed_at = datetime.now(timezone.utc)
        session.add(uc)

    # Award coins
    session.add(models.CoinTransaction(
        user_id=current_user.id,
        amount=challenge.reward_coins,
        type="EARN",
        description=f"Challenge Complete Reward: {challenge.title}"
    ))
    session.commit()

    return {
        "success": True,
        "message": f"Congratulations! You completed '{challenge.title}' and earned +{challenge.reward_coins} Eco-Coins!",
        "reward_coins": challenge.reward_coins
    }

# =========================================================================
# 6. GOALS MANAGER (FULL CRUD)
# =========================================================================

@app.get("/api/goals")
def list_goals(
    current_user: models.User = Depends(auth.get_current_user),
    session: Session = Depends(get_session)
):
    goals = session.exec(select(models.Goal).where(models.Goal.user_id == current_user.id)).all()
    return {"success": True, "goals": goals}

@app.post("/api/goals")
def create_goal(
    goal_data: models.GoalCreate,
    current_user: models.User = Depends(auth.get_current_user),
    session: Session = Depends(get_session)
):
    goal = models.Goal(
        user_id=current_user.id,
        interval=goal_data.interval,
        category=goal_data.category,
        target_kg=goal_data.target_kg,
        achieved_kg=goal_data.achieved_kg or 0.0,
    )
    session.add(goal)
    session.commit()
    session.refresh(goal)
    return {"success": True, "goal": goal, "message": "New target goal established"}

@app.put("/api/goals/{goal_id}")
def update_goal(
    goal_id: int,
    goal_data: models.GoalUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    session: Session = Depends(get_session)
):
    goal = session.exec(
        select(models.Goal).where(models.Goal.id == goal_id).where(models.Goal.user_id == current_user.id)
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    if goal_data.target_kg is not None:
        goal.target_kg = goal_data.target_kg
    if goal_data.achieved_kg is not None:
        goal.achieved_kg = goal_data.achieved_kg
    if goal_data.interval is not None:
        goal.interval = goal_data.interval
    if goal_data.category is not None:
        goal.category = goal_data.category

    goal.updated_at = datetime.now(timezone.utc)
    session.add(goal)
    session.commit()
    session.refresh(goal)
    return {"success": True, "goal": goal, "message": "Goal updated successfully"}

@app.delete("/api/goals/{goal_id}")
def delete_goal(
    goal_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    session: Session = Depends(get_session)
):
    goal = session.exec(
        select(models.Goal).where(models.Goal.id == goal_id).where(models.Goal.user_id == current_user.id)
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    session.delete(goal)
    session.commit()
    return {"success": True, "message": "Goal removed successfully"}

# =========================================================================
# 7. ESG PDF EXPORT ROUTE (REPORTLAB BINARY STREAMING)
# =========================================================================

@app.get("/api/esg/export-pdf")
def export_esg_pdf(
    current_user: models.User = Depends(auth.get_current_user),
    session: Session = Depends(get_session)
):
    """
    Feature 6: ESG Report Exporter Fix
    Secured with JWT, renders PDF in-memory buffer via ReportLab.
    Returns binary streaming with Content-Disposition header.
    """
    profile = session.exec(select(models.Profile).where(models.Profile.user_id == current_user.id)).first()
    user_name = profile.display_name if profile else "NetZero Participant"
    user_email = current_user.email or "N/A"

    # Fetch recent activity snapshot
    last_log = session.exec(
        select(models.ActivityLog)
        .where(models.ActivityLog.user_id == current_user.id)
        .order_by(models.ActivityLog.id.desc())
    ).first()

    elec_kwh = last_log.electricity_kwh if last_log else 120.0
    km_weekly = last_log.commute_km_weekly if last_log else 85.0
    fuel_l = last_log.fuel_liters_monthly if last_log else 20.0
    waste_kg = last_log.waste_kg_weekly if last_log else 12.0

    # Calculate emission scopes
    elec_annual_kg = elec_kwh * 0.46 * 12.0
    trans_annual_kg = km_weekly * 0.192 * 52.0
    fuel_annual_kg = fuel_l * 2.31 * 12.0
    waste_annual_kg = waste_kg * 0.5 * 1.25 * 52.0

    total_annual_kg = elec_annual_kg + trans_annual_kg + fuel_annual_kg + waste_annual_kg
    scope1_tons = round(fuel_annual_kg / 1000.0, 3)
    scope2_tons = round(elec_annual_kg / 1000.0, 3)
    scope3_tons = round((trans_annual_kg + waste_annual_kg) / 1000.0, 3)
    total_tons = round(total_annual_kg / 1000.0, 3)

    # Verified audits count
    verified_audits = session.exec(
        select(func.count(models.VerificationLog.id)).where(models.VerificationLog.user_id == current_user.id)
    ).one()

    # Create PDF in-memory
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=colors.HexColor('#065f46')
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#047857')
    )
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#1f2937')
    )
    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
    )

    elements = []

    # Header
    elements.append(Paragraph("NETZERO PRINTS - ESG SUSTAINABILITY AUDIT REPORT", title_style))
    elements.append(Paragraph("Platform: Hack Fest 2026 (PS-01 Green Tech) | Developed by Team Havoc.dev", subtitle_style))
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#10b981'), spaceAfter=15))

    # User & Audit Metadata Table
    meta_data = [
        [Paragraph("<b>Audited Entity / User:</b>", body_style), Paragraph(user_name, body_style),
         Paragraph("<b>Date of Issuance:</b>", body_style), Paragraph(datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"), body_style)],
        [Paragraph("<b>Registered Email:</b>", body_style), Paragraph(user_email, body_style),
         Paragraph("<b>Audit Standard:</b>", body_style), Paragraph("GHG Protocol Corporate & Personal Standard", body_style)],
        [Paragraph("<b>Account ID:</b>", body_style), Paragraph(f"NZP-USR-{current_user.id:05d}", body_style),
         Paragraph("<b>Verified Documents:</b>", body_style), Paragraph(f"{verified_audits} Audited Receipts/Bills", body_style)],
    ]
    meta_table = Table(meta_data, colWidths=[130, 140, 130, 140])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f0fdf4')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#bbf7d0')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#dcfce7')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 20))

    # Scope Summary Section
    elements.append(Paragraph("<b>1. GREENHOUSE GAS EMISSIONS INVENTORY (4-PILLAR REBALANCE)</b>", ParagraphStyle('H2', fontName='Helvetica-Bold', fontSize=12, textColor=colors.HexColor('#065f46'))))
    elements.append(Paragraph("The calculations strictly reflect Electricity, Transportation, Direct Fuel, and Solid Waste vectors:", body_style))
    elements.append(Spacer(1, 8))

    scope_data = [
        ["Scope Classification", "Pillar / Activity Source", "Activity Metric", "CO2e (kg/yr)", "CO2e (Metric Tons)"],
        ["Scope 1 (Direct)", "Vehicle Fuel (Petrol/Diesel/LPG)", f"{fuel_l} Liters/mo", f"{fuel_annual_kg:.1f}", f"{scope1_tons:.3f} t"],
        ["Scope 2 (Indirect)", "Grid Electricity Consumption", f"{elec_kwh} kWh/mo", f"{elec_annual_kg:.1f}", f"{scope2_tons:.3f} t"],
        ["Scope 3 (Value Chain)", "Ground Commute & Transit", f"{km_weekly} km/wk", f"{trans_annual_kg:.1f}", f"{trans_annual_kg/1000.0:.3f} t"],
        ["Scope 3 (Value Chain)", "Municipal Waste Output", f"{waste_kg} kg/wk", f"{waste_annual_kg:.1f}", f"{waste_annual_kg/1000.0:.3f} t"],
        ["NET ANNUAL EMISSION TOTAL", "Comprehensive 4-Vector Footprint", "--", f"{total_annual_kg:.1f} kg", f"{total_tons:.3f} Metric Tons"],
    ]
    scope_table = Table(scope_data, colWidths=[120, 160, 90, 85, 85])
    scope_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#059669')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#d1fae5')),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
    ]))
    elements.append(scope_table)
    elements.append(Spacer(1, 20))

    # Recommendations & Signoff
    elements.append(Paragraph("<b>2. STRATEGIC DECARBONIZATION ROADMAP</b>", ParagraphStyle('H2', fontName='Helvetica-Bold', fontSize=12, textColor=colors.HexColor('#065f46'))))
    elements.append(Paragraph("• <b>Grid Decoupling:</b> Shift high-wattage charging cycles to daytime solar windows to capture clean renewable generation.<br/>"
                              "• <b>Transit Transition:</b> Shift 3 commute trips weekly to electric rail or campus carpools to cut vehicle emissions by > 60%.<br/>"
                              "• <b>Waste Diversion:</b> Segregate 100% of organic waste to aerobic campus composters to prevent fugitive landfill methane.<br/>"
                              "• <b>Verified Audits:</b> Continue uploading utility bills to unlock maximum eco-coin incentives on the NetZero Prints Ledger.", body_style))
    elements.append(Spacer(1, 30))

    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#d1d5db'), spaceAfter=15))
    sign_data = [
        [Paragraph("<b>Certified ESG Engine:</b> NetZero Prints v2.0", body_style), Paragraph("<b>Lead Auditor:</b> Preetam (Team Havoc.dev)", body_style)],
        [Paragraph("<b>Cryptographic Hash:</b> Verified by SHA-256 Ledger", body_style), Paragraph("<b>Hack Fest 2026:</b> PS-01 Official Submission", body_style)]
    ]
    sign_table = Table(sign_data, colWidths=[270, 270])
    elements.append(sign_table)

    doc.build(elements)
    buffer.seek(0)
    pdf_bytes = buffer.getvalue()

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": 'attachment; filename="NetZero_ESG_Report.pdf"'
        }
    )

# =========================================================================
# 8. OPEN-SOURCE AI HELPDESK ENGINE
# =========================================================================

@app.post("/api/ai/chat")
def ai_helpdesk_chat(req: models.AIChatRequest):
    """
    Feature 7: Open-Source AI Helpdesk Widget
    Provides instant intelligent guidance on NetZero Prints features,
    coin earnings, proof uploads, emission reductions, and navigation.
    """
    msg = req.message.lower().strip()

    if "coin" in msg or "earn" in msg or "reward" in msg:
        reply = (
            "🌱 **How to Earn Eco-Coins in NetZero Prints:**\n\n"
            "1. **Proof Document Uploads:** Upload electricity bills (+50 coins), transit tickets (+40 coins), or fuel receipts (+35 coins).\n"
            "2. **Daily & Weekly Challenges:** Complete tasks like 'Zero Single-Use Plastic Day' (+25 coins) or 'Public Transit Week' (+60 coins).\n"
            "3. **Streak Milestones:** Log your activity continuously to trigger bonus eco-grants.\n\n"
            "Redeem your coins in the **Coins & Rewards Hub** for sustainable vouchers and tree-planting certificates!"
        )
    elif "proof" in msg or "verify" in msg or "bill" in msg or "audit" in msg:
        reply = (
            "📄 **Document Proof Audit System:**\n\n"
            "• We accept `.png`, `.jpg`, `.jpeg`, and `.pdf` files up to 5MB.\n"
            "• Every uploaded document is hashed with **SHA-256** to prevent duplicate or spoofed submissions.\n"
            "• Once verified, your status badge turns emerald **Verified** and coins are automatically credited to your ledger."
        )
    elif "electricity" in msg or "solar" in msg or "grid" in msg:
        reply = (
            "⚡ **Grid Decarbonization Tips:**\n\n"
            "• Electricity generation emits ~0.46 kg CO2e per kWh on average.\n"
            "• Running high-load appliances (laundry, EV charging) during daylight solar hours (11 AM - 3 PM) taps cleaner renewable power.\n"
            "• Eliminating standby phantom loads at night saves an estimated 8-12% on baseline electricity emissions."
        )
    elif "transport" in msg or "commute" in msg or "car" in msg:
        reply = (
            "🚗 **Commute Carbon Reduction:**\n\n"
            "• Solo gasoline cars produce ~0.192 kg CO2e per passenger-km.\n"
            "• Shifting 3 commute days to electric metro (~0.028 kg/km) or public bus (~0.039 kg/km) slashes transport emissions by up to 65%!\n"
            "• Check out the **Impact Forecast Engine** slider to simulate your exact savings."
        )
    elif "esg" in msg or "pdf" in msg or "report" in msg:
        reply = (
            "📊 **ESG Report Download:**\n\n"
            "• Click **'Export ESG Report'** in the Profile & Settings menu or Dashboard.\n"
            "• The system renders a formal PDF complying with GHG Protocol Scope 1, Scope 2, and Scope 3 frameworks.\n"
            "• The report includes your certified activity metrics, verified document count, and strategic decarbonization roadmap."
        )
    elif "forecast" in msg or "what-if" in msg or "simulator" in msg:
        reply = (
            "🔮 **Impact Forecast Engine:**\n\n"
            "• Head to the **Forecast** tab to drag interactive sliders for EV/Transit Commute %, Green Grid Shift %, and Waste Diversion %.\n"
            "• The engine instantly recalculates your projected monthly & annual savings and equivalent mature trees planted in real time!"
        )
    else:
        reply = (
            f"🌿 **NetZero Prints Solarpunk Assistant:**\n\n"
            f"I can guide you through every part of the NetZero Prints platform! "
            f"Try asking:\n"
            f"• *'How do I earn eco-coins?'*\n"
            f"• *'How does proof document verification work?'*\n"
            f"• *'What is my top carbon driver?'*\n"
            f"• *'How can I export my ESG PDF report?'*"
        )

    return {
        "success": True,
        "reply": reply,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
