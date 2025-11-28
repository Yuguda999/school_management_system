import asyncio
import sys
import os
from dotenv import load_dotenv

# Load env vars from backend/.env
load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))

# Add backend directory to python path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.core.database import AsyncSessionLocal
from app.models.fee import FeePayment
from app.models.student import Student
from sqlalchemy import select

async def debug_payments():
    async with AsyncSessionLocal() as db:
        print("--- Debugging Payments ---")
        
        # Get all payments
        result = await db.execute(select(FeePayment))
        payments = result.scalars().all()
        
        print(f"Total Payments: {len(payments)}")
        
        for p in payments:
            student_res = await db.execute(select(Student).where(Student.id == p.student_id))
            student = student_res.scalar_one_or_none()
            s_name = f"{student.first_name} {student.last_name}" if student else "UNKNOWN"
            print(f"Payment: {p.id} | Amt: {p.amount} | Student ID: {p.student_id} ({s_name})")

        print("\n--- Checking Students ---")
        # Get all students
        students_res = await db.execute(select(Student))
        students = students_res.scalars().all()
        for s in students:
             print(f"Student: {s.first_name} {s.last_name} | ID: {s.id} | Adm: {s.admission_number}")

if __name__ == "__main__":
    asyncio.run(debug_payments())
