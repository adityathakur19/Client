import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Save, Settings as SettingsIcon, Image as ImageIcon, X } from 'lucide-react';

const Settings = () => {
  const { token } = useAuth();
  const [settings, setSettings] = useState({
    restaurantName: '',
    phoneNumber: '',
    gstin: '',
    businessEmail: '',
    logoUrl: '',
    note: 'Thank you Visit Again'
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [selectedLogo, setSelectedLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        if (data.logoUrl) {
          setLogoPreview(data.logoUrl);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!settings.restaurantName?.trim()) {
      newErrors.restaurantName = 'Restaurant name is required';
    }
    
    if (!settings.phoneNumber?.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\d{10}$/.test(settings.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid 10-digit phone number';
    }
    
    if (settings.businessEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.businessEmail)) {
      newErrors.businessEmail = 'Please enter a valid email address';
    }
    
    if (settings.gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/.test(settings.gstin)) {
      newErrors.gstin = 'Please enter a valid GSTIN';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          logo: 'File size should be less than 5MB'
        }));
        return;
      }
      setSelectedLogo(file);
      setLogoPreview(URL.createObjectURL(file));
      // Clear any previous logo errors
      setErrors(prev => ({
        ...prev,
        logo: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSaving(true);
    setSaveStatus('');

    const formData = new FormData();
    Object.keys(settings).forEach(key => {
      if (key !== 'logoUrl') {
        formData.append(key, settings[key]);
      }
    });

    if (selectedLogo) {
      formData.append('logo', selectedLogo);
    }

    try {
      const response = await fetch('http://localhost:5000/api/settings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const updatedSettings = await response.json();
        setSettings(updatedSettings);
        if (updatedSettings.logoUrl) {
          setLogoPreview(updatedSettings.logoUrl);
        }
        setSaveStatus('success');
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 bg-white">
            <div className="flex items-center space-x-3">
              <SettingsIcon className="w-6 h-6 text-gray-600" />
              <h2 className="text-2xl font-bold text-gray-800">Restaurant Settings</h2>
            </div>
            <p className="mt-2 text-gray-600">Manage your restaurant's information and preferences</p>
          </div>
  
          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Logo Upload Section */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Restaurant Logo
              </label>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <label
                    htmlFor="logo-upload"
                    className="flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors duration-200"
                  >
                    <ImageIcon className="w-5 h-5 mr-2 text-gray-400" />
                    <span className="text-gray-600">
                      {logoPreview ? 'Change Logo' : 'Upload Logo'}
                    </span>
                  </label>
                  <input
                    id="logo-upload"
                    type="file"
                    onChange={handleLogoChange}
                    className="hidden"
                    accept="image/*"
                  />
                </div>
                {logoPreview && (
                  <div className="relative w-20 h-20">
                    <img
                      src={logoPreview}
                      alt="Logo Preview"
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setLogoPreview('');
                        setSelectedLogo(null);
                        setSettings(prev => ({ ...prev, logoUrl: '' }));
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              {errors.logo && (
                <p className="mt-1 text-sm text-red-500">{errors.logo}</p>
              )}
            </div>
  
            {/* Restaurant Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Restaurant Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="restaurantName"
                value={settings.restaurantName}
                onChange={handleChange}
                placeholder="Enter restaurant name"
                className={`w-full px-4 py-2.5 border ${
                  errors.restaurantName ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
              />
              {errors.restaurantName && (
                <p className="mt-1 text-sm text-red-500">{errors.restaurantName}</p>
              )}
            </div>
  
            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={settings.phoneNumber}
                onChange={handleChange}
                placeholder="10-digit phone number"
                className={`w-full px-4 py-2.5 border ${
                  errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              />
              {errors.phoneNumber && (
                <p className="mt-1 text-sm text-red-500">{errors.phoneNumber}</p>
              )}
            </div>
  
            {/* GSTIN */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GSTIN (Optional)
              </label>
              <input
                type="text"
                name="gstin"
                value={settings.gstin}
                onChange={handleChange}
                placeholder="Enter GSTIN number"
                className={`w-full px-4 py-2.5 border ${
                  errors.gstin ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              />
              {errors.gstin && (
                <p className="mt-1 text-sm text-red-500">{errors.gstin}</p>
              )}
            </div>
  
            {/* Business Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Email (Optional)
              </label>
              <input
                type="email"
                name="businessEmail"
                value={settings.businessEmail}
                onChange={handleChange}
                placeholder="Enter business email"
                className={`w-full px-4 py-2.5 border ${
                  errors.businessEmail ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              />
              {errors.businessEmail && (
                <p className="mt-1 text-sm text-red-500">{errors.businessEmail}</p>
              )}
            </div>
  
            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Receipt Note
              </label>
              <textarea
                name="note"
                value={settings.note}
                onChange={handleChange}
                placeholder="Enter a note to display on receipts"
                rows="3"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>
  
            {/* Save Button Section */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              {saveStatus === 'success' && (
                <div className="flex items-center text-green-600">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm">Settings saved successfully!</p>
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="flex items-center text-red-600">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <p className="text-sm">Error saving settings. Please try again.</p>
                </div>
              )}
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center space-x-2 px-6 py-2.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-5 h-5" />
                <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;  