import React, { useState } from 'react';

export default function CitizenRequestForm() {
  // 1. Form data ke liye state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    refType: 'None (Direct Request)',
    refName: '',
    issue: ''
  });

  // 2. Errors show karne ke liye state
  const [errors, setErrors] = useState({});
  
  // 3. Success message dikhane ke liye state
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Jab user input me type karega, ye function state update karega
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Type karte time error hata do
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  // Form validation ka logic
  const validateForm = () => {
    let newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.phone.trim() || formData.phone.length < 10) newErrors.phone = "Valid 10-digit phone number is required";
    if (!formData.issue.trim()) newErrors.issue = "Please describe your issue";
    
    setErrors(newErrors);
    // Agar newErrors object khali hai, toh form valid hai (returns true)
    return Object.keys(newErrors).length === 0;
  };

  // Form submit hone par kya hoga
  const handleSubmit = (e) => {
    e.preventDefault(); // Page refresh hone se roko
    
    if (validateForm()) {
      // Yahan aap backend/API call karoge (e.g., fetch, axios)
      console.log("Form Data Submitted:", formData);
      
      // Success state set karo
      setIsSubmitted(true);
      
      // Form reset kar do
      setFormData({ name: '', phone: '', refType: 'None (Direct Request)', refName: '', issue: '' });
      
      // 3 second baad success message hata do
      setTimeout(() => setIsSubmitted(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Request Assistance</h2>
          <p className="text-gray-500 text-sm mt-1">Please fill out the details below. If you have a reference, mention it.</p>
        </div>

        {/* Success Message Alert */}
        {isSubmitted && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
            Success! Your request has been sent to the Minister's office.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Personal Details */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input 
              type="text" 
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
              className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:ring-1 ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`} 
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input 
              type="tel" 
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="9876543210"
              className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:ring-1 ${errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`} 
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>

          {/* Referral Section */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 space-y-4">
            <div>
              <label className="block text-sm font-medium text-blue-900">Referred By (Designation)</label>
              <select 
                name="refType"
                value={formData.refType}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option>None (Direct Request)</option>
                <option>IPS Officer</option>
                <option>IAS Officer / DM</option>
                <option>MLA / MP</option>
                <option>Other Official</option>
              </select>
            </div>
            
            {/* Officer Name Input - Agar direct nahi hai tabhi highlight ho */}
            <div>
              <label className="block text-sm font-medium text-blue-900">Officer's Name (Optional)</label>
              <input 
                type="text" 
                name="refName"
                value={formData.refName}
                onChange={handleChange}
                placeholder="e.g., Shri Amit Kumar"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
              />
            </div>
          </div>

          {/* Issue Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Help Required</label>
            <textarea 
              name="issue"
              value={formData.issue}
              onChange={handleChange}
              rows="4" 
              placeholder="Describe your issue briefly..."
              className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:ring-1 ${errors.issue ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
            ></textarea>
            {errors.issue && <p className="text-red-500 text-xs mt-1">{errors.issue}</p>}
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-md hover:bg-blue-700 transition duration-200"
          >
            Submit Request
          </button>
        </form>

      </div>
    </div>
  );
}