# altermatchup.py
from sqlalchemy import create_engine, text

engine = create_engine("sqlite:///./matchup.db")

with engine.begin() as conn:
    try:
        conn.execute(text("ALTER TABLE bookings ADD COLUMN start_time DATETIME"))
        print("Added column: start_time")
    except Exception as e:
        print("start_time add skipped / error:", e)
    try:
        conn.execute(text("ALTER TABLE bookings ADD COLUMN end_time DATETIME"))
        print("Added column: end_time")
    except Exception as e:
        print("end_time add skipped / error:", e)

print("Done")
