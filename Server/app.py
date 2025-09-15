import joblib
import numpy as np

from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from pymilvus import MilvusClient, model as milvus_model


# ---------------- Milvus setup ----------------
client = MilvusClient("../VectorData/Hackathon.db")
embedding_fn = milvus_model.DefaultEmbeddingFunction()


# ---------------- ML Model setup ----------------
ml_model = joblib.load("../ML/model.pkl")


# ---------------- FastAPI App ----------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------- Request Models ----------------
class OccupationInsightRequest(BaseModel):
    occupation: str


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


# ---------------- Routes ----------------
@app.post("/insight")
def get_insight(data: OccupationInsightRequest):
    query_vectors = embedding_fn.encode_queries([data.occupation])

    res = client.search(
        collection_name="hackthon_collection",  # target collection
        data=query_vectors,
        limit=2,
        output_fields=["text", "subject"],
    )

    return res[0][0].text


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

    prediction = int(ml_model.predict(features)[0])

    reliable = prediction == 0  # 0 → reliable, 1 → not reliable

    return {
        "reliable": reliable,
        "message": "✅ This user is liable for a loan."
        if reliable
        else "❌ They aren't liable for a loan."
    }
