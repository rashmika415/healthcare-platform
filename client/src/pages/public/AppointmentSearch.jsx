import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, MapPin, Search, User, Clock, DollarSign, Star, ChevronDown } from 'lucide-react';
import axios from 'axios';

const AppointmentSearch = () => {
  const navigate = useNavigate();
  const [searchFilters, setSearchFilters] = useState({
    doctorName: '',
    specialization: '',
    hospital: '',
    date: ''
  });
  
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [specializations, setSpecializations] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  
  // Dropdown states
  const [isDoctorDropdownOpen, setIsDoctorDropdownOpen] = useState(false);
  const [isSpecializationDropdownOpen, setIsSpecializationDropdownOpen] = useState(false);
  const [isHospitalDropdownOpen, setIsHospitalDropdownOpen] = useState(false);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [filteredSpecializations, setFilteredSpecializations] = useState([]);
  const [filteredHospitals, setFilteredHospitals] = useState([]);

  // Fetch specializations, hospitals, and doctors from database on component mount
  React.useEffect(() => {
    fetchSpecializationsAndHospitals();
    fetchAllDoctors();
  }, []);

  const fetchSpecializationsAndHospitals = async () => {
    try {
      // Fetch all verified doctors to get unique specializations and hospitals
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/doctor/search`);
      const doctors = response.data.doctors || [];
      
      // Extract unique specializations and hospitals
      const uniqueSpecializations = [...new Set(doctors.map(doc => doc.specialization).filter(Boolean))];
      const uniqueHospitals = [...new Set(doctors.map(doc => doc.hospital).filter(Boolean))];
      
      setSpecializations(uniqueSpecializations);
      setFilteredSpecializations(uniqueSpecializations);
      setHospitals(uniqueHospitals);
      setFilteredHospitals(uniqueHospitals);
    } catch (error) {
      console.error('Error fetching specializations and hospitals:', error);
      // Fallback to default options
      const defaultSpecializations = [
        'Cardiology', 'Dermatology', 'Pediatrics', 'Orthopedics', 'Gynecology',
        'Neurology', 'Psychiatry', 'Oncology', 'General Surgery', 'Internal Medicine'
      ];
      const defaultHospitals = [
        'Asiri Hospital', 'Nawaloka Hospital', 'Lady Ridgeway Hospital', 
        'Skin Clinic-Karapitiya', 'Apollo Hospital', 'Colombo General Hospital'
      ];
      setSpecializations(defaultSpecializations);
      setFilteredSpecializations(defaultSpecializations);
      setHospitals(defaultHospitals);
      setFilteredHospitals(defaultHospitals);
    }
  };

  const fetchAllDoctors = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/doctor/search`);
      const doctors = response.data.doctors || [];
      setDoctors(doctors);
      setFilteredDoctors(doctors);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setDoctors([]);
      setFilteredDoctors([]);
    }
  };

  const handleInputChange = (field, value) => {
    setSearchFilters(prev => ({
      ...prev,
      [field]: value
    }));

    // Filter dropdowns based on input
    if (field === 'doctorName') {
      const filtered = doctors.filter(doctor => 
        doctor.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredDoctors(filtered);
      setIsDoctorDropdownOpen(value.length > 0 || filtered.length > 0);
    } else if (field === 'specialization') {
      const filtered = specializations.filter(spec => 
        spec.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSpecializations(filtered);
      setIsSpecializationDropdownOpen(value.length > 0 || filtered.length > 0);
    } else if (field === 'hospital') {
      const filtered = hospitals.filter(hospital => 
        hospital.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredHospitals(filtered);
      setIsHospitalDropdownOpen(value.length > 0 || filtered.length > 0);
    }
  };

  const handleDoctorSelect = (doctor) => {
    setSearchFilters(prev => ({
      ...prev,
      doctorName: doctor.name
    }));
    setIsDoctorDropdownOpen(false);
    setFilteredDoctors(doctors);
  };

  const handleSpecializationSelect = (specialization) => {
    setSearchFilters(prev => ({
      ...prev,
      specialization: specialization
    }));
    setIsSpecializationDropdownOpen(false);
    setFilteredSpecializations(specializations);
  };

  const handleHospitalSelect = (hospital) => {
    setSearchFilters(prev => ({
      ...prev,
      hospital: hospital
    }));
    setIsHospitalDropdownOpen(false);
    setFilteredHospitals(hospitals);
  };

  const handleSearch = async () => {
    setIsLoading(true);
    setHasSearched(true);
    setIsDoctorDropdownOpen(false);
    setIsSpecializationDropdownOpen(false);
    setIsHospitalDropdownOpen(false);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (searchFilters.doctorName) params.append('name', searchFilters.doctorName);
      if (searchFilters.specialization) params.append('specialization', searchFilters.specialization);
      if (searchFilters.hospital) params.append('hospital', searchFilters.hospital);
      if (searchFilters.date) params.append('date', searchFilters.date);
      
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/doctor/search?${params.toString()}`
      );
      
      setSearchResults(response.data.doctors || []);
    } catch (error) {
      console.error('Error searching doctors:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDoctorProfileClick = (doctor) => {
    navigate('/doctor-details', { state: { doctor } });
  };

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.doctor-dropdown-container')) {
        setIsDoctorDropdownOpen(false);
      }
      if (!event.target.closest('.specialization-dropdown-container')) {
        setIsSpecializationDropdownOpen(false);
      }
      if (!event.target.closest('.hospital-dropdown-container')) {
        setIsHospitalDropdownOpen(false);
      }
    };

    if (isDoctorDropdownOpen || isSpecializationDropdownOpen || isHospitalDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDoctorDropdownOpen, isSpecializationDropdownOpen, isHospitalDropdownOpen]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
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

      {/* Search Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Search results for</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Doctor Name with Dropdown */}
            <div className="relative doctor-dropdown-container">
              <User className="absolute left-3 top-3 h-5 w-5 text-gray-400 z-10" />
              <input
                type="text"
                placeholder="Search or select doctor..."
                value={searchFilters.doctorName}
                onChange={(e) => handleInputChange('doctorName', e.target.value)}
                onFocus={() => setIsDoctorDropdownOpen(true)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <ChevronDown 
                className="absolute right-3 top-3 h-5 w-5 text-gray-400 cursor-pointer z-10"
                onClick={() => setIsDoctorDropdownOpen(!isDoctorDropdownOpen)}
              />
              
              {/* Doctor Dropdown List */}
              {isDoctorDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                  {filteredDoctors.length > 0 ? (
                    filteredDoctors.map((doctor) => (
                      <div
                        key={doctor._id || doctor.id}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => handleDoctorSelect(doctor)}
                      >
                        <div className="flex items-center">
                          <img
                            src={doctor.avatar || 'https://i.pravatar.cc/150?img=12'}
                            alt={doctor.name}
                            className="w-8 h-8 rounded-full object-cover mr-3"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{doctor.name}</p>
                            <p className="text-xs text-gray-500">{doctor.specialization}</p>
                            <p className="text-xs text-gray-400">{doctor.hospital}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      {searchFilters.doctorName ? 'No doctors found' : 'Start typing to search doctors'}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Specialization with Dropdown */}
            <div className="relative specialization-dropdown-container">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400 z-10" />
              <input
                type="text"
                placeholder="Search or select specialization..."
                value={searchFilters.specialization}
                onChange={(e) => handleInputChange('specialization', e.target.value)}
                onFocus={() => setIsSpecializationDropdownOpen(true)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <ChevronDown 
                className="absolute right-3 top-3 h-5 w-5 text-gray-400 cursor-pointer z-10"
                onClick={() => setIsSpecializationDropdownOpen(!isSpecializationDropdownOpen)}
              />
              
              {/* Specialization Dropdown List */}
              {isSpecializationDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                  {filteredSpecializations.length > 0 ? (
                    filteredSpecializations.map((specialization) => (
                      <div
                        key={specialization}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => handleSpecializationSelect(specialization)}
                      >
                        <div className="flex items-center">
                          <Search className="h-4 w-4 text-gray-400 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{specialization}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      {searchFilters.specialization ? 'No specializations found' : 'Start typing to search specializations'}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Hospital with Dropdown */}
            <div className="relative hospital-dropdown-container">
              <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400 z-10" />
              <input
                type="text"
                placeholder="Search or select hospital..."
                value={searchFilters.hospital}
                onChange={(e) => handleInputChange('hospital', e.target.value)}
                onFocus={() => setIsHospitalDropdownOpen(true)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <ChevronDown 
                className="absolute right-3 top-3 h-5 w-5 text-gray-400 cursor-pointer z-10"
                onClick={() => setIsHospitalDropdownOpen(!isHospitalDropdownOpen)}
              />
              
              {/* Hospital Dropdown List */}
              {isHospitalDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                  {filteredHospitals.length > 0 ? (
                    filteredHospitals.map((hospital) => (
                      <div
                        key={hospital}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => handleHospitalSelect(hospital)}
                      >
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 text-gray-400 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{hospital}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      {searchFilters.hospital ? 'No hospitals found' : 'Start typing to search hospitals'}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Date Input */}
            <div className="relative">
              <CalendarDays className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={searchFilters.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="bg-blue-900 text-white px-6 py-2 rounded-lg hover:bg-blue-800 disabled:opacity-50"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {hasSearched && (
          <div className="mb-6">
            <p className="text-gray-600">
              Found {searchResults.length} doctor{searchResults.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
            <p className="mt-2 text-gray-600">Searching doctors...</p>
          </div>
        )}

        {!isLoading && hasSearched && searchResults.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No doctors found matching your criteria.</p>
          </div>
        )}

        {!isLoading && searchResults.length > 0 && (
          <div className="space-y-6">
            {searchResults.map(doctor => (
              <div key={doctor._id || doctor.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Doctor Profile Card */}
                  <div className="lg:w-1/3">
                    <div className="flex items-start space-x-4">
                      <img
                        src={doctor.avatar || 'https://i.pravatar.cc/150?img=12'}
                        alt={doctor.name}
                        className="w-20 h-20 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{doctor.name}</h3>
                        <p className="text-sm text-gray-600">{doctor.gender || 'Not specified'}</p>
                        <div className="flex items-center mt-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600 ml-1">{doctor.rating || 'N/A'}</span>
                          <span className="text-sm text-gray-400 ml-2">({doctor.experience || 'N/A'})</span>
                        </div>
                        <p className="text-sm text-blue-900 mt-2 font-medium">{doctor.specialization}</p>
                        <div className="mt-3 space-y-1">
                          {doctor.hospitals && doctor.hospitals.map((hospital, idx) => (
                            <p key={idx} className="text-xs text-gray-600">
                              • {hospital.name}
                            </p>
                          ))}
                        </div>
                        <button
                          onClick={() => handleDoctorProfileClick(doctor)}
                          className="mt-4 w-full bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 text-sm"
                        >
                          View Profile
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Sessions */}
                  <div className="lg:w-2/3">
                    <h4 className="font-semibold text-gray-900 mb-4">Available Sessions</h4>
                    <div className="space-y-4">
                      {doctor.hospitals && doctor.hospitals.map((hospital, hospIdx) => (
                        <div key={hospIdx} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h5 className="font-medium text-gray-900">{hospital.name}</h5>
                              <p className="text-sm text-gray-600 flex items-center mt-1">
                                <MapPin className="h-4 w-4 mr-1" />
                                {hospital.location}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {hospital.sessions && hospital.sessions.length > 0 ? (
                              hospital.sessions.map((session, sessionIdx) => (
                                <div key={sessionIdx} className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">{session.date}</p>
                                      <p className="text-sm text-gray-600 flex items-center">
                                        <Clock className="h-4 w-4 mr-1" />
                                        {session.time}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-semibold text-blue-900">
                                        <DollarSign className="h-4 w-4 inline mr-1" />
                                        {session.fee}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <p className="text-xs text-gray-500">
                                      {session.patients} patients
                                    </p>
                                    <button
                                      disabled={!session.available}
                                      className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                                        session.available
                                          ? 'bg-green-500 text-white hover:bg-green-600'
                                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                      }`}
                                    >
                                      {session.available ? 'Available' : 'Not Available'}
                                    </button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="col-span-full text-center py-8">
                                <p className="text-gray-500">No available sessions for this date</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentSearch;
