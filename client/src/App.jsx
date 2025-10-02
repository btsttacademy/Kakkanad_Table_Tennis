import React, { useEffect, useState } from "react";
import Home from "./Sections/Home";
import "./App.css";
import About from "./Sections/About";
import Testimonial from "./Sections/Testimonial";
import GalleryAndAwards from "./Sections/GalleryAndAwards";
import Footer from "./Sections/Footer";


const SERVER_URL = "https://btsttacademybe.onrender.com"; // Change this in production

const App = () => {
  const [contentData, setContentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from your Node.js server
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use your Node.js server endpoint for web content
      const url = `${SERVER_URL}/api/web-content`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setContentData(result.data);
        console.log('✅ Web content loaded successfully');
        if (result.cached) {
          console.log('📦 Using cached content');
        }
      } else {
        throw new Error(result.message || "No data found from server");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
      // Don't set any default data - let the error state handle it
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // This will run every time the component mounts (page reload)
    // fetchData();
    refreshData()
  }, []); // Empty dependency array means it runs once on mount

  // Function to refresh data
  const refreshData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const url = `${SERVER_URL}/api/web-content/refresh`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setContentData(result.data);
        console.log('✅ Web content refreshed successfully');
      } else {
        throw new Error(result.message || "Failed to refresh data");
      }
    } catch (err) {
      console.error("Error refreshing data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <div className="text-center">
          {/* Orange Material-UI inspired loader */}
          <div className="relative inline-block">
            <div className="w-16 h-16 border-4 border-orange-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-orange-500 rounded-full animate-spin border-t-transparent"></div>
          </div>
          <p className="mt-4 text-gray-600">Loading content from server...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <div className="text-center max-w-md mx-4">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Content Not Available</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500 mb-6">
            Make sure your backend server is running on {SERVER_URL}
          </p>
          <div className="space-y-2">
            <button 
              onClick={refreshData}
              className="w-full px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              Try Again
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="w-full px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App px-2">
      {contentData && (
        <>
          
          
          <Home 
            mainHeading={contentData.MainHeading}
            mainDescription={contentData.MainDescription}
            mainBG={contentData.mainBG}
            mainBGmb={contentData.mainBGmb}
          />
          <About 
            aboutHeading={contentData.AboutHeading}
            aboutDescription={contentData.AboutDescription}
            feature1Heading={contentData.dh1}
            feature1Description={contentData.dd1}
            feature2Heading={contentData.dh2}
            feature2Description={contentData.dd2}
            images={[contentData.img1, contentData.img2, contentData.img3]}
            coachingHeading={contentData.coaching}
            coachingDescription={contentData.coachingDes}
            groupCoachingHeading={contentData.Groupcoaching}
            groupCoachingDescription={contentData.GroupcoachingDes}
            price={contentData.oneTimeCharge}
            timing1Heading={contentData.Timingh1}
            timing1Description={contentData.Timingd1}
            timing2Heading={contentData.Timingh2}
            timing2Description={contentData.Timingd2}
          />
          <Testimonial />
          <GalleryAndAwards />
          <Footer />
        </>
      )}
    </div>
  );
};

export default App;