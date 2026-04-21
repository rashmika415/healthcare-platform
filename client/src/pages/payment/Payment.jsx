import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const PAYMENT_API_BASE_URL =
  process.env.REACT_APP_PAYMENT_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  "http://localhost:3000";

// ✅ FIXED KEY (same as backend account)
const stripeKey =
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY ||
  "pk_test_51TLj46BtxdtnPsIYiTgaKAb2MyUplD9ioDVtHEFaaUNJlvrUxPB2BSGPe8Nqe3yUzlydfST0rIoxWO2enu5bpSss00LL2nYKbx";

const stripePromise = loadStripe(stripeKey);

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();

  const location = useLocation();
  const navigate = useNavigate();

  const appointmentId = location.state?.appointmentId;

  const [paymentId, setPaymentId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [consultationFee, setConsultationFee] = useState(5000);
  const [feeLoading, setFeeLoading] = useState(true);
  const [agreedToPayment, setAgreedToPayment] = useState(false);

  useEffect(() => {
    const fetchPaymentIntent = async () => {
      try {
        const res = await axios.post(
          `${PAYMENT_API_BASE_URL}/payments/create`,
          { appointmentId }
        );

        setPaymentId(res.data.paymentId);
        setClientSecret(res.data.clientSecret || "");
        setErrorMessage(
          res.data.clientSecret ? "" : "Unable to initialize payment."
        );
      } catch (err) {
        console.error(err);
        setErrorMessage(
          err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Failed to load payment."
        );
      }
    };

    const fetchConsultationFee = async () => {
      try {
        const appointmentRes = await axios.get(
          `${PAYMENT_API_BASE_URL}/appointments/getappointmentbyid/${appointmentId}`
        );
        const doctorId = appointmentRes.data?.appointment?.doctorId;
        if (!doctorId) {
          setConsultationFee(5000);
          return;
        }

        const doctorRes = await axios.get(
          `${PAYMENT_API_BASE_URL}/public/doctors/${doctorId}`
        );
        const fee = Number(doctorRes.data?.doctor?.consultationFee);
        setConsultationFee(Number.isFinite(fee) && fee > 0 ? fee : 5000);
      } catch (err) {
        console.error("Failed to fetch consultation fee:", err);
        setConsultationFee(5000);
      } finally {
        setFeeLoading(false);
      }
    };

    if (!appointmentId) {
      setErrorMessage("No appointment selected. Please book an appointment first.");
      setFeeLoading(false);
      return;
    }

    fetchPaymentIntent();
    fetchConsultationFee();
  }, [appointmentId]);

  const handlePay = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cardElement = elements.getElement(CardNumberElement);
      if (!stripe || !elements || !cardElement) {
        alert("Stripe is not ready yet. Please refresh the page.");
        setLoading(false);
        return;
      }

      if (!clientSecret) {
        alert("Payment cannot proceed because the payment session is not initialized.");
        setLoading(false);
        return;
      }

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (result.error) {
        alert(result.error.message);
        setLoading(false);
        return;
      }

      if (result.paymentIntent.status === "succeeded") {
        await axios.post(`${PAYMENT_API_BASE_URL}/payments/confirm`, {
          paymentId,
        });

        alert("Payment Successful ✅");
        navigate("/success");
      }

    } catch (error) {
      console.error(error);
      alert("Payment Failed ❌");
    }

    setLoading(false);
  };

  const elementStyles = {
    base: {
      fontSize: "16px",
      color: "#0f172a",
      fontFamily: "Inter, system-ui, sans-serif",
      "::placeholder": {
        color: "#94a3b8",
      },
    },
    invalid: {
      color: "#ef4444",
    },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 px-4 py-10">
      <form onSubmit={handlePay} className="bg-white p-6 rounded-3xl w-full max-w-md shadow-xl border border-slate-200">

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Payment</h2>
          <p className="text-sm text-slate-500">Appointment Payment</p>
        </div>

        {errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">
            {errorMessage}
          </div>
        )}

        <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
          <p className="text-sm font-medium text-slate-700">
            Doctor Consultation Fee:{" "}
            <span className="font-bold text-slate-900">
              {feeLoading ? "Loading..." : `Rs.${consultationFee}`}
            </span>
          </p>
        </div>

        <label className="mb-4 flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={agreedToPayment}
            onChange={(e) => setAgreedToPayment(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span>I agree to proceed with this payment.</span>
        </label>

        {agreedToPayment && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Card Number</label>
              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                <CardNumberElement options={{ style: elementStyles }} />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Expiry Date</label>
              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                <CardExpiryElement options={{ style: elementStyles }} />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">CVC</label>
              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                <CardCvcElement options={{ style: elementStyles }} />
              </div>
            </div>
          </div>
        )}

        <button
          disabled={!stripe || loading || !clientSecret || !!errorMessage || !agreedToPayment}
          className="mt-6 bg-blue-600 text-white w-full py-3 rounded-2xl text-sm font-semibold shadow-lg shadow-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Processing..." : "Pay Now"}
        </button>
      </form>
    </div>
  );
}

export default function Payment() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}
