from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from backend import models, schemas, database
from backend.routers.auth import get_current_user

router = APIRouter(
    prefix="/planning",
    tags=["Community Planning"]
)

@router.post("/", response_model=schemas.CropPlanCreateResponse)
def create_plan(plan: schemas.CropPlanCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    harvest_date = plan.sowing_date + timedelta(days=plan.duration_days)
    
    new_plan = models.CropPlan(
        user_id=current_user.id,
        crop_name=plan.crop_name,
        sowing_date=plan.sowing_date,
        duration_days=plan.duration_days,
        harvest_date=harvest_date
    )
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)

    # Conflict Detection
    # Logic: Same Block, Same Crop, Sowing Date within +/- 30 days
    warnings = []
    if current_user.district and current_user.block_name: # Only if user location is known
        start_range = plan.sowing_date - timedelta(days=30)
        end_range = plan.sowing_date + timedelta(days=30)

        conflicting_plans = db.query(models.CropPlan).join(models.User).filter(
            models.User.district == current_user.district,
            models.User.block_name == current_user.block_name,
            models.CropPlan.crop_name == plan.crop_name,
            models.CropPlan.id != new_plan.id, # Don't count self
            models.CropPlan.sowing_date >= start_range,
            models.CropPlan.sowing_date <= end_range
        ).all()

        if conflicting_plans:
            count = len(conflicting_plans)
            warnings.append(f"⚠️ Warning: {count} other farmer(s) in {current_user.block_name} are planning to sow {plan.crop_name} around this time ( +/- 30 days).")
            # We could add more detail, e.g., list dates, but count is sufficient for insight.

    # Convert SQLAlchemy model to Pydantic response and add warnings
    response = schemas.CropPlanCreateResponse.from_orm(new_plan)
    response.warnings = warnings
    return response

@router.get("/my", response_model=List[schemas.CropPlanOut])
def get_my_plans(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.CropPlan).filter(models.CropPlan.user_id == current_user.id).all()

@router.delete("/{plan_id}")
def delete_plan(plan_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    plan = db.query(models.CropPlan).filter(models.CropPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    if plan.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this plan")
    
    db.delete(plan)
    db.commit()
    return {"message": "Plan deleted"}

@router.get("/community", response_model=schemas.CommunityStats)
def get_community_stats(
    district: Optional[str] = None, 
    block: Optional[str] = None, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(get_current_user)
):
    # Default to user's location if not specified
    target_district = district or current_user.district
    target_block = block or current_user.block_name # Use block_name from user model

    if not target_district or not target_block:
        # If user has no location set and didn't provide one, return empty or error?
        # Let's return stats for "Unknown" or just empty.
        pass

    # Query users in the target area
    users_query = db.query(models.User.id).filter(models.User.district == target_district)
    if target_block:
         users_query = users_query.filter(models.User.block_name == target_block) # Ensure block_name matches model field
    
    user_ids = [u[0] for u in users_query.all()]
    
    # Query plans for these users
    plans = db.query(models.CropPlan).filter(models.CropPlan.user_id.in_(user_ids)).all()
    
    crop_counts = {}
    detailed_plans = []

    # Pre-fetch user names to avoid N+1? Or just query with join above?
    # Better to query with join
    plans_with_users = db.query(models.CropPlan, models.User).join(models.User).filter(
        models.User.id.in_(user_ids)
    ).all()

    for p, u in plans_with_users:
        crop_counts[p.crop_name] = crop_counts.get(p.crop_name, 0) + 1
        detailed_plans.append(schemas.CommunityPlanDetail(
            farmer_name=u.full_name,
            crop_name=p.crop_name,
            sowing_date=p.sowing_date,
            duration_days=p.duration_days
        ))
        
    return {
        "district": target_district or "All",
        "block": target_block or "All",
        "total_farmers": len(user_ids),
        "crop_counts": crop_counts,
        "plans": detailed_plans
    }
