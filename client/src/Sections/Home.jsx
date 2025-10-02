import React, { useState } from 'react'
import NavBar from './NavBar'
import BasicInput from '../Components/BasicInput'
import CustomButton from '../Components/CustomButton';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

const Home = ({mainHeading,mainDescription,mainBG,mainBGmb}) => {
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    question: ''
  });
  const [errors, setErrors] = useState({
    name: '',
    phoneNumber: '',
    question: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialog, setDialog] = useState({
    open: false,
    type: 'success',
    message: ''
  });

  // Updated: Use your Node.js server URL
  const SERVER_URL = 'https://btsttacademybe.onrender.com'; // Change this in production

  const validateForm = () => {
    const newErrors = {
      name: '',
      phoneNumber: '',
      question: ''
    };

    let isValid = true;

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters long';
      isValid = false;
    } else if (!/^[a-zA-Z\s]*$/.test(formData.name.trim())) {
      newErrors.name = 'Name can only contain letters and spaces';
      isValid = false;
    }

    // Phone number validation
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
      isValid = false;
    } else if (!/^\d{10}$/.test(formData.phoneNumber.trim())) {
      newErrors.phoneNumber = 'Phone number must be exactly 10 digits';
      isValid = false;
    } else if (!/^[6-9]\d{9}$/.test(formData.phoneNumber.trim())) {
      newErrors.phoneNumber = 'Please enter a valid Indian phone number';
      isValid = false;
    }

    // Question validation - REMOVED all validations (optional field)
    // No validation for question field

    setErrors(newErrors);
    return isValid;
  };

  const handleInputChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));

    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        question: formData.question.trim() // Will be empty string if not provided
      };

      // Updated: Use your Node.js server endpoint
      const response = await fetch(`${SERVER_URL}/api/inquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Show success dialog with detailed info
        let successMessage = 'Message sent successfully! We will get back to you soon.';
        
        // Add storage details to message
        if (result.storedIn) {
          const storageDetails = [];
          if (result.storedIn.googleSheets) storageDetails.push('Google Sheets');
          if (result.storedIn.mongodb) storageDetails.push('Database');
          
          if (storageDetails.length > 0) {
            successMessage += ` (Stored in: ${storageDetails.join(' + ')})`;
          }
        }
        
        setDialog({
          open: true,
          type: 'success',
          message: successMessage
        });
        
        // Reset form
        setFormData({ name: '', phoneNumber: '', question: '' });
        setErrors({ name: '', phoneNumber: '', question: '' });
        
      } else {
        // Show error from server
        throw new Error(result.message || 'Failed to send message');
      }

    } catch (error) {
      console.error('Submission error:', error);
      
      // Show appropriate error message
      let errorMessage = 'Failed to send message. Please try again.';
      
      if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message.includes('duplicate')) {
        errorMessage = 'Similar inquiry already exists from this phone number.';
      }
      
      setDialog({
        open: true,
        type: 'error',
        message: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseDialog = () => {
    setDialog(prev => ({ ...prev, open: false }));
  };

  return (
    <div id="home" className='relative h-screen rounded-xl my-2 w-full overflow-hidden'>
      
      <div className='absolute inset-0 bg-homebg max-[750px]:bg-homebgmb bg-cover bg-center bg-no-repeat z-0' />
      
      <div className='absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/70 z-1' />
      
      <div className='relative z-10 flex flex-col justify-between p-5 h-full'>
        <NavBar/>
        
        <div className='flex gap-3 items-center max-[750px]:flex-col'>
          <div className='flex-1 text-white max-[750px]:text-center'>
            <p className='text-H font-riope'>{mainHeading}</p>
            <p className='font-in'>{mainDescription}</p>
          </div>

          <form onSubmit={handleSubmit} className='font-in flex-1 rounded-2xl max-[750px]:max-w-[400px] bg-black/35 backdrop-blur-md p-3'>
            <p className='text-stone-200 text-sm bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600 py-1 px-2 rounded-xl shadow-md'>
              You can use this chat facility to clear any of your queries prior to Bookings ....
            </p>
            
            <BasicInput
              labelName="Name"
              fieldName="Name"
              placeholder="Enter your Name"
              width="100%"
              value={formData.name}
              onChange={(value) => handleInputChange('name', value)}
              error={errors.name}
              required
            />
            
            <BasicInput
              labelName="Phone Number"
              fieldName="Phone Number"
              type="number"
              placeholder="Enter your 10-digit phone number"
              width="100%"
              value={formData.phoneNumber}
              onChange={(value) => handleInputChange('phoneNumber', value)}
              error={errors.phoneNumber}
              required
            />

            <BasicInput
              labelName="Your Question (Optional)"
              fieldName="Questions"
              type="multiline"
              placeholder="Ask your question here... (optional)"
              value={formData.question}
              onChange={(value) => handleInputChange('question', value)}
              error={errors.question}
              // Removed required prop to make it optional
            />
            
            <div className="mt-5 flex justify-end">
              <CustomButton 
                type="submit"
                message={true}
                size="small"
                text={isSubmitting ? "Sending..." : "Send Message"}
                loading={isSubmitting}
                disabled={isSubmitting}
                onClick={handleSubmit}
              />
            </div>
            
            <div className="mt-2 text-xs text-stone-400 text-center">
              Alternatively, you can email us at btsttacademy@gmail.com
            </div>
          </form>
        </div>
      </div>

      {/* Material-UI Dialog for messages */}
      <Dialog
        open={dialog.open}
        onClose={handleCloseDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: '12px',
            padding: '8px'
          }
        }}
      >
        <DialogTitle 
          id="alert-dialog-title"
          sx={{ 
            color: dialog.type === 'success' ? '#4caf50' : '#f44336',
            fontWeight: 'bold',
            textAlign: 'center'
          }}
        >
          {dialog.type === 'success' ? 'Success!' : 'Notice'}
        </DialogTitle>
        <DialogContent>
          <p id="alert-dialog-description" style={{ textAlign: 'center', margin: 0 }}>
            {dialog.message}
          </p>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', padding: '16px 24px' }}>
          <Button 
            onClick={handleCloseDialog}
            variant="contained"
            sx={{
              backgroundColor: dialog.type === 'success' ? '#4caf50' : '#f44336',
              '&:hover': {
                backgroundColor: dialog.type === 'success' ? '#45a049' : '#da190b'
              }
            }}
            autoFocus
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default Home;