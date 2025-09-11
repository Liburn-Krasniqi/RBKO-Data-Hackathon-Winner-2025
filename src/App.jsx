import { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Form, Button, Row, Col, Alert } from "react-bootstrap";
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
  });
  const [result, setResult] = useState(null);

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

    try {
      const res = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Age: Number(formData.Age),
          Income_Level: Number(formData.Income_Level),
          Account_Balance: Number(formData.Account_Balance),
          Deposits: Number(formData.Deposits),
          Withdrawals: Number(formData.Withdrawals),
          Transfers: Number(formData.Transfers),
          International_Transfers: Number(formData.International_Transfers),
          Investments: Number(formData.Investments),
          Loan_Amount: Number(formData.Loan_Amount),
          Loan_Term_Months: Number(formData.Loan_Term_Months),
        }),
      });

      const data = await res.json();
      setResult(data);
      console.log("Prediction result:", data);
    } catch (err) {
      console.error("Prediction error:", err);
      setResult({ message: "⚠️ API request failed." });
    }

    setValidated(true);
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
        </Row>

        <div className="text-center">
          <Button type="submit" className="btn-lg">
            Predict
          </Button>
        </div>
      </Form>

      {result && (
        <Alert
          variant={result.liable ? "success" : "danger"}
          className="mt-4 text-center"
        >
          <h4>{result.message}</h4>
        </Alert>
      )}
    </div>
  );
}

export default App;
