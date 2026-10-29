from typing import Dict, Any, List
from .models import ActivityInput, SimulationRequest
from .emission_factors import (
    GRID_INTENSITY_FACTORS,
    TRANSPORT_FACTORS,
    FUEL_FACTORS,
    WASTE_FACTORS,
)

def calculate_electricity_emissions(activity: ActivityInput) -> Dict[str, Any]:
    total_kwh_month = max(activity.electricity_kwh, 0.0)
    factor = GRID_INTENSITY_FACTORS["standard_grid"]
    monthly_kg = total_kwh_month * factor
    annual_kg = monthly_kg * 12.0

    return {
        "monthly_kwh": round(total_kwh_month, 1),
        "factor": factor,
        "monthly_kg": round(monthly_kg, 2),
        "annual_kg": round(annual_kg, 2),
    }

def calculate_transport_emissions(activity: ActivityInput) -> Dict[str, Any]:
    weekly_km = max(activity.commute_km_weekly, 0.0)
    primary_factor = TRANSPORT_FACTORS.get(activity.primary_transport_mode.value, 0.192)
    secondary_factor = TRANSPORT_FACTORS.get(
        activity.secondary_transport_mode.value if activity.secondary_transport_mode else "Public Bus",
        0.039
    )

    sec_pct = min(max(activity.secondary_transport_pct / 100.0, 0.0), 1.0)
    prim_pct = 1.0 - sec_pct

    weekly_kg = (weekly_km * prim_pct * primary_factor) + (weekly_km * sec_pct * secondary_factor)
    annual_kg = weekly_kg * 52.0
    monthly_kg = annual_kg / 12.0

    return {
        "weekly_km": round(weekly_km, 1),
        "monthly_kg": round(monthly_kg, 2),
        "annual_kg": round(annual_kg, 2),
        "primary_mode": activity.primary_transport_mode.value,
        "primary_factor": primary_factor,
        "secondary_mode": activity.secondary_transport_mode.value if activity.secondary_transport_mode else None,
        "secondary_pct": round(sec_pct * 100, 1),
    }

def calculate_fuel_emissions(activity: ActivityInput) -> Dict[str, Any]:
    liters_month = max(activity.fuel_liters_monthly, 0.0)
    factor = FUEL_FACTORS.get(activity.fuel_type.value, 2.31)
    monthly_kg = liters_month * factor
    annual_kg = monthly_kg * 12.0

    return {
        "monthly_liters": round(liters_month, 1),
        "fuel_type": activity.fuel_type.value,
        "factor": factor,
        "monthly_kg": round(monthly_kg, 2),
        "annual_kg": round(annual_kg, 2),
    }

def calculate_waste_emissions(activity: ActivityInput) -> Dict[str, Any]:
    weekly_kg_waste = max(activity.waste_kg_weekly, 0.0)
    rec_pct = min(max(activity.segregation_recycled_pct / 100.0, 0.0), 1.0)
    comp_pct = min(max(activity.segregation_composted_pct / 100.0, 0.0), 1.0)
    landfill_pct = max(0.0, 1.0 - (rec_pct + comp_pct))

    kg_rec = weekly_kg_waste * rec_pct
    kg_comp = weekly_kg_waste * comp_pct
    kg_landfill = weekly_kg_waste * landfill_pct

    weekly_kg_co2e = (
        (kg_landfill * WASTE_FACTORS["landfill"]) +
        (kg_rec * WASTE_FACTORS["recycled"]) +
        (kg_comp * WASTE_FACTORS["composted"])
    )
    annual_kg = weekly_kg_co2e * 52.0
    monthly_kg = annual_kg / 12.0

    return {
        "weekly_waste_kg": round(weekly_kg_waste, 1),
        "monthly_kg": round(monthly_kg, 2),
        "annual_kg": round(annual_kg, 2),
        "landfill_pct": round(landfill_pct * 100, 1),
        "recycled_pct": round(rec_pct * 100, 1),
        "composted_pct": round(comp_pct * 100, 1),
    }

def calculate_total_footprint(activity: ActivityInput) -> Dict[str, Any]:
    """
    Pure 4-vector carbon balance: Electricity + Transport + Fuel + Waste.
    Scope 1: Direct Fuel
    Scope 2: Grid Electricity
    Scope 3: Transport + Waste
    """
    elec = calculate_electricity_emissions(activity)
    trans = calculate_transport_emissions(activity)
    fuel = calculate_fuel_emissions(activity)
    waste = calculate_waste_emissions(activity)

    annual_kg_total = (
        elec["annual_kg"] +
        trans["annual_kg"] +
        fuel["annual_kg"] +
        waste["annual_kg"]
    )
    annual_tons_total = annual_kg_total / 1000.0

    scope1_annual_kg = fuel["annual_kg"]
    scope2_annual_kg = elec["annual_kg"]
    scope3_annual_kg = trans["annual_kg"] + waste["annual_kg"]

    categories = [
        {"name": "Electricity", "annual_kg": elec["annual_kg"], "color": "#10b981", "scope": "Scope 2", "icon": "Zap"},
        {"name": "Transport", "annual_kg": trans["annual_kg"], "color": "#06b6d4", "scope": "Scope 3", "icon": "Car"},
        {"name": "Fuel", "annual_kg": fuel["annual_kg"], "color": "#f59e0b", "scope": "Scope 1", "icon": "Fuel"},
        {"name": "Waste", "annual_kg": waste["annual_kg"], "color": "#8b5cf6", "scope": "Scope 3", "icon": "Trash2"},
    ]

    for cat in categories:
        cat["percent"] = round((cat["annual_kg"] / annual_kg_total * 100) if annual_kg_total > 0 else 0, 1)

    sorted_categories = sorted(categories, key=lambda x: x["annual_kg"], reverse=True)
    primary_driver = sorted_categories[0]["name"] if sorted_categories else "Electricity"
    primary_driver_pct = sorted_categories[0]["percent"] if sorted_categories else 0

    return {
        "annual_kg_total": round(annual_kg_total, 2),
        "annual_tons_total": round(annual_tons_total, 3),
        "monthly_kg_total": round(annual_kg_total / 12.0, 2),
        "breakdown": {
            "electricity": elec,
            "transport": trans,
            "fuel": fuel,
            "waste": waste,
        },
        "categories_chart": categories,
        "primary_driver": primary_driver,
        "primary_driver_pct": primary_driver_pct,
        "scopes": {
            "scope1_kg": round(scope1_annual_kg, 2),
            "scope2_kg": round(scope2_annual_kg, 2),
            "scope3_kg": round(scope3_annual_kg, 2),
            "scope1_tons": round(scope1_annual_kg / 1000.0, 3),
            "scope2_tons": round(scope2_annual_kg / 1000.0, 3),
            "scope3_tons": round(scope3_annual_kg / 1000.0, 3),
        }
    }

def run_impact_forecast(req: SimulationRequest) -> Dict[str, Any]:
    """
    Feature 3: Impact Forecast Engine (reactive What-If calculation)
    Allows reactive adjustments for:
    - ev_transit_shift_pct
    - green_grid_solar_pct
    - waste_recycling_compost_pct
    """
    baseline = calculate_total_footprint(req.baseline_activity)
    baseline_annual_kg = baseline["annual_kg_total"]

    # Copy activity
    sim_activity = req.baseline_activity.model_copy()

    # 1. EV & Transit Shift (cuts primary car commute factor)
    ev_shift_ratio = min(max(req.ev_transit_shift_pct / 100.0, 0.0), 1.0)
    current_weekly_km = req.baseline_activity.commute_km_weekly
    # Shift that portion of km to EV/transit blend (0.04 kg/km average)
    original_prim_factor = TRANSPORT_FACTORS.get(sim_activity.primary_transport_mode.value, 0.192)
    saved_trans_weekly_kg = current_weekly_km * ev_shift_ratio * (original_prim_factor - 0.04)

    # 2. Green Grid & Solar Shift (reduces electricity factor towards 0.18)
    green_shift_ratio = min(max(req.green_grid_solar_pct / 100.0, 0.0), 1.0)
    saved_elec_monthly_kg = sim_activity.electricity_kwh * green_shift_ratio * (0.46 - 0.18)

    # 3. Waste recycling & compost diversion (diverts from landfill 1.25 to average 0.15)
    waste_shift_ratio = min(max(req.waste_recycling_compost_pct / 100.0, 0.0), 1.0)
    current_waste_kg = sim_activity.waste_kg_weekly
    saved_waste_weekly_kg = current_waste_kg * waste_shift_ratio * (1.25 - 0.15)

    annual_kg_saved = (
        (saved_trans_weekly_kg * 52.0) +
        (saved_elec_monthly_kg * 12.0) +
        (saved_waste_weekly_kg * 52.0)
    )
    annual_kg_saved = max(0.0, annual_kg_saved)
    projected_annual_kg = max(0.0, baseline_annual_kg - annual_kg_saved)

    pct_reduction = (annual_kg_saved / baseline_annual_kg * 100) if baseline_annual_kg > 0 else 0.0
    trees_equivalent = round(annual_kg_saved / 22.0, 1)
    km_car_offset = round(annual_kg_saved / 0.192, 0)
    estimated_cost_saved_usd = round(annual_kg_saved * 0.12, 2)

    return {
        "baseline_annual_kg": round(baseline_annual_kg, 2),
        "projected_annual_kg": round(projected_annual_kg, 2),
        "monthly_baseline_kg": round(baseline_annual_kg / 12.0, 2),
        "monthly_projected_kg": round(projected_annual_kg / 12.0, 2),
        "annual_kg_saved": round(annual_kg_saved, 2),
        "monthly_kg_saved": round(annual_kg_saved / 12.0, 2),
        "pct_reduction": round(pct_reduction, 1),
        "trees_equivalent": trees_equivalent,
        "km_car_offset": km_car_offset,
        "estimated_cost_saved_usd": estimated_cost_saved_usd,
        "savings_by_pillar": {
            "transport_saved_kg": round(saved_trans_weekly_kg * 52.0, 1),
            "electricity_saved_kg": round(saved_elec_monthly_kg * 12.0, 1),
            "waste_saved_kg": round(saved_waste_weekly_kg * 52.0, 1),
        }
    }

def get_contributors_analytics(activity: ActivityInput) -> Dict[str, Any]:
    """
    Feature 6: Dedicated Contributors Analytics
    Identifies major carbon drivers and provides high-priority tailored action plans.
    """
    footprint = calculate_total_footprint(activity)
    driver = footprint["primary_driver"]
    driver_pct = footprint["primary_driver_pct"]

    action_plans = {
        "Transport": [
            {
                "id": "cp_trans_1",
                "title": "Shift 3 Commute Days to Metro or EV Carpool",
                "impact_kg_annual": 380.0,
                "difficulty": "Easy",
                "priority": "HIGH PRIORITY",
                "description": f"Transport is your #1 emission source ({driver_pct}% of total footprint). Switching to electric rail or sharing rides with 2 colleagues cuts commute emissions by up to 65% instantly.",
                "action": "Adopt Transit Schedule"
            },
            {
                "id": "cp_trans_2",
                "title": "Micro-Mobility Pledge (< 3km trips)",
                "impact_kg_annual": 120.0,
                "difficulty": "Easy",
                "priority": "RECOMMENDED",
                "description": "Short errand trips with cold engines burn excess fuel. Use bicycles or walking for errands within campus perimeter.",
                "action": "Pledge Micro-Mobility"
            },
            {
                "id": "cp_trans_3",
                "title": "Hybrid / EV Transition Evaluation",
                "impact_kg_annual": 850.0,
                "difficulty": "High Impact",
                "priority": "STRATEGIC",
                "description": "If replacing your vehicle, selecting an EV cuts operating emissions by over 73% compared to conventional gasoline.",
                "action": "Review EV Payback Calc"
            }
        ],
        "Electricity": [
            {
                "id": "cp_elec_1",
                "title": "Solar-Hour High-Power Appliance Synchronization",
                "impact_kg_annual": 240.0,
                "difficulty": "Easy",
                "priority": "HIGH PRIORITY",
                "description": f"Electricity represents {driver_pct}% of your footprint. Run washing machines, device charging, and heavy lab loads during peak daytime generation when green power floods the grid.",
                "action": "Schedule Smart Timer"
            },
            {
                "id": "cp_elec_2",
                "title": "Kill Dorm/Office Standby Phantom Draws",
                "impact_kg_annual": 95.0,
                "difficulty": "Easy",
                "priority": "RECOMMENDED",
                "description": "Idle power supplies and displays consume 8-12% baseline energy 24/7. Use master shutoff power bars.",
                "action": "Enable Master Switches"
            },
            {
                "id": "cp_elec_3",
                "title": "Thermostat Optimization (24°C Baseline)",
                "impact_kg_annual": 180.0,
                "difficulty": "Medium",
                "priority": "STRATEGIC",
                "description": "Setting cooling baselines to 24°C saves 6% compressor load per degree Celsius offset.",
                "action": "Lock 24°C Baseline"
            }
        ],
        "Fuel": [
            {
                "id": "cp_fuel_1",
                "title": "Trip Chaining Routine",
                "impact_kg_annual": 190.0,
                "difficulty": "Easy",
                "priority": "HIGH PRIORITY",
                "description": f"Direct fuel accounts for {driver_pct}% of emissions. Combine isolated errand runs into unified circular journeys to eliminate warm-up engine waste.",
                "action": "Plan Combined Trips"
            },
            {
                "id": "cp_fuel_2",
                "title": "Tire Pressure & Airflow Optimization",
                "impact_kg_annual": 65.0,
                "difficulty": "Easy",
                "priority": "RECOMMENDED",
                "description": "Maintaining correct tire pressure lowers rolling resistance, improving fuel mileage by up to 5%.",
                "action": "Check Tire Pressure"
            }
        ],
        "Waste": [
            {
                "id": "cp_waste_1",
                "title": "100% Organic Waste Composting Diversion",
                "impact_kg_annual": 210.0,
                "difficulty": "Easy",
                "priority": "HIGH PRIORITY",
                "description": f"Waste is your primary contributor ({driver_pct}%). Wet organic waste rotting in landfills produces methane. Diverting to aerobic composting prevents fugitive GHGs.",
                "action": "Use Compost Bins"
            },
            {
                "id": "cp_waste_2",
                "title": "Zero Single-Use Reusable Kit",
                "impact_kg_annual": 55.0,
                "difficulty": "Easy",
                "priority": "RECOMMENDED",
                "description": "Carry a refillable water flask, stainless container, and tote bag to eliminate ~250 single-use disposables annually.",
                "action": "Commit to Reusables"
            }
        ]
    }

    return {
        "primary_driver": driver,
        "primary_driver_pct": driver_pct,
        "annual_kg_total": footprint["annual_kg_total"],
        "recommendations": action_plans.get(driver, action_plans["Transport"]),
        "categories_ranking": footprint["categories_chart"]
    }
