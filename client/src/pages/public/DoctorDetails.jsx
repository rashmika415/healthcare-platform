import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  DollarSign, 
  Star, 
  User, 
  Phone, 
  Mail,
  Award,
  GraduationCap,
  Languages,
  CheckCircle
} from 'lucide-react';

const DoctorDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const doctor = location.state?.doctor;

  const [selectedSession, setSelectedSession] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Doctor information not found.</p>
          <Link 
            to="/appointments" 
            className="bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800"
          >
            Back to Search
          </Link>
        </div>
      </div>
    );
  }

  const handleBookSession = (hospital, session) => {
    setSelectedSession({ hospital, session });
    setShowBookingModal(true);
  };

  const handleConfirmBooking = () => {
    // Here you would typically make an API call to book the appointment
    alert('Appointment booked successfully!');
    setShowBookingModal(false);
    navigate('/appointments');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/appointments')}
                className="flex items-center text-gray-600 hover:text-blue-900 mr-4"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                Back
              </button>
              <Link to="/" className="text-2xl font-bold text-blue-900">
                Nexus Health
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-gray-600 hover:text-blue-900">
                Login
              </Link>
              <Link 
                to="/register" 
                className="bg-blue-900 text-white px-4 py-2 rounded-md hover:bg-blue-800"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Doctor Details Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Doctor Profile */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="text-center">
                <img
                  src={doctor.avatar}
                  alt={doctor.name}
                  className="w-32 h-32 rounded-full object-cover mx-auto mb-4"
                />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{doctor.name}</h1>
                <p className="text-gray-600 mb-1">{doctor.gender}</p>
                <div className="flex items-center justify-center mb-3">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <span className="text-gray-600 ml-1">{doctor.rating}</span>
                  <span className="text-gray-400 ml-2">({doctor.experience})</span>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 mb-4">
                  <p className="text-blue-900 font-medium text-sm">{doctor.specialization}</p>
                </div>
              </div>

              {/* Quick Info */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  +94 11 234 5678
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  doctor@nexushealth.lk
                </div>
              </div>

              {/* Qualifications */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Award className="h-5 w-5 mr-2 text-blue-900" />
                  Qualifications
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• MBBS (Colombo)</li>
                  <li>• MD (Dermatology)</li>
                  <li>• FRCP (London)</li>
                  <li>• Board Certified Dermatologist</li>
                </ul>
              </div>

              {/* Education */}
              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2 text-blue-900" />
                  Education
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• University of Colombo</li>
                  <li>• Postgraduate Institute of Medicine</li>
                  <li>• Royal College of Physicians, London</li>
                </ul>
              </div>

              {/* Languages */}
              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Languages className="h-5 w-5 mr-2 text-blue-900" />
                  Languages
                </h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">English</span>
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">Sinhala</span>
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">Tamil</span>
                </div>
              </div>
            </div>
          </div>

          {/* Available Sessions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Available Sessions</h2>
              
              {doctor.hospitals.map((hospital, hospIdx) => (
                <div key={hospIdx} className="mb-6 last:mb-0">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{hospital.name}</h3>
                      <p className="text-gray-600 flex items-center mt-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        {hospital.location}
                      </p>
                    </div>
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      Available
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hospital.sessions.map((session, sessionIdx) => (
                      <div key={sessionIdx} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-medium text-gray-900">{session.date}</p>
                            <p className="text-gray-600 flex items-center mt-1">
                              <Clock className="h-4 w-4 mr-1" />
                              {session.time}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-blue-900">
                              <DollarSign className="h-5 w-5 inline mr-1" />
                              {session.fee}
                            </p>
                            <p className="text-xs text-gray-500">per consultation</p>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center text-sm text-gray-600">
                            <User className="h-4 w-4 mr-1" />
                            <span>{session.patients} patients booked</span>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            session.available 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {session.available ? 'Available' : 'Full'}
                          </div>
                        </div>

                        <button
                          onClick={() => handleBookSession(hospital, session)}
                          disabled={!session.available}
                          className={`w-full py-2 rounded-lg font-medium transition-colors ${
                            session.available
                              ? 'bg-blue-900 text-white hover:bg-blue-800'
                              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {session.available ? 'Book Now' : 'Session Full'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* About Section */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">About</h2>
              <p className="text-gray-600 leading-relaxed">
                Dr. {doctor.name.split(' ')[1]} is a highly experienced and respected {doctor.specialization.toLowerCase()} 
                with over {doctor.experience.toLowerCase()} of clinical experience. Known for their compassionate 
                patient care and expertise in the latest medical treatments, they have helped thousands of patients 
                achieve better health outcomes. The doctor is committed to providing personalized care plans and 
                staying updated with the latest advancements in medical science.
              </p>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Expert Diagnosis</p>
                    <p className="text-sm text-gray-600">Accurate and timely diagnosis using latest technology</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Patient-Centered Care</p>
                    <p className="text-sm text-gray-600">Personalized treatment plans for each patient</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Modern Facilities</p>
                    <p className="text-sm text-gray-600">Access to state-of-the-art medical equipment</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Follow-up Support</p>
                    <p className="text-sm text-gray-600">Comprehensive post-treatment care and monitoring</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Confirm Booking</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Doctor:</span>
                <span className="font-medium">{doctor.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Hospital:</span>
                <span className="font-medium">{selectedSession.hospital.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">{selectedSession.session.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time:</span>
                <span className="font-medium">{selectedSession.session.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Consultation Fee:</span>
                <span className="font-medium text-blue-900">LKR {selectedSession.session.fee}</span>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowBookingModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBooking}
                className="flex-1 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDetails;
