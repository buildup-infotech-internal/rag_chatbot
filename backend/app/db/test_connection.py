from sqlalchemy import text
from app.db.database import engine

try:
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print("Supabase connection successful!")
        print("Database test result:", result.scalar())

except Exception as error:
    print("Database connection failed!")
    print("Error:", error)

finally:
    engine.dispose()
