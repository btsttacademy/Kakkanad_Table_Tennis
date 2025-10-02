import React, { useState } from "react";
import { Avatar } from "@mui/material";

const UserAvatar = ({ photoUrl, name }) => {
  const [imgError, setImgError] = useState(false);

  console.log('Original photoUrl:', photoUrl);
  console.log('Name:', name);

  const getGoogleDriveImageUrl = (url) => {
    if (!url) {
      console.log('No URL provided');
      return null;
    }
    
    console.log('Processing URL:', url);
    
    if (url.includes('drive.google.com/file/d/')) {
      const fileId = url.match(/\/file\/d\/([^\/]+)/)?.[1];
      console.log('Extracted fileId:', fileId);
      
      if (fileId) {
        const urlsToTry = [
          `https://drive.google.com/thumbnail?id=${fileId}&sz=w200`, // Thumbnail
          `https://lh3.googleusercontent.com/d/${fileId}=s200`, // Google Docs viewer
          `https://drive.google.com/uc?export=view&id=${fileId}` // Original direct
        ];
        
        console.log('URLs to try:', urlsToTry);
        return urlsToTry[0]; 
      }
    }
    
    console.log('Returning original URL (not a Google Drive URL)');
    return url;
  };

  const imageUrl = getGoogleDriveImageUrl(photoUrl);
  console.log('Final imageUrl to use:', imageUrl);

  const showImage = imageUrl && !imgError;
  console.log('Should show image?', showImage);

  return (
    <>
    <Avatar
      src={showImage ? imageUrl : undefined}
      alt={name}
      onError={() => {
        console.log('Image failed to load');
        setImgError(true);
      }}
      onLoad={() => console.log('Image loaded successfully')}
      sx={{ width: 48, height: 48, mr: 2, border: "2px solid #FF9800", background: "none" }}
    >
      {!showImage && name ? name.charAt(0).toUpperCase() : null}
    </Avatar>
   
    </>
  );
};

export default UserAvatar;