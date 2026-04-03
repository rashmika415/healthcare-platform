// src/components/appointment/AddAppointment.jsx
import React, { useState } from "react";
import axios from "axios";

function AddAppointment() {
  const [formData, setFormData] = useState({
    patientId: "",
    doctorId: "",
    patientName: "",
    doctorName: "",
    specialization: "",
    date: "",
    time: "",
    notes: ""
  });

  // handle input change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post("http://localhost:3003/appointments", formData);

      alert("✅ Appointment Added Successfully!");

      // reset form
      setFormData({
        patientId: "",
        doctorId: "",
        patientName: "",
        doctorName: "",
        specialization: "",
        date: "",
        time: "",
        notes: ""
      });

    } catch (error) {
      console.error("Error adding appointment:", error);
      alert("❌ Failed to add appointment");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Add Appointment</h2>

      <form onSubmit={handleSubmit}>
        
        <input
          type="text"
          name="patientId"
          placeholder="Patient ID"
          value={formData.patientId}
          onChange={handleChange}
          required
        />
        <br />

        <input
          type="text"
          name="patientName"
          placeholder="Patient Name"
          value={formData.patientName}
          onChange={handleChange}
          required
        />
        <br />

        <input
          type="text"
          name="doctorId"
          placeholder="Doctor ID"
          value={formData.doctorId}
          onChange={handleChange}
          required
        />
        <br />

        <input
          type="text"
          name="doctorName"
          placeholder="Doctor Name"
          value={formData.doctorName}
          onChange={handleChange}
          required
        />
        <br />

        <input
          type="text"
          name="specialization"
          placeholder="Specialization"
          value={formData.specialization}
          onChange={handleChange}
          required
        />
        <br />

        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          required
        />
        <br />

        <input
          type="time"
          name="time"
          value={formData.time}
          onChange={handleChange}
          required
        />
        <br />

        <textarea
          name="notes"
          placeholder="Notes (optional)"
          value={formData.notes}
          onChange={handleChange}
        />
        <br />

        <button type="submit">Add Appointment</button>
      </form>
    </div>
  );
}

export default AddAppointment;