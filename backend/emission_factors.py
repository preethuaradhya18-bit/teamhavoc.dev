"""
Standard CO2e emission factors based on GHG Protocol and IPCC guidelines.
Calculates pure 4-vector emissions: Electricity + Transport + Fuel + Waste.
(Diet vector strictly purged as requested).
"""

# Grid Electricity Carbon Intensity (kg CO2e / kWh)
GRID_INTENSITY_FACTORS = {
    "standard_grid": 0.46,   # Standard average grid factor (kg CO2e / kWh)
    "green_solar_mix": 0.18, # Solar and renewable purchase agreement mix
}

# Transport (kg CO2e per passenger-kilometer)
TRANSPORT_FACTORS = {
    "Solo Petrol Car": 0.192,
    "Solo Diesel Car": 0.171,
    "Electric Vehicle": 0.052,
    "Hybrid Vehicle": 0.105,
    "Carpool (3+ pax)": 0.048,
    "Public Bus": 0.039,
    "Metro / Electric Train": 0.028,
    "Bicycle / Walking": 0.000,
}

# Direct Fuel (kg CO2e per Liter)
FUEL_FACTORS = {
    "Petrol": 2.31,
    "Diesel": 2.68,
    "LPG": 1.51,
}

# Municipal Solid Waste (kg CO2e per kg waste)
WASTE_FACTORS = {
    "landfill": 1.25,      # Anaerobic degradation producing methane
    "recycled": 0.18,      # Sorting & mechanical processing
    "composted": 0.12,     # Aerobic decomposition
}
