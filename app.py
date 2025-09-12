from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:3000"] for more security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load trained logistic regression model
model = joblib.load("model.pkl")

class LoanRequest(BaseModel):
    Age: float
    Income_Level: float
    Account_Balance: float
    Deposits: float
    Withdrawals: float
    Transfers: float
    International_Transfers: float
    Investments: float
    Loan_Amount: float
    Loan_Term_Months: float

@app.post("/predict")
def predict(data: LoanRequest):
    features = np.array([[
        data.Age,
        data.Income_Level,
        data.Account_Balance,
        data.Deposits,
        data.Withdrawals,
        data.Transfers,
        data.International_Transfers,
        data.Investments,
        data.Loan_Amount,
        data.Loan_Term_Months
    ]])

    prediction = int(model.predict(features)[0])

    reliable = None;
    
    if prediction == 1:
        reliable = False;
    else:
        reliable = True;

    
    return {
        "reliable": reliable,
        "message": "✅ This user is liable for a loan."
        if reliable
        else "❌ They aren't liable for a loan."
    }
