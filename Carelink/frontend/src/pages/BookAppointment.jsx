import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/Auth.jsx";
import { toast } from "react-toastify";
import { PRODUCT_DETAIL, DOCTORS_LIST, SLOTS_LIST, APPOINTMENTS_CREATE, PAYMENT_ESEWA_INITIATE } from "../services/endpoints";
import "./BookAppointment.css";

const BookAppointment = () => {
  const { id: serviceId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(false);
  const [serviceLoading, setServiceLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [service, setService] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);

  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");

  // -----------------------------
  // Helpers
  // -----------------------------
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split("T")[0];
  };

  const isSlotPast = (isoDateTime) => {
    try {
      return new Date(isoDateTime).getTime() < Date.now();
    } catch {
      return false;
    }
  };

  const selectedDoctorObj = useMemo(
    () => doctors.find((d) => d._id === selectedDoctor),
    [doctors, selectedDoctor]
  );

  // -----------------------------
  // API Calls
  // -----------------------------
  const fetchService = useCallback(async () => {
    setServiceLoading(true);
    try {
      const { data } = await api.get(PRODUCT_DETAIL(serviceId));
      if (data?.success) {
        setService(data.data?.service || data.data?.product || null);
      } else {
        setService(null);
        toast.error("Service not found");
        navigate("/services");
      }
    } catch (error) {
      setService(null);
      toast.error("Service not found");
      navigate("/services");
    } finally {
      setServiceLoading(false);
    }
  }, [serviceId, navigate]);

  const fetchDoctors = useCallback(async (departmentId) => {
    try {
      const { data } = await api.get(`${DOCTORS_LIST}?category=${departmentId}`);
      if (data?.success) {
        setDoctors(data.data?.doctors || []);
      } else {
        setDoctors([]);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
      setDoctors([]);
    }
  }, []);

  const fetchSlots = useCallback(async () => {
    if (!selectedDoctor || !selectedDate) return;

    setSlotsLoading(true);
    try {
      const { data } = await api.get(
        `${SLOTS_LIST}?doctorId=${selectedDoctor}&date=${selectedDate}`
      );
      if (data?.success) {
        setSlots(data.data?.slots || []);
      } else {
        setSlots([]);
      }
    } catch (error) {
      console.error("Error fetching slots:", error);
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [selectedDoctor, selectedDate]);

  // -----------------------------
  // Effects
  // -----------------------------
  useEffect(() => {
    fetchService();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]);


  useEffect(() => {
    if (!service) return;
    const departmentId = service.category?._id || service.category;
    if (departmentId) fetchDoctors(departmentId);
  }, [service, fetchDoctors]);

  // Clear slots immediately when doctor/date changes (prevents stale UI)
  useEffect(() => {
    setSlots([]);
  }, [selectedDoctor, selectedDate]);

  useEffect(() => {
    if (selectedDoctor && selectedDate) fetchSlots();
  }, [selectedDoctor, selectedDate, fetchSlots]);

  // -----------------------------
  // Booking
  // -----------------------------
  const handleBook = async () => {
    if (loading) return; // prevent double click
    if (!selectedDoctor || !selectedDate || !selectedSlot) {
      toast.error("Please select doctor, date, and time slot");
      return;
    }

    if (isSlotPast(selectedSlot)) {
      toast.error("That time slot has already passed. Please pick another.");
      return;
    }

    setLoading(true);
    try {
      // 1) Create appointment
      const { data: appointmentData } = await api.post(APPOINTMENTS_CREATE, {
        doctorId: selectedDoctor,
        serviceId,
        scheduledAt: selectedSlot,
        durationMinutes: service?.durationMinutes || 30,
      });

      if (!appointmentData?.success || !appointmentData?.data?.appointment) {
        throw new Error("Failed to create appointment");
      }

      const appointmentId = appointmentData.data.appointment._id;

      // 2) Initiate payment
      const { data: paymentData } = await api.post(PAYMENT_ESEWA_INITIATE, {
        appointmentId,
      });

      if (!paymentData?.success) {
        throw new Error("Failed to initiate payment");
      }

      // 3) Submit eSewa form
      const form = document.createElement("form");
      form.method = "POST";
      form.action = paymentData.data.esewaUrl;

      Object.entries(paymentData.data.formData || {}).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Failed to book appointment");
      setLoading(false);
    }
  };

  // -----------------------------
  // UI
  // -----------------------------
  if (serviceLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (!service) {
    return <div className="loading">Service not found</div>;
  }

  return (
    <div className="checkout-page">
      <div className="container">
        <h1 className="page-title">Book Appointment</h1>

        <div className="checkout-content">
          <div className="checkout-form">
            <h2>Service: {service.name}</h2>
            <p>Price: Rs. {service.price?.toLocaleString?.() || "0"}</p>

            <div className="form-group">
              <label>Select Doctor *</label>
              <select
                value={selectedDoctor}
                onChange={(e) => {
                  setSelectedDoctor(e.target.value);
                  setSelectedSlot("");
                }}
                className="form-input"
                required
              >
                <option value="">Choose a doctor</option>
                {doctors.map((doctor) => (
                  <option key={doctor._id} value={doctor._id}>
                    {doctor.name} - {doctor.qualifications} ({doctor.experienceYears} years exp.)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Select Date *</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSlot("");
                }}
                min={getMinDate()}
                max={getMaxDate()}
                className="form-input"
                required
              />
            </div>

            {selectedDoctor && selectedDate && (
              <div className="form-group">
                <label>Select Time Slot *</label>

                {slotsLoading ? (
                  <p>Loading slots...</p>
                ) : slots.length === 0 ? (
                  <p>No available slots for this date</p>
                ) : (
                  <div className="slots-grid">
                    {slots.map((slot, index) => {
                      const disabled = isSlotPast(slot.start);
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => !disabled && setSelectedSlot(slot.start)}
                          disabled={disabled}
                          className={`slot-btn ${selectedSlot === slot.start ? "active" : ""} ${disabled ? "disabled" : ""
                            }`}
                        >
                          {slot.displayTime}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Summary */}
            <div className="booking-summary">
              <p>
                <strong>Doctor:</strong> {selectedDoctorObj?.name || "—"}
              </p>
              <p>
                <strong>Date:</strong> {selectedDate || "—"}
              </p>
              <p>
                <strong>Time:</strong>{" "}
                {selectedSlot ? new Date(selectedSlot).toLocaleString() : "—"}
              </p>
              <p>
                <strong>Duration:</strong> {service?.durationMinutes || 30} minutes
              </p>
            </div>

            <button
              onClick={handleBook}
              disabled={loading || !selectedDoctor || !selectedDate || !selectedSlot}
              className="btn btn-primary btn-large"
            >
              {loading ? "Processing..." : "Proceed to Payment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;
