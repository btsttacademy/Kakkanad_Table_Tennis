import React, { useState } from "react";
import { TextField, Box } from "@mui/material";
import { ErrorOutline } from "@mui/icons-material";
import india from "../Assets/india.png"

const BasicInput = ({ labelName, fieldName, value, onChange, placeholder, type, error, helperText, width = "100%" }) => {
  const [phoneError, setPhoneError] = useState("");
  const [touched, setTouched] = useState(false);

  // Phone number validation function
  const validatePhoneNumber = (phone) => {
    if (!phone) return "Phone number is required";
    
    
    const digits = phone.substring(3);
    
    
    return "";
  };

  // Handle regular input change
  const handleRegularChange = (e) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  // Handle phone number input
  const handlePhoneChange = (e) => {
    let inputValue = e.target.value;
    
    // Remove non-digit characters except +
    inputValue = inputValue.replace(/[^\d+]/g, '');
    
    // Ensure it starts with +91 but don't duplicate it
    if (!inputValue.startsWith('+91')) {
      // If user is typing and value doesn't start with +91, add it
      if (inputValue.length > 0) {
        inputValue =  inputValue.replace(/^\+91/, '');
      }
    }
    
    // Limit to 13 characters (+91 + 10 digits)
    if (inputValue.length > 13) {
      inputValue = inputValue.slice(0, 13);
    }
    
    // Validate only if user has started typing
    if (touched || inputValue.length > 3) {
      const validationError = validatePhoneNumber(inputValue);
      setPhoneError(validationError);
    }
    
    // Pass only the value to parent
    if (onChange) {
      onChange(inputValue);
    }
  };

  const handleBlur = () => {
    setTouched(true);
    if (isPhoneNumber) {
      const validationError = validatePhoneNumber(value);
      setPhoneError(validationError);
    }
  };

  const handleFocus = () => {
    setTouched(true);
  };

  // Check if it's a phone number field
  const isPhoneNumber = type === 'number' && fieldName?.toLowerCase().includes('phone');

  // Combine errors (parent error + phone validation error)
  const hasError = error || (isPhoneNumber && phoneError && touched);
  const displayHelperText = helperText || (isPhoneNumber && touched ? phoneError : '');

  return (
    <div>
      <div className={`my-1`} style={{ width: width }}>
        <label className="text-gray-200 block mb-1 text-sm">
          {labelName}
        </label>
        <TextField
        name={fieldName}
          id={`${fieldName}-input`}
          type={isPhoneNumber ? "tel" : type}
          placeholder={placeholder}
          value={value || ''}
          onChange={isPhoneNumber ? handlePhoneChange : handleRegularChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          fullWidth
          multiline={type === 'multiline'}
          rows={type === 'multiline' ? 2 : 1}
          size="small"
          error={hasError}
          helperText={displayHelperText}
          InputProps={{
            startAdornment: isPhoneNumber ? (
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                <img className="w-6 mr-1" src={india} alt="Indian flag" />
                <span style={{ 
                  color: hasError ? '#f44336' : '#ffffff', 
                  fontWeight: '500',
                  opacity: hasError ? 0.7 : 1,
                  fontSize: '14px'
                }}>+91</span>
              </Box>
            ) : null,
            endAdornment: hasError ? (
              <ErrorOutline sx={{ color: '#f44336', fontSize: '18px' }} />
            ) : null,
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(10px)",
              borderRadius: "6px",
              alignItems: type === 'multiline' ? 'flex-start' : 'center',
              transition: "all 0.3s ease",
              minHeight: type === 'multiline' ? 'auto' : '40px',

              "&:hover": {
                backgroundColor: hasError ? "rgba(244, 67, 54, 0.1)" : "rgba(255, 255, 255, 0.15)",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: hasError ? "#f44336" : "rgba(255, 255, 255, 0.5)",
                },
              },

              "&.Mui-focused": {
                backgroundColor: hasError ? "rgba(244, 67, 54, 0.1)" : "rgba(255, 255, 255, 0.2)",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: hasError ? "#f44336" : "#FF9800",
                  borderWidth: "2px",
                },
              },

              "&.Mui-error": {
                backgroundColor: "rgba(244, 67, 54, 0.1)",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#f44336",
                },
              },

              "& .MuiOutlinedInput-input": {
                color: hasError ? "#f44336" : "#ffffff",
                padding: type === 'multiline' ? "8px 12px" : "6px 12px",
                fontSize: "14px",
                lineHeight: type === 'multiline' ? "1.4" : "1.5",
                
                "&::placeholder": {
                  color: hasError ? "rgba(244, 67, 54, 0.9)" : "rgba(255, 255, 255, 0.7)",
                  fontSize: "14px",
                },
              },

              "& .MuiOutlinedInput-inputSizeSmall": {
                padding: type === 'multiline' ? "6px 12px" : "4px 12px",
              },
            },

            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: hasError ? "#f44336" : "rgba(255, 255, 255, 0.3)",
              transition: "all 0.3s ease",
            },

            "& .MuiFormHelperText-root": {
              color: hasError ? "#f44336" : "rgba(255, 255, 255, 0.7)",
              marginLeft: 0,
              fontSize: "0.7rem",
              marginTop: "2px",
            },
            
            // Style for multiline textarea
            "& .MuiOutlinedInput-inputMultiline": {
              resize: "vertical",
              minHeight: type === 'multiline' ? "60px" : "auto",
            },

            // Reduce margin between elements
            "& .MuiInputBase-root": {
              margin: 0,
            },
          }}
        />
      </div>
    </div>
  );
};

export default BasicInput;