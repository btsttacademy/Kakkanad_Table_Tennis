import React, { useState } from 'react';
import { Tabs, Tab, Box, useMediaQuery, useTheme } from '@mui/material';
import Gallery from '../Components/Gallery';
import Awards from '../Components/Awards';

const GalleryAndAwards = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const tabItems = [
    { label: "Gallery", component: <Gallery /> },
    { label: "Awards", component: <Awards /> }
  ];

  return (
    <Box id="gallery" sx={{ width: '100%' }}>
      {/* Tabs Navigation */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center',
        mb: 4,
        // backgroundColor: 'gray', // Gray background
        py: 2, // Add vertical padding
        borderRadius: 2, // Rounded corners
        mx: isMobile ? 1 : 2, // Horizontal margin
      }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant={isMobile ? "fullWidth" : "standard"}
          sx={{
            minHeight: "30px",
            width: isMobile ? '100%' : 'auto',
            "& .MuiTabs-indicator": {
              backgroundColor: "#f97316",
              height: "100%",
              borderRadius: "25px",
            },
            "& .MuiTab-root": {
              color: "rgba(0,0,0,0.7)", // Darker default text
              fontFamily: "'AlanSans', sans-serif",
              fontWeight: 500,
              fontSize: isMobile ? "12px" : "14px",
              textTransform: "none",
              minHeight: "32px",
              margin: "0 2px",
              minWidth: isMobile ? "50%" : "auto",
              zIndex: 1,
              padding: isMobile ? "6px 12px" : "6px 24px",
              justifyContent: 'center', // Center text horizontally
              textAlign: 'center', // Center text
              "&.Mui-selected": {
                color: "white",
                fontWeight: 600,
              },
              "&:hover": {
                color: "#E2DBD1",
                backgroundColor: 'rgba(255,255,255,0.1)', // Subtle hover effect
              },
            },
          }}
        >
          {tabItems.map((item, index) => (
            <Tab
              key={item.label}
              label={item.label}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
          ))}
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ minHeight: '500px' }} key={currentTab}>
        {tabItems[currentTab].component}
      </Box>
    </Box>
  );
};

export default GalleryAndAwards;