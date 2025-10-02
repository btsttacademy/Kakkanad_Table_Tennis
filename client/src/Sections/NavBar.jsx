import React, { useState, useEffect, useRef } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Box,
  useMediaQuery,
  useTheme,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  CircularProgress,
} from "@mui/material";
import { GiHamburgerMenu } from "react-icons/gi";
import { FaTableTennis } from "react-icons/fa";
import { Close } from "@mui/icons-material";
import CustomButton from "../Components/CustomButton";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import colorLogo from "../Assets/color.png";

// Import the new form components
import {
  TextInput,
  RatingInput,
  AvatarDisplay,
  MultiplePhotosUpload,
} from "../Components/FormComponents";

const NavBar = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedbackDialog, setFeedbackDialog] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [hasReviewed, setHasReviewed] = useState(false);
  const [checkingReview, setCheckingReview] = useState(false);
  const [additionalPhotosUploading, setAdditionalPhotosUploading] =
    useState(false);
  const [googleAuthLoading, setGoogleAuthLoading] = useState(false);

  // Updated: Use your Node.js server URL
  const SERVER_URL = 'https://btsttacademybe.onrender.com';

  const [reviewData, setReviewData] = useState({
    name: "",
    rating: 0,
    comment: "",
  });

  const [addPhotos, setAddPhotos] = useState([]);
  const [addPhotosPreview, setAddPhotosPreview] = useState([]);
  const addPhotosInputRef = useRef();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const menuItems = [
    { label: "Home", href: "#home" },
    { label: "About", href: "#about" },
    { label: "Testimonials", href: "#testimonials" },
    { label: "Gallery and Awards", href: "#gallery" },
  ];


   useEffect(() => {
refreshTestimonials()      
    }, []);

    // Function to refresh testimonials
const refreshTestimonials = async () => {
  try {
    const response = await fetch(`${SERVER_URL}/api/reviews/testimonials/refresh`);
    const data = await response.json();
    
   
  } catch (error) {
    console.error("Error refreshing testimonials:", error);
  }
};

  // File to base64 conversion
  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = (error) => reject(error);
    });

  const filesToBase64Array = async (files) =>
    Promise.all(
      files.map(async (file) => ({
        base64: await fileToBase64(file),
        name: file.name,
        type: file.type,
      }))
    );

  // Event Handlers
  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleMobileMenuItemClick = (href) => {
    setDrawerOpen(false);
    setTimeout(() => {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  const handleDesktopTabClick = (href, index) => {
    setCurrentTab(index);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleInputChange = (field, value) => {
    setReviewData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddReviewClick = async () => {
    if (user?.email) {
      setCheckingReview(true);
      try {
        const data = await checkUserReview(user.email);
        if (data.hasReview) {
          setHasReviewed(true);
          showFeedbackDialog("Your review has already been shared.", "info");
          setReviewDialogOpen(false);
        } else {
          setHasReviewed(false);
          setReviewDialogOpen(true);
        }
      } catch (error) {
        console.error("Error checking review:", error);
        setHasReviewed(false);
        setReviewDialogOpen(true);
      } finally {
        setCheckingReview(false);
      }
    } else {
      setAuthDialogOpen(true);
    }
  };

  // Check if user has already reviewed - UPDATED FOR NODE.JS BACKEND
  const checkUserReview = async (email) => {
    try {
      const response = await fetch(`${SERVER_URL}/api/reviews/check?email=${encodeURIComponent(email)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error checking review:", error);
      return { hasReview: false, message: "Error checking review status" };
    }
  };

  // Google OAuth Success
  const handleGoogleSuccess = async (credentialResponse) => {
    setGoogleAuthLoading(true);
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      setUser({
        ...decoded,
        picture: decoded.picture,
      });
      setReviewData((prev) => ({
        ...prev,
        name: decoded.name || "",
        photo: decoded.picture,
      }));
      setAuthDialogOpen(false);

      setCheckingReview(true);
      const reviewCheck = await checkUserReview(decoded.email);
      if (reviewCheck.hasReview) {
        setHasReviewed(true);
        setReviewDialogOpen(false);
        showFeedbackDialog("Your review has already been shared.", "info");
      } else {
        setHasReviewed(false);
        setReviewDialogOpen(true);
      }
    } catch (error) {
      console.error("Google auth error:", error);
      showFeedbackDialog("Authentication failed. Please try again.", "error");
    } finally {
      setGoogleAuthLoading(false);
      setCheckingReview(false);
    }
  };

  const handleGoogleError = () => {
    showFeedbackDialog(
      "Google authentication failed. Please try again.",
      "error"
    );
  };

  const handleAuthDialogClose = () => {
    setAuthDialogOpen(false);
  };

  const handleReviewDialogClose = () => {
    setReviewDialogOpen(false);
    setReviewData({
      name: user ? user.name || "" : "",
      rating: 0,
      comment: "",
    });
    setAddPhotos([]);
    setAddPhotosPreview([]);
  };

  const handleAddPhotosUpload = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(
      (file) =>
        file.type.startsWith("image/") &&
        file.size <= 5 * 1024 * 1024 &&
        !addPhotos.find((f) => f.name === file.name)
    );

    if (validFiles.length < files.length) {
      showFeedbackDialog(
        "Some files were not images or were over 5MB.",
        "warning"
      );
    }

    setAdditionalPhotosUploading(true);
    setAddPhotos((prev) => [...prev, ...validFiles]);

    let processedCount = 0;
    const newPreviews = [];

    validFiles.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target.result);
        processedCount++;

        if (processedCount === validFiles.length) {
          setAddPhotosPreview((prev) => [...prev, ...newPreviews]);
          setAdditionalPhotosUploading(false);
        }
      };
      reader.onerror = () => {
        processedCount++;
        if (processedCount === validFiles.length) {
          setAdditionalPhotosUploading(false);
        }
      };
      reader.readAsDataURL(file);
    });

    if (validFiles.length === 0) {
      setAdditionalPhotosUploading(false);
    }
  };

  const handleRemoveAddPhoto = (index) => {
    setAddPhotos((prev) => prev.filter((_, i) => i !== index));
    setAddPhotosPreview((prev) => prev.filter((_, i) => i !== index));
  };

  const showFeedbackDialog = (message, severity = "success") => {
    setFeedbackDialog({ open: true, message, severity });
  };

  const handleFeedbackDialogClose = () => {
    setFeedbackDialog((prev) => ({ ...prev, open: false }));
  };

 
// Submit Review Function - SIMPLIFIED SUCCESS MESSAGE
const handleReviewSubmit = async () => {
  if (reviewData.rating === 0) {
    showFeedbackDialog("Please provide a rating", "error");
    return;
  }

  if (!reviewData.comment.trim()) {
    showFeedbackDialog("Please provide a review comment", "error");
    return;
  }

  setLoading(true);

  try {
    const additionalPhotosBase64 = addPhotos.length > 0 
      ? await filesToBase64Array(addPhotos) 
      : [];

    const payload = {
      name: reviewData.name.trim(),
      email: user?.email || "unknown@example.com",
      rating: reviewData.rating,
      comment: reviewData.comment?.trim() || "",
      photo: user?.picture ? user.picture : null,
      additionalPhotos: additionalPhotosBase64,
    };

    console.log('Submitting review with payload:', payload);

    const response = await fetch(`${SERVER_URL}/api/reviews/submit`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Submission response:', data);

    if (data.success) {
      // Simple success message without storage details
      showFeedbackDialog("Thank you! Your review was submitted successfully.", "success");
      handleReviewDialogClose();
      setHasReviewed(true);
    } else {
      throw new Error(data.message || "Submission failed");
    }
  } catch (error) {
    console.error("Review submission error:", error);
    
    let errorMessage = "Submission failed. Please try again.";
    if (error.message.includes("duplicate") || error.message.includes("already submitted")) {
      errorMessage = "You have already submitted a review with this email.";
      setHasReviewed(true);
    } else if (error.message.includes("network") || error.message.includes("fetch")) {
      errorMessage = "Network error. Please check your connection and try again.";
    }
    
    showFeedbackDialog(errorMessage, "error");
  } finally {
    setLoading(false);
  }
};

  // Drawer Content
  const drawerContent = (
    <Box
      sx={{
        width: 280,
        height: "100%",
        background:
          "linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(50,50,50,0.95) 100%)",
        color: "white",
        padding: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <FaTableTennis className="text-orange-500 text-2xl" />
          <span className="font-in font-bold text-white">BT's TT Academy</span>
        </Box>
        <IconButton onClick={handleDrawerToggle} sx={{ color: "white" }}>
          <Close />
        </IconButton>
      </Box>
      <List>
        {menuItems.map((item, index) => (
          <ListItem
            key={item.label}
            button
            onClick={() => handleMobileMenuItemClick(item.href)}
            sx={{
              border:
                currentTab === index
                  ? "1px solid #FF9800"
                  : "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              marginBottom: 1,
              background:
                currentTab === index
                  ? "rgba(255,165,0,0.2)"
                  : "rgba(255,255,255,0.05)",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <ListItemText
              primary={item.label}
              sx={{
                color: currentTab === index ? "#FF9800" : "white",
                "& .MuiListItemText-primary": {
                  fontFamily: "'AlanSans', sans-serif",
                  fontWeight: currentTab === index ? 600 : 500,
                },
              }}
            />
          </ListItem>
        ))}
      </List>
      <Box sx={{ padding: 2 }}>
        <CustomButton
          rating
          size="small"
          onClick={handleAddReviewClick}
          fullWidth
          text={checkingReview ? "Checking..." : "Add Review"}
          disabled={checkingReview}
        />
      </Box>
    </Box>
  );

  return (
    <>
      <AppBar
        position="static"
        sx={{
          background: "transparent",
          boxShadow: "none",
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between", padding: "8px 0" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <img src={colorLogo} className=" w-16" />
          </Box>
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box
              sx={{
                background: "rgba(0,0,0,0.1)",
                borderRadius: "25px",
                border: "1px solid rgba(255,255,255,0.1)",
                padding: "4px",
              }}
            >
              <Tabs
                value={currentTab}
                onChange={handleTabChange}
                sx={{
                  minHeight: "40px",
                  "& .MuiTabs-indicator": {
                    backgroundColor: "#f97316",
                    height: "100%",
                    borderRadius: "25px",
                  },
                  "& .MuiTab-root": {
                    color: "rgba(255,255,255,0.7)",
                    fontFamily: "'AlanSans', sans-serif",
                    fontWeight: 500,
                    fontSize: "14px",
                    textTransform: "none",
                    minHeight: "32px",
                    margin: "0 2px",
                    minWidth: "auto",
                    zIndex: 1,
                    "&.Mui-selected": {
                      color: "white",
                      fontWeight: 600,
                    },
                    "&:hover": {
                      color: "#E2DBD1",
                    },
                  },
                }}
              >
                {menuItems.map((item, index) => (
                  <Tab
                    key={item.label}
                    label={item.label}
                    onClick={() => handleDesktopTabClick(item.href, index)}
                  />
                ))}
              </Tabs>
            </Box>
            <CustomButton
              rating
              size="small"
              text={checkingReview ? "Checking..." : "Add Review"}
              onClick={handleAddReviewClick}
              disabled={checkingReview}
            />
          </Box>
          <IconButton
            sx={{
              display: { xs: "flex", md: "none" },
              color: "white",
              background: "rgba(0,0,0,0.1)",
              border: "1px solid rgba(255,255,255,0.1)",
              "&:hover": {
                background: "rgba(255,165,0,0.2)",
              },
            }}
            onClick={handleDrawerToggle}
          >
            <GiHamburgerMenu />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        anchor="right"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: 280,
            border: "none",
            background: "transparent",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Auth Dialog */}
      <Dialog
        open={authDialogOpen}
        onClose={handleAuthDialogClose}
        maxWidth="xs"
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            background:
              "linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(50,50,50,0.98) 100%)",
            color: "white",
            borderRadius: "12px",
            textAlign: "center",
          },
        }}
      >
        <DialogTitle sx={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <Typography
            variant="h6"
            sx={{ fontFamily: "'AlanSans', sans-serif" }}
          >
            Sign In to Continue
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ padding: 3 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <FaTableTennis className="text-orange-500 text-4xl" />
            <Typography
              variant="h6"
              sx={{ fontFamily: "'AlanSans', sans-serif" }}
            >
              BT's TT Academy
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "rgba(255,255,255,0.7)", mb: 2 }}
            >
              Sign in with Google to add your review and share your experience
              with our academy.
            </Typography>
            {googleAuthLoading ? (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <CircularProgress size={30} sx={{ color: "#FF9800" }} />
                <Typography
                  variant="body2"
                  sx={{ color: "rgba(255,255,255,0.7)" }}
                >
                  Authenticating...
                </Typography>
              </Box>
            ) : (
              <Box sx={{ width: "100%", maxWidth: "200px" }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  size="large"
                  width="100%"
                  shape="circle"
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            padding: 2,
            justifyContent: "center",
            borderTop: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <Button
            onClick={handleAuthDialogClose}
            disabled={googleAuthLoading}
            sx={{
              color: "rgba(255,255,255,0.7)",
              "&:hover:not(:disabled)": {
                color: "white",
                background: "rgba(255,255,255,0.1)",
              },
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Review Dialog - OPTIMIZED WITH REUSABLE COMPONENTS */}
      <Dialog
        open={reviewDialogOpen}
        onClose={handleReviewDialogClose}
        maxWidth="sm"
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            background:
              "linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(50,50,50,0.98) 100%)",
            color: "white",
            borderRadius: "12px",
          },
        }}
      >
        <DialogTitle sx={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <Typography
            variant="h6"
            sx={{ fontFamily: "'AlanSans', sans-serif" }}
          >
            Add Your Review
          </Typography>
          {user && (
            <Typography
              variant="body2"
              sx={{ color: "rgba(255,255,255,0.7)", mt: 0.5 }}
            >
              Signed in as: {user.name || user.email}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent sx={{ padding: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Name Field */}
            <TextInput
              label="Your Name"
              value={reviewData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter your name"
              disabled={!!user}
              required={true}
              helperText={user ? "Name is taken from your Google profile" : ""}
            />

            {/* Avatar Photo Display */}
            <AvatarDisplay
              user={user}
              label="Your Photo (Avatar)"
              required={true}
            />

            {/* Additional Photos Upload */}
            <MultiplePhotosUpload
              photos={addPhotos}
              previews={addPhotosPreview}
              onUpload={handleAddPhotosUpload}
              onRemove={handleRemoveAddPhoto}
              inputRef={addPhotosInputRef}
              uploading={additionalPhotosUploading}
              label="Add Photos (Optional, Multiple)"
              required={false}
            />

            {/* Rating Input */}
            <RatingInput
              value={reviewData.rating}
              onChange={(e, newValue) => handleInputChange("rating", newValue)}
              required={true}
            />

            {/* Review Comment */}
            <TextInput
              label="Your Review"
              value={reviewData.comment}
              onChange={(e) => handleInputChange("comment", e.target.value)}
              placeholder="Share your experience with BT's TT Academy... (Required)"
              multiline={true}
              rows={4}
              required={true}
            />
          </Box>
        </DialogContent>
        <DialogActions
          sx={{ padding: 3, borderTop: "1px solid rgba(255,255,255,0.1)" }}
        >
          <Button
            onClick={handleReviewDialogClose}
            disabled={loading}
            sx={{
              color: "rgba(255,255,255,0.7)",
              "&:hover:not(:disabled)": {
                color: "white",
                background: "rgba(255,255,255,0.1)",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReviewSubmit}
            variant="contained"
            disabled={
              !reviewData.name.trim() ||
              reviewData.rating === 0 ||
              loading ||
              hasReviewed ||
              !reviewData.comment.trim()
            }
            sx={{
              background: "linear-gradient(45deg, #FF9800 30%, #FF5722 90%)",
              "&:hover:not(:disabled)": {
                background: "linear-gradient(45deg, #E65100 30%, #BF360C 90%)",
              },
              "&:disabled": {
                background: "rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.3)",
              },
              minWidth: "120px",
            }}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: "white" }} />
            ) : (
              "Submit Review"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog
        open={feedbackDialog.open}
        onClose={handleFeedbackDialogClose}
        maxWidth="xs"
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            background:
              "linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(50,50,50,0.98) 100%)",
            color: "white",
            borderRadius: "12px",
            textAlign: "center",
            padding: 2,
          },
        }}
      >
        <DialogTitle>
          <Typography
            variant="h6"
            sx={{
              color:
                feedbackDialog.severity === "error"
                  ? "#FF5252"
                  : feedbackDialog.severity === "success"
                  ? "#4CAF50"
                  : feedbackDialog.severity === "info"
                  ? "#FF9800"
                  : "#FFC107",
              mb: 1,
            }}
          >
            {feedbackDialog.severity.charAt(0).toUpperCase() +
              feedbackDialog.severity.slice(1)}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">{feedbackDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleFeedbackDialogClose}
            sx={{
              color: "rgba(255,255,255,0.7)",
              "&:hover": {
                color: "white",
                background: "rgba(255,255,255,0.1)",
              },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NavBar;