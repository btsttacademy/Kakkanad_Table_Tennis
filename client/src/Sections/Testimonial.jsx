import React, { useState, useEffect } from "react";
import {
  Rating,
  CircularProgress,
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Dialog,
  IconButton,
  Chip,
  Button,
} from "@mui/material";
import Masonry from "@mui/lab/Masonry";
import UserAvatar from "../Components/UserAvatar";
import { Close, NavigateBefore, NavigateNext } from "@mui/icons-material";

const Testimonial = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [displayTestimonials, setDisplayTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedTestimonial, setSelectedTestimonial] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const itemsPerPage = 10;

  // Updated to use your backend API instead of Google Apps Script
  const SERVER_URL = "https://btsttacademybe.onrender.com";

  // Function to handle base64 images from MongoDB
  const getImageUrl = (photoData) => {
    if (!photoData) return null;

    // If it's a base64 object from MongoDB
    if (typeof photoData === 'object' && photoData.base64) {
      return `data:${photoData.type || 'image/jpeg'};base64,${photoData.base64}`;
    }
    
    // If it's already a data URL
    if (typeof photoData === 'string' && photoData.startsWith('data:')) {
      return photoData;
    }
    
    // If it's a URL (for profile photos)
    if (typeof photoData === 'string' && photoData.startsWith('http')) {
      return photoData;
    }

    return null;
  };

  // Function to parse additional photos from MongoDB base64 data
  const parseAdditionalPhotos = (photosData) => {
    if (!photosData || !Array.isArray(photosData) || photosData.length === 0) {
      return [];
    }

    try {
      // Convert base64 objects to data URLs
      const photoUrls = photosData.map(photo => getImageUrl(photo)).filter(url => url !== null);
      
      console.log(`📸 Processed ${photoUrls.length} additional photos from MongoDB`);
      return photoUrls;
    } catch (error) {
      console.error("Error parsing additional photos:", error);
      return [];
    }
  };

  // FIXED: Safe URL validation function
  const testImageUrl = (url) => {
    // Check if url is a string and has the required method
    if (!url || typeof url !== 'string') {
      return false;
    }

    // Check if it's a base64 data URL or regular URL
    const isValidUrl = url.startsWith('data:') || 
                      url.startsWith('http') || 
                      url.startsWith('https');

    return isValidUrl;
  };

  // FIXED: Safe image click handler - only for additional photos
  const handleImageClick = (testimonial, imageUrl, index = 0) => {
    if (!testImageUrl(imageUrl)) {
      console.warn('Invalid image URL:', imageUrl);
      return;
    }
    
    setSelectedTestimonial(testimonial);
    setSelectedImage(imageUrl);
    setCurrentImageIndex(index);
    setImageDialogOpen(true);
  };

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("🔄 Fetching testimonials from backend...");

      // Use your backend API endpoint
      const response = await fetch(`${SERVER_URL}/api/reviews/testimonials`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch testimonials: ${response.status}`);
      }

      const data = await response.json();
      
      console.log("📊 Backend response:", data);

      if (data.success && data.testimonials) {
        // Process testimonials with base64 photos from MongoDB
        const processedTestimonials = data.testimonials.map((testimonial, index) => {
          const additionalPhotos = parseAdditionalPhotos(testimonial.additionalPhotos);
          const profilePhoto = getImageUrl(testimonial.photo);

          console.log(`👤 ${testimonial.name}:`, {
            profilePhoto: profilePhoto ? '✅' : '❌',
            additionalPhotos: additionalPhotos.length,
            source: testimonial.source || 'unknown'
          });

          return {
            ...testimonial,
            additionalPhotos: additionalPhotos,
            photo: profilePhoto,
            // Keep original timestamp handling
            timestamp: testimonial.timestamp || testimonial.storedAt || new Date()
          };
        });

        console.log(`✅ Loaded ${processedTestimonials.length} testimonials`);
        setTestimonials(processedTestimonials);
        setDisplayTestimonials(processedTestimonials.slice(0, itemsPerPage));
      } else {
        throw new Error(data.message || "No testimonials found");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
      setTestimonials([]);
      setDisplayTestimonials([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  useEffect(() => {
    if (showAll) {
      setDisplayTestimonials(testimonials);
    } else {
      setDisplayTestimonials(testimonials.slice(0, itemsPerPage));
    }
  }, [showAll, testimonials]);

  const handleCloseDialog = () => {
    setImageDialogOpen(false);
    setSelectedImage(null);
    setSelectedTestimonial(null);
    setCurrentImageIndex(0);
  };

  const handleNextImage = () => {
    if (selectedTestimonial) {
      const allImages = selectedTestimonial.additionalPhotos || [];
      if (allImages.length === 0) return;
      
      const nextIndex = (currentImageIndex + 1) % allImages.length;
      setCurrentImageIndex(nextIndex);
      setSelectedImage(allImages[nextIndex]);
    }
  };

  const handlePrevImage = () => {
    if (selectedTestimonial) {
      const allImages = selectedTestimonial.additionalPhotos || [];
      const prevIndex = (currentImageIndex - 1 + allImages.length) % allImages.length;
      setCurrentImageIndex(prevIndex);
      setSelectedImage(allImages[prevIndex]);
    }
  };

  const toggleShowAll = () => {
    setShowAll(!showAll);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
          background: "linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(50,50,50,0.95) 100%)",
          color: "white",
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress sx={{ color: "#FF9800", mb: 2 }} />
          <Typography variant="h6">Loading testimonials...</Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          textAlign: "center",
          minHeight: 400,
          background: "linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(50,50,50,0.95) 100%)",
          color: "white",
          padding: 4,
        }}
      >
        <Typography variant="h4" color="error" gutterBottom>
          Error Loading Testimonials
        </Typography>
        <Typography variant="body1">{error}</Typography>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <Button
            onClick={fetchTestimonials}
            variant="contained"
            sx={{ background: "#FF9800" }}
          >
            Try Again
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      id="testimonials"
      sx={{
        background: "linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(50,50,50,0.95) 100%)",
        color: "white",
        p: { xs: 3, md: 6 },
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <Typography
        variant="h4"
        component="h4"
        sx={{
          mb: 3,
          fontFamily: "'AlanSans', sans-serif",
          fontWeight: 700,
          background: "linear-gradient(45deg, #FF9800 30%, #FF5722 90%)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          color: "transparent",
        }}
      >
        What They've Said
      </Typography>

      <Box sx={{ width: "100%", maxWidth: 1200, justifyContent: "center" }}>
        <Masonry columns={{ xs: 1, sm: 2, md: 3 }} spacing={3}>
          {displayTestimonials.map((testimonial, index) => {
            const additionalPhotos = testimonial.additionalPhotos || [];
            const hasAdditionalPhotos = additionalPhotos.length > 0;

            return (
              <Card
                key={index}
                sx={{
                  background: "rgba(255,255,255,0.05)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 2,
                  overflow: "hidden",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-5px)",
                  },
                }}
              >
                <CardContent
                  sx={{
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    textAlign: "left",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <UserAvatar
                      photoUrl={testimonial.photo}
                      name={testimonial.name}
                    />

                    <Box sx={{ ml: 2 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          color: "#FFFF",
                          fontWeight: 600,
                          fontFamily: "'AlanSans', sans-serif",
                        }}
                      >
                        {testimonial.name}
                      </Typography>
                      <Rating
                        value={testimonial.rating}
                        readOnly
                        size="small"
                        sx={{
                          color: "#FF9800",
                          "& .MuiRating-iconFilled": { color: "#FF9800" },
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          color: "rgba(255,255,255,0.5)",
                          display: "block",
                          mt: 0.5,
                        }}
                      >
                        {new Date(testimonial.timestamp).toLocaleDateString()}
                      </Typography>
                      {testimonial.source && (
                        <Chip
                          label={testimonial.source}
                          size="small"
                          sx={{
                            mt: 0.5,
                            height: 20,
                            fontSize: '0.6rem',
                            backgroundColor: 'rgba(255,152,0,0.2)',
                            color: '#FF9800'
                          }}
                        />
                      )}
                    </Box>
                  </Box>

                  <div className="relative text-[rgba(255,255,255,0.9)] font-in px-2 text-center flex mb-2">
                    <p>
                      <b className="px-2 text-[#ff9800] text-2xl font-riope">"</b>
                      {testimonial.comment}
                      <b className="px-2 text-[#ff9800] text-2xl font-riope">"</b>
                    </p>
                  </div>

                  {/* Additional Photos Masonry - Only show additional photos */}
                  {hasAdditionalPhotos && (
                    <Box sx={{ mt: 2 }}>
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "repeat(3, 1fr)",
                          gap: 1,
                        }}
                      >
                        {additionalPhotos.map((photoUrl, photoIndex) => {
                          // FIXED: Safe URL check
                          const isValidUrl = testImageUrl(photoUrl);

                          return (
                            <Box
                              key={photoIndex}
                              onClick={() => {
                                if (isValidUrl) {
                                  handleImageClick(
                                    testimonial,
                                    photoUrl,
                                    photoIndex
                                  );
                                }
                              }}
                              sx={{
                                cursor: isValidUrl ? "pointer" : "not-allowed",
                                borderRadius: 1,
                                overflow: "hidden",
                                transition: "transform 0.2s ease",
                                "&:hover": {
                                  transform: isValidUrl ? "scale(1.05)" : "none",
                                },
                                aspectRatio: "1",
                                backgroundColor: isValidUrl
                                  ? "rgba(255,255,255,0.1)"
                                  : "rgba(255,0,0,0.3)",
                                border: isValidUrl
                                  ? "1px solid rgba(255,255,255,0.2)"
                                  : "1px solid rgba(255,0,0,0.5)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                position: "relative",
                              }}
                            >
                              {isValidUrl ? (
                                <img
                                  src={photoUrl}
                                  alt={`Additional photo ${photoIndex + 1} by ${testimonial.name}`}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                  }}
                                  onError={(e) => {
                                    console.error("Image failed to load:", photoUrl);
                                    e.target.style.display = "none";
                                    e.target.parentElement.innerHTML = `
                                      <div style="color: rgba(255,255,255,0.7); font-size: 10px; text-align: center; padding: 4px;">
                                        ❌ Load Failed
                                      </div>
                                    `;
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    color: "white",
                                    fontSize: "10px",
                                    textAlign: "center",
                                    padding: "4px",
                                  }}
                                >
                                  ⚠️ Invalid Image
                                  <br />
                                  <small style={{ fontSize: '8px', opacity: 0.7 }}>
                                    {typeof photoUrl === 'string' ? 
                                      photoUrl.substring(0, 10) + '...' : 
                                      'Non-string URL'
                                    }
                                  </small>
                                </div>
                              )}
                            </Box>
                          );
                        })}
                      </Box>
                      {/* <Typography 
                        variant="caption" 
                        sx={{ 
                          color: "rgba(255,255,255,0.5)", 
                          mt: 0.5, 
                          display: "block",
                          fontSize: '0.7rem'
                        }}
                      >
                        📸 {additionalPhotos.length} additional photo{additionalPhotos.length !== 1 ? 's' : ''}
                      </Typography> */}
                    </Box>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Masonry>

        {/* View More/Less Button */}
        {testimonials.length > itemsPerPage && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <Button
              onClick={toggleShowAll}
              variant="outlined"
              sx={{
                color: "#FF9800",
                borderColor: "#FF9800",
                "&:hover": {
                  borderColor: "#FF5722",
                  backgroundColor: "rgba(255,152,0,0.1)",
                },
              }}
            >
              {showAll
                ? "View Less"
                : `View More (${testimonials.length - itemsPerPage} more)`}
            </Button>
          </Box>
        )}
      </Box>

      {/* Image Dialog - Only shows additional photos */}
      <Dialog
        open={imageDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            background: "rgba(0,0,0,0.99)",
            color: "white",
          },
        }}
      >
        {selectedImage && selectedTestimonial && (
          <>
            <IconButton
              onClick={handleCloseDialog}
              sx={{
                position: "absolute",
                right: 8,
                top: 8,
                color: "white",
                background: "rgba(0,0,0,0.5)",
                "&:hover": {
                  background: "rgba(255,0,0,0.5)",
                },
                zIndex: 1000,
              }}
            >
              <Close />
            </IconButton>

            <IconButton
              onClick={handlePrevImage}
              sx={{
                position: "absolute",
                left: 8,
                top: "50%",
                transform: "translateY(-50%)",
                color: "white",
                background: "rgba(0,0,0,0.5)",
                "&:hover": {
                  background: "rgba(255,152,0,0.5)",
                },
                zIndex: 1000,
              }}
            >
              <NavigateBefore />
            </IconButton>

            <IconButton
              onClick={handleNextImage}
              sx={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                color: "white",
                background: "rgba(0,0,0,0.5)",
                "&:hover": {
                  background: "rgba(255,152,0,0.5)",
                },
                zIndex: 1000,
              }}
            >
              <NavigateNext />
            </IconButton>

            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                p: 2,
                minHeight: "400px",
                backgroundColor: "rgba(255,255,255,0.1)",
              }}
            >
              <img
                src={selectedImage}
                alt="Enlarged view"
                style={{
                  maxWidth: "100%",
                  maxHeight: "70vh",
                  objectFit: "contain",
                }}
                onError={(e) => {
                  console.error("Dialog image failed to load:", selectedImage);
                  e.target.style.display = "none";
                  e.target.parentElement.innerHTML = `
                    <div style="color: white; text-align: center; padding: 20px;">
                      <div style="font-size: 24px; margin-bottom: 10px;">❌</div>
                      <div>Image failed to load</div>
                    </div>
                  `;
                }}
              />
            </Box>

            <Box sx={{ p: 2, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography
                    variant="h6"
                    sx={{
                      color: "white",
                      fontFamily: "'AlanSans', sans-serif",
                    }}
                  >
                    {selectedTestimonial.name}
                  </Typography>
                  <Rating
                    value={selectedTestimonial.rating}
                    readOnly
                    size="small"
                    sx={{ color: "#FF9800" }}
                  />
                </Box>
                <Chip
                  label={`${currentImageIndex + 1} / ${
                    (selectedTestimonial.additionalPhotos || []).length
                  }`}
                  sx={{ color: "white", background: "rgba(255,152,0,0.3)" }}
                />
              </Box>
              <Typography
                variant="body2"
                sx={{ color: "rgba(255,255,255,0.8)", mt: 1 }}
              >
                {selectedTestimonial.comment}
              </Typography>
            </Box>
          </>
        )}
      </Dialog>

      {testimonials.length === 0 && !loading && (
        <Box sx={{ textAlign: "center", mt: 4 }}>
          <Typography variant="h6" sx={{ color: "rgba(255,255,255,0.7)" }}>
            No testimonials yet. Be the first to share your experience!
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Testimonial;