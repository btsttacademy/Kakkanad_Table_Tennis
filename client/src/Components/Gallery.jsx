import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  Dialog,
  IconButton,
} from '@mui/material';
import { Refresh, Close, NavigateBefore, NavigateNext, ExpandMore, ExpandLess } from '@mui/icons-material';

const Gallery = () => {
  const [galleryData, setGalleryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageLoadingStates, setImageLoadingStates] = useState({});
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [visibleCount, setVisibleCount] = useState(8); // Initial number of images to show
  const [showLoadMore, setShowLoadMore] = useState(true);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const SERVER_URL = 'https://btsttacademybe.onrender.com';

  // Items per load based on screen size
  const getItemsPerLoad = () => {
    if (isMobile) return 4;
    if (isTablet) return 6;
    return 8;
  };

  const fetchGalleryData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching gallery data from Node.js server...');
      
      const response = await fetch(`${SERVER_URL}/api/gallery`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('API Response:', result);
      
      if (result.success && result.data) {
        const transformedData = result.data.map((item, index) => ({
          imageNo: item.imageNo ?? index + 1,
          fileName: item.fileName || `Image ${item.imageNo ?? index + 1}`,
          imageUrl: convertToDirectUrl(item.imageUrl),
          // Use direct URL for preview as well
          previewUrl: convertToDirectUrl(item.imageUrl)
        }));
        
        console.log('Transformed data:', transformedData);
        setGalleryData(transformedData);
        
        const initialLoadingStates = {};
        transformedData.forEach((item, index) => {
          initialLoadingStates[index] = true;
        });
        setImageLoadingStates(initialLoadingStates);

        // Reset visible count when new data loads
        setVisibleCount(getItemsPerLoad());
        setShowLoadMore(transformedData.length > getItemsPerLoad());
      } else {
        throw new Error(result.message || 'No data received from server');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(`Error loading gallery: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Convert any Google Drive URL to direct download URL
  const convertToDirectUrl = (url) => {
    if (!url) return '';
    
    let fileId = '';
    
    if (url.includes('/file/d/')) {
      fileId = url.split('/file/d/')[1]?.split('/')[0];
    } else if (url.includes('uc?id=')) {
      fileId = url.split('uc?id=')[1];
    } else if (url.includes('open?id=')) {
      fileId = url.split('open?id=')[1];
    }
    
    if (fileId) {
      return `https://drive.google.com/uc?id=${fileId}`;
    }
    
    return url;
  };

  // Get thumbnail URL for grid view
  const getThumbnailUrl = (url) => {
    const fileId = url.split('uc?id=')[1];
    if (fileId) {
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
    }
    return url;
  };

  // Get preview URL (use direct URL for preview)
  const getPreviewUrl = (url) => {
    return url; // Use the direct URL we already converted
  };

  // Load More / Show Less functions
  const handleLoadMore = () => {
    const newCount = visibleCount + getItemsPerLoad();
    setVisibleCount(newCount);
    setShowLoadMore(newCount < galleryData.length);
  };

  const handleShowLess = () => {
    setVisibleCount(getItemsPerLoad());
    setShowLoadMore(true);
  };

  const handleImageLoad = (index) => {
    setImageLoadingStates(prev => ({
      ...prev,
      [index]: false
    }));
  };

  const handleImageError = (index, url) => {
    console.error(`Failed to load image ${index}:`, url);
    setImageLoadingStates(prev => ({
      ...prev,
      [index]: false
    }));
  };

  // Image preview functions
  const openImagePreview = (image, index) => {
    setSelectedImage({ ...image, index });
    setOpenDialog(true);
    setPreviewLoading(true);
  };

  const closeImagePreview = () => {
    setOpenDialog(false);
    setSelectedImage(null);
    setPreviewLoading(false);
  };

  const navigateImage = (direction) => {
    if (!selectedImage) return;

    const currentIndex = selectedImage.index;
    let newIndex;

    if (direction === 'next') {
      newIndex = (currentIndex + 1) % galleryData.length;
    } else {
      newIndex = (currentIndex - 1 + galleryData.length) % galleryData.length;
    }

    setSelectedImage({ ...galleryData[newIndex], index: newIndex });
    setPreviewLoading(true);
  };

  const handlePreviewImageLoad = () => {
    setPreviewLoading(false);
  };

  const handlePreviewImageError = (e) => {
    console.error('Failed to load preview image:', selectedImage?.previewUrl);
    setPreviewLoading(false);
    // Try fallback to thumbnail URL
    if (selectedImage) {
      e.target.src = getThumbnailUrl(selectedImage.imageUrl);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!openDialog) return;

      switch (event.key) {
        case 'Escape':
          closeImagePreview();
          break;
        case 'ArrowLeft':
          navigateImage('prev');
          break;
        case 'ArrowRight':
          navigateImage('next');
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openDialog, selectedImage]);

  // Determine columns based on screen size
  const getColumns = () => {
    if (isMobile) return 2;
    if (isTablet) return 3;
    return 4;
  };

  useEffect(() => {
    fetchGalleryData();
  }, []);

  // Get visible gallery items based on current count
  const visibleGallery = galleryData.slice(0, visibleCount);

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="200px"
        flexDirection="column"
        gap={2}
      >
        <CircularProgress />
        <Typography variant="body1">Loading photos...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3} display="flex" flexDirection="column" alignItems="center" gap={2}>
        <Alert severity="error" sx={{ width: '100%', maxWidth: 400 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          startIcon={<Refresh />}
          onClick={fetchGalleryData}
        >
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, maxWidth: 1200, margin: '0 auto' }}>
      
      {galleryData.length === 0 ? (
        <Box textAlign="center" p={3}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            No photos found in the gallery.
          </Typography>
          <Button 
            variant="outlined" 
            startIcon={<Refresh />}
            onClick={fetchGalleryData}
            sx={{ mt: 2 }}
          >
            Refresh
          </Button>
        </Box>
      ) : (
        <>
          <Box textAlign="center" mb={4}>
            <h1 className='text-[#FF9800] font-riope text-3xl'>
              Photo Gallery
            </h1>
            <p className='font-in text-gray-400'>
              Capturing our memorable moments
            </p>
            {/* <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Showing {visibleGallery.length} of {galleryData.length} photos
            </Typography> */}
          </Box>

          <Box
            sx={{
              columnCount: getColumns(),
              columnGap: 1,
              '& > *': {
                breakInside: 'avoid',
                marginBottom: 1,
                display: 'inline-block',
                width: '100%',
              }
            }}
          >
            {visibleGallery.map((item, idx) => {
              const thumbnailUrl = getThumbnailUrl(item.imageUrl);
              
              return (
                <Box
                  key={idx}
                  sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    boxShadow: 1,
                    transition: 'all 0.3s ease',
                    backgroundColor: 'background.paper',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                      cursor: 'pointer',
                    },
                    position: 'relative',
                    display: 'inline-block',
                    width: '100%',
                  }}
                  onClick={() => openImagePreview(item, idx)}
                >
                  {imageLoadingStates[idx] && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(0,0,0,0.05)',
                        zIndex: 1,
                        minHeight: 200,
                      }}
                    >
                      <CircularProgress size={40} />
                    </Box>
                  )}
                  
                  <Box
                    component="img"
                    src={thumbnailUrl}
                    alt={item.fileName}
                    loading="lazy"
                    sx={{
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                      opacity: imageLoadingStates[idx] ? 0 : 1,
                      transition: 'opacity 0.3s ease',
                    }}
                    onLoad={() => handleImageLoad(idx)}
                    onError={() => handleImageError(idx, thumbnailUrl)}
                  />
                </Box>
              );
            })}
          </Box>

          {/* Load More / Show Less Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, gap: 2 }}>
            {showLoadMore && visibleCount < galleryData.length && (
              <Button
                variant="outlined"
                startIcon={<ExpandMore />}
                onClick={handleLoadMore}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  borderColor: '#FF9800',
                  color: '#FF9800',
                  '&:hover': {
                    backgroundColor: '#FF9800',
                    color: 'white',
                    borderColor: '#FF9800',
                  }
                }}
              >
                Load More ({galleryData.length - visibleCount} more)
              </Button>
            )}
            
            {visibleCount > getItemsPerLoad() && (
              <Button
                variant="text"
                startIcon={<ExpandLess />}
                onClick={handleShowLess}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  color: 'text.secondary',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                    color: 'text.primary',
                  }
                }}
              >
                Show Less
              </Button>
            )}
          </Box>

          {/* Image Preview Dialog */}
          <Dialog
            open={openDialog}
            onClose={closeImagePreview}
            maxWidth="lg"
            fullWidth
            sx={{
              '& .MuiDialog-paper': {
                backgroundColor: 'rgba(0,0,0,0.9)',
                boxShadow: 'none',
                overflow: 'hidden',
              }
            }}
          >
            {selectedImage && (
              <Box sx={{ position: 'relative', height: '100%' }}>
                {/* Close Button */}
                <IconButton
                  onClick={closeImagePreview}
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    color: 'white',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    zIndex: 10,
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.7)',
                    }
                  }}
                >
                  <Close />
                </IconButton>

                {/* Navigation Buttons */}
                {galleryData.length > 1 && (
                  <>
                    <IconButton
                      onClick={() => navigateImage('prev')}
                      sx={{
                        position: 'absolute',
                        left: 16,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'white',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        zIndex: 10,
                        '&:hover': {
                          backgroundColor: 'rgba(0,0,0,0.7)',
                        }
                      }}
                    >
                      <NavigateBefore />
                    </IconButton>

                    <IconButton
                      onClick={() => navigateImage('next')}
                      sx={{
                        position: 'absolute',
                        right: 16,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'white',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        zIndex: 10,
                        '&:hover': {
                          backgroundColor: 'rgba(0,0,0,0.7)',
                        }
                      }}
                    >
                      <NavigateNext />
                    </IconButton>
                  </>
                )}

                {/* Image Counter */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 16,
                    left: 16,
                    color: 'white',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    padding: '4px 12px',
                    borderRadius: 2,
                    zIndex: 10,
                  }}
                >
                  <Typography variant="body2">
                    {selectedImage.index + 1} / {galleryData.length}
                  </Typography>
                </Box>

                {/* Preview Loader */}
                {previewLoading && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      zIndex: 5,
                    }}
                  >
                    <CircularProgress size={60} sx={{ color: 'white' }} />
                  </Box>
                )}

                {/* Main Image */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    minHeight: '400px',
                    padding: 4,
                    position: 'relative',
                  }}
                >
                  <Box
                    component="img"
                    src={getPreviewUrl(selectedImage.previewUrl)}
                    alt={selectedImage.fileName}
                    sx={{
                      maxWidth: '100%',
                      maxHeight: '80vh',
                      width: 'auto',
                      height: 'auto',
                      objectFit: 'contain',
                      opacity: previewLoading ? 0.3 : 1,
                      transition: 'opacity 0.3s ease',
                    }}
                    onLoad={handlePreviewImageLoad}
                    onError={handlePreviewImageError}
                  />
                </Box>

                {/* Image Info */}
                {/* <Box
                  sx={{
                    position: 'absolute',
                    bottom: 16,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    color: 'white',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    padding: '8px 16px',
                    borderRadius: 2,
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="body2">
                    {selectedImage.fileName}
                  </Typography>
                </Box> */}
              </Box>
            )}
          </Dialog>
        </>
      )}
    </Box>
  );
};

export default Gallery;