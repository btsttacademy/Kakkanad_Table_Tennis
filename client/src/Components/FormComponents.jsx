import React from "react";
import {
  TextField,
  Typography,
  Box,
  Rating,
  Avatar,
  Chip,
  IconButton,
  Grid,
  CircularProgress,
} from "@mui/material";
import { FaCloudUploadAlt } from "react-icons/fa";
import { Delete } from "@mui/icons-material";

// Text Input Component
export const TextInput = ({
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
  multiline = false,
  rows = 1,
  required = false,
  helperText = "",
}) => (
  <Box>
    <Typography gutterBottom sx={{ fontWeight: 500 }}>
      {label} {required && "*"}
    </Typography>
    <TextField
      fullWidth
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      variant="outlined"
      disabled={disabled}
      multiline={multiline}
      rows={rows}
      sx={{
        "& .MuiOutlinedInput-root": {
          color: "white",
          "& fieldset": {
            borderColor: "rgba(255,255,255,0.2)",
          },
          "&:hover fieldset": {
            borderColor: disabled
              ? "rgba(255,255,255,0.2)"
              : "rgba(255,255,255,0.4)",
          },
          "&.Mui-focused fieldset": {
            borderColor: "#FF9800",
          },
          "& .MuiInputBase-input.Mui-disabled": {
            WebkitTextFillColor: "rgba(255,255,255,0.7)",
          },
        },
      }}
    />
    {helperText && (
      <Typography
        variant="caption"
        sx={{
          color: "rgba(255,255,255,0.5)",
          mt: 1,
          display: "block",
        }}
      >
        {helperText}
      </Typography>
    )}
  </Box>
);

// Rating Input Component
export const RatingInput = ({ value, onChange, required = false }) => (
  <Box>
    <Typography gutterBottom sx={{ fontWeight: 500 }}>
      Your Rating {required && "*"}
    </Typography>
    <Rating
      value={value}
      onChange={onChange}
      size="large"
      sx={{
        color: "#FF9800",
        "& .MuiRating-iconEmpty": {
          color: "white",
        },
        "& .MuiRating-iconFilled": {
          color: "#FF9800",
        },
      }}
    />
  </Box>
);

// Avatar Display Component
export const AvatarDisplay = ({ user, label = "Your Photo", required = false }) => (
  <Box>
    <Typography gutterBottom sx={{ fontWeight: 500 }}>
      {label} {required && "*"}
    </Typography>
    {user?.picture ? (
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Avatar
          src={user.picture}
          sx={{ width: 80, height: 80, border: "2px solid #FF9800" }}
        />
        <Box>
          <Chip
            label="Google Profile Photo"
            variant="outlined"
            sx={{
              color: "white",
              borderColor: "rgba(255,255,255,0.3)",
            }}
          />
          <Typography
            variant="caption"
            sx={{
              color: "rgba(255,255,255,0.5)",
              display: "block",
              mt: 1,
            }}
          >
            Photo from your Google account
          </Typography>
        </Box>
      </Box>
    ) : (
      <Typography
        variant="body2"
        sx={{ color: "rgba(255,255,255,0.7)", fontStyle: "italic" }}
      >
        Your Google profile photo will be used
      </Typography>
    )}
  </Box>
);

// Multiple Photos Upload Component
export const MultiplePhotosUpload = ({
  photos = [],
  previews = [],
  onUpload,
  onRemove,
  inputRef,
  uploading = false,
  label = "Add Photos",
  required = false,
}) => (
  <Box>
    <Typography gutterBottom sx={{ fontWeight: 500 }}>
      {label} {required && "*"}
    </Typography>
    <input
      multiple
      type="file"
      accept="image/*"
      style={{ display: "none" }}
      ref={inputRef}
      onChange={onUpload}
    />
    {uploading ? (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          padding: 2,
          marginBottom: 2,
        }}
      >
        <CircularProgress size={24} sx={{ color: "#FF9800" }} />
        <Typography
          variant="body2"
          sx={{ color: "rgba(255,255,255,0.7)" }}
        >
          Uploading photos...
        </Typography>
      </Box>
    ) : (
      <Box
        sx={{
          border: "2px dashed rgba(255,255,255,0.3)",
          borderRadius: "8px",
          padding: 3,
          textAlign: "center",
          cursor: "pointer",
          minHeight: "60px",
          "&:hover": {
            borderColor: "#FF9800",
            background: "rgba(255,152,0,0.05)",
          },
          marginBottom: 2,
        }}
        onClick={() => inputRef.current?.click()}
      >
        <FaCloudUploadAlt
          style={{ fontSize: "2rem", color: "#FF9800" }}
        />
        <Typography
          variant="body2"
          sx={{ color: "rgba(255,255,255,0.7)" }}
        >
          Click to upload extra photos
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: "rgba(255,255,255,0.5)" }}
        >
          PNG, JPG, JPEG (Max 5MB each)
        </Typography>
      </Box>
    )}
    <Grid container spacing={2}>
      {previews.map((preview, idx) => (
        <Grid item key={idx}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Avatar
              src={preview}
              sx={{
                width: 60,
                height: 60,
                border: "2px solid #FF9800",
                marginBottom: 1,
              }}
            />
            <Chip
              label={photos[idx]?.name || ""}
              variant="outlined"
              sx={{
                color: "white",
                borderColor: "rgba(255,255,255,0.3)",
                marginBottom: 1,
              }}
            />
            <IconButton
              sx={{ color: "#FF9800" }}
              onClick={() => onRemove(idx)}
            >
              <Delete />
            </IconButton>
          </Box>
        </Grid>
      ))}
    </Grid>
  </Box>
);