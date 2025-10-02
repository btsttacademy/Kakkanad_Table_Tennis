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
  Card,
} from '@mui/material';
import { Refresh, Close, NavigateBefore, NavigateNext, ExpandMore, ExpandLess } from '@mui/icons-material';

const Awards = () => {
  const [awardsData, setAwardsData] = useState([]);
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

  const fetchAwardsData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching awards data from Node.js server...');
      
      const response = await fetch(`${SERVER_URL}/api/awards`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('API Response:', result);
      
      if (result.success && result.data) {
        // Use the data exactly as it comes from the API
        const transformedData = result.data.map((item, index) => ({
          imageNo: item.imageNo ?? index + 1,
          fileName: item.fileName || `Award ${item.imageNo ?? index + 1}`,
          thumbnailUrl: item.thumbnailUrl || '', // Ensure it's never undefined
          previewUrl: item.previewUrl || '', // Ensure it's never undefined
          description: item.description || '',
          fileId: item.fileId || '',
        }));
        
        console.log('Transformed data:', transformedData);
        setAwardsData(transformedData);
        
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
      setError(`Error loading awards: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Extract file ID from Google Drive URL
  const extractFileId = (url) => {
    if (!url || typeof url !== 'string') return '';
    
    let fileId = '';
    
    if (url.includes('/file/d/')) {
      fileId = url.split('/file/d/')[1]?.split('/')[0];
    } else if (url.includes('id=')) {
      fileId = url.split('id=')[1]?.split('&')[0];
    } else if (url.includes('/uc?id=')) {
      fileId = url.split('/uc?id=')[1];
    }
    
    return fileId;
  };

  // Get thumbnail URL for grid view (small size)
  const getThumbnailUrl = (url) => {
    if (!url || typeof url !== 'string') return '';
    
    const fileId = extractFileId(url);
    if (fileId) {
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
    }
    
    return url;
  };

  // Get preview URL - Convert to direct image URL for preview
  const getPreviewUrl = (url) => {
    if (!url || typeof url !== 'string') return '';
    
    const fileId = extractFileId(url);
    if (fileId) {
      // Use direct download URL for preview
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
    
    return url;
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

  // Load More / Show Less functions
  const handleLoadMore = () => {
    const newCount = visibleCount + getItemsPerLoad();
    setVisibleCount(newCount);
    setShowLoadMore(newCount < awardsData.length);
  };

  const handleShowLess = () => {
    setVisibleCount(getItemsPerLoad());
    setShowLoadMore(true);
  };

  // Image preview functions
  const openImagePreview = (image, index) => {
    console.log('=== OPENING IMAGE PREVIEW ===');
    console.log('Original Thumbnail URL:', image.thumbnailUrl);
    console.log('Original Preview URL:', image.previewUrl);
    
    const thumbnailFileId = extractFileId(image.thumbnailUrl);
    const previewFileId = extractFileId(image.previewUrl);
    
    console.log('Thumbnail File ID:', thumbnailFileId);
    console.log('Preview File ID:', previewFileId);
    console.log('Are file IDs different?', thumbnailFileId !== previewFileId);
    
    const previewImage = {
      ...image,
      index,
      displayThumbnailUrl: getThumbnailUrl(image.thumbnailUrl), // For grid
      displayPreviewUrl: getPreviewUrl(image.previewUrl) // For dialog - converted to direct URL
    };
    
    console.log('Grid URL:', previewImage.displayThumbnailUrl);
    console.log('Preview URL:', previewImage.displayPreviewUrl);
    
    setSelectedImage(previewImage);
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
      newIndex = (currentIndex + 1) % awardsData.length;
    } else {
      newIndex = (currentIndex - 1 + awardsData.length) % awardsData.length;
    }

    const newImage = {
      ...awardsData[newIndex],
      index: newIndex,
      displayThumbnailUrl: getThumbnailUrl(awardsData[newIndex].thumbnailUrl),
      displayPreviewUrl: getPreviewUrl(awardsData[newIndex].previewUrl)
    };
    
    console.log('Navigating to image:', newIndex);
    console.log('New preview URL:', newImage.displayPreviewUrl);
    
    setSelectedImage(newImage);
    setPreviewLoading(true);
  };

  const handlePreviewImageLoad = () => {
    console.log('✅ Preview image loaded successfully');
    setPreviewLoading(false);
  };

  const handlePreviewImageError = (e) => {
    console.error('❌ Failed to load preview image:', selectedImage?.displayPreviewUrl);
    setPreviewLoading(false);
    
    // Try alternative URL formats
    if (selectedImage && selectedImage.previewUrl) {
      const fileId = extractFileId(selectedImage.previewUrl);
      if (fileId) {
        // Try different Google Drive URL formats
        const alternatives = [
          `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`,
          `https://lh3.googleusercontent.com/d/${fileId}`,
          `https://docs.google.com/uc?id=${fileId}`
        ];
        
        console.log('Trying alternative URLs:', alternatives);
        
        // Try the first alternative
        e.target.src = alternatives[0];
      }
    }
  };

  // Debug function to log URLs when clicking
  const handleImageClick = (item, index) => {
    console.log('=== CLICK DEBUG INFO ===');
    console.log('Image Index:', index);
    console.log('Thumbnail URL:', item.thumbnailUrl);
    console.log('Preview URL:', item.previewUrl);
    
    const thumbnailFileId = extractFileId(item.thumbnailUrl);
    const previewFileId = extractFileId(item.previewUrl);
    
    console.log('Thumbnail File ID:', thumbnailFileId);
    console.log('Preview File ID:', previewFileId);
    console.log('Grid will use:', getThumbnailUrl(item.thumbnailUrl));
    console.log('Preview will use:', getPreviewUrl(item.previewUrl));
    console.log('=== END DEBUG INFO ===');
    
    openImagePreview(item, index);
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
    fetchAwardsData();
  }, []);

  // Get visible awards based on current count
  const visibleAwards = awardsData.slice(0, visibleCount);

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
        <Typography variant="body1">Loading awards...</Typography>
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
          onClick={fetchAwardsData}
        >
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, maxWidth: 1200, margin: '0 auto' }}>
      
      {awardsData.length === 0 ? (
        <Box textAlign="center" p={3}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            No awards found.
          </Typography>
          <Button 
            variant="outlined" 
            startIcon={<Refresh />}
            onClick={fetchAwardsData}
            sx={{ mt: 2 }}
          >
            Refresh
          </Button>
        </Box>
      ) : (
        <>
          <Box textAlign="center" mb={4}>
            <h1 className=' text-[#FF9800] font-riope text-3xl'>
              Our Awards & Achievements
            </h1>
            <p className=' font-in text-gray-400'>
              Success and recognition
            </p>
            {/* <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Showing {visibleAwards.length} of {awardsData.length} awards
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
            {visibleAwards.map((item, idx) => {
              if (!item || !item.thumbnailUrl) {
                console.warn('Invalid item at index:', idx, item);
                return null;
              }

              const thumbnailUrl = getThumbnailUrl(item.thumbnailUrl);
              
              if (!thumbnailUrl) {
                return null;
              }
              
              return (
                <Card
                  key={idx}
                  sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    boxShadow: 2,
                    transition: 'all 0.3s ease',
                    backgroundColor: 'background.paper',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6,
                      cursor: 'pointer',
                    },
                    position: 'relative',
                    display: 'inline-block',
                    width: '100%',
                  }}
                  onClick={() => handleImageClick(item, idx)}
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
                    alt={item.fileName || `Award ${idx + 1}`}
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
                  
                  {item.description && (
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                        color: 'white',
                        padding: 2,
                        paddingTop: 4,
                      }}
                    >
                      <Typography variant="body2" noWrap>
                        {item.description}
                      </Typography>
                    </Box>
                  )}
                </Card>
              );
            })}
          </Box>

          {/* Load More / Show Less Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, gap: 2 }}>
            {showLoadMore && visibleCount < awardsData.length && (
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
                Load More ({awardsData.length - visibleCount} more)
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

                {awardsData.length > 1 && (
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
                    {selectedImage.index + 1} / {awardsData.length}
                  </Typography>
                </Box>

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
                  {selectedImage.displayPreviewUrl ? (
                    <Box
                      component="img"
                      src={selectedImage.displayPreviewUrl}
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
                  ) : (
                    <Box sx={{ color: 'white', textAlign: 'center', padding: 4 }}>
                      <Typography variant="h6">No preview available</Typography>
                    </Box>
                  )}
                </Box>

                <Box
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
                    width: '80%',
                    maxWidth: 600,
                  }}
                >
                  <Typography variant="body2">
                    {selectedImage.description}
                  </Typography>
                </Box>
              </Box>
            )}
          </Dialog>
        </>
      )}
    </Box>
  );
};

export default Awards;