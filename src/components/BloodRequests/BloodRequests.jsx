import { useEffect, useState } from "react";
import { State, City } from "country-state-city";
import api from "../../services/api";
import "./BloodRequests.css";
import toast from "react-hot-toast";
import { FaHeartbeat } from "react-icons/fa";
import Loader from "../../components/Common/Loader";

const COUNTRY_CODE = "IN"; // India

// Blood Compatibility Matrix: [Donor Group] -> [Allowed Recipient Groups]
const COMPATIBILITY_MAP = {
  "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"], // Universal Donor
  "O+": ["O+", "A+", "B+", "AB+"],
  "A-": ["A-", "A+", "AB-", "AB+"],
  "A+": ["A+", "AB+"],
  "B-": ["B-", "B+", "AB-", "AB+"],
  "B+": ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"],
};

function BloodRequests() {
  const [requests, setRequests] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Selected request for the detail modal
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Filter States using ISO Codes and Names
  const [selectedStateCode, setSelectedStateCode] = useState("");
  const [selectedStateName, setSelectedStateName] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  // Pagination State (5 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch States from country-state-city
  const indianStates = State.getStatesOfCountry(COUNTRY_CODE);

  // Fetch Cities dependent on selected state
  const availableCities = selectedStateCode
    ? City.getCitiesOfState(COUNTRY_CODE, selectedStateCode)
    : [];

  // Fetch Requests & Current User Profile
  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Fetch requests (handles both direct array or wrapped responses)
      const res = await api.get("/requests");
      const requestData = Array.isArray(res.data)
        ? res.data
        : res.data.requests || [];
      setRequests(requestData);

      // Fetch user profile if logged in
      if (token) {
        try {
          const profileRes = await api.get("/users/profile", {
            headers: { Authorization: `Bearer ${token}` },
          });

          // Handle response wrapping (e.g., profileRes.data.user or direct profileRes.data)
          const userData = profileRes.data?.user || profileRes.data?.data || profileRes.data;
          setUserProfile(userData);
        } catch (pErr) {
          console.warn("User profile could not be fetched", pErr);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch blood requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle State Dropdown Selection
  const handleStateChange = (e) => {
    const isoCode = e.target.value;
    setSelectedStateCode(isoCode);

    const matchedState = indianStates.find((s) => s.isoCode === isoCode);
    setSelectedStateName(matchedState ? matchedState.name : "");

    setSelectedCity(""); // Reset city when state changes
    setCurrentPage(1); // Reset pagination
  };

  // Filter requests based on selected State & City
  const filteredRequests = requests.filter((request) => {
    const matchesState = selectedStateName
      ? request.state === selectedStateName
      : true;
    const matchesCity = selectedCity
      ? request.city?.toLowerCase() === selectedCity.toLowerCase()
      : true;
    return matchesState && matchesCity;
  });

  // Calculate Pagination Slices
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRequests = filteredRequests.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Check blood compatibility
  const checkCompatibility = (donorBloodGroup, recipientBloodGroup) => {
    if (!donorBloodGroup || !recipientBloodGroup) return false;
    
    const formattedDonor = String(donorBloodGroup).trim().toUpperCase();
    const formattedRecipient = String(recipientBloodGroup).trim().toUpperCase();

    const allowedRecipients = COMPATIBILITY_MAP[formattedDonor] || [];
    return allowedRecipients.includes(formattedRecipient);
  };

  // Respond to a blood request with Compatibility Validation
  const handleRespond = async (request) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to respond to requests.");
      return;
    }

    // Fallback checks for common backend field variations
    const donorBloodGroup =
      userProfile?.bloodGroup ||
      userProfile?.blood_group ||
      userProfile?.bloodType;

    const recipientBloodGroup = request?.bloodGroup || request?.blood_group;

    if (!donorBloodGroup) {
      toast.error("Could not verify your blood group. Please update your profile.");
      return;
    }

    const isCompatible = checkCompatibility(
      donorBloodGroup,
      recipientBloodGroup
    );

    if (!isCompatible) {
      toast.error(
        `You are not compatible! Your blood group is (${donorBloodGroup}), but patient needs (${recipientBloodGroup}).`,
        { duration: 5000 }
      );
      return;
    }

    try {
      await api.put(
        `/requests/${request._id}/respond`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Response Sent Successfully ❤️");
      fetchData(); // Refresh requests list
      setSelectedRequest(null); // Close modal if open
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit response.");
    }
  };

  // Helper to retrieve patient age, favoring patientAge key
  const getPatientAge = (req) => {
    if (!req) return null;
    const age = req.patientAge ?? req.age ?? null;
    return age !== null && age !== "" ? age : null;
  };

  if (loading) {
    return <Loader text="Loading Requests..." />;
  }

  return (
    <section className="blood-requests">
      <h2>🩸 Active Blood Requests</h2>

      {/* Filter Controls */}
      <div className="filters-container">
        {/* State Select */}
        <div className="filter-group">
          <label htmlFor="state-select">Filter by State:</label>
          <select
            id="state-select"
            value={selectedStateCode}
            onChange={handleStateChange}>
            <option value="">All States</option>
            {indianStates.map((s) => (
              <option key={s.isoCode} value={s.isoCode}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* City Select Dropdown */}
        <div className="filter-group">
          <label htmlFor="city-select">Filter by City:</label>
          <select
            id="city-select"
            value={selectedCity}
            onChange={(e) => {
              setSelectedCity(e.target.value);
              setCurrentPage(1); // Reset page on filter change
            }}
            disabled={!selectedStateCode}>
            <option value="">
              {selectedStateCode ? "All Cities" : "Select State First"}
            </option>
            {availableCities.map((c) => (
              <option key={`${c.name}-${c.latitude}`} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Requests List View */}
      <div className="requests-list-container">
        {filteredRequests.length > 0 ? (
          <>
            <div className="requests-table-wrapper">
              <table className="requests-table">
                <thead>
                  <tr>
                    <th>Patient Name</th>
                    <th>Blood Group</th>
                    <th>State</th>
                    <th>Status</th>
                    <th style={{ textAlign: "center" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRequests.map((request) => {
                    const rawStatus =
                      request.status ||
                      (request.isCompleted ? "Completed" : "Open");
                    const normalizedStatus = String(rawStatus)
                      .trim()
                      .toLowerCase();
                    const isCompleted =
                      normalizedStatus === "completed" ||
                      request.isCompleted === true;
                    const displayStatus = isCompleted
                      ? "Completed"
                      : rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);

                    const patientAge = getPatientAge(request);

                    return (
                      <tr
                        key={request._id}
                        className={isCompleted ? "row-completed" : ""}>
                        <td className="patient-name-cell">
                          <strong>{request.patientName}</strong>
                          {patientAge !== null && (
                            <span
                              style={{
                                fontSize: "0.85em",
                                color: "#666",
                                marginLeft: "6px",
                              }}>
                              ({patientAge} yrs)
                            </span>
                          )}
                        </td>
                        <td>
                          <span className="blood-badge">
                            {request.bloodGroup}
                          </span>
                        </td>
                        <td>
                          <strong>{request.state || "N/A"}</strong>
                        </td>
                        <td>
                          <span
                            className={`status-badge status-${normalizedStatus}`}>
                            {displayStatus}
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            className="view-details-btn"
                            onClick={() => setSelectedRequest(request)}>
                            👁️ View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination-container">
                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}>
                  &laquo; Prev
                </button>

                <div className="pagination-numbers">
                  {Array.from(
                    { length: totalPages },
                    (_, index) => index + 1,
                  ).map((pageNum) => (
                    <button
                      key={pageNum}
                      className={`pagination-number ${
                        currentPage === pageNum ? "active" : ""
                      }`}
                      onClick={() => handlePageChange(pageNum)}>
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}>
                  Next &raquo;
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="no-requests">
            No blood requests found for the selected location.
          </p>
        )}
      </div>

      {/* POPUP MODAL CARD FOR DETAILED VIEW */}
      {selectedRequest && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedRequest(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close-btn"
              onClick={() => setSelectedRequest(null)}>
              ✕
            </button>

            <div className="modal-header">
              <span className="modal-blood-badge">
                {selectedRequest.bloodGroup}
              </span>
              <h3>{selectedRequest.patientName}</h3>
              {getPatientAge(selectedRequest) !== null && (
                <span className="modal-patient-age">
                  {getPatientAge(selectedRequest)} Yrs Old
                </span>
              )}
            </div>

            <div className="modal-details-grid">
              <div className="compat-item">
                <span className="compat-title">Patient Age</span>
                <span className="compat-val">
                  {getPatientAge(selectedRequest) !== null
                    ? `${getPatientAge(selectedRequest)} Years`
                    : "N/A"}
                </span>
              </div>

              <div className="compat-item">
                <span className="compat-title">Units Required</span>
                <span className="compat-val">
                  {selectedRequest.units} Unit(s)
                </span>
              </div>

              <div className="compat-item">
                <span className="compat-title">Hospital</span>
                <span className="compat-val">
                  {selectedRequest.hospital || "N/A"}
                </span>
              </div>

              <div className="compat-item">
                <span className="compat-title">City & State</span>
                <span className="compat-val">
                  {selectedRequest.city ? `${selectedRequest.city}, ` : ""}
                  {selectedRequest.state || "N/A"}
                </span>
              </div>

              <div className="compat-item">
                <span className="compat-title">Medical Condition</span>
                <span className="compat-val">
                  {selectedRequest.condition || "N/A"}
                </span>
              </div>

              <div className="compat-item">
                <span className="compat-title">Reason</span>
                <span className="compat-val">
                  {selectedRequest.reason === "Other"
                    ? selectedRequest.otherReason
                    : selectedRequest.reason || "N/A"}
                </span>
              </div>

              <div className="compat-item">
                <span className="compat-title">Contact Person</span>
                <span className="compat-val">
                  {selectedRequest.contact || "N/A"}
                </span>
              </div>
            </div>

            <div className="modal-footer">
              {selectedRequest.status === "completed" ||
              selectedRequest.isCompleted ? (
                <span className="completed-action-btn">
                  ✓ Request Completed
                </span>
              ) : (
                <button
                  className="donate-btn"
                  onClick={() => handleRespond(selectedRequest)}>
                  <FaHeartbeat className="donate-icon" />
                  <span>I Can Donate</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default BloodRequests;