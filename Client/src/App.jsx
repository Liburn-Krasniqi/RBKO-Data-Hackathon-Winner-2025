import { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Form, Button, Row, Col, Alert, Spinner } from "react-bootstrap";
import "./App.css";

function App() {
  const [validated, setValidated] = useState(false);
  const [formData, setFormData] = useState({
    Age: "",
    Income_Level: "",
    Account_Balance: "",
    Deposits: "",
    Withdrawals: "",
    Transfers: "",
    International_Transfers: "",
    Investments: "",
    Loan_Amount: "",
    Loan_Term_Months: "",
    Occupation: "",
  });
  const [result, setResult] = useState(null);
  const [advice, setAdvice] = useState(null);
  const [loadingResult, setLoadingResult] = useState(false);
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

const handleSubmit = async (event) => {
  event.preventDefault();
  event.stopPropagation();

  const form = event.currentTarget;
  if (form.checkValidity() === false) {
    setValidated(true);
    return;
  }

  // --- Pre-eligibility checks (unchanged) ---
  const Age = Number(formData.Age);
  const Income = Number(formData.Income_Level);
  const LoanAmount = Number(formData.Loan_Amount);
  const LoanTerm = Number(formData.Loan_Term_Months);
  const MonthlyDebt = Number(formData.Withdrawals);
  const CollateralValue = Number(formData.Account_Balance);
  const EmploymentStatus = formData.Occupation ? "Employed" : "Unemployed";
  const DefaultHistory = 0;
  const UnemploymentRate = 12;
  const Inflation = 5;
  const InterestRate = 6;
  const model_probability = 0.8;

  const reject = (msg) => {
    setResult({ message: `❌ Loan Rejected: ${msg}`, reliable: false });
    return true;
  };
  const approve = (msg) => {
    setResult({ message: `✅ ${msg}`, reliable: true });
    return false;
  };

  if (Age < 18) {
    if (reject("Client is under legal age")) return;
  } else if (Age + LoanTerm > 65) {
    if (reject("Loan term exceeds retirement age")) return;
  } else if (Income <= 0) {
    if (reject("No verifiable income")) return;
  } else if ((MonthlyDebt / Income) > 0.40) {
    if (reject("Debt-to-income ratio is too high")) return;
  } else if (LoanAmount > Income * 6) {
    if (reject("Loan amount is too high compared to income")) return;
  } else if ((LoanAmount / CollateralValue) > 0.80) {
    if (reject("Loan-to-collateral ratio is too high")) return;
  } else if (EmploymentStatus !== "Employed") {
    if (reject("No stable employment")) return;
  } else if (DefaultHistory > 0) {
    if (reject("Credit history shows defaults")) return;
  } else if (UnemploymentRate >= 15 && (MonthlyDebt / Income) > 0.35) {
    if (reject("High unemployment risk with high debt-to-income")) return;
  } else if (Inflation >= 10 && LoanAmount > Income * 5) {
    if (reject("High inflation – loan amount restricted")) return;
  } else if (InterestRate >= 8 && model_probability < 0.75) {
    if (reject("High interest rate – requires stronger approval probability")) return;
  } else if (model_probability < 0.70) {
    if (reject("Approval probability is too low")) return;
  } else {
    if (approve("Loan may be approved")) return;
  }

  // --- If all checks pass, continue submission ---
  setValidated(true);
  setResult(null);
  setAdvice(null);

  // ---- 1) Send to FastAPI backend for loan prediction ----
  setLoadingResult(true);
  try {
    const res = await fetch("http://127.0.0.1:3000/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Age,
        Income_Level: Income,
        Account_Balance: Number(formData.Account_Balance),
        Deposits: Number(formData.Deposits),
        Withdrawals: Number(formData.Withdrawals),
        Transfers: Number(formData.Transfers),
        International_Transfers: Number(formData.International_Transfers),
        Investments: Number(formData.Investments),
        Loan_Amount: LoanAmount,
        Loan_Term_Months: LoanTerm,
      }),
    });

    const data = await res.json();
    setResult(data);
  } catch (err) {
    console.error("Prediction error:", err);
    setResult({ message: "⚠️ API request failed." });
  } finally {
    setLoadingResult(false);
  }

  // ---- 2) Fetch context from vector DB ----
  setLoadingAdvice(true);
  let context = "";
  try {
    const resContext = await fetch("http://127.0.0.1:3000/insight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ occupation: formData.Occupation }),
    });
    const dataContext = await resContext.json();
    context = typeof dataContext === "string" ? dataContext : JSON.stringify(dataContext);
    console.log("Vector DB context:", context);
  } catch (err) {
    console.error("Vector DB error:", err);
    context = "⚠️ No context retrieved from vector DB.";
  }

  // ---- 3) Banker Advice with LLM ----
  try {
    const SYSTEM_PROMPT = `You are an adviser for bankers, you give them insights on if their clients based on their job (stability and growth) are good loan candidates. Give 2-4 sentence answers, short and concise. In the end give a short final statement if they should be CONSIDERED (not absolute statements) for the loan. Their occupation: ${formData.Occupation}. Context about their job stability according to the WEF_Future_of_Jobs_Report_2025: ${context}`;

    const resAdvice = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b:free",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Please analyze this occupation: ${formData.Occupation}` },
        ],
      }),
    });

    console.log("OpenRouter response status:", resAdvice.status);

    const dataAdvice = await resAdvice.json();
    const message = dataAdvice?.choices?.[0]?.message?.content || "⚠️ No advice received.";
    setAdvice(message);
  } catch (err) {
    console.error("OpenRouter error:", err);
    setAdvice("⚠️ Could not fetch banker advice.");
  } finally {
    setLoadingAdvice(false);
  }
};



  return (
    <div className="container py-4">
      <h1 className="text-center mb-4">DataWave Loan Predictor</h1>

      <Form noValidate validated={validated} onSubmit={handleSubmit}>
        <Row className="mb-3">
          <Form.Group as={Col} md="4" controlId="Age">
            <Form.Label>Age</Form.Label>
            <Form.Control
              required
              type="number"
              min="0"
              value={formData.Age}
              onChange={handleChange}
            />
          </Form.Group>
          <Form.Group as={Col} md="4" controlId="Income_Level">
            <Form.Label>Income Level</Form.Label>
            <Form.Control
              required
              type="number"
              min="0"
              value={formData.Income_Level}
              onChange={handleChange}
            />
          </Form.Group>
          <Form.Group as={Col} md="4" controlId="Account_Balance">
            <Form.Label>Account Balance</Form.Label>
            <Form.Control
              required
              type="number"
              min="0"
              value={formData.Account_Balance}
              onChange={handleChange}
            />
          </Form.Group>
        </Row>

        <Row className="mb-3">
          <Form.Group as={Col} md="4" controlId="Deposits">
            <Form.Label>Deposits</Form.Label>
            <Form.Control
              type="number"
              min="0"
              value={formData.Deposits}
              onChange={handleChange}
            />
          </Form.Group>
          <Form.Group as={Col} md="4" controlId="Withdrawals">
            <Form.Label>Withdrawals</Form.Label>
            <Form.Control
              type="number"
              min="0"
              value={formData.Withdrawals}
              onChange={handleChange}
            />
          </Form.Group>
          <Form.Group as={Col} md="4" controlId="Transfers">
            <Form.Label>Transfers</Form.Label>
            <Form.Control
              type="number"
              min="0"
              value={formData.Transfers}
              onChange={handleChange}
            />
          </Form.Group>
        </Row>

        <Row className="mb-3">
          <Form.Group as={Col} md="4" controlId="International_Transfers">
            <Form.Label>International Transfers</Form.Label>
            <Form.Control
              type="number"
              min="0"
              value={formData.International_Transfers}
              onChange={handleChange}
            />
          </Form.Group>
          <Form.Group as={Col} md="4" controlId="Investments">
            <Form.Label>Investments</Form.Label>
            <Form.Control
              type="number"
              min="0"
              value={formData.Investments}
              onChange={handleChange}
            />
          </Form.Group>
          <Form.Group as={Col} md="4" controlId="Loan_Amount">
            <Form.Label>Loan Amount</Form.Label>
            <Form.Control
              type="number"
              min="0"
              value={formData.Loan_Amount}
              onChange={handleChange}
            />
          </Form.Group>
        </Row>

        <Row className="mb-3">
          <Form.Group as={Col} md="6" controlId="Loan_Term_Months">
            <Form.Label>Loan Term (Months)</Form.Label>
            <Form.Control
              type="number"
              min="1"
              value={formData.Loan_Term_Months}
              onChange={handleChange}
            />
          </Form.Group>
          <Form.Group as={Col} md="6" controlId="Occupation">
            <Form.Label>Occupation</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter your occupation"
              value={formData.Occupation}
              onChange={handleChange}
            />
          </Form.Group>
        </Row>

        <div className="text-center">
          <Button type="submit" className="btn-lg">
            Predict
          </Button>
        </div>
      </Form>

      {/* Loan Prediction Result */}
      {loadingResult && (
        <div className="mt-4 text-center">
          <Spinner animation="border" role="status" />
          <p className="mt-2">Loading loan prediction...</p>
        </div>
      )}
      {result && !loadingResult && (
        <Alert
          variant={result.reliable ? "success" : "danger"}
          className="mt-4 text-center opacity-75"
        >
          <h4>{result.message}</h4>
        </Alert>
      )}

      {/* Banker Adviser Advice */}
      {loadingAdvice && (
        <div className="mt-3 text-center text-primary">
          <Spinner animation="border" role="status" />
          <p className="mt-2 fs-1">Fetching banker advice...</p>
        </div>
      )}
      {advice && !loadingAdvice && (
        <Alert variant="info" className="mt-3 text-center opacity-75">
          <h5>Banker Adviser Insights:</h5>
          <p>{advice}</p>
        </Alert>
      )}
    </div>
  );
}

export default App;
